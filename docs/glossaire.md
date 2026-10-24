# Glossaire

Termes du domaine métier. Ils ne sont pas traduits dans le code. Leur forme dans le code est en
camelCase, sans accents ni article (voir [AGENTS.md](../AGENTS.md)).

| Terme | Dans le code | Définition |
| --- | --- | --- |
| Aire marine protégée (AMP) | `aireMarineProtegee` | Espace protégé en mer. Les parcs naturels marins, les sites Natura 2000 en mer et les réserves naturelles en font partie. |
| Parc naturel marin (PNM) | `parc` | Aire marine protégée gérée par l'OFB. On en compte 8. |
| Porteur de projet | `porteurProjet` | Personne ou structure qui envisage un projet dans un parc naturel marin. |
| Projet | `projet` | Ce que le porteur décrit dans le parcours : type d'activité, localisation… |
| Activité | `activite` | Activité humaine en mer. |
| Localisation | `localisation` | Les éléments qui situent un projet : lieux, parcours, zones. |
| Lieux | `lieux` | Série de points d'un projet (mouillages, stations…), avec un rayon autour de chacun. |
| Parcours | `parcours` | Tracé d'un projet, ouvert ou en boucle, avec la largeur de son couloir. |
| Zone | `zone` | Surface d'un projet, donnée par ses angles, avec une marge autour. |
| Périmètre | `perimetre` | Limite officielle d'un parc naturel marin. |
| Pression | `pression` | Effet qu'une activité exerce sur le milieu marin. |
| Plan de gestion | `planGestion` | Document qui fixe les objectifs de gestion d'un parc naturel marin. |
| Habitat | `habitat` | Habitat marin, identifié par `cdhab` (référentiel HABREF). |
| Espèce | `espece` | Espèce, identifiée par `cdnom` (référentiel TAXREF). |
| Mesure ERC | `mesureErc` | Mesure pour Éviter, Réduire ou Compenser un impact. |
| Référentiel | `referentiel` | Jeu de données de référence préparé par les traitements et publié sur S3. |
