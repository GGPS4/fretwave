/* Optional: Google sign-in and sync across devices.
   1. Create a free project at https://console.firebase.google.com
   2. Add a Web app, then paste its config object below (replace null).
   3. Authentication > Sign-in method > enable Google. Add your GitHub Pages domain under Authorized domains.
   4. Firestore Database > Create database, then use these rules:
        rules_version = '2';
        service cloud.firestore { match /databases/{db}/documents {
          match /users/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; } } }
   Example:
   window.FRETWAVE_FIREBASE = { apiKey: '...', authDomain: '...', projectId: '...', appId: '...' };
*/
window.FRETWAVE_FIREBASE = null;
