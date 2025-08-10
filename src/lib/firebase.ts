// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAa6oAqK3kFremsOqAGg9dgSwhUmdt3KKw",
  authDomain: "nice-theater-415516.firebaseapp.com",
  projectId: "nice-theater-415516",
  storageBucket: "nice-theater-415516.firebasestorage.app",
  messagingSenderId: "638699560027",
  appId: "1:638699560027:web:baf634eab0c80ac284f37e",
  measurementId: "G-7M4LF002RZ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
