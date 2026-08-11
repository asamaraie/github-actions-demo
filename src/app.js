const express = require('express');
const path = require('path');

function createApp() {
  const app = express();

  // API route - the backend part of "hello world"
  app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
  });

  // Serve the built static frontend from /dist
  app.use(express.static(path.join(__dirname, '..', 'dist')));

  return app;
}

module.exports = { createApp };
