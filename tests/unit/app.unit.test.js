const { createApp } = require('../../src/app');

describe('createApp (unit)', () => {
  it('returns an Express app instance', () => {
    const app = createApp();
    expect(typeof app).toBe('function'); // Express apps are callable functions
    expect(typeof app.get).toBe('function');
  });
});
