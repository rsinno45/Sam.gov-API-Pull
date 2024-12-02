import { initializeApp } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjOhYOP28qAJMvn2ZWR9SQ28PagQSjMv4",
  authDomain: "apex-4a697.firebaseapp.com",
  projectId: "apex-4a697",
  storageBucket: "apex-4a697.firebasestorage.app",
  messagingSenderId: "432387527633",
  appId: "1:432387527633:web:67c02c2049478af7e8c6f0",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
