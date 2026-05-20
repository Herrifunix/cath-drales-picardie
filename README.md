# 📖 Documentation technique exhaustive : "Les 7 Cathédrales de Picardie"

Bienvenue dans la documentation complète de l'application **Les Sept Cathédrales de Picardie**. Ce document est destiné aux développeurs ou chefs de projet reprenant l'application. Il détaille en profondeur l'architecture, le rôle de chaque script, les variables globales principales et la méthode de mise à jour.

---

## 📌 1. Architecture Globale et Fonctionnement SPA

L'application est une **PWA (Progressive Web App) en Vanilla JavaScript**. Elle n'utilise aucun framework lourd (comme React ou Vue) pour garantir une compatibilité maximale et une maintenance aisée.
Elle fonctionne sur le principe de **SPA (Single Page Application)** : toutes les "pages" sont déjà chargées dans le `index.html` sous forme de balises `<section class="page">`. La navigation ne fait que masquer ou afficher ces sections via des classes CSS, rendant l'application instantanée.

### L'arborescence des fichiers :
*   `index.html` : L'interface utilisateur.
*   `manifest.json` : Le fichier de configuration PWA (nom, icônes, couleurs d'affichage).
*   `sw.js` : Le Service Worker (gestion du cache pour le mode hors ligne).
*   `css/style.css` : La feuille de style principale.
*   `js/data.js` : Le dictionnaire des données des cathédrales.
*   `js/app.js` : Le script contenant toute la logique métier.
*   `gpx/` : Dossier contenant les tracés vélo.

---

## 🔍 2. Détail des Scripts et Variables Globales

### A. `js/data.js` (La Base de Données)
Ce fichier ne contient qu'une seule variable majeure, structurée en tableau d'objets JSON.
*   **Variable globale :** `const CATHEDRALS = [ ... ]`
*   **Rôle :** Contient toutes les données textuelles, les coordonnées GPS, et les informations pratiques.
*   **Attributs clés d'un objet cathédrale :**
    *   `id` : L'identifiant unique (ex: `'beauvais'`). Utilisé dans les URL et les relations.
    *   `lat` / `lng` : Coordonnées utilisées par la carte Leaflet.
    *   `presentationImage` / `presentationCreditHtml` : Médias affichés sur la fiche détail.
    *   `agendaCalendarUrl` : L'URL d'intégration de l'agenda Google. Si null, l'onglet agenda n'apparaît pas.
    *   `horaires`, `histoire`, `curiosites` : Tableaux structurés pour afficher les différents onglets de la fiche détaillée.

### B. `js/app.js` (Le Cœur du Système)
C'est le contrôleur principal. Il gère la navigation, l'initialisation des cartes, et le traitement des données GPX.

**1. Configuration Initiale et Mode Démo**
*   `DEMO_MODE` *(Boolean)* : Si `true`, l'app masque les cathédrales qui ne sont pas prêtes.
*   `DEMO_VISIBLE` *(Array)* : Liste des IDs des cathédrales visibles en mode démo (ex: `['amiens', 'beauvais']`).

**2. Configuration des itinéraires vélos**
*   `VELO_TRAJETS` *(Array)* : Définit les étapes vélos. Chaque objet relie un point A (`fromId`) à un point B (`toId`).
*   Fonction `getTrajetGpxCandidates(trajet)` : Génère les noms de fichiers possibles à chercher dans le dossier `/gpx/` (pour gérer les espaces ou les tirets dans les noms de fichiers GPX).

**3. Installation PWA**
*   `deferredPrompt` : Variable temporaire qui stocke l'événement `beforeinstallprompt` lancé par le navigateur, réutilisée lorsque l'utilisateur clique sur "Ajouter à l'écran d'accueil" via la fonction `installApp()`.

**4. Variables d'Etat et de Vue (State)**
*   `currentPage` *(String)* : La page actuellement affichée (`home`, `map`, `velo`, `detail`).
*   `mainMap`, `veloMap`, `detailMap` *(Object)* : Les instances globales des cartes générées par la librairie `L` (Leaflet.js).
*   `veloRouteLayer`, `veloMarkersLayer` : Calques Leaflet stockant le tracé GPX et les marqueurs vélos temporaires.
*   `veloAvailableTrajets` *(Array)* : Stocke dynamiquement les tracés vélos qui ont pu être trouvés et décodés dans le dossier `/gpx/`.

**5. Fonctions Clés**
*   `navigateTo(page, param)` : Cache/affiche les balises `<section>` via les classes CSS `.active`, met à jour l'URL (hash) pour le bouton "Retour", et déclenche l'initialisation des cartes si besoin (`initMainMap()`, `initVeloMap()`).
*   `renderCards()` : Boucle sur la variable `CATHEDRALS` pour générer le HTML de la page d'accueil.
*   `buildAgendaIframeSrc(rawUrl)` : Nettoie l'URL Google Agenda fournie dans `data.js` pour s'assurer de son bon formatage pour un affichage web.
*   `fetchTrajetGpx(trajet)` & `parseGpxData(gpxText)` : Va chercher le fichier `.gpx`, lit le XML grâce au `DOMParser`, extrait les balises `<trkpt>` (Trace Points) et stocke les latitudes/longitudes ainsi que les altitudes.
*   `haversineDistanceKm(a, b)` : Formule mathématique pure pour calculer la distance réelle entre deux coordonnées GPS en prenant en compte la courbure de la Terre.

### C. `sw.js` (Le Service Worker)
C'est le script de "Network Proxy" fonctionnant en tâche de fond.
*   **Variable globale :** `const CACHE_NAME` (Ex: `'cathedrales-v15'`). Elle sert d'identifiant de version.
*   **Variable globale :** `const ASSETS` *(Array)*. La liste stricte des fichiers que le téléphone va télécharger lors de la première visite.
*   **Fonctionnement :**
    *   L'événement `install` télécharge tout le tableau `ASSETS`.
    *   L'événement `activate` s'assure que si `CACHE_NAME` a changé (ex: passage à `v16`), il supprime l'ancien cache `v15` pour purger la mémoire de l'utilisateur.
    *   L'événement `fetch` intercepte CHAQUE requête réseau de l'application. Si le fichier est en cache, il donne le fichier hors-ligne. Sinon, il tente internet.

---

## 🔓 3. Débloquer le Mode Présentation (Mode Démo)

Par défaut, l'application peut être restreinte à quelques éléments lors du développement.

**Pour lever la restriction :**
1. Ouvrez `js/app.js`.
2. Repérez le bloc `/* ===== DEMO MODE ===== */`.
3. Passez la constante à `false` : `const DEMO_MODE = false;`
4. Mettez le service worker à jour (voir Chapitre 6).

---

## 🛠 4. Créer une nouvelle page (Architecture SPA)

L'application n'a pas de multiples fichiers `.html`. Pour créer une page "À propos" :

**Étape 1 : Créer la vue HTML**
Ajoutez une balise `<section>` dans le `index.html` (dans la balise `<main id="app">`) :
```html
<section id="page-a-propos" class="page">
  <div class="page-content">
    <h2>À Propos</h2>
    <p>Cette application...</p>
  </div>
</section>
```

**Étape 2 : Le Lien**
Créez un bouton HTML standard dans le footer ou le bottom-nav et appelez la fonction `navigateTo()` en ciblant l'ID de votre page :
```html
<button onclick="navigateTo('a-propos')">Aller à la page</button>
```

**Étape 3 : Actions JavaScripts (Si besoin)**
Si cette page nécessite un chargement spécifique (ex: graphiques), allez dans `js/app.js` dans la fonction `navigateTo(page)` :
```javascript
  if (page === 'a-propos') {
    // Mon script spécial pour "à propos"
  }
```

---

## 🚲 5. Ajouter un itinéraire Vélo GPX

Si l'itinéraire ne s'affiche pas pour un tronçon, suivez ces étapes :
1. Vérifiez `VELO_TRAJETS` dans `app.js` pour voir les étapes déclarées (ID de départ et arrivée).
2. Nommez votre fichier `.gpx` selon les règles listées dans `getTrajetGpxCandidates`. Exemples valides pour l'étape Beauvais-Amiens :
   - `Gpx Beauvais Amiens .gpx`
   - `Beauvais-Amiens.gpx`
3. Déposez-le dans le répertoire `/gpx/`.
4. Le système (par la fonction `findAvailableVeloTrajets()`) s'occupe de chercher le fichier, le parser, et s'il est valide, il apparaîtra de lui-même dans la liste déroulante !

---

## ⚙️ 6. Mise en Production et Vider le Cache Utilisateur

Puisque l'application est une PWA, le téléphone ou l'ordinateur garde les fichiers en mémoire morte (hors ligne).
Si vous modifiez du formatage CSS, complétez le texte dans `data.js` ou ajoutez une fonctionnalité, vos utilisateurs ne verront **aucune** modification sauf si vous incrémentez la version du cache !

**À chaque mise en ligne :**
1. Ouvrez `sw.js`.
2. Changez le numéro de version de la variable `CACHE_NAME` (Ligne 1) :
```javascript
// Remplacez :
const CACHE_NAME = 'cathedrales-v15';
// Par :
const CACHE_NAME = 'cathedrales-v16';
```
3. Assurez-vous d'avoir bien listé votre nouveau fichier (si vous en avez créés) dans le tableau `ASSETS` juste en dessous.
4. Lors de la visite suivante de l'utilisateur, l'événement "activate" de Leaflet détectera le `v16`, videra le `v15` et retéléchargera vos fichiers modifiés proprement en fond.

---
*Si vous avez un doute sur du code, tout le JavaScript est en ECMAScript 6 Vanilla pour assurer des décennies de support navigateur.*