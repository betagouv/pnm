# Parcours porteur de projet (v0)

> En cours de définition.

## Vue d'ensemble

1. **Accueil.** La page explique à quoi sert le service et présente les grandes étapes. Un
   bouton « Préparer mon projet » s'adresse aux porteurs de projet.
2. **Préparer mon projet.** Le porteur choisit d'abord le parc naturel marin concerné.
3. **Parcours guidé** dans le parc choisi, en quatre étapes :
   1. **Votre activité** ;
   2. **Localisation du projet** ;
   3. **Habitats concernés** ;
   4. **Recommandations**.

## Accueil

- Pourquoi on est là, puis le bouton « Préparer mon projet ».
- Les grandes étapes pour monter son projet :
  1. sélectionner l'activité et la zone concernée ;
  2. consulter les impacts et les recommandations du parc ;
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

## Accueil du parc

Chaque parc a sa page d'accueil, à `/parcs/<parc>`, d'après la maquette de la designeuse.
Quand un parc est affiché, l'entrée « Accueil » du menu mène à sa page d'accueil ; sinon, à
l'accueil du site. Choisir un parc dans le menu hors d'une section mène aussi à sa page d'accueil.

- **« Un projet dans le Parc ? »** : à qui s'adresse le service, la mise en garde sur l'étude de
  terrain, puis le bouton « Préparer / Évaluer un projet » vers le parcours. Le nom complet du parc
  précède le titre, et son logo l'accompagne.
- **Les grandes étapes** pour adapter un projet aux enjeux du Parc, chacune sous son illustration.
- **Missions et objectifs du Parc** : trois missions, chacune avec un pictogramme du DSFR, et une
  photo du parc.
- **Les dernières actualités** : trois cartes (cards) DSFR, avec leur catégorie, leur date et un
  pictogramme en guise d'image. Leur source n'est pas choisie : la page montre des actualités
  inventées pour le Cap Corse (`apps/web/src/exemple-actualites.ts`), avec un badge « Contenu
  d'exemple ».

Le logo et la photo d'un parc sont désignés dans `apps/api/src/parcs.json` (`logo`, `photo`) par
leur adresse sur le site ; les fichiers sont dans `apps/web/public/parcs/<parc>/`. Un parc sans
logo ni photo a la même page, sans ces images. Le texte de la page vaut pour tous les parcs.

Écarts à la maquette :

- l'en-tête propre au parc (« Parc naturel marin / Cap Corse Agriate ») et son menu (« Découvrir
  les enjeux du Parc », « Les travaux du Parc », « Données ») ne sont pas repris : le site garde
  son en-tête et son menu ;
- la phrase « Le Parc naturel marin réunit », inachevée, n'est pas reprise ;
- les emplacements d'image des missions sont des pictogrammes du DSFR (`environment/leaf`,
  `environment/human-cooperation`, `leisure/community`).

Questions ouvertes :

- La source des actualités de chaque parc.
- Le texte de la page est-il propre à chaque parc ? Il faudrait alors le porter dans les données.
- La légende de la photo du Cap Corse (l'île de la Giraglia ?) : **à confirmer**. Elle est
  décorative en attendant.

## Le parcours en quatre étapes

Chaque étape a sa propre adresse : `/parcs/<parc>/preparer-mon-projet/<étape>`, avec
`activite`, `localisation`, `habitats` et `recommandations`. Un bandeau commun rappelle le parc et
porte l'indicateur d'étapes du DSFR. En bas de page, « Retour » et « Continuer » passent d'une étape
à l'autre. La page ne saute pas en haut : l'indicateur d'étapes revient dans l'écran en douceur
s'il en était sorti, et son titre prend le focus pour que les lecteurs d'écran annoncent l'étape.

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
- Les activités proposées sont celles du plan de gestion du parc, dans la table « Activités (MPM) »
  de son document Grist : chaque parc a les siennes. Le projet garde l'identifiant Grist de
  l'activité.
- **Ajouter une activité** : une ligne dans cette table, avec son nom, sa description et son
  pictogramme, puis un passage de la chaîne de traitement. Le pictogramme est désigné par sa
  catégorie et son nom dans le DSFR, par exemple `institutions/navy-anchor`. Un nom inconnu du DSFR
  laisse sa place vide.
- La description de « Rechargement de plage » et son pictogramme (`environment/sun`) sont
  provisoires, **à confirmer**.

### 2. Localisation du projet

Sans localisation, on ne peut pas remonter les recommandations : elle est obligatoire. Continuer
sans rien sur la carte affiche une erreur.

Un projet peut réunir plusieurs éléments, par exemple une série de mouillages et un circuit de
course :

- **des lieux**, une série de points (mouillages, stations de prélèvement…), avec un rayon
  autour de chacun ;
- **un parcours**, ouvert ou en boucle (circuit de course, randonnée nautique…), avec la largeur
  de son couloir. L'intérieur d'une boucle n'en fait pas partie : si l'intérieur compte, c'est une
  zone ;
- **une zone**, donnée par ses angles, avec une marge autour.

Chaque élément garde ce que le porteur a dessiné et sa distance, pas la surface calculée. La
marge d'une zone s'étend vers l'extérieur, la largeur d'un couloir se répartit de part et d'autre
du parcours. La carte calcule la surface couverte (`@turf/buffer`) pour l'afficher.

L'interface vise à rester intelligible pour un néophyte :

- les commandes sont des boutons DSFR hors de la carte, pas une barre d'outils posée dessus ;
- pendant le dessin, une consigne dit quoi faire ; « Terminer », « Annuler le dernier point » et
  « Abandonner » sont des boutons visibles. Finir sur le premier point boucle un parcours ou
  ferme une zone, avec plus de tolérance au doigt qu'à la souris ;
- rien ne bouge au-dessus de la carte pendant le dessin : la consigne est fixe et les boutons
  sont là dès le début, désactivés tant qu'ils ne servent pas. Sur mobile, où ils s'empilent, un
  bouton qui apparaîtrait décalerait la carte sous le doigt ;
- la carte s'ouvre sur le projet s'il en a déjà, sinon sur tout le parc ; « Zoomer sur le
  projet » y revient ;
- une liste à côté de la carte dit en mots ce qu'elle montre (« Boucle de 4,2 km ») et règle la
  distance de chaque élément, affichée en direct sur la carte.

La carte affiche la photographie aérienne de l'IGN et le périmètre du parc. Les périmètres des 8
parcs viennent du WFS de l'OFB (couche des aires marines protégées, `wxs.ofb.fr`), simplifiés à
20 m près pour l'affichage. Ils sont préparés par la chaîne de traitement, puis copiés dans
l'API.

À venir :

- **saisie de coordonnées**, nécessaire pour l'accessibilité (RGAA) : un dessin à la souris ne
  s'utilise pas au clavier ;
- **import de fichiers** : GPX, KML, GeoJSON, Shapefile ;
- **modification** d'un élément déjà dessiné ;
- **distances par défaut et limites** selon l'activité, fournies avec les données ;
- **« Situé dans… »** : croisement avec les zonages, fournis avec les données ;
- **recherche d'un lieu** (port, plage…) et fond vectoriel OpenFreeMap.

Questions ouvertes :

- Le parc a déjà un champ `localisation` (sa façade maritime, « Méditerranée »), homonyme de la
  localisation du projet : à renommer ?
- Quelles autres informations décrivent le projet ?

### 3. Habitats concernés

Une fois la localisation validée, l'étape montre les habitats que rencontre le projet, d'après le
croisement de sa localisation par l'API. Sans localisation, elle renvoie à l'étape 2.

- La surface couverte par le projet, puis une carte (card) DSFR par habitat, en deux groupes :
  **dans votre zone de projet** et **à proximité** (à moins de la tolérance du croisement).
- Chaque carte donne la part du projet dans l'habitat et sa surface, avec une jauge à la couleur
  de l'habitat, ou sa distance au projet. Quand le projet a plusieurs éléments, elle dit lesquels
  sont concernés.
- Sous les cartes, la part du projet qui ne recoupe aucun habitat connu.
- Choisir une carte (un bouton) affiche à côté, ou dessous sur mobile, l'aperçu de l'habitat par
  rapport au projet : ses chiffres, la carte de l'habitat sur la zone du projet, lue dans les
  PMTiles des habitats, avec une légende, le début de sa présentation et un lien vers sa fiche.
  L'habitat qui prend la plus grande part du projet est choisi d'emblée. Les contours de l'habitat
  sont élargis et simplifiés par la chaîne : l'aperçu le dit.
- Si l'API ne peut pas croiser la localisation, l'étape le signale et laisse continuer.

### 4. Recommandations

L'étape rappelle l'activité choisie et montre les recommandations du plan de gestion pour le
projet. Sans localisation, elle renvoie à l'étape 2.

Une recommandation, dans la table « Recommandations (MPM) » du plan de gestion, peut viser des
activités, des habitats, ou les deux :

- si elle vise des activités, le projet doit avoir l'une d'elles ;
- si elle vise des habitats, le projet doit en concerner un : dans sa zone ou à proximité, comme à
  l'étape 3 ;
- si elle ne vise rien, elle vaut pour tous les projets.

Chaque recommandation est une carte (card) DSFR : une illustration, l'enjeu qu'elle sert en
étiquette (tag), son titre et sa description. Une recommandation qui vise des habitats dit lesquels
le projet concerne. L'illustration est provisoire, la même pour toutes, en attendant celles du plan
de gestion. Sans titre, la description prend sa place.

Si l'API ne peut pas croiser la localisation, l'étape le signale et montre les recommandations qui
ne visent pas d'habitat.

La maquette y montre aussi des projets similaires et des guides de bonnes pratiques, et un encart
« Besoin d'un accompagnement ? ». Contenus et sources à définir.

## Plan de gestion

Le plan de gestion d'un parc a ses pages, indépendantes du projet, sous
`/parcs/<parc>/plan-de-gestion`. Une entrée « Plan de gestion » du menu principal y mène, pour le
parc en cours. Seul le plan du Cap Corse et de l'Agriate est dans Grist ; un parc sans plan de
gestion n'a pas ces pages. Le contenu est encore partiel : chaque page dit ce qui manque.

Une entité a sa page quand elle porte un contenu propre ; celles qui ne font que ranger les autres
deviennent des titres, des sections ou des étiquettes :

| Page | Adresse | Contenu |
| --- | --- | --- |
| Présentation | `plan-de-gestion` | Le document officiel, les enjeux, les habitats rangés par habitat générique, les actions |
| Enjeu | `plan-de-gestion/enjeux/<id>` | Sa formulation et sa synthèse, ses objectifs à long terme, chacun avec ses sous-objectifs, leur niveau d'exigence et leurs indicateurs ; les habitats et les actions liés |
| Habitat | `plan-de-gestion/habitats/<code habitat>` | Sa présentation, l'enjeu et l'objectif dont il relève, ses codes, les recommandations qui le visent, et sa carte sur tout le parc quand la chaîne en a les surfaces |
| Action | `plan-de-gestion/actions/<id>` | Sa synthèse, sa période, son porteur, son financement, et ce qu'elle sert dans le plan |

- Sans page : l'objectif à long terme (un titre de section de son enjeu, avec une ancre), le
  sous-objectif et ses indicateurs (un bloc sous son objectif), la recommandation (une carte, comme
  à l'étape 4, dans la fiche des habitats qu'elle vise, avec les activités qu'elle vise).
- Pas affichés : le sous-enjeu, simple étiquette ; la nomenclature détaillée des activités (table
  « Activités »), les métriques et l'inventaire des données géographiques. Les recommandations qui
  ne visent pas d'habitat n'apparaissent qu'à l'étape 4.
- Navigation : un menu latéral DSFR liste la présentation, les enjeux, les habitats et les actions
  ; un fil d'Ariane situe chaque page ; les pages se lient entre elles (habitat et enjeu, action et
  objectif). L'aperçu d'un habitat, à l'étape 3, mène à sa page.
- Les textes du plan sont repris tels que tapés dans Grist : paragraphes séparés par une ligne
  vide, listes dont les lignes commencent par `*` ou `-`.

Questions ouvertes :

- Les noms des habitats viennent tels quels du plan de gestion, dans Grist : leurs suffixes
  (« - habitat prioritaire ») sont à harmoniser.
- Hors des côtes, la photographie aérienne de l'IGN laisse des tuiles blanches : un fond
  vectoriel (OpenFreeMap) les éviterait.
