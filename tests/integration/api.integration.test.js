const request = require('supertest');
const { createApp } = require('../../src/app');

// Integration test: exercises the real Express routing + middleware stack,
// not just an isolated function. This is what should run in CI before merge.
describe('GET /api/hello (integration)', () => {
  const app = createApp({
    environment: 'staging',
    allowedOrigins: ['https://github-actions-demo-site-staging.onrender.com'],
    serveStatic: false,
  });

  it('responds with 200 and the hello world message', async () => {
    const response = await request(app).get('/api/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello, World!' });
  });

  it('responds with JSON content type', async () => {
    const response = await request(app).get('/api/hello');
    expect(response.headers['content-type']).toMatch(/json/);
  });

  it('allows requests from configured static site origin', async () => {
    const response = await request(app)
      .get('/api/hello')
      .set('Origin', 'https://github-actions-demo-site-staging.onrender.com');

    expect(response.headers['access-control-allow-origin']).toBe(
      'https://github-actions-demo-site-staging.onrender.com'
    );
  });

  it('does not allow requests from unconfigured origins', async () => {
    const response = await request(app)
      .get('/api/hello')
      .set('Origin', 'https://untrusted.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('does not serve frontend assets', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(404);
  });
});
