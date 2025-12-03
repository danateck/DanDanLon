// ========================================
// 📊 מחשבון שימוש קיים - למשתמשים ישנים
// ========================================

/**
 * סקריפט זה רץ פעם אחת עבור משתמשים קיימים
 * כדי לחשב את השימוש הנוכחי שלהם באחסון ומסמכים
 */

export async function calculateExistingUsage(userEmail, db, fs) {
  try {
    console.log(`📊 מחשב שימוש עבור: ${userEmail}`);
    
    // טען את כל המסמכים של המשתמש
    const docsRef = fs.collection(db, 'documents');
    const q = fs.query(docsRef, fs.where('owner', '==', userEmail));
    const snapshot = await fs.getDocs(q);
    
    let totalStorage = 0;
    let documentCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const fileSize = data.fileSize || 0;
      
      totalStorage += fileSize;
      documentCount++;
    });
    
    console.log(`✅ שימוש נוכחי:
      - קבצים: ${documentCount}
      - אחסון: ${formatBytes(totalStorage)} (${totalStorage} bytes)`);
    
    return {
      usedStorage: totalStorage,
      documentCount: documentCount
    };
    
  } catch (error) {
    console.error('שגיאה בחישוב שימוש:', error);
    return {
      usedStorage: 0,
      documentCount: 0
    };
  }
}

/**
 * עדכון מנוי משתמש עם השימוש הנוכחי
 */
export async function updateUserSubscriptionUsage(userEmail, db, fs) {
  try {
    // חשב שימוש
    const usage = await calculateExistingUsage(userEmail, db, fs);
    
    // עדכן במסד הנתונים
    const userRef = fs.doc(db, `users/${userEmail}`);
    const userSnap = await fs.getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const subscription = userData.subscription || {};
      
      // עדכן את השימוש
      subscription.usedStorage = usage.usedStorage;
      subscription.documentCount = usage.documentCount;
      
      await fs.setDoc(userRef, {
        subscription: subscription
      }, { merge: true });
      
      console.log('✅ מנוי עודכן בהצלחה');
      return subscription;
    } else {
      console.warn('⚠️ משתמש לא נמצא במסד הנתונים');
      return null;
    }
    
  } catch (error) {
    console.error('שגיאה בעדכון מנוי:', error);
    return null;
  }
}

/**
 * רץ על כל המשתמשים ועדכן את השימוש שלהם
 * (להרצה חד-פעמית בעת השקת המערכת)
 */
export async function migrateAllUsersToSubscriptionSystem(db, fs) {
  try {
    console.log('🚀 מתחיל מיגרציה של כל המשתמשים...');
    
    // קבל את כל המסמכים
    const docsRef = fs.collection(db, 'documents');
    const snapshot = await fs.getDocs(docsRef);
    
    // צור מפה של משתמשים ושימוש
    const usageMap = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const owner = data.owner;
      const fileSize = data.fileSize || 0;
      
      if (owner) {
        if (!usageMap.has(owner)) {
          usageMap.set(owner, {
            storage: 0,
            count: 0
          });
        }
        
        const usage = usageMap.get(owner);
        usage.storage += fileSize;
        usage.count++;
      }
    });
    
    console.log(`📊 נמצאו ${usageMap.size} משתמשים`);
    
    // עדכן כל משתמש
    for (const [email, usage] of usageMap.entries()) {
      try {
        const userRef = fs.doc(db, `users/${email}`);
        const userSnap = await fs.getDoc(userRef);
        
        let subscription = {
          plan: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: null,
          cancelledDate: null,
          graceEndDate: null,
          usedStorage: usage.storage,
          documentCount: usage.count,
          extraStorageGB: 0
        };
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.subscription) {
            // משתמש כבר יש לו מנוי - עדכן רק שימוש
            subscription = {
              ...userData.subscription,
              usedStorage: usage.storage,
              documentCount: usage.count
            };
          }
        }
        
        await fs.setDoc(userRef, {
          subscription: subscription
        }, { merge: true });
        
        console.log(`✅ ${email}: ${usage.count} קבצים, ${formatBytes(usage.storage)}`);
        
      } catch (error) {
        console.error(`❌ שגיאה ב-${email}:`, error);
      }
    }
    
    console.log('🎉 מיגרציה הושלמה!');
    return usageMap.size;
    
  } catch (error) {
    console.error('שגיאה במיגרציה:', error);
    throw error;
  }
}

/**
 * בדיקה האם קובץ חורג מהמגבלה
 */
export function checkFileSizeLimit(fileSize, plan) {
  if (fileSize > plan.maxFileSize) {
    return {
      valid: false,
      message: `גודל הקובץ (${formatBytes(fileSize)}) חורג מהמותר (${formatBytes(plan.maxFileSize)})`
    };
  }
  return { valid: true };
}

/**
 * בדיקה האם יש מקום לקובץ נוסף
 */
export function checkStorageSpace(currentUsage, fileSize, plan) {
  if (plan.storage === Infinity) {
    return { valid: true };
  }
  
  const totalAfterUpload = currentUsage + fileSize;
  
  if (totalAfterUpload > plan.storage) {
    const remainingSpace = plan.storage - currentUsage;
    return {
      valid: false,
      message: `אין מספיק מקום. נותר: ${formatBytes(remainingSpace)}, נדרש: ${formatBytes(fileSize)}`
    };
  }
  
  return { valid: true };
}

/**
 * בדיקה האם יש מקום למסמך נוסף
 */
export function checkDocumentLimit(currentCount, plan) {
  if (plan.maxDocuments === Infinity) {
    return { valid: true };
  }
  
  if (currentCount >= plan.maxDocuments) {
    return {
      valid: false,
      message: `הגעת למכסת המסמכים המקסימלית (${plan.maxDocuments})`
    };
  }
  
  return { valid: true };
}

/**
 * קבלת התראת קרבה למגבלה
 */
export function getStorageWarning(percentage) {
  if (percentage >= 95) {
    return {
      level: 'critical',
      message: '⛔ האחסון כמעט מלא! מחק קבצים או שדרג מנוי'
    };
  } else if (percentage >= 80) {
    return {
      level: 'warning',
      message: '⚠️ האחסון מתמלא. שקול לשדרג את המנוי'
    };
  } else if (percentage >= 60) {
    return {
      level: 'info',
      message: 'ℹ️ השתמשת ביותר ממחצית האחסון'
    };
  }
  return null;
}

// Helper: פורמט בייטים
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (bytes === Infinity) return '∞';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// חשוף גלובלית
if (typeof window !== 'undefined') {
  window.calculateExistingUsage = calculateExistingUsage;
  window.updateUserSubscriptionUsage = updateUserSubscriptionUsage;
  window.migrateAllUsersToSubscriptionSystem = migrateAllUsersToSubscriptionSystem;
}

export { formatBytes };
