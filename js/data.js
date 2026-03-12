const CATHEDRALS = [
  {
    id: 'beauvais',
    name: 'Cathédrale Saint-Pierre de Beauvais',
    city: 'Beauvais',
    lat: 49.4326,
    lng: 2.0815,
    emoji: '🏛️',
    shortDesc: "Chef-d'œuvre gothique inachevé, la cathédrale de Beauvais impressionne par son chœur le plus haut de la chrétienté (48 mètres).",
    description: "Chef-d'œuvre gothique inachevé, la cathédrale de Beauvais impressionne par son chœur le plus haut de la chrétienté (48 mètres) et ses vitraux flamboyants, véritables joyaux de lumière. Symbole d'audace médiévale, sa construction, marquée par des effondrements, témoigne de la quête de transcendance des bâtisseurs.",
    address: 'Rue Saint-Pierre, 60000 BEAUVAIS',
    horaires: [
      { periode: 'Du 1ᵉʳ novembre au 31 mars', detail: 'Tous les jours de 10 h à 12 h 15 et de 14 h 00 à 17 h 15' },
      { periode: 'Du 1ᵉʳ avril au 31 octobre', detail: 'Tous les jours de 10 h à 18 h 15' }
    ],
    services: [
      "Visite de l'horloge astronomique",
      'Audio guide',
      'Accès PMR'
    ],
    website: 'https://cathedrale-beauvais.fr',
    donUrl: 'https://www.helloasso.com/associations/association-beauvais-cathedrale/formulaires/1',
    adhesionUrl: 'https://www.helloasso.com/associations/association-beauvais-cathedrale/adhesions/adhesion-classique'
  },
  {
    id: 'amiens',
    name: 'Cathédrale Notre-Dame d\'Amiens',
    city: 'Amiens',
    lat: 49.8941,
    lng: 2.3018,
    emoji: '⛪',
    shortDesc: "Plus vaste cathédrale de France, Notre-Dame d'Amiens est un chef-d'œuvre du gothique classique, inscrite au patrimoine mondial de l'UNESCO.",
    description: "Plus vaste cathédrale de France par ses volumes intérieurs, Notre-Dame d'Amiens est un chef-d'œuvre du gothique classique. Inscrite au patrimoine mondial de l'UNESCO, elle fascine par sa façade ornée de plus de 3 000 statues et son élévation harmonieuse. Sa nef immense (42,3 m de haut, 145 m de long) en fait un joyau de l'architecture médiévale.",
    address: '30 Place Notre-Dame, 80000 AMIENS',
    horaires: [
      { periode: 'Toute l\'année', detail: 'Tous les jours de 8 h 30 à 17 h 15 (18 h 15 d\'avril à septembre)' }
    ],
    services: [
      'Spectacle de polychromie (été et décembre)',
      'Audio guide',
      'Accès PMR'
    ],
    website: 'https://www.cathedrale-amiens.fr',
    donUrl: null,
    adhesionUrl: null
  },
  {
    id: 'laon',
    name: 'Cathédrale Notre-Dame de Laon',
    city: 'Laon',
    lat: 49.5637,
    lng: 3.6241,
    emoji: '🐂',
    shortDesc: "Perchée sur sa colline, la cathédrale de Laon est un chef-d'œuvre du premier art gothique, célèbre pour ses tours ornées de bœufs sculptés.",
    description: "Perchée sur sa colline fortifiée, la cathédrale Notre-Dame de Laon est l'un des plus beaux témoignages du premier art gothique. Construite entre 1155 et 1235, elle est célèbre pour ses cinq tours (à l'origine sept) ornées de seize bœufs sculptés grandeur nature, hommage aux animaux qui ont transporté les pierres. Sa nef lumineuse à quatre niveaux d'élévation en fait un modèle architectural majeur.",
    address: 'Rue du Cloître, 02000 LAON',
    horaires: [
      { periode: 'Toute l\'année', detail: 'Tous les jours de 8 h 30 à 18 h 30 (17 h en hiver)' }
    ],
    services: [
      'Visites guidées des tours',
      'Audio guide',
      'Accès PMR partiel'
    ],
    website: null,
    donUrl: null,
    adhesionUrl: null
  },
  {
    id: 'noyon',
    name: 'Cathédrale Notre-Dame de Noyon',
    city: 'Noyon',
    lat: 49.5816,
    lng: 2.9999,
    emoji: '🕊️',
    shortDesc: "L'une des premières cathédrales gothiques de France, Noyon marque la transition entre l'art roman et le gothique avec son transept arrondi unique.",
    description: "L'une des premières cathédrales gothiques de France, Notre-Dame de Noyon (commencée vers 1150) marque la transition entre l'art roman et le gothique. Elle se distingue par son transept aux extrémités arrondies, unique en France, et son ensemble canonial remarquablement préservé comprenant cloître, bibliothèque du chapitre et salle capitulaire.",
    address: 'Place du Parvis, 60400 NOYON',
    horaires: [
      { periode: 'Toute l\'année', detail: 'Tous les jours de 9 h à 12 h et de 14 h à 18 h (17 h en hiver)' }
    ],
    services: [
      'Visite du cloître et de la bibliothèque',
      'Audio guide',
      'Accès PMR'
    ],
    website: null,
    donUrl: null,
    adhesionUrl: null
  },
  {
    id: 'senlis',
    name: 'Cathédrale Notre-Dame de Senlis',
    city: 'Senlis',
    lat: 49.2068,
    lng: 2.5856,
    emoji: '👑',
    shortDesc: "Cathédrale royale au portail sculpté du Couronnement de la Vierge, Senlis est un bijou de l'art gothique primitif dans la cité des rois.",
    description: "Élevée à partir de 1153, la cathédrale Notre-Dame de Senlis est un bijou de l'art gothique primitif, célèbre pour son portail occidental sculpté du Couronnement de la Vierge, l'un des premiers du genre. Sa flèche élancée (78 m) domine la cité royale. Malgré sa taille modeste, elle rayonne par la finesse de sa sculpture et son histoire liée aux rois de France.",
    address: 'Place du Parvis Notre-Dame, 60300 SENLIS',
    horaires: [
      { periode: 'Toute l\'année', detail: 'Tous les jours de 8 h à 18 h 30' }
    ],
    services: [
      'Visite libre',
      'Concerts réguliers'
    ],
    website: null,
    donUrl: null,
    adhesionUrl: null
  },
  {
    id: 'soissons',
    name: 'Cathédrale Saint-Gervais-et-Saint-Protais de Soissons',
    city: 'Soissons',
    lat: 49.3817,
    lng: 3.3236,
    emoji: '🌹',
    shortDesc: "Joyau du gothique classique, la cathédrale de Soissons séduit par la pureté de son bras sud et sa rosace nord de 6 mètres de diamètre.",
    description: "Joyau du gothique classique, la cathédrale Saint-Gervais-et-Saint-Protais de Soissons séduit par la pureté de ses lignes et l'harmonie de ses proportions. Son bras sud du transept, chef-d'œuvre de légèreté, est considéré comme l'un des plus beaux morceaux d'architecture gothique. Sa rosace nord de 6 mètres de diamètre et son « Adoration des Bergers » de Rubens enrichissent la visite.",
    address: 'Place Fernand Marquigny, 02200 SOISSONS',
    horaires: [
      { periode: 'Toute l\'année', detail: 'Tous les jours de 9 h 30 à 12 h et de 14 h à 17 h 30' }
    ],
    services: [
      'Visite libre',
      'Tableau de Rubens',
      'Accès PMR'
    ],
    website: null,
    donUrl: null,
    adhesionUrl: null
  },
  {
    id: 'saint-quentin',
    name: 'Basilique-Cathédrale de Saint-Quentin',
    city: 'Saint-Quentin',
    lat: 49.8484,
    lng: 3.2873,
    emoji: '✨',
    shortDesc: "Basilique élevée au rang de cathédrale, Saint-Quentin éblouit par son double transept et son labyrinthe pavé du XIIIe siècle.",
    description: "Basilique élevée au rang de cathédrale, l'édifice de Saint-Quentin éblouit par son double transept unique et sa nef gothique d'une grande élégance. Construite du XIIe au XVe siècle sur le tombeau de saint Quentin, elle conserve un remarquable labyrinthe pavé du XIIIe siècle et un ensemble de vitraux du XVIe siècle. Sa restauration après les destructions de 1917 témoigne de la résilience du patrimoine picard.",
    address: 'Rue de la Basilique, 02100 SAINT-QUENTIN',
    horaires: [
      { periode: 'Toute l\'année', detail: 'Tous les jours de 9 h à 18 h' }
    ],
    services: [
      'Labyrinthe médiéval',
      'Visite guidée',
      'Accès PMR'
    ],
    website: null,
    donUrl: null,
    adhesionUrl: null
  }
];
