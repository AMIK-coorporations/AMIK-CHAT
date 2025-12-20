// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Firebase configuration
// Prefer environment variables (so you can use your own Firebase project),
// but fall back to the existing project so the app still works out‑of‑the‑box.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyA3G5V2MllF32sgU2F5zWIcOmdL40PhUeU",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "chatsnap-y6m78.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chatsnap-y6m78",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "chatsnap-y6m78.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "740798864765",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:740798864765:web:ce7fc33ef3a6bc07bb8014",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://chatsnap-y6m78-default-rtdb.firebaseio.com",
};

// Basic sanity check – helps catch wrong or missing env in development
if (process.env.NODE_ENV !== "production") {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Firebase] Missing core config values. Check your NEXT_PUBLIC_FIREBASE_* env variables."
    );
  }
}

// Initialize Firebase (singleton pattern to avoid re‑initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { db, auth, rtdb, storage };
