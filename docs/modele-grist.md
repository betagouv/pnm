# Modèle Grist du plan de gestion

Le plan de gestion de chaque parc est un document Grist, que l'équipe du parc tient à jour. La
chaîne de traitement le lit (`pipelines/src/plan-gestion`, `pipelines/src/habitats`) et en tire le
fichier que l'API sert au site. Ce fichier décrit les tables et les colonnes qu'elle lit, et ce que
le site en fait.

Tous les documents de plan de gestion suivent ce modèle : un document qui s'en écarte change dans
Grist, la chaîne ne gère pas de variantes. Un changement du modèle met ce fichier à jour dans la
même PR que le code qui le suit. Le plan de gestion adopté reste la source de vérité : le document
Grist le retranscrit.

Documents traités : le Parc naturel marin du Cap Corse et de l'Agriate. La liste est dans
`pipelines/src/sources.ts`.

## Conventions

### Noms

- Une table porte un nom au pluriel : `Enjeux`, `Sous_objectifs`.
- Une colonne a pour identifiant le nom du champ dans le code, en camelCase, sans traduire les
  termes du domaine : `libelle`, `niveauExigence`. Son libellé, en français, s'adresse à l'équipe
  du parc. L'identifiant est détaché du libellé : retoucher un libellé ne casse pas la chaîne.
- Un lien porte le nom de ce qu'il vise, au singulier ou au pluriel : `enjeu`, `objectifs`. Lu
  dans les deux sens, c'est une référence bidirectionnelle de Grist, pas une formule. Une
  référence affiche le libellé court de ce qu'elle vise, ou son libellé.
- Pas de colonne qui recopie l'identifiant de ligne ou une valeur d'une autre table.

### Valeurs

- Un texte vide vaut une absence. Les identifiants du site sont ceux des lignes Grist : supprimer
  une ligne et la recréer change son identifiant.
- Un pictogramme est un pictogramme du DSFR, désigné par sa catégorie et son nom :
  `environment/leaf`, `institutions/navy-anchor`. Un nom mal formé arrête la chaîne ; un nom bien
  formé que le DSFR ne connaît pas laisse sa place vide.
- Les textes sont repris tels que tapés : paragraphes séparés par une ligne vide, lignes de liste
  qui commencent par `- ` ou `* `, barre oblique inverse `\` en fin de ligne pour forcer un retour
  à la ligne. Un simple retour à la ligne ne compte pas : un texte copié d'un document en garde
  souvent.
- Un texte que Mon Parc Marin a rédigé, là où le plan de gestion n'en avait pas, commence par une
  marque, que le site affiche en badge. L'équipe du parc relit le texte, puis retire la marque :
  - `[Résumé du plan]` : un résumé du plan de gestion adopté, qui finit par les pages utilisées
    (pour le Cap Corse et l'Agriate, le
    [plan de 2019](https://www.consultations-publiques.developpement-durable.gouv.fr/IMG/pdf/plan_de_gestion_pnmca_-_partie_1_-_plan_de_gestion.pdf)) ;
  - `[Texte généré]` : un texte écrit à partir des seuls libellés du plan.

### Ce qui arrête la chaîne

La chaîne refuse un document plutôt que de servir un plan faux :

- une table lue qui manque, ou une colonne `Habitats.code` qui n'est pas de type texte (Grist lit
  `1110-5` comme une date dans un autre type) ;
- deux habitats qui ont le même code ;
- une recommandation qui vise une activité ou un habitat absent du plan, ou dont le sous-objectif,
  l'objectif et l'enjeu se contredisent ;
- un pictogramme mal formé.

Une ligne à laquelle manque un champ obligatoire, signalé dans chaque table, est ignorée.

## Vue d'ensemble

- `Plan_de_gestion` : le document adopté.
- `Enjeux` → `Objectifs` → `Sous_objectifs` → `Indicateurs` : l'arbre du plan. Les objectifs
  sont les finalités du plan, les sous-objectifs ses sous-finalités.
- `Habitats`, `Especes` : rattachés chacun à un sous-objectif.
- `Actions` : ce que fait le Parc, rattaché aux enjeux, objectifs et sous-objectifs qu'il sert.
- `Activites` : les activités que le porteur de projet choisit.
- `Recommandations` : les conseils au porteur de projet, placés dans l'arbre du plan et visant
  des activités et des habitats.
- `Photos` : les images, que d'autres tables visent.

## Tables

### `Plan_de_gestion`

Une ligne : le plan de gestion en vigueur.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `document` | Plan de gestion (adresse) | Texte | Le lien « Lire le plan de gestion du Parc ». La première adresse `http(s)://` de la table |

Non lue : `guide`.

### `Enjeux`

Les enjeux du parc : chaque parc a les siens.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `libelle` | Libellé | Texte | L'étiquette du filtre et le titre de l'enjeu. Sans libellé : « Enjeu N » |
| `pictogramme` | Pictogramme | Texte | À côté du titre, et dans les recommandations du projet |
| `description` | Description courte | Texte | « Description » |
| `synthese` | Synthèse | Texte | « En savoir plus », sous la description |
| `beneficesMer` | Bénéfices pour la mer | Texte | « Bénéfices », un bénéfice par ligne |
| `beneficesTerritoire` | Bénéfices pour le territoire | Texte | Idem |
| `formulation` | Formulation du plan de gestion | Texte | Lu, pas affiché : le titre de l'enjeu dans le plan |
| `objectifs` | Objectifs | Liste de références | Sens inverse de `Objectifs.enjeu` |
| `recommandations` | Recommandations | Liste de références | Sens inverse de `Recommandations.enjeu` |

Non lues : `referents`, `photo`, et trois formules qui listent les données géographiques de
l'enjeu.

### `Objectifs`

Les objectifs à long terme : les finalités du plan.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `libelle` | Libellé | Texte | Le titre de l'objectif. Sans libellé : « Objectif N » |
| `enjeu` | Enjeu | Référence | L'enjeu dont il relève |
| `synthese` | Synthèse | Texte | Sa présentation : repliée au-dessus de ses sous-objectifs, en entier s'il n'en a pas |
| `niveauExigence` | Niveau d'exigence | Texte | Pour un objectif que le plan ne divise pas en sous-objectifs |
| `sousEnjeu` | Sous-enjeu | Texte | Lu, pas affiché : une étiquette qui range les objectifs |
| `libelleCourt` | Libellé court | Texte | Ce qu'affichent les références dans Grist |
| `recommandations` | Recommandations | Liste de références | Sens inverse de `Recommandations.objectif` |

### `Sous_objectifs`

Les sous-objectifs : les sous-finalités du plan. Chacun a sa page.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `libelle` | Libellé | Texte | Le titre de sa page. Sans libellé : « Sous-objectif N » |
| `objectif` | Objectif | Référence | L'objectif dont il relève |
| `synthese` | Synthèse | Texte | Sa présentation |
| `niveauExigence` | Niveau d'exigence | Texte | « Niveau d'exigence du plan de gestion », une puce du plan par ligne de liste |
| `libelleCourt` | Libellé court | Texte | Ce qu'affichent les références dans Grist |
| `recommandations` | Recommandations | Liste de références | Sens inverse de `Recommandations.sousObjectif` |

Non lue : `photo`.

### `Indicateurs`

Ce qui mesure l'avancée d'un sous-objectif : « Où en est-on ? ».

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `code` | Code | Texte | Obligatoire, avec le libellé : `I2-3a` |
| `libelle` | Libellé | Texte | Le titre de la carte de l'indicateur |
| `sousObjectif` | Sous-objectif | Référence | Le sous-objectif qu'il mesure |

Non lues : `metriques` et les trois formules de score par année. Les tables `Metriques` et
`Mesures`, qui les alimentent, ne sont pas lues non plus : les scores ne sont pas encore définis.

### `Habitats`

Les habitats élémentaires que suit le plan. Chacun a sa page, et la chaîne y rattache les surfaces
des couches de l'OFB par leur code.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `code` | Code habitat élémentaire | Texte, imposé | Obligatoire et unique : `1120-1`, tel que l'écrivent les gestionnaires du parc |
| `nom` | Habitat élémentaire | Texte | Obligatoire : le titre de sa page |
| `codeHabitatGenerique` | Code habitat générique | Texte | « Habitat générique », avec le nom : `1120` |
| `nomHabitatGenerique` | Habitat générique | Texte | Idem. L'un sans l'autre n'est pas affiché |
| `synthese` | Synthèse | Texte | Sa présentation |
| `sousObjectif` | Sous-objectif | Référence | Le sous-objectif dont il relève : il apparaît dans son enjeu et sur la page du sous-objectif |

Non lues : `representativite`, `interetConservation`, `pressions`, `consequences`, `photo`.

### `Especes`

Les espèces que suit le plan. Chacune a sa page.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `nom` | Nom | Texte | Obligatoire : le titre de sa page |
| `nomScientifique` | Nom scientifique | Texte | En italique, sous le nom |
| `synthese` | Synthèse | Texte | Sa présentation |
| `sousObjectif` | Sous-objectif | Référence | Le sous-objectif dont elle relève : elle apparaît dans son enjeu et sur la page du sous-objectif |

Non lue : `photo`. L'identifiant TAXREF (`cdNom`) n'y est pas encore, **à confirmer**.

### `Actions`

Les actions du Parc, reprises de l'outil EVA. Chacune a sa page.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `libelle` | Libellé | Texte | Le titre de la carte et de la page. Sans libellé : « Action N » |
| `categorie` | Catégorie (nomenclature) | Choix | Un badge sur la carte |
| `synthese` | Synthèse | Texte | Sa présentation |
| `debut` | Début | Date | Sa période, et son statut : « À venir », « En cours », « Terminée » |
| `fin` | Fin | Date | Idem |
| `porteur` | Porteur | Texte | Sur sa page |
| `operateurTechnique` | Opérateur technique | Texte | Idem |
| `acteurOperationnel` | Acteur opérationnel | Texte | Idem |
| `financement` | Financement | Texte | Idem |
| `enjeu` | Enjeu | Référence | Un enjeu qu'elle sert |
| `objectifs` | Objectifs | Liste de références | Les objectifs qu'elle sert : elle sert aussi leurs enjeux |
| `sousObjectifs` | Sous-objectifs | Liste de références | Les sous-objectifs qu'elle sert |

Non lues : `codeEva`, `type`, `photo`.

### `Activites`

Les activités que le porteur de projet choisit à la première étape. Chaque parc a les siennes. Créer une activité permet de réserver une recommandation très
spécifique aux projets qu'elle concerne.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `nom` | Nom | Texte | Obligatoire : le libellé du choix |
| `description` | Description | Texte | Le texte d'aide sous le libellé |
| `pictogramme` | Pictogramme | Texte | À côté du choix |
| `active` | Active | Booléen | Lu, pas affiché : seules les activités actives sont proposées au porteur de projet |

### `Recommandations`

Les conseils du plan au porteur de projet, à la dernière étape.

| Colonne | Libellé | Type | Sur le site |
| --- | --- | --- | --- |
| `description` | Description | Texte | Obligatoire. Sans titre, elle en tient lieu ; si elle répète le titre, elle n'est pas affichée |
| `titre` | Titre | Texte | Le titre de la carte |
| `sousObjectif` | Sous-objectif | Référence | Sa place dans le plan : voir ci-dessous |
| `objectif` | Objectif | Référence | Idem. Le site affiche l'objectif à long terme |
| `enjeu` | Enjeu | Référence | Idem. Le site range les recommandations par enjeu |
| `activites` | Activités | Liste de références | Les activités qu'elle vise |
| `habitats` | Habitats | Liste de références | Les habitats qu'elle vise |

- **Sa place dans le plan** : on remplit le niveau le plus précis, le sous-objectif, sinon
  l'objectif, sinon l'enjeu, et la chaîne en déduit les autres. Une recommandation sans aucun des
  trois est rangée dans « Autres recommandations ».
- **À qui elle s'adresse** : si elle vise des activités, le projet doit avoir l'une d'elles. Si
  elle vise des habitats, le projet doit en concerner un ; un habitat qui n'a pas encore de carte
  ne permet pas de le savoir, et la recommandation s'affiche alors toujours. Sans activité ni
  habitat, elle vaut pour tous les projets.

Non lues : `sources`, `pointControle`, `fichePratique`, `sequenceErc`.

### `Photos`

Les images que visent les colonnes `photo` des autres tables, avec leur légende et leur crédit.
Elles ne sont pas encore lues : la page d'un sous-objectif montre un emplacement « Image à venir ».

## Les autres tables

Le document contient d'autres tables, que la chaîne ne lit pas : l'inventaire des données
géographiques par enjeu (`Donnees_geographiques_*` et `E1_*` à `E9_*`, deux versions à fusionner),
`Mesures` et `Metriques` (le tableau de bord des indicateurs), `Nomenclature_activites` (une
nomenclature de référence) et `Outil_PNMBA` (des mesures reprises de l'outil d'un autre parc).
