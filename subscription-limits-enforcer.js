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

// ========================================
// בדיקה לפני הוספת הזמנה לתיקייה קיימת
// ========================================
window.checkAddInvitationLimits = function(folder, newEmail) {
  if (!window.subscriptionManager) {
    return { allowed: true };
  }
  
  const plan = window.subscriptionManager.getCurrentPlan();
  const owner = (folder.owner || "").trim().toLowerCase();

  const members = Array.isArray(folder.members) ? folder.members : [];
  const membersWithoutOwner = members.filter(m => {
    if (!m) return false;
    return m.trim().toLowerCase() !== owner;
  }).length;

  const pendingInvites = Array.isArray(folder.pendingInvites)
    ? folder.pendingInvites.filter(inv => inv && inv.status === 'pending').length
    : 0;

  const totalOthers = membersWithoutOwner + pendingInvites;

  if (plan.maxSharedUsers !== Infinity && totalOthers >= plan.maxSharedUsers) {
    return {
      allowed: false,
      reason: `⚠️ הגעת למכסת המשתפים!\n\n` +
              `משתמשים פעילים (חוץ ממך): ${membersWithoutOwner}\n` +
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
