// JS/authCheck.js  — same logic, base-aware redirects (no ../ needed)

// Helper: resolve a path against <base href="..."> and avoid history loops
function go(path) {
  location.replace(new URL(path, document.baseURI).href);
}

// Check if user is logged in (unchanged)
function isUserLoggedIn() {
  const currentUser = sessionStorage.getItem("docArchiveCurrentUser");
  console.log("Checking login status. Current user:", currentUser);
  return currentUser !== null && currentUser !== "";
}

// Get current logged in user email (unchanged)
function getCurrentUserEmail() {
  return sessionStorage.getItem("docArchiveCurrentUser");
}

// Logout (only change: base-aware redirect)
function logoutUser() {
  sessionStorage.removeItem("docArchiveCurrentUser");
  sessionStorage.removeItem("loginSuccess");
  console.log("User logged out");
  // go to login page under forms/eco-wellness
  go("forms/eco-wellness/index.html");
}

// LOGIN PAGE: if already logged in → go home (only change: path)
function redirectIfLoggedIn() {
  const loginSuccess = sessionStorage.getItem("loginSuccess");
  if (isUserLoggedIn() && loginSuccess === "true") {
    console.log("User already logged in, redirecting to home...");
    sessionStorage.removeItem("loginSuccess"); // Clear the flag
    go("index.html");
    return true;
  }
  return false;
}

// HOME PAGE: if NOT logged in → go to login (only change: path)
function requireLogin() {
  console.log("requireLogin called");
  if (!isUserLoggedIn()) {
    console.log("User not logged in, redirecting to login page...");
    go("forms/eco-wellness/index.html");
    return false;
  }
  // Clear the login success flag once we're on home page
  sessionStorage.removeItem("loginSuccess");
  console.log("User is logged in:", getCurrentUserEmail());
  return true;
}

console.log("authCheck.js loaded. Current user:", getCurrentUserEmail());
