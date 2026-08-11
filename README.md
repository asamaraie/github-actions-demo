# github-actions-demo

Express API plus static frontend CI/CD example.

## Local development

```sh
cp .env.example .env
npm ci
npm run build
npm start
```

`APP_ENV=local` is default. Express serves `dist` and `/api/hello` from one process, so frontend
uses same-origin `/api/hello`.

## Render: separate API and static site

Staging and production each need two Render services. Do not host frontend through API Web Service.

| Service | Render type | Build command             | Start/publish setting     |
| ------- | ----------- | ------------------------- | ------------------------- |
| API     | Web Service | `npm ci`                  | `npm start`               |
| Site    | Static Site | `npm ci && npm run build` | Publish directory: `dist` |

Set these environment variables in Render:

| Environment | Static Site variables                                                              | API Web Service variables                                                  |
| ----------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Staging     | `APP_ENV=staging`, `API_BASE_URL=https://<staging-api>.onrender.com`               | `APP_ENV=staging`, `SITE_ORIGIN=https://<staging-site>.onrender.com`       |
| Production  | `APP_ENV=production`, `API_BASE_URL=https://github-actions-demo-tk0d.onrender.com` | `APP_ENV=production`, `SITE_ORIGIN=https://<production-site>.onrender.com` |

`API_BASE_URL` is required for staging/production static builds and must be absolute HTTP(S).
`SITE_ORIGIN` is required for staging/production API services and accepts comma-separated static
site origins. Application exits at startup/build when deployed configuration is incomplete.

GitHub `staging` and `production` environments need `SITE_URL` and `API_URL` variables plus
separate `RENDER_SITE_DEPLOY_HOOK` and `RENDER_API_DEPLOY_HOOK` secrets. The deploy workflows
trigger both independent Render services; Render builds the site using its own `API_BASE_URL`.
