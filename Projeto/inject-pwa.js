const fs = require('fs');
const path = require('path');

const distIndex = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(distIndex, 'utf8');

const pwaTags = `
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/assets/icon.png" />
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js')
          .then(function(reg) {
            console.log('Service Worker registrado:', reg.scope);
          })
          .catch(function(err) {
            console.log('Service Worker erro:', err);
          });
      });
    }
  </script>
</head>`;

html = html.replace('</head>', pwaTags);
fs.writeFileSync(distIndex, html);
console.log('PWA tags injetadas em dist/index.html');