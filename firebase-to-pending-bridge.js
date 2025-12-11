// ========================================
// 🔗 חיבור Firebase למערכת Pending Shares
// ========================================
// קובץ זה צריך להיטען אחרי firebase-config.js
// ולפני pending-shares-ui-fixed.js

(function() {
  console.log('🔗 מחבר Firebase למערכת Pending Shares...');

  // המתן ש-Firebase יהיה מוכן
  function waitForFirebase() {
    return new Promise((resolve) => {
      if (window.db && window.fs) {
        resolve();
      } else {
        window.addEventListener('firebase-ready', () => {
          resolve();
        });
      }
    });
  }

  waitForFirebase().then(() => {
    console.log('✅ Firebase מוכן, מגדיר את window.firestore...');

    // הגדרת window.firestore עבור pending-shares-ui-fixed.js
    // הקובץ שלך כבר מייצא את fs שמכיל את כל הפונקציות
    window.firestore = {
      // Firestore core functions
      collection: window.fs.collection,
      doc: window.fs.doc,
      getDoc: window.fs.getDoc,
      getDocs: window.fs.getDocs,
      setDoc: window.fs.setDoc,
      updateDoc: window.fs.updateDoc,
      deleteDoc: window.fs.deleteDoc,
      addDoc: window.fs.addDoc,
      
      // Query functions
      query: window.fs.query,
      where: window.fs.where,
      
      // Array functions
      arrayUnion: window.fs.arrayUnion,
      arrayRemove: (value) => {
        // אם יש arrayRemove ב-fs
        if (window.fs.arrayRemove) {
          return window.fs.arrayRemove(value);
        }
        // אחרת נשתמש ב-Firestore ישירות
        return deleteField();
      },
      
      // Timestamp
      serverTimestamp: () => {
        // Firebase v9+ serverTimestamp
        return { serverTimestamp: true };
      },
      
      Timestamp: {
        now: () => new Date(),
        fromDate: (date) => date
      }
    };

    console.log('✅ window.firestore הוגדר!');

    // הגדרת פונקציית getCurrentUserEmail
    if (!window.getCurrentUserEmail) {
      window.getCurrentUserEmail = function() {
        // מנסה מספר דרכים למצוא את האימייל
        if (window.getCurrentUser) {
          return window.getCurrentUser();
        }
        if (window.auth?.currentUser?.email) {
          return window.auth.currentUser.email;
        }
        if (window.currentUser?.email) {
          return window.currentUser.email;
        }
        if (window.userEmail) {
          return window.userEmail;
        }
        if (localStorage.getItem('userEmail')) {
          return localStorage.getItem('userEmail');
        }
        return null;
      };
    }

    // בדיקה שהכל עובד
    try {
      const testRef = window.firestore.collection(window.db, 'pendingShares');
      console.log('✅ בדיקת חיבור ל-pendingShares הצליחה');
    } catch (error) {
      console.error('❌ שגיאה בחיבור ל-pendingShares:', error);
    }

    // שליחת אירוע שהכל מוכן
    window.dispatchEvent(new Event('pending-shares-ready'));
    console.log('🎉 מערכת Pending Shares מוכנה!');
  });
})();