// JS/authCheck.js – Fixed version with proper timing

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const auth = getAuth();

// -------- PATHS ON GITHUB PAGES --------
const ROOT_PATH = "/Eco-Files-FullStack/";
const LOGIN_PATH = "/Eco-Files-FullStack/forms/eco-wellness/";

function isOnLoginPage() {
  const path = window.location.pathname;
  return path === LOGIN_PATH || 
         path === LOGIN_PATH + "index.html" ||
         path.startsWith(LOGIN_PATH);
}

function isOnDashboard() {
  const path = window.location.pathname;
  return path === ROOT_PATH || 
         path === ROOT_PATH + "index.html";
}

// ---------- UPDATE HEADER USERNAME / EMAIL ----------
function paintUserHeader(user) {
  const label = document.getElementById("currentUserLabel");
  const mail = document.getElementById("currentUserEmail");

  if (!label && !mail) return;

  if (!user) {
    if (label) label.textContent = "שלום, אורח";
    if (mail) mail.textContent = "";
    return;
  }

  const email = user.email || "";
  const namePart = email.split("@")[0] || "משתמש";

  if (label) label.textContent = `שלום, ${namePart}`;
  if (mail) mail.textContent = email;
}

// ✅ Wait for DOM
function waitForDOM() {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    } else {
      resolve();
    }
  });
}

// ✅ Wait for bootFromCloud function
function waitForBootFunction() {
  return new Promise((resolve) => {
    const check = () => {
      if (typeof window.bootFromCloud === 'function') {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

// ---------- MAIN AUTH LISTENER ----------
onAuthStateChanged(auth, async (user) => {
  console.log("🔍 Auth state changed:", "user =", user ? user.email : null);

  paintUserHeader(user);

  if (user) {
    console.log("✅ User logged in:", user.email);
    window.userNow = (user.email || "").toLowerCase();

    if (isOnLoginPage()) {
      console.log("➡ Redirecting to dashboard");
      setTimeout(() => {
        window.location.replace(ROOT_PATH);
      }, 100);
      return;
    }

    if (isOnDashboard()) {
      console.log("✅ On dashboard, waiting for boot...");
      
      await waitForDOM();
      window.dispatchEvent(new CustomEvent('firebase-ready'));
      
      await waitForBootFunction();
      console.log("🚀 Calling bootFromCloud");
      
      window.bootFromCloud(window.userNow);
    }
  } else {
    console.log("❌ No user logged in");
    
    if (!isOnLoginPage()) {
      console.log("➡ Redirecting to login");
      setTimeout(() => {
        window.location.replace(LOGIN_PATH);
      }, 100);
    }
  }
});

export function isUserLoggedIn() {
  return !!auth.currentUser;
}

export function getCurrentUserEmail() {
  return auth.currentUser?.email ?? null;
}

export function logout() {
  console.log("🚪 Logout initiated");
  return signOut(auth)
    .then(() => {
      console.log("✅ Signed out");
      setTimeout(() => {
        window.location.href = LOGIN_PATH;
      }, 100);
    })
    .catch((err) => {
      console.error("❌ Logout error:", err);
    });
}

console.log("✅ authCheck.js loaded");