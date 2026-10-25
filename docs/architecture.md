# Architecture

## Décidé

- **Monorepo npm workspaces**, TypeScript partout.
- **API** : Node.js, Express, Zod.
- **Front** : React, Vite, TypeScript, DSFR.
- **Un seul processus web** : il sert l'API et les fichiers buildés du front. API et front sont
  séparés dans le code.
- **Traitements de données** : une chaîne locale récupère les données brutes à leur source, les
  transforme de notre côté et prépare des référentiels, publiés sur un stockage S3.
- **Formats de travail** : DuckDB/Parquet et PMTiles, stockés sur S3 et lus en HTTP. En
  production, l'application lira les référentiels avec DuckDB pour Node.js (neo).
- **Cartographie** : MapLibre GL JS. Le fond est la photographie aérienne de l'IGN, servie par la
  Géoplateforme. Un fond vectoriel OpenFreeMap est envisagé.

| Besoin | Outil |
| --- | --- |
| Code, issues, PR | GitHub |
| Intégration continue | GitHub Actions |
| Hébergement de l'application | Scalingo |
| Stockage objet (S3) | Scaleway |

## Organisation du code

```text
apps/
  api/        @pnm/api     API Express : un routeur, sans connaissance du front
  web/        @pnm/web     front React/Vite/DSFR, sans connaissance du serveur
  server/     @pnm/server  processus web unique : monte l'API sous /api, sert le front
packages/
  shared/     @pnm/shared  schémas Zod et types partagés entre l'API et le front
  wfs/        @pnm/wfs     récupération complète d'une couche WFS, telle qu'elle est sur le serveur
  grist/      @pnm/grist   lecture d'un document Grist tel qu'il est, écriture à la demande
pipelines/    @pnm/pipelines  chaîne de traitement locale : récupère les sources, prépare les référentiels
docs/
```

Seul `@pnm/server` dépend à la fois de l'API et du front. C'est ce qui garde les deux séparés.
`@pnm/web` expose dans `serve.ts` ce dont le serveur a besoin pour le servir : le dossier du build
et, en développement, le middleware Vite.

### Front (`apps/web/src`)

- `components/` : les composants UI, de la présentation pure, pilotés par leurs props.
- `pages/` : les composants de haut niveau. Ils lisent les données et l'adresse, et les passent
  aux composants UI.
- Les routes utilisent React Router en mode données : les loaders chargent depuis l'API avant
  d'afficher une page, et une ressource inconnue donne une page 404.
- Les appels à l'API passent par un même point, qui ne demande chaque adresse qu'une fois par
  visite.
- L'adresse désigne une page, elle ne stocke pas d'état. Ce que saisit le porteur de projet est
  gardé dans le navigateur (`localStorage`), en attendant un stockage en base.
- MapLibre est lourd : seule la page qui affiche une carte le charge.

### API (`apps/api/src`)

- Les données servies viennent de fichiers JSON, validés par Zod au démarrage. Une donnée mal
  formée empêche le serveur de démarrer plutôt que d'arriver aux utilisateurs.
- Une donnée préparée par la chaîne de traitement est copiée dans l'API par une commande de
  l'API, et versionnée. La chaîne n'écrit pas dans l'application.

### Code partagé (`packages/shared`)

- Un type n'est déclaré qu'une fois. Ce qui sert à l'API et au front vit ici, sous forme de schéma
  Zod dont on déduit le type.
- L'API valide ses données avec les schémas. Le front n'importe que les types (`import type`) :
  Zod n'entre pas dans son bundle.
- Ce code ne dépend ni de Node.js ni du navigateur.

### Récupération des données (`packages/wfs`)

- Une couche est téléchargée telle qu'elle est sur le serveur : ni filtre, ni reprojection. La
  sélection, l'agrégation et la fusion se font ensuite, de notre côté.
- L'exhaustivité est contrôlée : le nombre d'objets annoncé par le serveur, celui de chaque page,
  puis le total. Le serveur ne garantit pas la cohérence d'une page à l'autre : les pages sont
  triées sur la clé de la couche, et une couche dont le nombre d'objets change pendant le
  téléchargement est rejetée.
- Les pages sont téléchargées en parallèle, compressées, et écrites sur disque au fil de l'eau.
  Une page qui échoue est retentée seule ; une requête refusée pour ce qu'elle demande ne l'est
  pas.

### Documents Grist (`packages/grist`)

- Un document est lu tel qu'il est : ses tables, leurs colonnes et leurs lignes. Les valeurs
  restent encodées comme Grist les stocke ; on les décode ensuite d'après le type des colonnes.
- On n'écrit dans un document qu'à la demande explicite de la personne qui en a la charge, jamais
  dans un traitement automatique.
- Une écriture qui ne se rejoue pas sans effet (un ajout, une suppression) n'est retentée que si
  Grist l'a refusée sans l'exécuter. Les valeurs sont écrites telles quelles : Grist n'interprète
  les chaînes selon le type de la colonne que si on le demande.
- L'accès passe par une clé d'API personnelle, qui porte tous les droits de son propriétaire.
  Elle reste hors du dépôt, par exemple dans `.env`, ignoré par git.

### Chaîne de traitement (`pipelines/`)

- Elle tourne en local, jamais en production : ses dépendances sont des dépendances de
  développement. tippecanoe, qui produit les PMTiles, s'installe à part (`brew install
  tippecanoe`).
- Ses données sont dans `data/`, à la racine, ignoré par git et sans code : `raw/` garde les
  sources telles que téléchargées, avec la date et le nombre d'objets ; `work/` garde les résultats
  intermédiaires d'une étape, refaits quand ce qui les produit change ; `dist/` reçoit ce que la
  chaîne produit. Un nouveau téléchargement ne remplace l'ancien qu'une fois complet.
- Le téléchargement ne transforme rien : il stocke la donnée brute. Toute transformation produit
  une donnée dérivée, à partir de `raw/`, et se régénère quand on veut, sans le serveur : on
  améliore les traitements sans dépendre de lui.
- Chaque source décrit sa clé et la projection de ses coordonnées. Au chargement, la chaîne
  vérifie le nombre d'objets, et que la clé est unique et toujours remplie.
- Les transformations se font dans DuckDB, avec son extension spatiale : le même moteur qu'en
  production.
- Une étape lourde lit le brut page par page et garde ses tables dans une base DuckDB sur disque,
  sous `work/` : la mémoire dépend de la taille d'une page, pas de celle d'une couche.
- Une étape est découpée par couche. Ce qu'elle tire d'une couche est gardé sous `work/`, avec
  l'empreinte de ce qui l'a produit : le téléchargement, les requêtes et les versions de DuckDB et
  de son extension spatiale. Tant que l'empreinte ne change pas, la couche n'est pas refaite :
  changer un paramètre d'une couche ne relance qu'elle. L'assemblage final se refait à chaque
  passage.
- Chaque couche se traite dans une projection métrique de là où elle se trouve (Lambert-93 en
  métropole et en Corse), puis s'écrit dans le format pivot, en WGS 84. L'assemblage et ce qu'il
  produit, GeoParquet et PMTiles, sont en WGS 84.
- Le moteur des couches ne connaît aucune couche : il lit le brut page par page, applique le
  traitement d'une couche, garde son résultat au format pivot avec son empreinte, puis publie le
  GeoParquet et les PMTiles. Chaque couche a son propre fichier : sa source, sa projection, ses
  règles et, s'il le faut, son traitement propre. Une étape ne fait qu'orchestrer.
- Une reprojection passe toujours par PROJ (`ST_Transform`), jamais par une formule écrite à la
  main.
- Ce qu'on fait des sources reste dans le dépôt : quelles couches, quels objets, à quel habitat
  on les rattache, avec quel tampon. Un document Grist ne fournit que du contenu métier, comme les
  habitats d'un plan de gestion.
- Chaque parc a un plan de gestion en vigueur, dans son propre document Grist, qui porte son
  contenu : habitats, recommandations, nomenclature des activités. Les codes d'habitat sont ceux
  qu'écrivent les gestionnaires du parc, pris tels quels. Les référentiels communs se limitent a
  priori à la liste des parcs.
- Une couche n'appartient à aucun parc : nationale ou par façade maritime, elle se rattache aux
  habitats par leur code, quel que soit le plan de gestion qui les cite.
- Une couche est traitée entière, jamais découpée à un parc : ce que la chaîne produit peut servir
  à d'autres usages que les nôtres.
- Le tampon redresse une couche, pour le rendu comme pour le croisement : des miettes, des éclats
  et des points deviennent des surfaces qui représentent un habitat, fusionnées quand elles se
  touchent. La tolérance autour d'un projet n'est pas ce tampon : elle élargit le projet, au moment
  du croisement.

## Exécution

- Node.js ≥ 24 exécute directement le TypeScript du serveur, de l'API et de la chaîne de
  traitement (suppression des types, sans étape de build). Le code doit donc s'en tenir à la
  syntaxe effaçable : pas d'`enum`, pas de `namespace`, imports relatifs avec l'extension `.ts`.
- **Développement** : un seul processus. Vite tourne en mode middleware dans Express (`npm run
  dev`), avec rechargement à chaud du front et redémarrage du serveur quand l'API change.
- **Production** : `npm run build` produit le front dans `apps/web/dist`, puis `npm start` sert
  l'API et ces fichiers statiques.
- **DSFR** : intégré avec `@codegouvfr/react-dsfr`. Seules les icônes DSFR utilisées dans le code
  sont incluses (`react-dsfr update-icons`, lancé avant `dev` et `build`).

## Intégration continue et déploiement

- **GitHub Actions** (`.github/workflows/ci.yml`), sur chaque PR et sur `main` : lint, typecheck,
  build, puis démarrage du serveur comme sur Scalingo et appel de `/api/health`.
- **Scalingo**, avec le buildpack Node.js, sans configuration propre au projet :
  - `npm ci`, dépendances de développement comprises, puis `npm run build` ;
  - les dépendances de développement sont retirées à la fin du build : le serveur ne doit pas en
    dépendre à l'exécution ;
  - démarrage par `npm start` (le script `start`, faute de `Procfile`).
- **Version de Node.js** : pour `engines.node` `>=24`, le buildpack Scalingo prend la dernière
  version de l'Active LTS (24 au 15 octobre 2026) et signale la plage large dans les logs de build.
  La CI suit la même règle (`lts/*`).
- **Variables d'environnement** : aucune à définir. Scalingo fournit `PORT`, et `NODE_ENV` vaut
  `production` par défaut.

## Questions ouvertes

- **Requêtes simultanées sur le GeoServer de l'OFB** : combien en accepter ? 4 par défaut.
