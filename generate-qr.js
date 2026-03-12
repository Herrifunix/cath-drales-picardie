const QRCode = require('qrcode');
const fs = require('fs');

const URL = 'https://herrifunix.github.io/cath-drales-picardie/';

QRCode.toDataURL(URL, { width: 600, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } }, (err, dataUrl) => {
  if (err) { console.error(err); return; }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>QR Code - Les 7 Cathédrales de Picardie</title>
  <style>
    body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; background:#f5f5f5; margin:0; }
    h1 { color:#1a1a2e; font-size:1.5rem; margin-bottom:8px; }
    p { color:#666; margin-bottom:24px; font-size:0.95rem; }
    img { max-width:300px; }
    small { margin-top:16px; color:#999; }
    @media print { body { background:#fff; } }
  </style>
</head>
<body>
  <h1>Les 7 Cathédrales de Picardie</h1>
  <p>Scannez pour installer l'application</p>
  <img src="${dataUrl}" alt="QR Code">
  <small>herrifunix.github.io/cath-drales-picardie</small>
</body>
</html>`;

  fs.writeFileSync('qrcode.html', html);
  console.log('qrcode.html generated!');
});
