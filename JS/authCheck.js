// authCheck.js
// FIXED: Prevents infinite redirect loops


import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";


const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("✅ User is logged in:", user.email);
    // Redirect to dashboard
    if (window.location.pathname.includes("eco-wellness")) {
window.location.replace("/Eco-Files-FullStack/");
    }
  } else {
    // User is signed out
    console.log("❌ User not logged in");
    if (!window.location.pathname.includes("eco-wellness")) {
window.location.replace("/Eco-Files-FullStack/forms/eco-wellness/");
    }
  }
});



// Check if user is logged in
function isUserLoggedIn() {
    const currentUser = auth.currentUser?.email?.toLowerCase() ?? "";
    return currentUser !== null && currentUser !== "";
}

// Get current logged in user email
function getCurrentUserEmail() {
    return auth.currentUser?.email?.toLowerCase() ?? "";
}

// Logout function
function logoutUser() {
    const auth = getAuth();
    const userEmail = auth.currentUser?.email ?? "Unknown";
    console.log("🚪 Logging out user:", userEmail);

    signOut(auth)
        .then(() => {
            console.log("✅ User signed out successfully");
            // Redirect to login page
window.location.replace("/Eco-Files-FullStack/forms/eco-wellness/");
        })
        .catch((error) => {
            console.error("❌ Error signing out:", error);
        });
}

// For LOGIN PAGE: Redirect to home if already logged in
// ONLY checks once on page load, won't loop
function redirectIfLoggedIn() {
  // Only run this check on the LOGIN page
  const onLoginPage = window.location.pathname.includes("/Eco-Files-FullStack/forms/eco-wellness/");
  if (onLoginPage && document.getElementById("loginForm")) {
    onAuthStateChanged(auth, (user) => {
  if (user) {
    if (window.location.pathname.includes("eco-wellness")) {
      window.location.replace("/Eco-Files-FullStack/");
    }
  } else {
    if (!window.location.pathname.includes("eco-wellness")) {
      window.location.replace("/Eco-Files-FullStack/forms/eco-wellness/");
    }
  }
});

  }
  return false;
}


// For HOME PAGE (Dashboard): Redirect to login if NOT logged in
// ONLY checks once on page load
function requireLogin() {
  const path = window.location.pathname;

  // Your site lives under /Eco-Files-FullStack/
  const isLoginPage = path.includes("/Eco-Files-FullStack/forms/eco-wellness/");
  const isDashboard = path.startsWith("/Eco-Files-FullStack/") && !isLoginPage;

  if (isDashboard) {
    if (!isUserLoggedIn()) {
      console.log("❌ User not logged in, redirecting to login...");
      window.location.replace("/Eco-Files-FullStack/forms/eco-wellness/");
      return false;
    }
    sessionStorage.removeItem("loginSuccess");
    console.log("✅ User authenticated on dashboard:", getCurrentUserEmail());
    return true;
  }
  return true;
}


console.log("✅ authCheck.js loaded");