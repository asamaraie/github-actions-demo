const express = require('express');
const path = require('path');
const { getAllowedOrigins, getAppEnvironment } = require('./config');

function createApp({
  environment = getAppEnvironment(),
  allowedOrigins = getAllowedOrigins(undefined, environment),
  serveStatic = environment === 'local',
} = {}) {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.get('origin');

    if (origin && allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.vary('Origin');
    }

    next();
  });

  // API route - the backend part of "hello world"
  app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello, World!' });
  });

  if (serveStatic) {
    app.use(express.static(path.join(__dirname, '..', 'dist')));
  }

  return app;
}

module.exports = { createApp };
