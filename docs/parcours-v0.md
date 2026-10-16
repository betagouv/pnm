# Parcours porteur de projet (v0)

> En cours de définition.

## Vue d'ensemble

1. **Accueil.** La page explique à quoi sert le service et présente les grandes étapes. Un
   bouton « Préparer mon projet » s'adresse aux porteurs de projet.
2. **Préparer mon projet.** Le porteur choisit d'abord le parc naturel marin concerné.
3. **Parcours guidé** dans le parc choisi, en trois étapes :
   1. **Votre activité** ;
   2. **Localisation du projet** ;
   3. **Mesures à prendre**.

## Accueil

- Pourquoi on est là, puis le bouton « Préparer mon projet ».
- Les grandes étapes pour monter son projet :
  1. sélectionner l'activité et la zone concernée ;
  2. consulter les impacts et les mesures à mettre en place ;
  3. consulter la documentation du parc ;
  4. construire son projet en tenant compte des enjeux du parc naturel marin.

## Choix du parc

« Préparer mon projet » présente les 8 parcs naturels marins en tuiles. Un parc disponible
mène à sa page. Les autres sont désactivés, avec la mention « Bientôt disponible ».

| Parc naturel marin | Disponible en v0 |
| --- | --- |
| Estuaires picards et mer d'Opale | non |
| Iroise | non |
| Bassin d'Arcachon | non |
| Estuaire de la Gironde et mer des Pertuis | non |
| Golfe du Lion | non |
| Cap Corse et Agriate | **oui** |
| Mayotte | non |
| Martinique | non |

Source : [OFB, Les parcs naturels marins](https://ofb.gouv.fr/les-parcs-naturels-marins)
(consulté le 15 octobre 2026).

- **Activer un parc** : passer `disponible` à `true` dans `apps/api/src/parcs.json`. Tous les
  parcs partagent les mêmes pages ; seuls certains contenus ciblés varieront d'un parc à l'autre.
- **Plus tard, peut-être** : une carte SVG des parcs, DROM compris, en complément des tuiles.
  Ce n'est pas la priorité.

Questions ouvertes :

- Logos des parcs sur les tuiles : non utilisés en v0, à reconsidérer.
- Ordre des tuiles : l'ordre géographique de l'OFB place le seul parc disponible en 6e position,
  ce qui oblige à défiler sur mobile.

## Le parc, sélection de haut niveau

Le parc choisi est porté par l'adresse : `/parcs/<parc>/<section>`, par exemple
`/parcs/cap-corse-agriate/preparer-mon-projet`. La navigation affiche le parc en cours et permet
d'en changer en restant dans la même section. Les futures sections (actualités, carte
interactive) conserveront ainsi le parc choisi.

## Le parcours en trois étapes

Chaque étape a sa propre adresse : `/parcs/<parc>/preparer-mon-projet/<étape>`, avec
`activite`, `localisation` et `mesures`. Un bandeau commun rappelle le parc et porte
l'indicateur d'étapes du DSFR. En bas de page, « Retour » et « Continuer » passent d'une étape à
l'autre. La page ne saute pas en haut : l'indicateur d'étapes revient dans l'écran en douceur s'il
en était sorti, et son titre prend le focus pour que les lecteurs d'écran annoncent l'étape.

Le projet en cours est gardé dans le navigateur (`localStorage`) : un seul projet par
navigateur, rattaché à son parc. Il survit à un rechargement et se retrouve en revenant sur le
site. Sans activité choisie dans ce parc, les étapes 2 et 3 renvoient à l'étape 1.

Plus tard, le projet sera stocké en base, avec un identifiant et une clé : le navigateur ne
gardera que ces deux valeurs.

La maquette reste indicative. Son titre « Cap projet » n'est pas repris : la page garde
« Préparer mon projet », comme la navigation.

### 1. Votre activité

- Le porteur choisit une activité parmi des boutons radio riches du DSFR, avec pictogramme. La
  maquette montrait des tuiles, mais les tuiles DSFR servent à naviguer et n'ont pas d'état
  sélectionné. Continuer sans choix affiche une erreur sur le groupe de boutons.
- Activités proposées, reprises de la maquette : « Manifestation nautique » et « Étude
  scientifique ». Liste et descriptions **à confirmer**.
- **Ajouter une activité** : une entrée dans `apps/api/src/activites.json`, pictogramme compris.
  Le pictogramme est désigné par sa catégorie et son nom dans le DSFR, par exemple
  `institutions/navy-anchor`. Un nom inconnu du DSFR laisse sa place vide.
- Le référentiel des activités de POOLPE (OFB) est une piste, mais incomplet.

### 2. Localisation du projet

Squelette : l'étape rappelle l'activité choisie et annonce la carte.

- Le composant de la maquette, basé sur Leaflet, n'est pas retenu : on fera mieux.

Questions ouvertes :

- Quelles géométries le porteur peut-il saisir : point, tracé (ligne), emprise (polygone) ?
- Quel fond de carte, quelle bibliothèque cartographique ?
- Quelles autres informations décrivent le projet ?

### 3. Mesures à prendre

Squelette : l'étape rappelle l'activité choisie et annonce les mesures.

La maquette y montre les mesures concrètes à prendre, des projets similaires et des guides de
bonnes pratiques, et un encart « Besoin d'un accompagnement ? ». Contenus et sources à définir.
