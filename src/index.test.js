const { helloWorld } = require('./index');

test('helloWorld returns the correct greeting text', () => {
  expect(helloWorld()).toBe('Hello, World!');
});
