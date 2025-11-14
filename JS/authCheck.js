// JS/authCheck.js – clean version for GitHub Pages

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const auth = getAuth();

// -------- PATHS ON GITHUB PAGES --------
// Your live site:  https://danateck.github.io/Eco-Files-FullStack/
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

// ---------- UPDATE HEADER USERNAME / EMAIL ----------
function paintUserHeader(user) {
  const label = document.getElementById("currentUserLabel");
  const mail  = document.getElementById("currentUserEmail");

  if (!label && !mail) return; // nothing to update

  if (!user) {
    if (label) label.textContent = "שלום, אורח";
    if (mail)  mail.textContent  = "";
    return;
  }

  const email = user.email || "";
  const namePart = email.split("@")[0] || "משתמש";

  if (label) label.textContent = `שלום, ${namePart}`;
  if (mail)  mail.textContent  = email;
}

// ---------- MAIN AUTH LISTENER ----------
onAuthStateChanged(auth, (user) => {
  console.log(
    "auth state changed. path =",
    window.location.pathname,
    "user =",
    user ? user.email : null
  );

  // Always try to paint username in header (if elements exist)
  paintUserHeader(user);

  if (user) {
    // ---------- USER LOGGED IN ----------
    console.log("✅ User logged in:", user.email);

    // If logged-in user is on the login page → send them to dashboard
    if (isOnLoginPage() && !isOnDashboard()) {
      console.log("➡ Logged-in user on login page, going to dashboard");
      window.location.replace(ROOT_PATH);
    }
    // If already on dashboard or other internal page → do nothing

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

// ---------- OPTIONAL HELPERS FOR OTHER SCRIPTS ----------
export function isUserLoggedIn() {
  return !!auth.currentUser;
}

export function getCurrentUserEmail() {
  return auth.currentUser?.email ?? null;
}

export function logout() {
  return signOut(auth)
    .then(() => {
      console.log("✅ Logged out, going to login page");
      window.location.replace(LOGIN_PATH);
    })
    .catch((err) => {
      console.error("❌ Error while logging out:", err);
    });
}

console.log("✅ authCheck.js loaded");
