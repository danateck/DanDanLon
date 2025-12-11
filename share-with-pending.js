// ========================================
// 🔗 פונקציה לשיתוף מסמכים עם בדיקת מגבלות אחסון
// ========================================

/**
 * שיתוף מסמך עם משתמש אחר - עם בדיקת מקום ו-pending shares
 * @param {string} docId - מזהה המסמך
 * @param {string} targetEmail - האימייל של המשתמש שאיתו רוצים לשתף
 * @returns {Promise<{status: string, message: string}>}
 */
async function shareDocumentWithUser(docId, targetEmail) {
  try {
    const currentUser = getCurrentUserEmail();
    if (!currentUser) {
      throw new Error('אתה לא מחובר למערכת');
    }

    if (!window.db || !window.firestore) {
      throw new Error('Firestore לא מאותחל');
    }

    targetEmail = targetEmail.trim().toLowerCase();
    
    if (targetEmail === currentUser.toLowerCase()) {
      throw new Error('לא ניתן לשתף עם עצמך');
    }

    // 1️⃣ טעינת המסמך
    const docRef = window.firestore.doc(window.db, 'documents', docId);
    const docSnapshot = await window.firestore.getDoc(docRef);

    if (!docSnapshot.exists()) {
      throw new Error('המסמך לא נמצא');
    }

    const docData = docSnapshot.data();

    // בדיקה שהמשתמש הנוכחי הוא הבעלים
    if (docData.owner?.toLowerCase() !== currentUser.toLowerCase()) {
      throw new Error('רק הבעלים יכול לשתף את המסמך');
    }

    const fileSize = Number(docData.fileSize || 0);

    // 2️⃣ בדיקה אם המסמך כבר משותף עם המשתמש
    let sharedWith = docData.sharedWith || [];
    if (!Array.isArray(sharedWith)) {
      sharedWith = Object.keys(sharedWith);
    }

    if (sharedWith.includes(targetEmail)) {
      return {
        status: 'already_shared',
        message: 'המסמך כבר משותף עם משתמש זה'
      };
    }

    // 3️⃣ חישוב השימוש הנוכחי של המשתמש המקבל
    const targetUsage = await calculateUserStorage(targetEmail);
    const targetLimit = await getUserStorageLimit(targetEmail);

    console.log(`📊 Target user storage: ${formatBytes(targetUsage)} / ${formatBytes(targetLimit)}`);

    // 4️⃣ בדיקה אם יש מקום למשתמש המקבל
    if (targetUsage + fileSize > targetLimit) {
      console.log('⚠️ Not enough space, adding to pending shares');
      
      // אין מקום - הוספה לטבלת pending shares
      await addToPendingShares(docId, currentUser, targetEmail);

      return {
        status: 'pending',
        message: `הקובץ נוסף לרשימת הממתינים של ${targetEmail}. המשתמש יוכל לקבל אותו לאחר שיפנה מקום או ישדרג את המנוי.`,
        reason: 'no_space',
        details: {
          targetUsage: targetUsage,
          targetLimit: targetLimit,
          needed: fileSize,
          missing: (targetUsage + fileSize) - targetLimit
        }
      };
    }

    // 5️⃣ יש מקום - שיתוף בפועל
    sharedWith.push(targetEmail);
    
    await window.firestore.updateDoc(docRef, {
      sharedWith: sharedWith
    });

    console.log('✅ Document shared successfully');

    return {
      status: 'shared',
      message: `המסמך שותף בהצלחה עם ${targetEmail}`
    };

  } catch (error) {
    console.error('❌ Error sharing document:', error);
    throw error;
  }
}

/**
 * חישוב השימוש הכולל באחסון של משתמש
 */
async function calculateUserStorage(userEmail) {
  try {
    if (!window.db || !window.firestore) {
      return 0;
    }

    userEmail = userEmail.toLowerCase();

    // שאילתה לכל המסמכים של המשתמש
    const docsRef = window.firestore.collection(window.db, 'documents');
    
    // מסמכים שהמשתמש הוא הבעלים שלהם
    const qOwned = window.firestore.query(
      docsRef,
      window.firestore.where('owner', '==', userEmail)
    );

    // מסמכים שמשותפים עם המשתמש
    const qShared = window.firestore.query(
      docsRef,
      window.firestore.where('sharedWith', 'array-contains', userEmail)
    );

    const [ownedSnapshot, sharedSnapshot] = await Promise.all([
      window.firestore.getDocs(qOwned),
      window.firestore.getDocs(qShared)
    ]);

    // איחוד התוצאות (בלי כפילויות)
    const docIds = new Set();
    let totalBytes = 0;

    ownedSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.trashed && !data._trashed && !docIds.has(doc.id)) {
        docIds.add(doc.id);
        const size = Number(data.fileSize || 0);
        if (Number.isFinite(size)) {
          totalBytes += size;
        }
      }
    });

    sharedSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.trashed && !data._trashed && !docIds.has(doc.id)) {
        docIds.add(doc.id);
        const size = Number(data.fileSize || 0);
        if (Number.isFinite(size)) {
          totalBytes += size;
        }
      }
    });

    return totalBytes;
  } catch (error) {
    console.error('❌ Error calculating storage:', error);
    return 0;
  }
}

/**
 * קבלת מגבלת האחסון של משתמש
 */
async function getUserStorageLimit(userEmail) {
  try {
    if (!window.db || !window.firestore) {
      return 200 * 1024 * 1024; // ברירת מחדל - 200MB
    }

    userEmail = userEmail.toLowerCase();

    const userRef = window.firestore.doc(window.db, 'users', userEmail);
    const userSnapshot = await window.firestore.getDoc(userRef);

    if (!userSnapshot.exists()) {
      return 200 * 1024 * 1024; // Free - 200MB
    }

    const userData = userSnapshot.data();
    const subscription = userData.subscription || {};
    const planId = (subscription.plan || 'free').toLowerCase();

    const storageLimits = {
      free: 200 * 1024 * 1024,          // 200MB
      basic: 500 * 1024 * 1024,         // 500MB
      standard: 2 * 1024 * 1024 * 1024, // 2GB
      advanced: 10 * 1024 * 1024 * 1024, // 10GB
      pro: 20 * 1024 * 1024 * 1024,     // 20GB
      premium: 50 * 1024 * 1024 * 1024, // 50GB
      premium_plus: 50 * 1024 * 1024 * 1024 // 50GB + dynamic
    };

    let baseLimit = storageLimits[planId] || storageLimits.free;

    // Premium+ עם GB נוספים
    if (planId === 'premium_plus' && subscription.extraStorageGB > 0) {
      baseLimit += subscription.extraStorageGB * 1024 * 1024 * 1024;
    }

    return baseLimit;
  } catch (error) {
    console.error('❌ Error getting storage limit:', error);
    return 200 * 1024 * 1024;
  }
}

/**
 * הוספה לרשימת pending shares
 */
async function addToPendingShares(docId, fromUser, toUser) {
  try {
    if (!window.db || !window.firestore) {
      throw new Error('Firestore לא מאותחל');
    }

    // בדיקה אם כבר קיים pending עבור הקובץ הזה
    const pendingRef = window.firestore.collection(window.db, 'pendingShares');
    const q = window.firestore.query(
      pendingRef,
      window.firestore.where('docId', '==', docId),
      window.firestore.where('toUser', '==', toUser.toLowerCase())
    );

    const snapshot = await window.firestore.getDocs(q);
    
    if (!snapshot.empty) {
      console.log('⚠️ Pending share already exists');
      return;
    }

    // הוספה לטבלת pending
    await window.firestore.addDoc(pendingRef, {
      docId: docId,
      fromUser: fromUser.toLowerCase(),
      toUser: toUser.toLowerCase(),
      createdAt: window.firestore.serverTimestamp()
    });

    console.log('✅ Added to pending shares');
  } catch (error) {
    console.error('❌ Error adding to pending shares:', error);
    throw error;
  }
}

/**
 * פונקציות עזר
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getCurrentUserEmail() {
  if (window.currentUser?.email) return window.currentUser.email;
  if (window.userEmail) return window.userEmail;
  if (localStorage.getItem('userEmail')) return localStorage.getItem('userEmail');
  if (window.auth?.currentUser?.email) return window.auth.currentUser.email;
  return null;
}

// ========================================
// 📋 פונקציה נוספת: ניקוי pending shares ישנים
// ========================================

/**
 * מוחק pending shares שעברו יותר מ-30 ימים
 */
async function cleanupOldPendingShares() {
  try {
    if (!window.db || !window.firestore) {
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pendingRef = window.firestore.collection(window.db, 'pendingShares');
    const q = window.firestore.query(
      pendingRef,
      window.firestore.where('createdAt', '<', thirtyDaysAgo)
    );

    const snapshot = await window.firestore.getDocs(q);
    
    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(window.firestore.deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);
    
    console.log(`🗑️ Cleaned up ${deletePromises.length} old pending shares`);
  } catch (error) {
    console.error('❌ Error cleaning up pending shares:', error);
  }
}

// ========================================
// 🚀 ייצוא לשימוש גלובלי
// ========================================

if (typeof window !== 'undefined') {
  window.shareDocumentWithUser = shareDocumentWithUser;
  window.calculateUserStorage = calculateUserStorage;
  window.getUserStorageLimit = getUserStorageLimit;
  window.addToPendingShares = addToPendingShares;
  window.cleanupOldPendingShares = cleanupOldPendingShares;
}

console.log('✅ Share with pending system loaded');

// ========================================
// 📝 דוגמאות שימוש
// ========================================

/*

// דוגמה 1: שיתוף מסמך
try {
  const result = await shareDocumentWithUser('doc123', 'user@example.com');
  
  if (result.status === 'shared') {
    alert('✅ המסמך שותף בהצלחה!');
  } else if (result.status === 'pending') {
    alert('⏳ המסמך נוסף לרשימת הממתינים של המשתמש');
  }
} catch (error) {
  alert('❌ שגיאה: ' + error.message);
}

// דוגמה 2: בדיקת מקום פנוי
const usage = await calculateUserStorage('user@example.com');
const limit = await getUserStorageLimit('user@example.com');
console.log(`שימוש: ${formatBytes(usage)} מתוך ${formatBytes(limit)}`);

// דוגמה 3: ניקוי pending shares ישנים (להריץ פעם ביום)
await cleanupOldPendingShares();

*/