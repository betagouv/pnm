# Parcours porteur de projet (v0)

> En cours de définition.

## Vue d'ensemble

1. **Accueil.** La page explique à quoi sert le service et présente les grandes étapes. Un
   bouton « Préparer mon projet » s'adresse aux porteurs de projet.
2. **Préparer mon projet.** Le porteur choisit d'abord le parc naturel marin concerné.
3. **Parcours guidé** dans le parc choisi, en plusieurs étapes :
   1. **Définir son projet** : type d'activité, localisation ou tracé cartographique…
   2. Étapes suivantes : à définir.

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

## Définir son projet

- **Type d'activité.** Le référentiel des activités de POOLPE (OFB) est une piste, mais incomplet.
- **Localisation ou tracé cartographique.** Le composant de la maquette, basé sur Leaflet, n'est
  pas retenu : on fera mieux.

Questions ouvertes :

- Quelles géométries le porteur peut-il saisir : point, tracé (ligne), emprise (polygone) ?
- Quel fond de carte, quelle bibliothèque cartographique ?
- Quelles autres informations décrivent le projet ?

## Suite du parcours

À définir.
