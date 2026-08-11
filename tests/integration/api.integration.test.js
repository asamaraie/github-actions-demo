const request = require('supertest');
const { createApp } = require('../../src/app');

// Integration test: exercises the real Express routing + middleware stack,
// not just an isolated function. This is what should run in CI before merge.
describe('GET /api/hello (integration)', () => {
  const app = createApp();

  it('responds with 200 and the hello world message', async () => {
    const response = await request(app).get('/api/hello');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello, World!' });
  });

  it('responds with JSON content type', async () => {
    const response = await request(app).get('/api/hello');
    expect(response.headers['content-type']).toMatch(/json/);
  });
});
