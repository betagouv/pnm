# Glossaire

Termes du domaine métier. Ils ne sont pas traduits dans le code. Leur forme dans le code est en
camelCase, sans accents ni article (voir [AGENTS.md](../AGENTS.md)).

| Terme | Dans le code | Définition |
| --- | --- | --- |
| Aire marine protégée (AMP) | `aireMarineProtegee` | Espace protégé en mer. Les parcs naturels marins, les sites Natura 2000 en mer et les réserves naturelles en font partie. |
| Parc naturel marin (PNM) | `parc` | Aire marine protégée gérée par l'OFB. On en compte 8. |
| Porteur de projet | `porteurProjet` | Personne ou structure qui envisage un projet dans un parc naturel marin. |
| Projet | `projet` | Ce que le porteur décrit dans le parcours : type d'activité, localisation… |
| Activité | `activite` | Activité humaine en mer. Le porteur de projet choisit la sienne parmi celles du plan de gestion du parc. |
| Localisation | `localisation` | Les éléments qui situent un projet : lieux, parcours, zones. |
| Lieux | `lieux` | Série de points d'un projet (mouillages, stations…), avec un rayon autour de chacun. |
| Parcours | `parcours` | Tracé d'un projet, ouvert ou en boucle, avec la largeur de son couloir. |
| Zone | `zone` | Surface d'un projet, donnée par ses angles, avec une marge autour. |
| Périmètre | `perimetre` | Limite officielle d'un parc naturel marin. |
| Pression | `pression` | Effet qu'une activité exerce sur le milieu marin. |
| Plan de gestion | `planGestion` | Document qui fixe les objectifs de gestion d'un parc naturel marin. |
| Enjeu | `enjeu` | Ce que le plan de gestion d'un parc vise à préserver : la qualité de l'eau, les espèces, les habitats… Il se décline en objectifs à long terme. |
| Sous-enjeu | `sousEnjeu` | Étiquette qui range les objectifs à long terme d'un enjeu. |
| Sous-objectif | `sousObjectif` | Déclinaison concrète d'un objectif à long terme, avec son niveau d'exigence et ses indicateurs. |
| Niveau d'exigence | `niveauExigence` | Ce qu'un sous-objectif demande d'atteindre. |
| Indicateur | `indicateur` | Ce qui mesure l'atteinte d'un sous-objectif, identifié par un code : `I4-7a-A`. |
| Action | `action` | Action menée par le parc, étude ou suivi, au service d'enjeux et d'objectifs du plan de gestion. |
| Recommandation | `recommandation` | Conseil du plan de gestion d'un parc au porteur de projet, rattaché à un enjeu. Elle peut viser des activités et des habitats : elle ne vaut alors que pour un projet qui a l'une de ces activités et concerne l'un de ces habitats. |
| Habitat générique | `habitatGenerique` | Habitat de la typologie Natura 2000 qui regroupe des habitats élémentaires : `1120` pour les herbiers de Posidonia. |
| Objectif à long terme | `objectifLongTerme` | Objectif du plan de gestion d'un parc, décliné en sous-objectifs. Un habitat relève de l'un d'eux. |
| Habitat | `habitat` | Habitat élémentaire du plan de gestion d'un parc, identifié par son code habitat élémentaire, tel que l'écrivent les gestionnaires du parc : `1120-1` pour les herbiers à posidonie. |
| Croisement | `croisement` | Ce que rencontre la localisation d'un projet : habitats, et plus tard espèces et zones de gouvernance, avec les surfaces et les distances. |
| Espèce | `espece` | Espèce, identifiée par `cdnom` (référentiel TAXREF). |
| Mesure ERC | `mesureErc` | Mesure pour Éviter, Réduire ou Compenser un impact. |
| Référentiel | `referentiel` | Jeu de données de référence préparé par les traitements et publié sur S3. |
