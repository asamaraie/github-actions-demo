const request = require('supertest');
const app = require('./app');

test('GET /api/hello returns the greeting as JSON', async () => {
  const res = await request(app).get('/api/hello');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: 'Hello, World!' });
});
