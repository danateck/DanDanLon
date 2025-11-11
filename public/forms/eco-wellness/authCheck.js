// authCheck.js
// Place this file in pages/login/ folder and include it in index.html

    import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";


// Check if user is logged in
function isUserLoggedIn() {
    const currentUser = auth.currentUser?.email?.toLowerCase() ?? "";
    console.log("Checking login status. Current user:", currentUser);
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
            console.log("✅ User logged out successfully");
            // Redirect to login page
            window.location.href = "./index.html";
        })
        .catch((error) => {
            console.error("❌ Error logging out:", error);
        });
}

// For LOGIN PAGE: Redirect to home if already logged in
function redirectIfLoggedIn() {
    // Only redirect if login was successful (not during a failed attempt)

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ Logged in:", user.email);
        window.location.replace("../../index.html");
    }
});

    return false;
}

// For HOME PAGE: Redirect to login if NOT logged in
function requireLogin() {
    console.log("requireLogin called");
    if (!isUserLoggedIn()) {
        console.log("User not logged in, redirecting to login page...");
        // Path from project/index.html to forms/eco-wellness/index.html
        window.location.replace("./index.html");
        return false;
    }
    // Clear the login success flag once we're on home page
    sessionStorage.removeItem("loginSuccess");
    console.log("User is logged in:", getCurrentUserEmail());
    return true;
}

console.log("authCheck.js loaded. Current user:", getCurrentUserEmail());