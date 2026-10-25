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
Sans `DATA_URL`, l'API lit les données de la chaîne dans `data/dist/`, que le serveur sert aussi
en fichiers au navigateur, sous `/data/`, comme le fait le bucket S3 en production.
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
- MapLibre est lourd : seules les pages qui affichent une carte le chargent. Les cartes partagent
  le fond, le périmètre et le dessin du projet.
- Les surfaces des habitats s'affichent depuis leurs PMTiles, lus par le protocole `pmtiles` de
  MapLibre, à l'adresse que donne `GET /api/config`.

### API (`apps/api/src`)

- Les données n'ont qu'un chemin : la chaîne de traitement les produit dans `data/dist/`, copié
  tel quel dans le bucket S3 (voir [deploiement.md](deploiement.md)), et l'API les lit à l'adresse
  que le serveur lui donne. Rien de ce que produit la chaîne n'est copié dans l'API.
- Le dépôt ne garde des données que ce qui est lié au code : les couches géographiques à traiter
  et leurs paramètres, qui se rattachent aux données de référence du plan de gestion (les codes
  d'habitat).
- Les parcs, les activités et les périmètres sont encore des fichiers JSON de l'API, versionnés et
  validés par Zod au démarrage : un héritage, qui passera par ce même chemin.
- Sans ses données, le serveur ne démarre pas : l'API vérifie au démarrage, avant que le serveur
  n'écoute, que chacune est là et valide (les habitats, leurs surfaces et leurs PMTiles, le plan
  de gestion de chaque parc ouvert). Un déploiement sans elles échoue, et la version en ligne
  reste en place.
- Les données se lisent pourtant par des promesses, au moment où une route en a besoin : on
  pourra, avec tous les parcs, ne plus tout garder en mémoire.
- **Croisement** : une seule route, `POST /api/croisement`, reçoit le parc et la localisation d'un
  projet et renvoie ce qu'elle rencontre, en chiffres et sans géométrie : la surface couverte par
  le projet, et pour chaque habitat du plan de gestion du parc la part du projet qui s'y trouve, sa
  distance et les éléments concernés. Les espèces et les zones de gouvernance s'y ajouteront.
- **Plan de gestion** : `GET /api/parcs/<parc>/plan-de-gestion` sert tout le plan d'un parc
  (enjeux et leur arbre d'objectifs, habitats, actions), d'un seul tenant : le front en tire toutes
  ses pages. Un parc sans plan de gestion répond 404. Le croisement reprend le contenu de chaque
  habitat.
- `GET /api/habitats` donne les habitats que couvrent les surfaces de la chaîne : la fiche d'un
  habitat n'affiche de carte que pour eux.
- Le croisement recalcule la surface de chaque élément comme la carte la dessine : le rayon d'un
  lieu, la moitié de la largeur de part et d'autre d'un parcours, la marge d'une zone.
- Surfaces et distances se calculent dans une projection azimutale équivalente de Lambert centrée
  sur le projet : surfaces exactes, distances justes à l'échelle d'un projet, dans tous les parcs,
  outre-mer compris.
- La tolérance autour du projet est de 50 m (à confirmer) : un habitat à moins de 50 m est
  signalé, avec sa distance, même si le projet ne l'atteint pas.

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
- Une mise à jour ou un ajout part par lots de lignes qui portent les mêmes champs : Grist refuse
  sinon la mise à jour, et met à vide, dans un ajout, les champs qu'une ligne ne donne pas, au lieu
  de leur valeur par défaut.
- Une lecture est aussi retentée quand l'instance ne trouve plus le serveur qui porte le document
  (404 « document worker not present ») : Grist lui-même en essaie alors un autre.
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

Le déploiement, Scalingo et les données sur Scaleway : [deploiement.md](deploiement.md).

## Questions ouvertes

- **Requêtes simultanées sur le GeoServer de l'OFB** : combien en accepter ? 4 par défaut.
