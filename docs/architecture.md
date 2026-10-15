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

## Proposition d'organisation du code

À valider à l'initialisation du monorepo.

```
apps/
  api/        @pnm/api     API Express/Zod : un routeur, sans connaissance du front
  web/        @pnm/web     front React/Vite/DSFR, sans connaissance du serveur
  server/     @pnm/server  processus web unique : monte l'API sous /api, sert le build du front
packages/                  code partagé au besoin (schémas Zod communs au front et à l'API)
pipelines/                 traitements de préparation des référentiels, publiés sur S3
docs/
```

Seul `@pnm/server` dépend à la fois de l'API et du front. C'est ce qui garde les deux séparés.

## Questions ouvertes

- **Intégration React du DSFR** : `@codegouvfr/react-dsfr` est la bibliothèque de référence.
- **Développement local** : un seul processus (Vite en mode middleware dans Express)
- **Format des référentiels sur S3** : à définir.
- **Cartographie** : MapLibre GL JS + fonds de carte à définir
