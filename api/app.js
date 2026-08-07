const express = require('express');
const cors = require('cors');
const { helloWorld } = require('../src/index');

const app = express();
app.use(cors());

app.get('/api/hello', (req, res) => {
  res.json({ message: helloWorld() });
});

module.exports = app;
