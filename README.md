# Mon Parc Marin

*Nom provisoire.* Service numérique qui informe les porteurs de projet au regard des parcs
naturels marins, porté par l'Office français de la biodiversité (OFB).

Projet en démarrage. La documentation est dans [`docs/`](docs/README.md) et les conventions de
travail dans [`AGENTS.md`](AGENTS.md).

## Développement

Prérequis : Node.js ≥ 24.

```bash
npm install
npm run dev
```

Le service est disponible sur <http://localhost:3000>.

Le serveur ne démarre pas sans les données de la chaîne de traitement (voir
[`docs/architecture.md`](docs/architecture.md)). Donnez dans `DATA_URL` l'adresse du bucket S3
qui les publie (voir [`docs/deploiement.md`](docs/deploiement.md)), ou produisez-les dans
`data/dist/` :

```bash
npm run download -w @pnm/pipelines       # récupère les sources, avec GRIST_API_KEY dans .env
npm run plan-gestion -w @pnm/pipelines   # prépare le plan de gestion de chaque parc
npm run habitats -w @pnm/pipelines       # prépare les surfaces des habitats
```

Les périmètres des parcs sont encore versionnés dans l'API. Pour les refaire :

```bash
npm run perimetres -w @pnm/pipelines     # prépare les périmètres
npm run perimetres -w @pnm/api           # les copie dans l'API
```

## Licence

[MIT](LICENSE)
