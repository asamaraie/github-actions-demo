const fs = require('fs');
const path = require('path');
const { helloWorld } = require('./index');

const distDir = path.join(__dirname, '..', 'dist');
fs.mkdirSync(distDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GitHub Actions Demo</title>
</head>
<body>
  <p>${helloWorld()}</p>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), html);
console.log('Built dist/index.html');
