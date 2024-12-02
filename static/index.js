// index.js
import { auth, db } from "./firebase-config.js";
import {
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

// Auth state observer
onAuthStateChanged(auth, (user) => {
  const userSection = document.getElementById("userSection");
  const authButtons = document.getElementById("authButtons");
  const userEmail = document.getElementById("userEmail");

  if (user) {
    userSection.style.display = "block";
    authButtons.style.display = "none";
    userEmail.textContent = user.email;

    // Add save buttons to results if they don't exist
    addSaveButtonsToResults();
  } else {
    userSection.style.display = "none";
    authButtons.style.display = "block";
  }
});

// Make functions available globally
window.toggleUserMenu = function () {
  const menu = document.getElementById("userMenu");
  menu.classList.toggle("active");
};

window.signOut = async function () {
  try {
    await signOut(auth);
    window.location.href = "/";
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

window.saveBusiness = async function (businessData) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please sign in to save businesses");
    return;
  }

  try {
    const businessRef = doc(
      collection(
        doc(collection(db, "savedBusinesses"), user.uid),
        "businesses"
      ),
      businessData.ueiSAM
    );
    await setDoc(businessRef, {
      ...businessData,
      savedAt: serverTimestamp(),
    });

    const saveButton = document.querySelector(
      `[data-uei="${businessData.ueiSAM}"]`
    );
    if (saveButton) {
      saveButton.innerHTML = "Saved ✓";
      saveButton.disabled = true;
    }
  } catch (error) {
    console.error("Error saving business:", error);
    alert("Error saving business. Please try again.");
  }
};

function addSaveButtonsToResults() {
  const resultCards = document.querySelectorAll(".result-card");
  resultCards.forEach((card) => {
    if (!card.querySelector(".save-button")) {
      const saveButton = document.createElement("button");
      saveButton.className = "account-button save-button";
      saveButton.setAttribute("data-uei", card.getAttribute("data-uei"));
      saveButton.textContent = "Save Business";
      saveButton.onclick = () => {
        const businessData = {
          ueiSAM: card.getAttribute("data-uei"),
          legalBusinessName: card.querySelector(".business-name").textContent,
          // Add other business data you want to save
        };
        window.saveBusiness(businessData);
      };
      card.appendChild(saveButton);
    }
  });
}

window.viewSaved = function () {
  window.location.href = "/saved-businesses.html";
};
