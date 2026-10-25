# Déploiement

L'application tourne sur Scalingo. Les données de la chaîne de traitement sont publiées dans un
bucket S3 de Scaleway, que l'API et le navigateur lisent en HTTPS.

## Scalingo

- Buildpack Node.js, sans configuration propre au projet :
  - `npm ci`, dépendances de développement comprises, puis `npm run build` ;
  - les dépendances de développement sont retirées à la fin du build : le serveur ne doit pas en
    dépendre à l'exécution ;
  - démarrage par `npm start` (le script `start`, faute de `Procfile`).
- Version de Node.js : pour `engines.node` `>=24`, le buildpack prend la dernière version de
  l'Active LTS (24 au 15 octobre 2026) et signale la plage large dans les logs de build.
- Le serveur ne démarre pas sans ses données : un déploiement dont les données manquent échoue,
  et la version en ligne reste en place.
- DuckDB télécharge ses extensions (spatial, httpfs) au démarrage, avec les surfaces des habitats :
  un échec empêche aussi le déploiement.

Variables d'environnement :

| Variable | Valeur |
| --- | --- |
| `PORT` | Fournie par Scalingo |
| `NODE_ENV` | `production`, par défaut |
| `DATA_URL` | `https://mon-parc-marin-data.s3.fr-par.scw.cloud`, l'adresse du bucket des données |

Sans `DATA_URL`, le serveur lit `data/dist/` et le sert lui-même au navigateur : c'est le mode de
développement.

## Données sur Scaleway

Le bucket `mon-parc-marin-data`, en région `fr-par`, reçoit le contenu de `data/dist/`, tel quel, à
sa racine. Ses fichiers sont publics en lecture.

### Copier les données

Après un passage de la chaîne de traitement, et avant de déployer du code qui a besoin des
nouvelles données :

```bash
rclone copy data/dist pnm:mon-parc-marin-data
rclone check data/dist pnm:mon-parc-marin-data
```

`pnm` est un remote rclone, avec une clé d'API Scaleway qui reste hors du dépôt :

```ini
[pnm]
type = s3
provider = Scaleway
region = fr-par
endpoint = s3.fr-par.scw.cloud
acl = public-read
access_key_id = …
secret_access_key = …
```

`acl = public-read` rend chaque fichier copié lisible par tous. `rclone copy` ne supprime rien : un
fichier retiré de `data/dist/` reste dans le bucket.

### CORS

Le navigateur lit les PMTiles directement dans le bucket, par requêtes partielles (`Range`). Le
bucket accepte toutes les origines : ses fichiers sont publics, et peuvent servir à d'autres sites.
Il expose `ETag` et `Content-Range`, que lit le client PMTiles.

rclone ne règle pas le CORS. Le CLI AWS le fait, avec la même clé dans `AWS_ACCESS_KEY_ID` et
`AWS_SECRET_ACCESS_KEY` :

```bash
aws s3api put-bucket-cors --endpoint-url https://s3.fr-par.scw.cloud --region fr-par \
  --bucket mon-parc-marin-data --cors-configuration '{
    "CORSRules": [{
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["range"],
      "ExposeHeaders": ["ETag", "Content-Range"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

`aws s3api get-bucket-cors`, avec les mêmes options sauf la règle, relit celle en place.

## Intégration continue

- GitHub Actions (`.github/workflows/ci.yml`), sur chaque PR et sur `main` : lint, typecheck,
  build, puis démarrage du serveur comme sur Scalingo et appel de `/api/health`.
- Le serveur ne démarrant pas sans données, la CI lit celles du bucket : la variable `DATA_URL` du
  dépôt GitHub (variables d'Actions) porte la même adresse que sur Scalingo.
- La CI prend la même version de Node.js que Scalingo (`lts/*`).
