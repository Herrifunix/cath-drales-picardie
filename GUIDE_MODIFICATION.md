# 🛠️ Guide d'édition de l'application (Pour non-initiés)

Ce document vous explique comment modifier le contenu de l'application (textes, images, itinéraires vélo) sans avoir besoin de connaissances avancées en programmation. 

## 1. Modifier les textes correspondants aux cathédrales

Toutes les informations propres à chaque cathédrale se trouvent dans un seul fichier : **`js/data.js`**.
Ouvrez ce fichier dans un éditeur de texte (ou directement dans VS Code).

Chaque cathédrale est définie par un "bloc" entre accolades `{ ... }`. Vous y trouverez différentes "clés" suivies d'une valeur.
**Pour modifier une information, il suffit de changer le texte entre les guillemets (simples `'...'` ou doubles `"..."`).**

Exemple : 
```javascript
  phone: '03 44 48 11 60',         // Changez le numéro ici !
  associationText: 'Texte ici',    // Ajoutez ou modifiez la présentation de votre association.
  website: 'https://monsite.fr',   // Changez le lien du site officiel.
```

**⚠️ Important :** 
- Ne supprimez pas les guillemets autour de vos textes.
- Ne supprimez pas les virgules `,` à la fin de chaque ligne.
- Si vous n'avez pas de site ou de téléphone, laissez les guillemets vides : `phone: '',`.

---

## 2. Changer une image

Les images de présentation des cathédrales se trouvent dans le dossier **`img/`**.

**Comment faire :**
1. Glissez votre nouvelle image dans le dossier `img/` (assurez-vous qu'elle pèse moins de 1 Mo pour ne pas ralentir l'application !).
2. Repérez son nom exact (par exemple `nouvelle-photo-beauvais.jpg`).
3. Allez dans le fichier `js/data.js`, cherchez votre cathédrale, et modifiez la ligne `presentationImage`:
```javascript
  presentationImage: './img/nouvelle-photo-beauvais.jpg',
```

---

## 3. Ajouter ou modifier un trajet vélo (GPX)

C'est maintenant totalement automatique ! 
Vous n'avez plus besoin d'écrire du code pour ajouter un nouveau trajet. L'application calcule même la distance toute seule !

**Comment faire :**
1. Votre fichier doit être au format `.gpx`.
2. Renommez votre fichier en respectant le format : `Gpx Ville1 Ville2.gpx` 
   - *Exemple :* `Gpx Laon Soissons.gpx` ou `Gpx Laon Soissons .gpx`.
   - *Note : L'ordre des villes n'a pas d'importance.*
3. Glissez simplement le fichier dans le dossier **`gpx/`**.

Dès que vous actualiserez l'application, le trajet apparaîtra automatiquement dans l'onglet "Vélo" !

---

## 4. À propos de la création d'une "page dédiée pour modifier"

Puisque l'application fonctionne "côté client" (sans base de données complexe ou serveur actif en pleine nature), **il n'est pas possible de créer une interface d'administration basique sur le site pour enregistrer localement les changements.** 
Modifier le fichier `data.js` reste donc le meilleur moyen et le plus simple pour pérenniser vos textes ! 
