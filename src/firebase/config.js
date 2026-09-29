// ─────────────────────────────────────────────────────────────────────────────
// Firebase Configuration
// Uses environment variables; falls back to demo mode if not configured.
// NEVER commit real credentials — use .env.local
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';
import { getAuth }       from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Detect if Firebase is configured
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'undefined';

let app, db, auth;

if (isFirebaseConfigured) {
  try {
    app  = initializeApp(firebaseConfig);
    db   = getFirestore(app);
    auth = getAuth(app);
    console.info('[Firebase] Connected to project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Firebase] Initialization failed — running in demo mode.', err);
  }
} else {
  console.info('[Firebase] Not configured — running in demo mode. Add .env.local to enable Firebase.');
}

export { app, db, auth };
