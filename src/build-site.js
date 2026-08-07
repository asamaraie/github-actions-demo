const fs = require('fs');
const path = require('path');
const { helloWorld } = require('./index');

const distDir = path.join(__dirname, '..', 'dist');
fs.mkdirSync(distDir, { recursive: true });

const apiBaseUrl = process.env.API_BASE_URL || '';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GitHub Actions Demo</title>
</head>
<body>
  <p id="api-message">${helloWorld()}</p>
  <script>
    fetch(${JSON.stringify(apiBaseUrl)} + '/api/hello')
      .then(function (r) { return r.json(); })
      .then(function (data) { document.getElementById('api-message').textContent = data.message; })
      .catch(function () { /* keep the static fallback text above */ });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), html);
console.log('Built dist/index.html');
