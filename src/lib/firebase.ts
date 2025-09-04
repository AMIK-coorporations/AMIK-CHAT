// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3G5V2MllF32sgU2F5zWIcOmdL40PhUeU",
  authDomain: "chatsnap-y6m78.firebaseapp.com",
  projectId: "chatsnap-y6m78",
  storageBucket: "chatsnap-y6m78.firebasestorage.app",
  messagingSenderId: "740798864765",
  appId: "1:740798864765:web:ce7fc33ef3a6bc07bb8014",
  databaseURL: "https://chatsnap-y6m78-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { db, auth, rtdb, storage };
