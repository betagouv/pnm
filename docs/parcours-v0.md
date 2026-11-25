# Parcours porteur de projet (v0)

> En cours de définition.

## Vue d'ensemble

1. **Accueil.** La page explique à quoi sert le service et présente les grandes étapes. Un
   bouton « Préparer mon projet » s'adresse aux porteurs de projet.
2. **Préparer mon projet.** Le porteur choisit d'abord le parc naturel marin concerné.
3. **Parcours guidé** dans le parc choisi, en quatre étapes :
   1. **Votre activité** ;
   2. **Localisation du projet** ;
   3. **Enjeux concernés** ;
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

- le titre propre au parc dans l'en-tête (« Parc naturel marin / Cap Corse Agriate ») et son menu
  (« Les travaux du Parc », « Données ») ne sont pas repris : le site garde son titre et son menu,
  où « Découvrir les enjeux du Parc » est devenu « Explorer les enjeux ». Son sous-titre, « Outil
  d'aide à la décision et à l'action », est devenu celui du site ;
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
`activite`, `localisation`, `enjeux` et `recommandations`. Un bandeau commun rappelle le parc et
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
- Les activités proposées sont celles du plan de gestion du parc, dans la table `Activites` de son
  document Grist : chaque parc a les siennes. Le projet garde l'identifiant Grist de
  l'activité.
- **Ajouter une activité** : une ligne dans cette table, avec son nom, sa description et son
  pictogramme, puis un passage de la chaîne de traitement. Le pictogramme est désigné par sa
  catégorie et son nom dans le DSFR, par exemple `institutions/navy-anchor`. Un nom inconnu du DSFR
  laisse sa place vide.
- La description de « Rechargement de plage » et les pictogrammes des activités autres que
  « Manifestation nautique » sont provisoires, **à confirmer**. Les activités qui n'avaient pas de
  description en ont une générée, marquée comme les textes générés du plan (voir « Explorer les
  enjeux »).

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

### 3. Enjeux concernés

Une fois la localisation validée, l'étape montre les enjeux que rencontre le projet. Sans
localisation, elle renvoie à l'étape 2.

Trois enjeux, dans cet ordre : **Gouvernance**, **Habitats** et **Espèces**. Chacun est une carte
(card) DSFR, qui est un bouton : la choisir affiche l'enjeu à côté, ou dessous sur mobile. La carte
résume ce que le projet rencontre (« 2 habitats dans votre zone »). Habitats est choisi d'emblée.

Gouvernance et Espèces attendent leurs données : chacun dit, sous un badge « À venir », ce qu'il
montrera. Ce que recouvre la gouvernance (zones de gouvernance du croisement ?) est **à
confirmer**.

Habitats montre tous les habitats que rencontre le projet, d'après le croisement de sa localisation
par l'API :

- La surface couverte par le projet, puis une étiquette (tag) sélectionnable du DSFR par habitat,
  en deux groupes : **dans votre zone de projet** et **à proximité** (à moins de la tolérance du
  croisement).
- Une carte de tous ces habitats sur la zone du projet, lue dans les PMTiles des habitats, avec une
  légende. Les habitats qui partagent un habitat générique partagent une couleur, et la légende les
  nomme par lui (« Récifs ») : un parc en compte plus que de couleurs qu'on distingue. Les contours des habitats sont élargis et simplifiés par
  la chaîne : la page le dit.
- Une carte des habitats, ici comme sur la page d'un enjeu ou d'un habitat, s'ouvre en pleine page
  par un contrôle sous son zoom : la légende reste visible, la molette et un doigt zooment sans
  touche, et « Fermer », en haut à droite, ou Échap la referment. Hors pleine page, la carte ne
  zoome qu'avec deux doigts ou Ctrl, pour laisser défiler la page.
- Choisir une étiquette met son habitat en surbrillance sur la carte : les autres s'estompent.
  Dessous viennent sa distance s'il est à proximité, les éléments du projet qu'il concerne quand il
  y en a plusieurs, le début de sa présentation et un lien vers sa fiche. La choisir de nouveau la
  retire de la surbrillance.
- Ni la part du projet dans chaque habitat, ni sa surface, ni la part hors habitat ne sont
  affichées.
- Le script du DSFR bascule de lui-même une étiquette pressée quand on la clique : le clic est
  arrêté avant de l'atteindre, et c'est React qui garde le choix.
- Si l'API ne peut pas croiser la localisation, Habitats le signale et l'étape laisse continuer.

### 4. Recommandations

L'étape rappelle l'activité choisie et montre les recommandations du plan de gestion pour le
projet. Sans localisation, elle renvoie à l'étape 2.

Une recommandation, dans la table `Recommandations` du plan de gestion, peut viser des activités,
des habitats, ou les deux :

- si elle vise des activités, le projet doit avoir l'une d'elles ;
- si elle vise des habitats, le projet doit en concerner un : dans sa zone ou à proximité, comme à
  l'étape 3. Un habitat que la chaîne ne cartographie pas encore ne permet pas de le savoir : une
  recommandation qui en vise un s'affiche toujours, en disant pour quels habitats elle vaut ;
- si elle ne vise rien, elle vaut pour tous les projets.

Une recommandation a sa place dans le plan : on la rattache à son niveau le plus précis, un
sous-objectif, sinon un objectif, sinon un enjeu, et la chaîne en déduit les autres. Si plusieurs
niveaux sont remplis et se contredisent, la chaîne s'arrête. Pour qu'une recommandation très
spécifique ne s'affiche qu'aux projets qu'elle concerne, on la rattache à des activités, quitte à en
créer : « Plaisance », « Prestation de loisirs en mer » et « Plongée sous-marine » ont été créées
ainsi, d'après les sous-finalités 10a et 10b du plan, **à confirmer** par le parc.

Les recommandations sont rangées par enjeu, dans l'ordre du plan, chaque enjeu replié avec son
pictogramme et le nombre de ses recommandations ; celles que le plan ne place pas viennent en
dernier. Chacune est une carte (card) DSFR : son titre, sa description si elle ne fait pas que le
répéter, son objectif à long terme, qui mène à sa place sur la page de l'enjeu, et les habitats
qu'elle concerne. Sans titre, la description prend sa place.

Si l'API ne peut pas croiser la localisation, l'étape le signale et montre les recommandations qui
ne visent pas d'habitat cartographié.

La maquette y montre aussi des projets similaires et des guides de bonnes pratiques, et un encart
« Besoin d'un accompagnement ? ». Contenus et sources à définir.

## Explorer les enjeux

Les enjeux du plan de gestion d'un parc ont leur section, indépendante du projet, sous
`/parcs/<parc>/enjeux`, d'après la maquette de la designeuse. Une entrée « Explorer les enjeux » du
menu principal y mène, pour le parc en cours. Elle remplace les anciennes pages « Plan de gestion ».
Seul le plan du Cap Corse et de l'Agriate est dans Grist ; un parc sans plan de gestion n'a pas
cette section.

Les enjeux sont une donnée : chaque parc a les siens, dans son document Grist, avec leur
pictogramme et leurs textes. Le code ne connaît aucun enjeu en particulier. Un enjeu liste les
habitats et les espèces qui relèvent de ses sous-objectifs. Il montre ses habitats sur une carte
quand la chaîne en a les surfaces : c'est le cas d'« Habitats » au Cap Corse. Les espèces n'ont pas
encore de données de répartition.

Les espèces sont dans la table `Especes` du document Grist, chacune rattachée à un sous-objectif ;
une page les range dans l'ordre de leurs sous-objectifs. Au Cap Corse, Mon Parc Marin y a mis les
20 espèces que le plan de gestion de 2019 présente vraiment (chapitre 6 : oiseaux marins, cétacés,
tortue caouanne, espèces protégées, ange de mer), chacune avec un résumé du plan : la liste est à
valider par le parc. Leur identifiant TAXREF (`cdNom`) n'y est pas encore, **à confirmer**.

| Page | Adresse | Contenu |
| --- | --- | --- |
| Enjeux du Parc marin | `enjeux/<id>` | Un filtre par grande thématique, une étiquette par enjeu ; l'enjeu choisi : sa carte s'il en a une, ses habitats et ses espèces, ses chiffres, sa description, sa synthèse (« En savoir plus »), ses bénéfices pour la mer et pour le territoire, ses objectifs avec leur présentation (repliée au-dessus de leurs sous-objectifs, ou en entier pour ceux que le plan ne divise pas, avec leur niveau d'exigence), les actions du Parc |
| Sous-objectif | `enjeux/sous-objectifs/<id>` | Sa présentation, son niveau d'exigence, une image, ses indicateurs (« Où en est-on ? ») et les habitats et les espèces qui en relèvent |
| Habitat | `enjeux/habitats/<code habitat>` | Sa présentation, l'enjeu et le sous-objectif dont il relève, ses codes, les recommandations qui le visent, et sa carte sur tout le parc quand la chaîne en a les surfaces |
| Espèce | `enjeux/especes/<id>` | Son nom, son nom scientifique, sa présentation, l'enjeu et le sous-objectif dont elle relève |
| Action | `enjeux/actions/<id>` | Sa synthèse, sa catégorie, sa période, son porteur, son financement, et ce qu'elle sert dans le plan |

- `enjeux` mène au premier enjeu du plan. Choisir une étiquette change d'enjeu sans faire
  remonter la page : l'adresse porte l'enjeu, qu'on peut partager.
- Un fil d'Ariane situe chaque page : une page de détail se range sous l'enjeu dont elle relève,
  une action sous le premier enjeu qu'elle sert. L'aperçu d'un habitat, à l'étape 3, mène à sa
  fiche.
- Les chiffres d'un enjeu se calculent : ses sous-objectifs et les recommandations qui le servent.
- Le statut d'une action (« En cours », « Terminée », « À venir ») se déduit de ses dates.
- Pas affichés : le sous-enjeu, simple étiquette ; la formulation de l'enjeu ; la nomenclature
  détaillée des activités (table `Nomenclature_activites`), les métriques et l'inventaire des
  données géographiques.
- Les textes du plan sont repris tels que tapés dans Grist, et ceux que Mon Parc Marin a rédigés
  portent une marque, affichée en badge : voir [modele-grist.md](modele-grist.md).

Écarts à la maquette :

- l'en-tête et le menu propres au parc ne sont pas repris (voir l'accueil du parc) ;
- les nombres entre parenthèses des étiquettes ne sont pas repris : leur sens n'est pas défini ;
- « Enjeux forts identifiés » devient « Sous-objectifs » : la notion n'est pas définie ;
- la légende de la carte est sous la carte, comme ailleurs sur le site ;
- les cartes d'action n'affichent pas le code EVA ; les encadrés de bénéfices n'ont pas de
  pictogramme ;
- les jauges des indicateurs et l'échelle du baromètre attendent leurs mesures : chaque indicateur
  porte « Baromètre à venir » ;
- les images sont des emplacements « Image à venir » ;
- l'écran de choix d'une commune, d'une zone ou d'un point n'est pas fait.

Questions ouvertes :

- Les scores des indicateurs : par métrique ou par indicateur, sur quelle échelle (4 niveaux dans
  la maquette, 1 à 5 dans les mesures) ?
- Les noms des habitats viennent tels quels du plan de gestion, dans Grist : leurs suffixes
  (« - habitat prioritaire ») sont à harmoniser.
- Hors des côtes, la photographie aérienne de l'IGN laisse des tuiles blanches : un fond
  vectoriel (OpenFreeMap) les éviterait.
