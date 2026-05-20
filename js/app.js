/* ===== SERVICE WORKER ===== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

/* ===== DEMO MODE ===== */
// Passer à false pour tout afficher
const DEMO_MODE = true;
const DEMO_VISIBLE = ['amiens', 'beauvais'];

const VELO_TRAJETS = [
  { id: 'beauvais-senlis', fromId: 'beauvais', toId: 'senlis', distance: '~56 km' },
  { id: 'senlis-noyon', fromId: 'senlis', toId: 'noyon', distance: '~60 km' },
  { id: 'noyon-laon', fromId: 'noyon', toId: 'laon', distance: '~52 km' },
  { id: 'laon-saint-quentin', fromId: 'laon', toId: 'saint-quentin', distance: '~45 km' },
  { id: 'saint-quentin-soissons', fromId: 'saint-quentin', toId: 'soissons', distance: '~60 km' },
  { id: 'soissons-amiens', fromId: 'soissons', toId: 'amiens', distance: '~95 km' },
  { id: 'beauvais-amiens', fromId: 'beauvais', toId: 'amiens', distance: '~68 km' }
];

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
let veloRouteLayer = null;
let veloMarkersLayer = null;
let veloAvailableTrajets = [];
let veloUiSetupPromise = null;

function buildAgendaIframeSrc(rawUrl) {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const isGoogleCalendar = /(^|\.)calendar\.google\.com$/i.test(url.hostname);
    if (!isGoogleCalendar) return rawUrl;

    // Supporte les liens /calendar/embed?src=... et les liens partagés avec ?cid=...
    const srcParam = url.searchParams.get('src');
    let cidParam = url.searchParams.get('cid');

    if (cidParam && !cidParam.includes('@')) {
      try {
        cidParam = decodeURIComponent(atob(cidParam));
      } catch (_) {
        // garde la valeur d'origine si ce n'est pas du base64 valide
      }
    }

    const calendarId = srcParam || cidParam;
    if (!calendarId) return rawUrl;

    const embed = new URL('https://calendar.google.com/calendar/embed');
    embed.searchParams.set('src', calendarId);
    embed.searchParams.set('ctz', url.searchParams.get('ctz') || 'Europe/Paris');
    embed.searchParams.set('showTitle', '0');
    embed.searchParams.set('showNav', '1');
    embed.searchParams.set('showDate', '0');
    embed.searchParams.set('showPrint', '0');
    embed.searchParams.set('showTabs', '0');
    embed.searchParams.set('showCalendars', '0');
    embed.searchParams.set('showTz', '0');
    embed.searchParams.set('mode', 'AGENDA');
    embed.searchParams.set('hl', 'fr');

    return embed.toString();
  } catch (_) {
    return rawUrl;
  }
}

function getActiveCathedrals() {
  return DEMO_MODE ? CATHEDRALS.filter(c => DEMO_VISIBLE.includes(c.id)) : CATHEDRALS;
}

function getCathedralById(id) {
  return CATHEDRALS.find(c => c.id === id) || null;
}

function getTrajetLabel(trajet) {
  const from = getCathedralById(trajet.fromId)?.city || trajet.fromId;
  const to = getCathedralById(trajet.toId)?.city || trajet.toId;
  return `${from} -> ${to}`;
}

function getTrajetGpxCandidates(trajet) {
  const from = getCathedralById(trajet.fromId)?.city || trajet.fromId;
  const to = getCathedralById(trajet.toId)?.city || trajet.toId;
  return [
    `./gpx/Gpx ${from} ${to} .gpx`,
    `./gpx/Gpx ${from} ${to}.gpx`
  ];
}

function haversineDistanceKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function parseGpxData(gpxText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, 'application/xml');
  const parseNode = (node) => {
    const lat = Number.parseFloat(node.getAttribute('lat'));
    const lng = Number.parseFloat(node.getAttribute('lon'));
    const eleText = node.querySelector('ele')?.textContent;
    const ele = Number.parseFloat(eleText || '');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, ele: Number.isFinite(ele) ? ele : null };
  };

  let sourcePoints = Array.from(xmlDoc.querySelectorAll('trkpt')).map(parseNode).filter(Boolean);
  if (sourcePoints.length < 2) {
    sourcePoints = Array.from(xmlDoc.querySelectorAll('rtept')).map(parseNode).filter(Boolean);
  }
  if (sourcePoints.length < 2) return null;

  const points = sourcePoints.map((p) => [p.lat, p.lng]);

  let distanceKm = 0;
  for (let i = 1; i < sourcePoints.length; i += 1) {
    distanceKm += haversineDistanceKm(sourcePoints[i - 1], sourcePoints[i]);
  }

  let minAltitude = null;
  let maxAltitude = null;
  let positiveGain = 0;
  let negativeGain = 0;

  for (let i = 0; i < sourcePoints.length; i += 1) {
    const currentEle = sourcePoints[i].ele;
    if (Number.isFinite(currentEle)) {
      minAltitude = minAltitude === null ? currentEle : Math.min(minAltitude, currentEle);
      maxAltitude = maxAltitude === null ? currentEle : Math.max(maxAltitude, currentEle);
    }

    if (i === 0) continue;
    const prevEle = sourcePoints[i - 1].ele;
    if (!Number.isFinite(prevEle) || !Number.isFinite(currentEle)) continue;
    const diff = currentEle - prevEle;
    if (diff > 0) positiveGain += diff;
    else negativeGain += Math.abs(diff);
  }

  return {
    points,
    stats: {
      distanceKm,
      pointCount: sourcePoints.length,
      minAltitude,
      maxAltitude,
      positiveGain,
      negativeGain
    }
  };
}

async function fetchTrajetGpx(trajet) {
  const candidates = getTrajetGpxCandidates(trajet);
  for (const candidate of candidates) {
    try {
      const response = await fetch(encodeURI(candidate));
      if (!response.ok) continue;
      const gpxText = await response.text();
      const parsed = parseGpxData(gpxText);
      if (parsed?.points?.length > 1) {
        return { points: parsed.points, stats: parsed.stats, url: encodeURI(candidate) };
      }
    } catch (_) {
      // on tente le candidat suivant
    }
  }
  return null;
}

async function findAvailableVeloTrajets() {
  const results = await Promise.all(
    VELO_TRAJETS.map(async (trajet) => {
      const loaded = await fetchTrajetGpx(trajet);
      if (loaded?.url && loaded?.points?.length > 1) {
        return { ...trajet, gpxUrl: loaded.url, points: loaded.points, stats: loaded.stats };
      }
      return null;
    })
  );
  return results.filter(Boolean);
}

function formatOneDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '--';
}

function setVeloTraceInfo(stats) {
  const panel = document.getElementById('velo-trace-info');
  const distanceEl = document.getElementById('trace-distance');
  const pointsEl = document.getElementById('trace-points');
  const minAltEl = document.getElementById('trace-min-alt');
  const maxAltEl = document.getElementById('trace-max-alt');
  const posEl = document.getElementById('trace-positive');
  const negEl = document.getElementById('trace-negative');
  if (!panel || !distanceEl || !pointsEl || !minAltEl || !maxAltEl || !posEl || !negEl) return;

  if (!stats) {
    panel.classList.add('hidden');
    return;
  }

  panel.classList.remove('hidden');
  distanceEl.textContent = `${formatOneDecimal(stats.distanceKm)} km`;
  pointsEl.textContent = `${stats.pointCount ?? '--'}`;
  minAltEl.textContent = `${formatOneDecimal(stats.minAltitude)} m`;
  maxAltEl.textContent = `${formatOneDecimal(stats.maxAltitude)} m`;
  posEl.textContent = `${formatOneDecimal(stats.positiveGain)} m`;
  negEl.textContent = `${formatOneDecimal(stats.negativeGain)} m`;
}

function setVeloStatus(message, isError = false) {
  const statusEl = document.getElementById('velo-gpx-status');
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('velo-status-error', isError);
}

function setVeloDownloadLink(url) {
  const linkEl = document.getElementById('velo-gpx-download');
  if (!linkEl) return;
  if (!url) {
    linkEl.classList.add('hidden');
    linkEl.removeAttribute('href');
    return;
  }
  linkEl.href = url;
  linkEl.classList.remove('hidden');
}

function renderVeloEtapesList() {
  const etapesEl = document.getElementById('velo-etapes-list');
  if (!etapesEl) return;

  etapesEl.innerHTML = veloAvailableTrajets.map((trajet) => {
    const from = getCathedralById(trajet.fromId)?.city || trajet.fromId;
    const to = getCathedralById(trajet.toId)?.city || trajet.toId;
    return `<li><strong>${from}</strong> -> ${to} <span class="distance">${trajet.distance}</span></li>`;
  }).join('');
}

async function loadVeloTrajet(trajetId) {
  if (!veloMap) return;
  const trajet = veloAvailableTrajets.find(t => t.id === trajetId);
  if (!trajet) return;

  if (veloRouteLayer) {
    veloMap.removeLayer(veloRouteLayer);
    veloRouteLayer = null;
  }
  if (veloMarkersLayer) {
    veloMap.removeLayer(veloMarkersLayer);
    veloMarkersLayer = null;
  }

  const from = getCathedralById(trajet.fromId);
  const to = getCathedralById(trajet.toId);
  if (!from || !to) return;

  setVeloStatus(`Chargement du GPX : ${from.city} -> ${to.city}...`);
  setVeloDownloadLink(trajet.gpxUrl || null);

  const routePoints = trajet.points;
  if (!routePoints || routePoints.length < 2) {
    setVeloStatus('', false);
    setVeloTraceInfo(null);
    return;
  }

  veloRouteLayer = L.polyline(routePoints, {
    color: '#c9a84c',
    weight: 4,
    opacity: 0.95
  }).addTo(veloMap);

  veloMarkersLayer = L.layerGroup([
    L.circleMarker([from.lat, from.lng], { radius: 7, fillColor: '#c9a84c', fillOpacity: 1, color: '#fff', weight: 2 }).bindTooltip(`Départ : ${from.city}`),
    L.circleMarker([to.lat, to.lng], { radius: 7, fillColor: '#1f4a7c', fillOpacity: 1, color: '#fff', weight: 2 }).bindTooltip(`Arrivée : ${to.city}`)
  ]).addTo(veloMap);

  veloMap.fitBounds(veloRouteLayer.getBounds(), { padding: [20, 20] });

  setVeloStatus(`Trajet charge : ${from.city} -> ${to.city}`);
  setVeloTraceInfo(trajet.stats || null);
}

async function setupVeloUi() {
  if (!veloUiSetupPromise) {
    veloUiSetupPromise = findAvailableVeloTrajets();
  }
  veloAvailableTrajets = await veloUiSetupPromise;
  renderVeloEtapesList();

  const selectEl = document.getElementById('velo-trajet-select');
  const controlsEl = document.querySelector('.velo-trajet-controls');
  const listEl = document.getElementById('velo-etapes-list');
  const mapEl = document.getElementById('map-velo');
  const etapesTitleEl = document.querySelector('.velo-info h3');
  if (!selectEl || !controlsEl || !listEl || !mapEl || !etapesTitleEl) return;

  if (!veloAvailableTrajets.length) {
    etapesTitleEl.classList.add('hidden');
    listEl.classList.add('hidden');
    controlsEl.classList.add('hidden');
    mapEl.classList.add('hidden');
    setVeloTraceInfo(null);
    setVeloStatus('', false);
    setVeloDownloadLink(null);
    return;
  }

  etapesTitleEl.classList.remove('hidden');
  listEl.classList.remove('hidden');
  controlsEl.classList.remove('hidden');
  mapEl.classList.remove('hidden');

  selectEl.innerHTML = veloAvailableTrajets.map((trajet) =>
    `<option value="${trajet.id}">${getTrajetLabel(trajet)} (${trajet.distance})</option>`
  ).join('');

  if (!selectEl.dataset.bound) {
    selectEl.addEventListener('change', () => {
      loadVeloTrajet(selectEl.value);
    });
    selectEl.dataset.bound = 'true';
  }
}

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

function goBackOrHome() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigateTo('home');
  }
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
  const list = getActiveCathedrals();
  grid.innerHTML = list.map(c => `
    <div class="card" onclick="navigateTo('detail', '${c.id}')">
      <div class="card-visual" ${c.presentationImage ? `style="background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(17, 50, 89, 0.9) 85%), url('${encodeURI(c.presentationImage)}');"` : ''}>
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
}

function initVeloMap() {
  setupVeloUi().then(() => {
    const selectEl = document.getElementById('velo-trajet-select');
    if (!veloAvailableTrajets.length || !selectEl?.value) return;

    if (veloMap) {
      veloMap.invalidateSize();
      loadVeloTrajet(selectEl.value);
      return;
    }

    veloMap = L.map('map-velo').setView([49.55, 2.85], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(veloMap);

    loadVeloTrajet(selectEl.value);
    veloMap.invalidateSize();
  });
}

/* ===== DETAIL PAGE ===== */
function renderDetail(c) {
  const container = document.getElementById('detail-content');

  if (detailMap) { detailMap.remove(); detailMap = null; }

  let horairesHtml = '';
  if (c.horaires) {
    const horairesNoteHtml = c.horairesNote
      ? `<p class="horaires-note"><strong>${c.horairesNote}</strong></p>`
      : '';
    horairesHtml = c.horaires.map(h =>
      `<p><strong>${h.periode}</strong><br>${h.detail}</p>`
    ).join('');
    horairesHtml = `${horairesNoteHtml}${horairesHtml}`;
  }

  let servicesHtml = '';
  if (c.services && c.services.length) {
    servicesHtml = '<ul>' + c.services.map(s => `<li>${s}</li>`).join('') + '</ul>';
  }

  let linksHtml = '';
  const serviceLinkClass = c.centerServicesLinks ? 'detail-link centered' : 'detail-link';
  if (c.website) {
    linksHtml += `<a href="${encodeURI(c.website)}" target="_blank" rel="noopener noreferrer" class="${serviceLinkClass}">
      <span class="detail-link-icon">🌐</span> Site officiel
    </a>`;
  }
  if (c.adhesionUrl) {
    linksHtml += `<a href="${encodeURI(c.adhesionUrl)}" target="_blank" rel="noopener noreferrer" class="${serviceLinkClass}">
      <span class="detail-link-icon">🤝</span> Adhérer à l'association
    </a>`;
  }
  if (c.phone) {
    linksHtml += `<a href="tel:${c.phone.replace(/\s+/g, '')}" class="${serviceLinkClass}">
      <span class="detail-link-icon">📞</span> ${c.phone}
    </a>`;
  }

  const presentationBlock = c.presentationImage
    ? `<div class="detail-section detail-presentation">
        <h3>${c.presentationTitle || 'Présentation'}</h3>
        <img class="detail-presentation-image" src="${encodeURI(c.presentationImage)}" alt="Visuel de présentation - ${c.name}" loading="lazy" onerror="this.style.display='none'">
        ${c.presentationCreditHtml ? `<p class="detail-presentation-credit">${c.presentationCreditHtml}</p>` : ''}
      </div>`
    : '';

  const hasServices = !!(servicesHtml || linksHtml);
  const hasAssociation = !!(c.donUrl || c.adhesionUrl);
  const agendaIframeSrc = buildAgendaIframeSrc(c.agendaCalendarUrl);
  const hasAgenda = !!agendaIframeSrc;
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
        <button class="detail-tab-btn active" data-tab="presentation" onclick="switchDetailTab(this)">
          <span class="detail-tab-icon">⚙️</span> Présentation
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
        ${hasAgenda ? `<button class="detail-tab-btn" data-tab="agenda" onclick="switchDetailTab(this)">
          <span class="detail-tab-icon">📅</span> Agenda
        </button>` : ''}
      </div>
      <div class="detail-quick-nav">
        <button class="detail-quick-nav-btn" onclick="goBackOrHome()">← Retour</button>
      </div>
    </div>

    <div id="tab-presentation" class="detail-tab-panel">
      ${presentationBlock}
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
        <p><strong>Adresse :</strong> ${c.address}</p>
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
    ${hasAgenda ? `<div id="tab-agenda" class="detail-tab-panel hidden">
      <div class="detail-section">
        <h3>📅 Agenda des événements</h3>
        <p class="agenda-intro">Retrouvez ici les prochains événements, messes, concerts et visites organisés par la cathédrale.</p>
        <iframe
          class="agenda-iframe"
          src="${agendaIframeSrc}"
          title="Agenda de ${c.name}"
          loading="lazy"
        ></iframe>
      </div>
    </div>` : ''}  `;
}

function switchDetailTab(btn) {
  document.querySelectorAll('.detail-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.detail-tab-panel').forEach(p => p.classList.add('hidden'));
  const tabId = btn.dataset.tab;
  document.getElementById('tab-' + tabId).classList.remove('hidden');

  if (tabId === 'acces' && !detailMap) {
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

// Cacher l'option carte pour l'instant
document.getElementById('btn-explore')?.classList.add('hidden');
document.getElementById('page-map')?.classList.remove('active');

handleHash();
