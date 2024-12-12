// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
export const auth = getAuth(app);
