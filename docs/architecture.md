# Architecture

## Décidé

- **Monorepo npm workspaces**, TypeScript partout.
- **API** : Node.js, Express, Zod.
- **Front** : React, Vite, TypeScript, DSFR.
- **Un seul processus web** : il sert l'API et les fichiers buildés du front. API et front sont
  séparés dans le code.
- **Traitements de données** : ils préparent des référentiels et les publient sur un stockage S3.
  L'application lit ces référentiels.

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
docs/
```

Seul `@pnm/server` dépend à la fois de l'API et du front. C'est ce qui garde les deux séparés.
`@pnm/web` expose dans `serve.ts` ce dont le serveur a besoin pour le servir : le dossier du build
et, en développement, le middleware Vite.

À venir : `packages/` pour le code partagé entre front et API (schémas Zod), `pipelines/` pour les
traitements de préparation des référentiels.

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
- **Cartographie** : MapLibre GL JS, fonds de carte à définir.
