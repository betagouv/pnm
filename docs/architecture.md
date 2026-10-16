# Architecture

## Décidé

- **Monorepo npm workspaces**, TypeScript partout.
- **API** : Node.js, Express, Zod.
- **Front** : React, Vite, TypeScript, DSFR.
- **Un seul processus web** : il sert l'API et les fichiers buildés du front. API et front sont
  séparés dans le code.
- **Traitements de données** : ils préparent des référentiels et les publient sur un stockage S3.
  L'application lit ces référentiels.
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
- `scripts/` : les scripts qui récupèrent des données à leur source et les préparent pour l'API.
  Leur résultat est versionné, et on les relance quand la source change.

### Code partagé (`packages/shared`)

- Un type n'est déclaré qu'une fois. Ce qui sert à l'API et au front vit ici, sous forme de schéma
  Zod dont on déduit le type.
- L'API valide ses données avec les schémas. Le front n'importe que les types (`import type`) :
  Zod n'entre pas dans son bundle.
- Ce code ne dépend ni de Node.js ni du navigateur.

À venir : `pipelines/` pour les traitements de préparation des référentiels.

## Exécution

- Node.js ≥ 24 exécute directement le TypeScript du serveur et de l'API (suppression des types,
  sans étape de build). Le code doit donc s'en tenir à la syntaxe effaçable : pas d'`enum`, pas de
  `namespace`, imports relatifs avec l'extension `.ts`.
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

- **Format des référentiels sur S3** : à définir.
