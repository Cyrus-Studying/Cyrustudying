// @ts-nocheck

// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getDatabase, ref } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"; // Corrigido!

const firebaseConfig = {
  apiKey: "AIzaSyCWP1-iiXx7gmL1MnW8Yn3tvcDIQpcoqLI",
  authDomain: "cyrustudying.firebaseapp.com",
  databaseURL: "https://cyrustudying-default-rtdb.firebaseio.com",
  projectId: "cyrustudying",
  storageBucket: "cyrustudying.firebasestorage.app",
  messagingSenderId: "59392547392",
  appId: "1:59392547392:web:dd8caa9874e90c7d729da5",
  measurementId: "G-9MTG3DWB8Q"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app); 

export { app, analytics, auth, db, getDatabase, ref }; // Agora `ref` pode ser exportado corretamente!
