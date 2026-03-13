/* ===== SERVICE WORKER ===== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

/* ===== DEMO MODE ===== */
// Passer à false pour tout afficher
const DEMO_MODE = true;
const DEMO_VISIBLE = ['amiens', 'beauvais'];

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

  if (page === 'map') {
    initMainMap();
  } else if (page === 'velo') {
    initVeloMap();
  } else if (page === 'detail') {
    const cathedral = CATHEDRALS.find(c => c.id === param);
    if (cathedral) {
      renderDetail(cathedral);
    }
  }

  currentPage = page;
  window.scrollTo(0, 0);
  window.location.hash = param ? `${page}/${param}` : page;
}

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
      const geoHref = `geo:${c.lat},${c.lng}?q=${encodeURIComponent(`${c.name}, ${c.city}`)}`;
      marker.bindPopup(`
        <div class="popup-name">${c.city}</div>
        <div style="font-size:0.85rem;color:#ccc;margin:4px 0;">${c.name}</div>
        <div class="popup-actions">
          <span class="popup-link" onclick="navigateTo('detail','${c.id}')">Voir la fiche →</span>
          <a class="popup-nav-btn" href="${geoHref}">Naviguer</a>
        </div>
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

  if (detailMap) { detailMap.remove(); detailMap = null; }

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
  if (c.adhesionUrl) {
    linksHtml += `<a href="${encodeURI(c.adhesionUrl)}" target="_blank" rel="noopener noreferrer" class="detail-link">
      <span class="detail-link-icon">🤝</span> Adhérer à l'association
    </a>`;
  }

  const hasServices = !!(servicesHtml || linksHtml);
  const hasAssociation = !!(c.donUrl || c.adhesionUrl);
  let associationActionsHtml = '';
  if (c.donUrl) {
    associationActionsHtml += `<a href="${encodeURI(c.donUrl)}" target="_blank" rel="noopener noreferrer" class="btn-don">❤️ Faire un don</a>`;
  }
  if (c.adhesionUrl) {
    associationActionsHtml += `<a href="${encodeURI(c.adhesionUrl)}" target="_blank" rel="noopener noreferrer" class="btn-asso">🤝 Adhérer à l'association</a>`;
  }
  const detailGeoHref = `geo:${c.lat},${c.lng}?q=${encodeURIComponent(`${c.name}, ${c.city}`)}`;

  container.dataset.cathedralId = c.id;

  container.innerHTML = `
    <div class="detail-hero">
      <div class="detail-hero-icon">${c.emoji}</div>
      <h2>${c.name}</h2>
      <div class="detail-city">📍 ${c.city}</div>
    </div>

    <div class="detail-tab-card">
      <div class="detail-tabs">
        <button class="detail-tab-btn active" data-tab="introduction" onclick="switchDetailTab(this)">
          <span class="detail-tab-icon">⚙️</span> Introduction
        </button>
        <button class="detail-tab-btn" data-tab="acces" onclick="switchDetailTab(this)">
          <span class="detail-tab-icon">📍</span> Accès
        </button>
        ${c.horaires ? `<button class="detail-tab-btn" data-tab="horaires" onclick="switchDetailTab(this)">
          <span class="detail-tab-icon">🕐</span> Horaires
        </button>` : ''}
        ${hasServices ? `<button class="detail-tab-btn" data-tab="services" onclick="switchDetailTab(this)">
          <span class="detail-tab-icon">🎯</span> Services
        </button>` : ''}
        ${hasAssociation ? `<button class="detail-tab-btn" data-tab="association" onclick="switchDetailTab(this)">
          <span class="detail-tab-icon">🤝</span> Association
        </button>` : ''}
      </div>
    </div>

    <div id="tab-introduction" class="detail-tab-panel">
      <div class="detail-section">
        <p>${c.description}</p>
      </div>
      ${c.chiffres ? `<div class="detail-chiffres">
        ${c.chiffres.map(f => `<div class="chiffre-item"><span class="chiffre-icon">${f.icon}</span><span class="chiffre-value">${f.value}</span><span class="chiffre-label">${f.label}</span></div>`).join('')}
      </div>` : ''}
      ${c.histoire ? `<div class="detail-section detail-section-histoire">
        <h3>📜 Histoire</h3>
        ${c.histoire.map(p => `<p>${p}</p>`).join('')}
      </div>` : ''}
      ${c.curiosites ? `<div class="detail-section">
        <h3>💡 À savoir</h3>
        <ul class="curiosites-list">
          ${c.curiosites.map(q => `<li>${q}</li>`).join('')}
        </ul>
      </div>` : ''}
    </div>

    <div id="tab-acces" class="detail-tab-panel hidden">
      <div class="detail-section">
        <p>${c.address}</p>
        <a class="detail-nav-btn" href="${detailGeoHref}">🧭 Naviguer vers cette cathédrale</a>
        <div id="detail-map-${c.id}" class="detail-map"></div>
      </div>
    </div>

    ${c.horaires ? `<div id="tab-horaires" class="detail-tab-panel hidden">
      <div class="detail-section">
        ${horairesHtml}
      </div>
    </div>` : ''}

    ${hasServices ? `<div id="tab-services" class="detail-tab-panel hidden">
      <div class="detail-section">
        ${servicesHtml}
        ${linksHtml ? `<div class="detail-links">${linksHtml}</div>` : ''}
      </div>
    </div>` : ''}

    ${hasAssociation ? `<div id="tab-association" class="detail-tab-panel hidden">
      <div class="detail-section">
        <h3>🤝 Présentation de l'association</h3>
        <p>Notre association a pour vocation de valoriser la cathédrale Saint-Pierre, la basse-œuvre et l’église Saint-Étienne de Beauvais, dans une démarche résolument culturelle. Nous animons ces édifices emblématiques en veillant à respecter le culte catholique, conformément à la loi du 9 décembre 1905, ainsi que l’héritage patrimonial qu’ils incarnent.</p>
        <p>Vous pouvez soutenir nos actions en faisant un don ou en adhérant.</p>
        <div class="association-actions">${associationActionsHtml}</div>
      </div>
    </div>` : ''}
  `;
}

function switchDetailTab(btn) {
  document.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.detail-tab-panel').forEach(p => p.classList.add('hidden'));
  const tabId = btn.dataset.tab;
  document.getElementById('tab-' + tabId).classList.remove('hidden');

  if (tabId === 'acces' && !detailMap) {
    setTimeout(() => {
      const id = document.getElementById('detail-content').dataset.cathedralId;
      const cathedral = CATHEDRALS.find(cat => cat.id === id);
      const mapEl = document.getElementById('detail-map-' + id);
      if (mapEl && cathedral) {
        detailMap = L.map(mapEl).setView([cathedral.lat, cathedral.lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(detailMap);
        L.marker([cathedral.lat, cathedral.lng]).addTo(detailMap);
        detailMap.invalidateSize();
      }
    }, 150);
  }
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
