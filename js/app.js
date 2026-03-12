/* ===== SERVICE WORKER ===== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

/* ===== DEMO MODE ===== */
// Passer à false pour tout afficher
const DEMO_MODE = true;
const DEMO_VISIBLE = ['amiens'];

/* ===== INSTALL (optionnel) ===== */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallHint();
});

function showInstallHint() {
  const hint = document.getElementById('install-hint');
  if (hint) hint.classList.remove('hidden');
}

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    document.getElementById('install-hint').classList.add('hidden');
  } else {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let msg;
    if (isIOS) {
      msg = 'Pour ajouter à l\'écran d\'accueil :\n\n1. Appuyez sur le bouton Partager (carré avec flèche)\n2. Choisissez « Sur l\'écran d\'accueil »';
    } else {
      msg = 'Pour ajouter à l\'écran d\'accueil :\n\n1. Ouvrez le menu du navigateur (⋮ ou ⋯)\n2. Choisissez « Ajouter à l\'écran d\'accueil »';
    }
    alert(msg);
  }
}

// Afficher le bouton si pas déjà installé en mode standalone
window.addEventListener('load', () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (!isStandalone) {
    setTimeout(() => showInstallHint(), 3000);
  }
});

window.addEventListener('appinstalled', () => {
  const hint = document.getElementById('install-hint');
  if (hint) hint.classList.add('hidden');
});

/* ===== STATE ===== */
let currentPage = 'home';
let mainMap = null;
let veloMap = null;
let detailMap = null;

/* ===== NAVIGATION ===== */
function navigateTo(page, param) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  const homeBrand = document.getElementById('home-brand');
  const innerBrand = document.getElementById('inner-brand');
  const menuBtn = document.getElementById('btn-menu');
  const title = document.getElementById('header-title');

  if (page === 'home') {
    homeBrand?.classList.remove('hidden');
    innerBrand?.classList.add('hidden');
    menuBtn?.classList.remove('hidden');
    title.textContent = 'Les 7 Cathédrales';
  } else if (page === 'map') {
    homeBrand?.classList.add('hidden');
    innerBrand?.classList.remove('hidden');
    menuBtn?.classList.add('hidden');
    title.textContent = 'Carte';
    initMainMap();
  } else if (page === 'velo') {
    homeBrand?.classList.add('hidden');
    innerBrand?.classList.remove('hidden');
    menuBtn?.classList.add('hidden');
    title.textContent = 'Circuit à vélo';
    initVeloMap();
  } else if (page === 'detail') {
    homeBrand?.classList.add('hidden');
    innerBrand?.classList.remove('hidden');
    menuBtn?.classList.add('hidden');
    const cathedral = CATHEDRALS.find(c => c.id === param);
    if (cathedral) {
      title.textContent = cathedral.city;
      renderDetail(cathedral);
    }
  }

  currentPage = page;
  window.scrollTo(0, 0);
  window.location.hash = param ? `${page}/${param}` : page;
}

/* Back button */
document.getElementById('btn-back').addEventListener('click', () => {
  navigateTo('home');
});

/* Bottom nav */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    navigateTo(btn.dataset.page);
  });
});

/* ===== RENDER CARDS ===== */
function renderCards() {
  const grid = document.getElementById('cathedral-cards');
  const list = DEMO_MODE ? CATHEDRALS.filter(c => DEMO_VISIBLE.includes(c.id)) : CATHEDRALS;
  grid.innerHTML = list.map(c => `
    <div class="card" onclick="navigateTo('detail', '${c.id}')">
      <div class="card-visual">
        <div class="card-title-wrap">
          <h4>${c.name}</h4>
          <div class="card-city">&#128205; ${c.city}</div>
        </div>
      </div>
      <div class="card-body">
        <p class="card-text">${c.shortDesc}</p>
        <span class="card-link">En savoir plus</span>
      </div>
    </div>
  `).join('');
}

/* ===== MAP ===== */
function initMainMap() {
  if (mainMap) { mainMap.invalidateSize(); return; }

  setTimeout(() => {
    mainMap = L.map('map').setView([49.55, 2.85], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mainMap);

    const goldIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:linear-gradient(135deg,#c9a84c,#b8942f);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(0,0,0,0.4);border:2px solid #fff;">⛪</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    CATHEDRALS.forEach(c => {
      const marker = L.marker([c.lat, c.lng], { icon: goldIcon }).addTo(mainMap);
      marker.bindPopup(`
        <div class="popup-name">${c.city}</div>
        <div style="font-size:0.85rem;color:#ccc;margin:4px 0;">${c.name}</div>
        <span class="popup-link" onclick="navigateTo('detail','${c.id}')">Voir la fiche →</span>
      `);
    });

    mainMap.invalidateSize();
  }, 100);
}

function initVeloMap() {
  if (veloMap) { veloMap.invalidateSize(); return; }

  setTimeout(() => {
    veloMap = L.map('map-velo').setView([49.55, 2.85], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(veloMap);

    const route = CATHEDRALS.map(c => [c.lat, c.lng]);
    route.push(route[0]); // boucle

    L.polyline(route, { color: '#c9a84c', weight: 3, dashArray: '10 6' }).addTo(veloMap);

    CATHEDRALS.forEach(c => {
      L.circleMarker([c.lat, c.lng], {
        radius: 7, fillColor: '#c9a84c', fillOpacity: 1,
        color: '#fff', weight: 2
      }).addTo(veloMap).bindTooltip(c.city, { permanent: true, direction: 'top', offset: [0, -10] });
    });

    veloMap.invalidateSize();
  }, 100);
}

/* ===== DETAIL PAGE ===== */
function renderDetail(c) {
  const container = document.getElementById('detail-content');

  let horairesHtml = '';
  if (c.horaires) {
    horairesHtml = c.horaires.map(h =>
      `<p><strong>${h.periode}</strong><br>${h.detail}</p>`
    ).join('');
  }

  let servicesHtml = '';
  if (c.services && c.services.length) {
    servicesHtml = '<ul>' + c.services.map(s => `<li>${s}</li>`).join('') + '</ul>';
  }

  let linksHtml = '';
  if (c.website) {
    linksHtml += `<a href="${encodeURI(c.website)}" target="_blank" rel="noopener noreferrer" class="detail-link">
      <span class="detail-link-icon">🌐</span> Site officiel
    </a>`;
  }
  if (c.donUrl) {
    linksHtml += `<a href="${encodeURI(c.donUrl)}" target="_blank" rel="noopener noreferrer" class="detail-link">
      <span class="detail-link-icon">❤️</span> Faire un don
    </a>`;
  }
  if (c.adhesionUrl) {
    linksHtml += `<a href="${encodeURI(c.adhesionUrl)}" target="_blank" rel="noopener noreferrer" class="detail-link">
      <span class="detail-link-icon">🤝</span> Adhérer à l'association
    </a>`;
  }

  container.innerHTML = `
    <div class="detail-hero">
      <div class="detail-hero-icon">${c.emoji}</div>
      <h2>${c.name}</h2>
      <div class="detail-city">${c.city}</div>
    </div>

    <div class="detail-section">
      <h3>📖 Présentation</h3>
      <p>${c.description}</p>
    </div>

    <div class="detail-section">
      <h3>📍 Localisation</h3>
      <p>${c.address}</p>
      <div id="detail-map-${c.id}" class="detail-map"></div>
    </div>

    ${c.horaires ? `<div class="detail-section">
      <h3>🕐 Horaires</h3>
      ${horairesHtml}
    </div>` : ''}

    ${servicesHtml ? `<div class="detail-section">
      <h3>🎯 Services</h3>
      ${servicesHtml}
    </div>` : ''}

    ${linksHtml ? `<div class="detail-section">
      <h3>🔗 Liens</h3>
      <div class="detail-links">${linksHtml}</div>
    </div>` : ''}
  `;

  // Mini map for this cathedral
  setTimeout(() => {
    if (detailMap) { detailMap.remove(); detailMap = null; }
    const mapEl = document.getElementById('detail-map-' + c.id);
    if (mapEl) {
      detailMap = L.map(mapEl).setView([c.lat, c.lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(detailMap);
      L.marker([c.lat, c.lng]).addTo(detailMap);
      detailMap.invalidateSize();
    }
  }, 150);
}

/* ===== HASH ROUTING ===== */
function handleHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash || hash === 'home') {
    navigateTo('home');
  } else if (hash.startsWith('detail/')) {
    navigateTo('detail', hash.split('/')[1]);
  } else {
    navigateTo(hash);
  }
}

window.addEventListener('hashchange', handleHash);

/* ===== INIT ===== */
renderCards();

// Masquer carte et vélo en mode demo
if (DEMO_MODE) {
  document.getElementById('bottom-nav')?.remove();
  document.getElementById('btn-explore')?.remove();
  document.getElementById('btn-velo')?.remove();
  document.getElementById('btn-velo-highlight')?.remove();
}

handleHash();
