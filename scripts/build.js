const fs = require('fs');
const path = require('path');
const { getApiBaseUrl } = require('../src/config');

const distDir = path.join(__dirname, '..', 'dist');

function createHtml(apiBaseUrl) {
  const helloUrl = `${apiBaseUrl}/api/hello`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello World App</title>
</head>
<body>
  <h1 id="message">Loading...</h1>
  <script>
    fetch(${JSON.stringify(helloUrl)})
      .then((res) => res.json())
      .then((data) => {
        document.getElementById('message').textContent = data.message;
      })
      .catch(() => {
        document.getElementById('message').textContent = 'Failed to load message';
      });
  </script>
</body>
</html>
`;
}

function build({ apiBaseUrl = getApiBaseUrl() } = {}) {
  const html = createHtml(apiBaseUrl);

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir);
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
  // eslint-disable-next-line no-console
  console.log('Build complete: dist/index.html created');
}

if (require.main === module) {
  build();
}

module.exports = { createHtml, getApiBaseUrl, build };
