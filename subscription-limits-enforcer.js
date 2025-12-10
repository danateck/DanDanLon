// ========================================
// 🔒 אכיפת מגבלות מנוי - NestyFile
// ========================================

console.log('🔒 טוען מערכת אכיפת מגבלות...');

// ========================================
// בדיקה לפני העלאת קובץ
// ========================================
window.checkUploadLimits = async function(file) {
  if (!window.subscriptionManager) {
    console.warn('⚠️ מערכת מנויים לא זמינה');
    return { allowed: true };
  }
  
  const plan = window.subscriptionManager.getCurrentPlan();
  const info = window.subscriptionManager.getSubscriptionInfo();
  
  // 1️⃣ בדיקת גודל קובץ
  if (file.size > plan.maxFileSize) {
    const maxSizeMB = Math.round(plan.maxFileSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      allowed: false,
      reason: `⚠️ הקובץ גדול מדי!\n\n` +
              `גודל הקובץ: ${fileSizeMB}MB\n` +
              `מקסימום בתוכנית ${plan.nameHe}: ${maxSizeMB}MB\n\n` +
              `💎 שדרג את התוכנית שלך להעלאת קבצים גדולים יותר`,
      showUpgrade: true
    };
  }
  
  // 2️⃣ בדיקת מכסת מסמכים (קבוע מההתחלה, לא משנה כמה GB)
  if (plan.maxDocuments !== Infinity) {
    if (info.documents.count >= plan.maxDocuments) {
      return {
        allowed: false,
        reason: `⚠️ הגעת למכסת המסמכים!\n\n` +
                `מספר מסמכים נוכחי: ${info.documents.count}\n` +
                `מקסימום בתוכנית ${plan.nameHe}: ${plan.maxDocuments} מסמכים\n\n` +
                `💎 שדרג את התוכנית או מחק מסמכים ישנים`,
        showUpgrade: true
      };
    }
  }
  
  // 3️⃣ בדיקת מכסת אחסון (הקודם מבין GB למסמכים)
  const newStorage = info.storage.used + file.size;
  if (plan.storage !== Infinity && newStorage > plan.storage) {
    const usedMB = Math.round(info.storage.used / (1024 * 1024));
    const limitMB = Math.round(plan.storage / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    
    return {
      allowed: false,
      reason: `⚠️ אין מספיק מקום באחסון!\n\n` +
              `שימוש נוכחי: ${usedMB}MB\n` +
              `גודל קובץ: ${fileSizeMB}MB\n` +
              `מגבלת תוכנית ${plan.nameHe}: ${limitMB}MB\n\n` +
              `💎 שדרג את התוכנית או מחק קבצים ישנים`,
      showUpgrade: true
    };
  }
  
  return { allowed: true };
};

// ========================================
// בדיקה לפני שיתוף מסמך
// ========================================
window.checkShareDocumentLimits = function(currentSharedCount, newShareCount = 1) {
  if (!window.subscriptionManager) {
    return { allowed: true };
  }
  
  const plan = window.subscriptionManager.getCurrentPlan();
  const totalAfterShare = currentSharedCount + newShareCount;
  
  if (plan.maxSharedUsers !== Infinity && totalAfterShare > plan.maxSharedUsers) {
    const msg = plan.maxSharedUsers === 1 
      ? `⚠️ בתוכנית ${plan.nameHe} ניתן לשתף רק עם אדם אחד\n\n` +
        `💎 שדרג לתוכנית Standard (₪9/חודש) כדי לשתף עם עד 5 אנשים`
      : `⚠️ חריגה ממגבלת השיתוף!\n\n` +
        `המסמך משותף כבר עם ${currentSharedCount} אנשים\n` +
        `ניסית להוסיף עוד ${newShareCount} אנשים\n` +
        `מקסימום בתוכנית ${plan.nameHe}: ${plan.maxSharedUsers} אנשים\n\n` +
        `💎 שדרג את התוכנית שלך כדי לשתף עם יותר אנשים`;
    
    return {
      allowed: false,
      reason: msg,
      showUpgrade: true
    };
  }
  
  return { allowed: true };
};

// ========================================
// בדיקה לפני יצירת תיקייה משותפת
// ========================================
window.checkCreateSharedFolderLimits = function(invitedEmails = []) {
  if (!window.subscriptionManager) {
    return { allowed: true };
  }
  
  const plan = window.subscriptionManager.getCurrentPlan();
  const info = window.subscriptionManager.getSubscriptionInfo();
  
  // 1️⃣ האם מותר ליצור תיקיות משותפות בכלל?
  if (!plan.fullFolderSharing) {
    return {
      allowed: false,
      reason: `⚠️ שיתוף תיקיות לא זמין בתוכנית ${plan.nameHe}\n\n` +
              `בחינם ניתן לשתף רק מסמכים בודדים\n\n` +
              `💎 שדרג לתוכנית Standard (₪9/חודש) לשיתוף תיקיות`,
      showUpgrade: true
    };
  }
  
  // 2️⃣ בדיקת מכסת תיקיות משותפות
  if (plan.maxSharedFolders !== Infinity) {
    // ספור כמה תיקיות כבר קיימות
    const currentFolderCount = window.mySharedFolders ? window.mySharedFolders.length : 0;
    
    if (currentFolderCount >= plan.maxSharedFolders) {
      return {
        allowed: false,
        reason: `⚠️ הגעת למכסת התיקיות המשותפות!\n\n` +
                `מספר תיקיות משותפות: ${currentFolderCount}\n` +
                `מקסימום בתוכנית ${plan.nameHe}: ${plan.maxSharedFolders} תיקיות\n\n` +
                `💎 שדרג את התוכנית או מחק תיקיות ישנות`,
        showUpgrade: true
      };
    }
  }
  
  // 3️⃣ בדיקת מכסת הזמנות לתיקייה
  if (plan.maxSharedUsers !== Infinity && invitedEmails.length > plan.maxSharedUsers) {
    return {
      allowed: false,
      reason: `⚠️ יותר מדי הזמנות!\n\n` +
              `ניסית להזמין ${invitedEmails.length} אנשים\n` +
              `מקסימום בתוכנית ${plan.nameHe}: ${plan.maxSharedUsers} אנשים\n\n` +
              `💎 שדרג את התוכנית להזמנת יותר משתפים`,
      showUpgrade: true
    };
  }
  
  return { allowed: true };
};


// 📦 סינון מסמכים לפי מגבלת האחסון של התוכנית
window.filterDocsByStorageQuota = function(docs) {
  if (!Array.isArray(docs) || !window.subscriptionManager) {
    return docs;
  }

  try {
    const info = window.subscriptionManager.getSubscriptionInfo();
    const plan = info.plan || window.subscriptionManager.getCurrentPlan();

    // אם אין מגבלה (פרימיום / פרימיום+) – לא מסננים כלום
    if (!plan || !Number.isFinite(plan.storage) || plan.storage === Infinity) {
      return docs;
    }

    const limitBytes = plan.storage;
    let used = 0;
    const result = [];

    // חשוב: מדלגים על מסמכים שנמצאים בסל מחזור / בלי קובץ
    for (const d of docs) {
      if (!d || d._trashed || d.hasFile === false) continue;

      let size = Number(d.fileSize ?? d.file_size ?? d.size);
      if (!Number.isFinite(size) || size <= 0) {
        size = 300 * 1024; // ברירת מחדל קטנה
      }

      // אם אחרי הוספת הקובץ הזה נחצה את המגבלה – לא נכניס אותו
      if (used + size > limitBytes) {
        continue;
      }

      used += size;
      result.push(d);
    }

    console.log("📦 filterDocsByStorageQuota:", {
      limitMB: (limitBytes / (1024 * 1024)).toFixed(1),
      kept: result.length,
      skipped: docs.length - result.length
    });

    return result;
  } catch (e) {
    console.warn("⚠️ filterDocsByStorageQuota failed:", e);
    return docs;
  }
};



// ========================================
// בדיקה לפני הוספת הזמנה לתיקייה קיימת
// ========================================
window.checkAddInvitationLimits = function(folder, newEmail) {
  if (!window.subscriptionManager) {
    return { allowed: true };
  }
  
  const plan = window.subscriptionManager.getCurrentPlan();

  // מי המשתמש הנוכחי?
  const currentEmail =
    window.subscriptionManager.userEmail ||
    window.subscriptionManager.currentUser ||
    null;

  // מי הבעלים של התיקייה?
  const folderOwner =
    folder && (folder.owner || folder.ownerEmail || folder.ownerId || folder.createdBy);

  const isOwner =
    currentEmail &&
    folderOwner &&
    String(currentEmail).toLowerCase() === String(folderOwner).toLowerCase();

  // 💡 אם המשתמש הנוכחי *לא* הבעלים של התיקייה (כלומר הוא רק מוזמן אליה),
  // לא מגבילים לפי maxSharedUsers — הבדיקה הזו נועדה רק לבעלים שמזמין אחרים.
  if (!isOwner) {
    return { allowed: true };
  }
  
  // ספור משתמשים קיימים (מלבד הבעלים עצמם – members זה רק שותפים)
  const currentMembers = Array.isArray(folder.members) ? folder.members.length : 0;
  const pendingInvites = Array.isArray(folder.pendingInvites)
    ? folder.pendingInvites.filter(inv => inv.status === 'pending').length
    : 0;

  const totalUsers = currentMembers + pendingInvites;
  
  if (plan.maxSharedUsers !== Infinity && totalUsers >= plan.maxSharedUsers) {
    return {
      allowed: false,
      reason:
        `⚠️ הגעת למכסת המשתפים!\n\n` +
        `משתמשים פעילים: ${currentMembers}\n` +
        `הזמנות ממתינות: ${pendingInvites}\n` +
        `מקסימום בתוכנית ${plan.nameHe}: ${plan.maxSharedUsers} משתפים\n\n` +
        `💎 שדרג את התוכנית להוספת משתפים נוספים`,
      showUpgrade: true
    };
  }
  
  return { allowed: true };
};


// ========================================
// פונקציה להצגת הודעת שגיאה + אופציה לשדרוג
// ========================================
window.showLimitError = function(limitCheckResult) {
  if (!limitCheckResult || limitCheckResult.allowed) return;
  
  // הצג הודעת שגיאה
  if (window.showAlert) {
    window.showAlert(limitCheckResult.reason, 'error');
  } else {
    alert(limitCheckResult.reason);
  }
  
  // אם צריך להציע שדרוג - פתח פאנל פרימיום
  if (limitCheckResult.showUpgrade) {
    setTimeout(() => {
      const premiumPanel = document.getElementById('premiumPanel');
      if (premiumPanel) {
        premiumPanel.classList.remove('hidden');
        
        // גלול לתוכניות
        setTimeout(() => {
          const plansSection = document.querySelector('.pricing-grid');
          if (plansSection) {
            plansSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }, 2000);
  }
};

// ========================================
// בדיקת OCR
// ========================================
window.checkOCRLimits = function() {
  if (!window.subscriptionManager) {
    return { allowed: true };
  }
  
  const plan = window.subscriptionManager.getCurrentPlan();
  
  if (!plan.ocrFeatures) {
    return {
      allowed: false,
      reason: `⚠️ OCR לא זמין בתוכנית ${plan.nameHe}\n\n` +
              `💎 שדרג לתוכנית Advanced (₪39/חודש) כדי להשתמש ב-OCR`,
      showUpgrade: true
    };
  }
  
  
  return { allowed: true };
};

// ========================================
// פונקציות עזר לבדיקות מהירות
// ========================================


// האם המשתמש חרג ממכסת האחסון (OWNED + SHARED)
window.isOverStorageQuota = function() {
  if (!window.subscriptionManager) {
    return false; // אם אין מערכת מנויים – לא חוסמים
  }

  try {
    const info = window.subscriptionManager.getSubscriptionInfo();
    const plan = info.plan || window.subscriptionManager.getCurrentPlan();

    // אם אין מידע מסודר – לא חוסמים
    if (!plan || !info || !info.storage) {
      return false;
    }

    // תוכנית עם אחסון ללא הגבלה
    if (plan.storage === Infinity) {
      return false;
    }

    // כאן יש לנו שימוש כולל (OWNED + SHARED) לעומת מגבלת התוכנית
    return info.storage.used > plan.storage;
  } catch (e) {
    console.warn("⚠️ isOverStorageQuota failed:", e);
    return false; // במקרה של שגיאה – לא נתקע את המשתמש
  }
};



// האם מותר להעלות קובץ?
window.canUploadFile = async function(file) {
  const result = await window.checkUploadLimits(file);
  if (!result.allowed) {
    window.showLimitError(result);
  }
  return result.allowed;
};

// האם מותר לשתף מסמך?
window.canShareDocument = function(currentSharedCount, newShareCount = 1) {
  const result = window.checkShareDocumentLimits(currentSharedCount, newShareCount);
  if (!result.allowed) {
    window.showLimitError(result);
  }
  return result.allowed;
};

// האם מותר ליצור תיקייה משותפת?
window.canCreateSharedFolder = function(invitedEmails = []) {
  const result = window.checkCreateSharedFolderLimits(invitedEmails);
  if (!result.allowed) {
    window.showLimitError(result);
  }
  return result.allowed;
};

// האם מותר להוסיף הזמנה?
window.canAddInvitation = function(folder, newEmail) {
  const result = window.checkAddInvitationLimits(folder, newEmail);
  if (!result.allowed) {
    window.showLimitError(result);
  }
  return result.allowed;
};

// האם מותר להשתמש ב-OCR?
window.canUseOCR = function() {
  const result = window.checkOCRLimits();
  if (!result.allowed) {
    window.showLimitError(result);
  }
  return result.allowed;
};

console.log('✅ מערכת אכיפת מגבלות טעונה');





// ========================================
// 📦 סינון מסמכים לפי מגבלת אחסון של התוכנית
// ========================================
window.filterDocsByStorageQuota = function (docs) {
  if (!Array.isArray(docs)) return [];

  if (!window.subscriptionManager) return docs;

  try {
    const info = window.subscriptionManager.getSubscriptionInfo();
    const limit = Number(info.storage.limit);

    // אם אין מגבלה (פרימיום / פרימיום+) – לא מסננים כלום
    if (!Number.isFinite(limit) || limit <= 0 || limit === Infinity) {
      return docs;
    }

    const MB = 1024 * 1024;
    console.log(
      "📦 filterDocsByStorageQuota → limit",
      (limit / MB).toFixed(1),
      "MB, docs:",
      docs.length
    );

    // מדלגים על מסמכים שנמצאים בסל מחזור / מחוקים
    const candidates = docs.filter(
      (d) => d && !d._trashed && !d.deletedAt
    );

    // מסדרים לפי תאריך (ישן → חדש)
    candidates.sort((a, b) => {
      const ta =
        a.uploadedAt ||
        a.uploadDate ||
        a.createdAt ||
        a.lastModified ||
        0;
      const tb =
        b.uploadedAt ||
        b.uploadDate ||
        b.createdAt ||
        b.lastModified ||
        0;
      return Number(ta) - Number(tb);
    });

    const visible = [];
    let used = 0;

    for (const doc of candidates) {
      let size = Number(doc.fileSize ?? doc.size ?? doc.file_size);
      if (!Number.isFinite(size) || size <= 0) size = 0;

      // אם אחרי המסמך הזה נחרוג ממכסה → לא מוסיפים אותו
      if (used + size > limit) {
        continue;
      }

      visible.push(doc);
      used += size;
    }

    console.log("📊 filterDocsByStorageQuota result:", {
      in: docs.length,
      visible: visible.length,
      usedBytes: used,
    });

    return visible;
  } catch (err) {
    console.warn(
      "⚠️ filterDocsByStorageQuota failed, returning original docs:",
      err
    );
    return docs;
  }
};

