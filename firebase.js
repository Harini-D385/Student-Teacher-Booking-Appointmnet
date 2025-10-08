// firebase.js
// Replace the firebaseConfig object values with the ones from your Firebase Console (Web app)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDeSFvKaR4YBwlMeA0TeNOw-nc3dTehIHs",
  authDomain: "student-teacher-appointm-40138.firebaseapp.com",
  projectId: "student-teacher-appointm-40138",
  storageBucket:  "student-teacher-appointm-40138.firebasestorage.app",
  messagingSenderId: "224821669629",
  appId: "1:224821669629:web:4005acb8df5491da301894"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
