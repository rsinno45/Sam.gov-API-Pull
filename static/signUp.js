import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js";

// Make auth functions available globally
window.handleAuth = async function (event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    if (window.isSignUp) {
      const name = document.getElementById("name").value;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: name,
      });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    window.location.href = "/";
  } catch (error) {
    alert(error.message);
  }
};

window.toggleAuthMode = function () {
  window.isSignUp = !window.isSignUp;
  const nameGroup = document.getElementById("nameGroup");
  const authSubmit = document.getElementById("authSubmit");
  const toggleText = document.querySelector(".toggle-auth");

  nameGroup.style.display = window.isSignUp ? "block" : "none";
  authSubmit.textContent = window.isSignUp ? "Sign Up" : "Log In";
  toggleText.innerHTML = window.isSignUp
    ? 'Already have an account? <a href="#" onclick="toggleAuthMode()">Log In</a>'
    : 'Need an account? <a href="#" onclick="toggleAuthMode()">Sign Up</a>';
};

// Initialize isSignUp
window.isSignUp = true;
