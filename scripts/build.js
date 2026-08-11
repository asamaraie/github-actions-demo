const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

// Simulate a "build": in a real app this might be webpack/vite/esbuild.
// Here we just generate a static index.html that calls the API.
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello World App</title>
</head>
<body>
  <h1 id="message">Loading...</h1>
  <script>
    fetch('/api/hello')
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

function build() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir);
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
  // eslint-disable-next-line no-console
  console.log('Build complete: dist/index.html created');
}

build();
