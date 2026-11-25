# AGENTS.md

Mon Parc Marin est un service public de l'OFB, sans
authentification. Il informe les porteurs de projet au regard des parcs naturels marins.
Contexte, architecture et parcours : [`docs/`](docs/README.md).

## Commandes

```bash
npm install
npm run dev         # API + front sur http://localhost:3000, un seul processus
npm run typecheck
npm run lint        # xo, avec --fix pour corriger
npm run build       # build du front, avant npm start
```

## Git : dépôt public de l'État

- Jamais de push, d'issue ni de PR sans accord explicite. Un agent ne merge jamais.
- Jamais de trace de session d'agent de code dans les commits et les PR (`Co-Authored-By`, lien de
  session, « Generated with »).
- Une branche par sujet depuis `main`. Pas de commit direct sur `main`.
- Commits en Conventional Commits, en français : `feat(web): ajoute l'écran de choix du parc`.
- PR et issues en français.

## Langue

- Identifiants du code en anglais, sauf le domaine métier, qu'on ne traduit pas : `listParcs()`,
  `porteurProjet`, et non `park`, `projectOwner`. Identifiants sans accents. Référence :
  [`docs/glossaire.md`](docs/glossaire.md).
- Commentaires du code, commits, PR, issues, interface et `docs/` en français. Les commentaires
  encore en anglais se traduisent quand on touche leur code.

## Types

- Un type n'est déclaré qu'une fois, dans du code partagé : `packages/shared` (`@pnm/shared`),
  sous forme de schéma Zod dont on déduit le type. L'API valide avec les schémas, le front
  n'importe que les types (`import type`).

## Front

- DSFR obligatoire : ses composants et ses classes, pas d'autre bibliothèque UI ni de style maison sauf pour ce que le DSFR ne propose pas
- Séparer les composants UI (présentation pure, pilotés par leurs props, dans
  `apps/web/src/components/`) des composants de haut niveau (données, état, logique métier, dans
  `apps/web/src/pages/`). Cette séparation s'installe progressivement.
- Vérifier toute modification d'interface avec agent-browser : conformité aux éléments fournis,
  fonctionnement sur mobile (`agent-browser set viewport 375 812`) et sur desktop.

## Documentation

- Tenir `docs/` à jour au fur et à mesure, dans la même PR que le changement : décisions prises,
  et tout nouveau terme métier dans le glossaire.
- N'affirmer que ce qui est vérifié ou sourcé, sinon écrire « à confirmer ».
