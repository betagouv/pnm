# AGENTS.md

Mon Parc Marin est un service public de l'OFB, sans
authentification. Il informe les porteurs de projet au regard des parcs naturels marins.
Contexte, architecture et parcours : [`docs/`](docs/README.md).

## Git : dépôt public de l'État

- Jamais de push, d'issue ni de PR sans accord explicite. Un agent ne merge jamais.
- Jamais de trace de session d'agent de code dans les commits et les PR (`Co-Authored-By`, lien de
  session, « Generated with »).
- Une branche par sujet depuis `main`. Pas de commit direct sur `main`.
- Commits en Conventional Commits, en anglais : `feat(web): add parc selection screen`.
- PR et issues en français.

## Langue

- Code en anglais, sauf le domaine métier, qu'on ne traduit pas : `listParcs()`,
  `porteurProjet`, et non `park`, `projectOwner`. Identifiants sans accents. Référence :
  [`docs/glossaire.md`](docs/glossaire.md).
- Interface et `docs/` en français.

## Front

- DSFR obligatoire : ses composants et ses classes, pas d'autre bibliothèque UI ni de style maison sauf pour ce que le DSFR ne propose pas
- Séparer les composants UI (présentation pure, pilotés par leurs props) des composants de haut
  niveau (données, état, logique métier). Cette séparation s'installe progressivement.
- Vérifier toute modification d'interface avec agent-browser : conformité aux éléments fournis,
  fonctionnement sur mobile (`agent-browser set viewport 375 812`) et sur desktop.

## Documentation

- Tenir `docs/` à jour au fur et à mesure, dans la même PR que le changement : décisions prises,
  et tout nouveau terme métier dans le glossaire.
- N'affirmer que ce qui est vérifié ou sourcé, sinon écrire « à confirmer ».
