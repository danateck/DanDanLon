// JS/authCheck.js

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const auth = getAuth();

// ---- PATHS FOR GITHUB PAGES ----
const ROOT_PATH = "/Eco-Files-FullStack/";                 // dashboard (index.html)
const LOGIN_PATH = "/Eco-Files-FullStack/forms/eco-wellness/"; // login form folder

function isOnLoginPage() {
  const path = window.location.pathname;
  // works for:
  //  /Eco-Files-FullStack/forms/eco-wellness/
  //  /Eco-Files-FullStack/forms/eco-wellness/index.html
  return path === LOGIN_PATH || path.startsWith(LOGIN_PATH);
}

function isOnDashboard() {
  const path = window.location.pathname;
  // works for:
  //  /Eco-Files-FullStack/
  //  /Eco-Files-FullStack/index.html
  return path === ROOT_PATH || path === ROOT_PATH + "index.html";
}

onAuthStateChanged(auth, (user) => {
  console.log(
    "authCheck fired. path =",
    window.location.pathname,
    "user exists?",
    !!user
  );

  if (user) {
    // ---------- USER LOGGED IN ----------
    console.log("✅ User is logged in:", user.email);

    // If a logged-in user is on the login page → send them to dashboard
    if (isOnLoginPage() && !isOnDashboard()) {
      console.log("➡ Logged-in user on login page, going to dashboard");
      window.location.replace(ROOT_PATH);
    }
    // If already on dashboard or some other page → do nothing
  } else {
    // ---------- NO USER LOGGED IN ----------
    console.log("❌ No user logged in");

    // If not on login page → go there ONCE
    if (!isOnLoginPage()) {
      console.log("➡ Redirecting to login page…");
      window.location.replace(LOGIN_PATH);
    } else {
      console.log("ℹ Already on login page, not redirecting again");
    }
  }
});

// ---- OPTIONAL HELPERS (if you use them elsewhere) ----
export function isUserLoggedIn() {
  return !!auth.currentUser;
}

export function getCurrentUserEmail() {
  return auth.currentUser?.email ?? null;
}

export function logout() {
  return signOut(auth).then(() => {
    window.location.replace(LOGIN_PATH);
  });
}
