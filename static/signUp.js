// signUp.js
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Keep track of whether we're in signup or login mode
let isSignUp = true;

// Add event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Set up form submission handler
  const authForm = document.getElementById("authForm");
  authForm.addEventListener("submit", handleAuth);

  // Set up toggle auth mode handler
  const toggleAuthLink = document.querySelector(".toggle-auth a");
  if (toggleAuthLink) {
    toggleAuthLink.addEventListener("click", toggleAuthMode);
  }
});

async function handleAuth(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    if (isSignUp) {
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
}

function toggleAuthMode() {
  isSignUp = !isSignUp;
  const nameGroup = document.getElementById("nameGroup");
  const authSubmit = document.getElementById("authSubmit");
  const toggleText = document.querySelector(".toggle-auth");

  nameGroup.style.display = isSignUp ? "block" : "none";
  authSubmit.textContent = isSignUp ? "Sign Up" : "Log In";
  toggleText.innerHTML = isSignUp
    ? 'Already have an account? <a href="#">Log In</a>'
    : 'Need an account? <a href="#">Sign Up</a>';
}
