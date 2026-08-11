const { createApp } = require('../../src/app');
const { build } = require('../../scripts/build');
const request = require('supertest');

describe('createApp (unit)', () => {
  it('returns an Express app instance', () => {
    const app = createApp();
    expect(typeof app).toBe('function'); // Express apps are callable functions
    expect(typeof app.get).toBe('function');
  });

  it('serves frontend only in local environment', async () => {
    build({ apiBaseUrl: '' });

    const localApp = createApp({ environment: 'local' });
    const deployedApp = createApp({
      environment: 'staging',
      allowedOrigins: ['https://site.example.com'],
    });

    expect((await request(localApp).get('/')).status).toBe(200);
    expect((await request(deployedApp).get('/')).status).toBe(404);
  });
});
