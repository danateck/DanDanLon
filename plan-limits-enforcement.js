// ═══════════════════════════════════════════════════════
// 🛡️ מערכת אכיפת מגבלות תוכניות - NestyFile
// ═══════════════════════════════════════════════════════

// 📊 הגדרות מגבלות לכל תוכנית
const PLAN_LIMITS = {
  free: {
    name: 'חינם',
    storage: 200 * 1024 * 1024, // 200MB
    maxDocuments: 200,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxSharedUsers: 1,
    maxSharedFolders: 0,
    maxProfiles: 1,
    features: {
      ocr: false,
      aiSearch: false,
      vipSupport: false
    }
  },
  
  standard: {
    name: 'רגיל',
    storage: 2 * 1024 * 1024 * 1024, // 2GB
    maxDocuments: 1000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxSharedUsers: 5,
    maxSharedFolders: 5,
    maxProfiles: 3,
    features: {
      ocr: false,
      aiSearch: false,
      vipSupport: false
    }
  },
  
  advanced: {
    name: 'מתקדם',
    storage: 10 * 1024 * 1024 * 1024, // 10GB
    maxDocuments: 5000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxSharedUsers: 20,
    maxSharedFolders: 10,
    maxProfiles: 5,
    features: {
      ocr: true,
      aiSearch: false,
      vipSupport: false
    }
  },
  
  pro: {
    name: 'מקצועי',
    storage: 20 * 1024 * 1024 * 1024, // 20GB
    maxDocuments: 10000,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxSharedUsers: 50,
    maxSharedFolders: 20,
    maxProfiles: 10,
    features: {
      ocr: true,
      aiSearch: true,
      vipSupport: false
    }
  },
  
  premium: {
    name: 'פרימיום',
    storage: 50 * 1024 * 1024 * 1024, // 50GB
    maxDocuments: Infinity,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxSharedUsers: Infinity,
    maxSharedFolders: Infinity,
    maxProfiles: Infinity,
    features: {
      ocr: true,
      aiSearch: true,
      vipSupport: true
    }
  },
  
  premium_plus: {
    name: 'פרימיום+',
    storage: Infinity, // ללא הגבלה (+ ₪1.5/GB)
    maxDocuments: Infinity,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxSharedUsers: Infinity,
    maxSharedFolders: Infinity,
    maxProfiles: Infinity,
    features: {
      ocr: true,
      aiSearch: true,
      vipSupport: true
    }
  }
};

// ═══════════════════════════════════════════════════════
// 🔍 פונקציות בדיקת מגבלות
// ═══════════════════════════════════════════════════════

/**
 * בדיקה האם ניתן להעלות קובץ
 */
async function canUploadFile(fileSize) {
  const userPlan = await getUserPlan();
  const limits = PLAN_LIMITS[userPlan];
  
  // בדיקה 1: גודל קובץ
  if (fileSize > limits.maxFileSize) {
    const maxSizeMB = (limits.maxFileSize / (1024 * 1024)).toFixed(0);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    showUpgradeModal({
      title: '📎 קובץ גדול מדי',
      message: `הקובץ שלך (${fileSizeMB}MB) גדול מהמגבלה בתוכנית ${limits.name} (${maxSizeMB}MB).`,
      action: 'שדרג תוכנית',
      requiredPlan: getRequiredPlanForFileSize(fileSize)
    });
    
    return false;
  }
  
  // בדיקה 2: מספר מסמכים
  const currentDocs = await getDocumentCount();
  if (currentDocs >= limits.maxDocuments) {
    showUpgradeModal({
      title: '📄 הגעת למגבלת מסמכים',
      message: `יש לך ${currentDocs} מסמכים, והמגבלה בתוכנית ${limits.name} היא ${limits.maxDocuments}.`,
      action: 'שדרג תוכנית',
      requiredPlan: getRequiredPlanForDocuments(currentDocs + 1)
    });
    
    return false;
  }
  
  // בדיקה 3: אחסון
  const currentStorage = await getUsedStorage();
  if (currentStorage + fileSize > limits.storage && limits.storage !== Infinity) {
    const availableMB = ((limits.storage - currentStorage) / (1024 * 1024)).toFixed(0);
    const neededMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    showUpgradeModal({
      title: '💾 אין מספיק אחסון',
      message: `נשאר ${availableMB}MB בלבד, אבל הקובץ שלך ${neededMB}MB.`,
      action: 'שדרג תוכנית',
      requiredPlan: getRequiredPlanForStorage(currentStorage + fileSize)
    });
    
    return false;
  }
  
  return true;
}

/**
 * בדיקה האם ניתן לשתף עם משתמש נוסף
 */
async function canShareWithUser(folderId) {
  const userPlan = await getUserPlan();
  const limits = PLAN_LIMITS[userPlan];
  
  const currentShares = await getSharedUsersCount(folderId);
  
  if (currentShares >= limits.maxSharedUsers) {
    showUpgradeModal({
      title: '👥 הגעת למגבלת שיתופים',
      message: `בתוכנית ${limits.name} ניתן לשתף עם עד ${limits.maxSharedUsers} משתמשים.`,
      action: 'שדרג תוכנית',
      requiredPlan: getRequiredPlanForSharing(currentShares + 1)
    });
    
    return false;
  }
  
  return true;
}

/**
 * בדיקה האם ניתן ליצור תיקייה משותפת
 */
async function canCreateSharedFolder() {
  const userPlan = await getUserPlan();
  const limits = PLAN_LIMITS[userPlan];
  
  const currentFolders = await getSharedFoldersCount();
  
  if (currentFolders >= limits.maxSharedFolders) {
    showUpgradeModal({
      title: '📁 הגעת למגבלת תיקיות משותפות',
      message: `בתוכנית ${limits.name} ניתן ליצור עד ${limits.maxSharedFolders} תיקיות משותפות.`,
      action: 'שדרג תוכנית',
      requiredPlan: 'standard' // מינימום רגיל לתיקיות משותפות
    });
    
    return false;
  }
  
  return true;
}

/**
 * בדיקה האם ניתן ליצור פרופיל נוסף
 */
async function canCreateProfile() {
  const userPlan = await getUserPlan();
  const limits = PLAN_LIMITS[userPlan];
  
  const currentProfiles = await getProfilesCount();
  
  if (currentProfiles >= limits.maxProfiles) {
    showUpgradeModal({
      title: '👨‍👩‍👧 הגעת למגבלת פרופילים',
      message: `בתוכנית ${limits.name} ניתן ליצור עד ${limits.maxProfiles} פרופילים.`,
      action: 'שדרג תוכנית',
      requiredPlan: 'standard' // מינימום רגיל לפרופילים נוספים
    });
    
    return false;
  }
  
  return true;
}

/**
 * בדיקה האם ניתן להשתמש ב-OCR
 */
async function canUseOCR() {
  const userPlan = await getUserPlan();
  const limits = PLAN_LIMITS[userPlan];
  
  if (!limits.features.ocr) {
    showUpgradeModal({
      title: '🔍 OCR זמין רק בתוכניות מתקדמות',
      message: `כדי להשתמש ב-OCR, שדרג לתוכנית מתקדם ומעלה.`,
      action: 'שדרג תוכנית',
      requiredPlan: 'advanced'
    });
    
    return false;
  }
  
  return true;
}

/**
 * בדיקה האם ניתן להשתמש בחיפוש AI
 */
async function canUseAISearch() {
  const userPlan = await getUserPlan();
  const limits = PLAN_LIMITS[userPlan];
  
  if (!limits.features.aiSearch) {
    showUpgradeModal({
      title: '🤖 חיפוש AI זמין רק בתוכניות מקצועיות',
      message: `כדי להשתמש בחיפוש AI חכם, שדרג לתוכנית מקצועי ומעלה.`,
      action: 'שדרג תוכנית',
      requiredPlan: 'pro'
    });
    
    return false;
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════
// 🔧 פונקציות עזר
// ═══════════════════════════════════════════════════════

/**
 * מציאת תוכנית מינימלית לגודל קובץ
 */
function getRequiredPlanForFileSize(fileSize) {
  if (fileSize <= 5 * 1024 * 1024) return 'free';
  if (fileSize <= 50 * 1024 * 1024) return 'standard';
  if (fileSize <= 100 * 1024 * 1024) return 'advanced';
  if (fileSize <= 200 * 1024 * 1024) return 'pro';
  if (fileSize <= 500 * 1024 * 1024) return 'premium';
  return 'premium_plus';
}

/**
 * מציאת תוכנית מינימלית למספר מסמכים
 */
function getRequiredPlanForDocuments(count) {
  if (count <= 200) return 'free';
  if (count <= 1000) return 'standard';
  if (count <= 5000) return 'advanced';
  if (count <= 10000) return 'pro';
  return 'premium';
}

/**
 * מציאת תוכנית מינימלית לאחסון
 */
function getRequiredPlanForStorage(bytes) {
  if (bytes <= 200 * 1024 * 1024) return 'free';
  if (bytes <= 2 * 1024 * 1024 * 1024) return 'standard';
  if (bytes <= 10 * 1024 * 1024 * 1024) return 'advanced';
  if (bytes <= 20 * 1024 * 1024 * 1024) return 'pro';
  if (bytes <= 50 * 1024 * 1024 * 1024) return 'premium';
  return 'premium_plus';
}

/**
 * מציאת תוכנית מינימלית לשיתופים
 */
function getRequiredPlanForSharing(count) {
  if (count <= 1) return 'free';
  if (count <= 5) return 'standard';
  if (count <= 20) return 'advanced';
  if (count <= 50) return 'pro';
  return 'premium';
}

/**
 * קבלת תוכנית המשתמש
 */
async function getUserPlan() {
  const user = await getCurrentUser();
  return user?.subscription?.plan || 'free';
}

/**
 * הצגת מודל שדרוג
 */
function showUpgradeModal(options) {
  const modal = document.createElement('div');
  modal.className = 'upgrade-modal-backdrop';
  modal.innerHTML = `
    <div class="upgrade-modal">
      <div class="upgrade-modal-header">
        <h2>${options.title}</h2>
        <button class="upgrade-modal-close" onclick="this.closest('.upgrade-modal-backdrop').remove()">✖</button>
      </div>
      <div class="upgrade-modal-body">
        <p>${options.message}</p>
        <div class="upgrade-modal-plan">
          <strong>תוכנית מומלצת:</strong> ${PLAN_LIMITS[options.requiredPlan].name}
        </div>
      </div>
      <div class="upgrade-modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.upgrade-modal-backdrop').remove()">ביטול</button>
        <button class="btn btn-primary" onclick="showSubscriptionSettings(); this.closest('.upgrade-modal-backdrop').remove();">
          ${options.action}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════
// 🎨 CSS למודל שדרוג
// ═══════════════════════════════════════════════════════

const upgradeModalCSS = `
.upgrade-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s;
}

.upgrade-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  animation: slideUp 0.3s;
}

.upgrade-modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upgrade-modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1a1a1a;
}

.upgrade-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
}

.upgrade-modal-body {
  padding: 1.5rem;
}

.upgrade-modal-body p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: #333;
}

.upgrade-modal-plan {
  background: #f0f9ff;
  border: 2px solid #0ea5e9;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.upgrade-modal-plan strong {
  color: #0284c7;
}

.upgrade-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
`;

// הוסף CSS לדף
const style = document.createElement('style');
style.textContent = upgradeModalCSS;
document.head.appendChild(style);

// ═══════════════════════════════════════════════════════
// 📤 ייצוא
// ═══════════════════════════════════════════════════════

window.PlanLimits = {
  PLAN_LIMITS,
  canUploadFile,
  canShareWithUser,
  canCreateSharedFolder,
  canCreateProfile,
  canUseOCR,
  canUseAISearch,
  getUserPlan
};

console.log('✅ מערכת אכיפת מגבלות נטענה');