# carrier-portal

Self-service portal for Kestrel Freight carrier partners: tender LTL
shipments, track them, and manage documents. Data comes from shipment-api.

## Local development

Requires Node 20.18 (`nvm use`).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`npm test` runs the unit tests, `npm run build` the production build.
