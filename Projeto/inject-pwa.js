const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
const web = path.join(__dirname, 'web');

// Copiar arquivo
function copiarArquivo(origem, destino) {
  if (fs.existsSync(origem)) {
    fs.copyFileSync(origem, destino);
    console.log(`Copiado: ${origem} -> ${destino}`);
  } else {
    console.log(`Aviso: arquivo não encontrado: ${origem}`);
  }
}

// Copiar pasta recursivamente
function copiarPasta(origem, destino) {
  if (!fs.existsSync(origem)) {
    console.log(`Aviso: pasta não encontrada: ${origem}`);
    return;
  }

  fs.mkdirSync(destino, { recursive: true });

  for (const item of fs.readdirSync(origem)) {
    const origemItem = path.join(origem, item);
    const destinoItem = path.join(destino, item);

    if (fs.statSync(origemItem).isDirectory()) {
      copiarPasta(origemItem, destinoItem);
    } else {
      fs.copyFileSync(origemItem, destinoItem);
    }
  }
}

// Garantir que dist existe
fs.mkdirSync(dist, { recursive: true });

// Copiar arquivos PWA
copiarArquivo(
  path.join(web, 'sw.js'),
  path.join(dist, 'sw.js')
);

copiarArquivo(
  path.join(web, 'manifest.json'),
  path.join(dist, 'manifest.json')
);

// Copiar assets
copiarPasta(
  path.join(web, 'assets'),
  path.join(dist, 'assets')
);

// Alterar index.html
const distIndex = path.join(dist, 'index.html');

if (fs.existsSync(distIndex)) {
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

  console.log('PWA configurado com sucesso!');
} else {
  console.error('Erro: dist/index.html não encontrado.');
}