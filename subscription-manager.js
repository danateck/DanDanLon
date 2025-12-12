// ========================================
// 📋 מערכת ניהול מנויים - NestyFile
// עם תמיכה ב-Premium+ חד-פעמי
// ========================================

// תוכניות המנוי
export const SUBSCRIPTION_PLANS = {
    FREE: {
    id: 'free',
    name: 'Free',
    nameHe: 'חינם',
    price: 0,
    storage: 200 * 1024 * 1024, // 200MB בבייטים
    maxDocuments: 200,
    maxFileSize: 5 * 1024 * 1024, // 5MB בבייטים
    maxSharedUsers: 1,
    maxSharedFolders: 1,              // 👈 תיקייה משותפת אחת
    maxSharedProfiles: 1,             // 👈 אפשר לשתף פרופיל אחד
    maxProfileInvitesPerProfile: 1,   // 👈 עד אדם אחד לכל פרופיל
    autoSuggestCategory: true,
    ocrFeatures: false,
    aiSearch: false,
    fullFolderSharing: true,          // 👈 מותר תיקיות משותפות
    features: [
      '200MB נפח אחסון',
      'עד 200 מסמכים',
      'גודל קובץ עד 5MB',
      'שיתוף אדם אחד בתיקייה משותפת',
      'תיקייה משותפת אחת',
      'שיתוף פרופיל אחד',
      'הצעה אוטומטית לתיקייה'
    ]
  },



  STANDARD: {
    id: 'standard',
    name: 'Standard',
    nameHe: 'רגיל',
    price: 9,
    storage: 2 * 1024 * 1024 * 1024, // 2GB
    maxDocuments: 1000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxSharedUsers: 5,
    maxSharedFolders: 5,
    maxSharedProfiles: 3,
    maxProfileInvitesPerProfile: 3,

    autoSuggestCategory: true,
    ocrFeatures: false,
    aiSearch: false,
    fullFolderSharing: true,
    features: [
      '2GB נפח אחסון',
      'עד 1,000 מסמכים',
      'שיתוף עד 5 אנשים',
      'שיתוף עד 5 תיקיות',
      'שיתוף עד 3 פרופילים',
      'שיתוף תיקיות שלמות'
    ]
  },
  ADVANCED: {
    id: 'advanced',
    name: 'Advanced',
    nameHe: 'מתקדם',
    price: 39,
    storage: 10 * 1024 * 1024 * 1024, // 10GB
    maxDocuments: 5000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxSharedUsers: 20,
    maxSharedFolders: 20,
    maxSharedProfiles: 10,
    maxProfileInvitesPerProfile: 10,

    autoSuggestCategory: true,
    ocrFeatures: true,
    aiSearch: false,
    fullFolderSharing: true,
    features: [
      '10GB נפח אחסון',
      'עד 5,000 מסמכים',
      'שיתוף עד 20 אנשים',
      'שיתוף עד 20 תיקיות',
      'שיתוף עד 10 פרופילים',
      'OCR - זיהוי תאריכים, ארגונים ונמענים',
      'שיתוף תיקיות שלמות'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    nameHe: 'מקצועי',
    price: 59,
    storage: 20 * 1024 * 1024 * 1024, // 20GB
    maxDocuments: 10000,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxSharedUsers: 40,
    maxSharedFolders: 40,
    maxSharedProfiles: 20,
    maxProfileInvitesPerProfile: 20,

    autoSuggestCategory: true,
    ocrFeatures: true,
    aiSearch: true,
    fullFolderSharing: true,
    features: [
      '20GB נפח אחסון',
      'עד 10,000 מסמכים',
      'שיתוף עד 20 אנשים',
      'שיתוף עד 40 תיקיות',
      'שיתוף עד 20 פרופילים',
      'OCR - זיהוי תאריכים, ארגונים ונמענים',
      'חיפוש מתקדם עם AI',
      'שיתוף תיקיות שלמות'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    nameHe: 'פרימיום',
    price: 99,
    storage: 50 * 1024 * 1024 * 1024, // 50GB
    maxDocuments: Infinity,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxSharedUsers: Infinity,
    maxSharedFolders: Infinity,
    maxSharedProfiles: Infinity,
    maxProfileInvitesPerProfile: Infinity,

    autoSuggestCategory: true,
    ocrFeatures: true,
    aiSearch: true,
    fullFolderSharing: true,
    features: [
      '50GB נפח אחסון',
      'מסמכים ללא הגבלה',
      'שיתוף אנשים ללא הגבלה',
      'שיתוף תיקיות ללא הגבלה',
      'שיתוף פרופילים ללא הגבלה',
      'OCR - זיהוי תאריכים, ארגונים ונמענים',
      'חיפוש מתקדם עם AI',
      'שיתוף תיקיות שלמות'
    ]
  },
  PREMIUM_PLUS: {
    id: 'premium_plus',
    name: 'Premium+',
    nameHe: 'פרימיום+',
    price: 99, // בסיס
    pricePerGB: 1.5, // ₪1.5 לכל GB נוסף (חד-פעמי!)
    storage: 50 * 1024 * 1024 * 1024, // 50GB בסיס + נוספים
    maxDocuments: Infinity,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxSharedUsers: Infinity,
    maxSharedFolders: Infinity,
    maxSharedProfiles: Infinity,
    maxProfileInvitesPerProfile: Infinity,
    autoSuggestCategory: true,
    ocrFeatures: true,
    aiSearch: true,
    fullFolderSharing: true,
    features: [
      '50GB + אחסון נוסף',
      'מסמכים ללא הגבלה',
      'שיתוף ללא הגבלה',
      'OCR מלא',
      'חיפוש AI מתקדם',
      '₪1.5 לכל GB נוסף (תשלום חד-פעמי)'
    ]
  }
};

// ========================================
// 🔐 מחלקה לניהול מנויים
// ========================================
export class SubscriptionManager {
  constructor(db, fs) {
    this.db = db;
    this.fs = fs;
    this.currentUser = null;
    this.userSubscription = null;
  }

  // אתחול המשתמש הנוכחי
  async initialize(userEmail) {
    this.userEmail = userEmail;
    this.currentUser = userEmail;
    await this.loadUserSubscription();
    
    // 🆕 רענן את ה-cache מיד בהתחלה
    await this.refreshUsageFromFirestore(true);
    
    return this.userSubscription;
  }

  // טעינת מנוי המשתמש מ-Firestore
  async loadUserSubscription() {
    try {
      const userRef = this.fs.doc(this.db, `users/${this.currentUser}`);
      const userSnap = await this.fs.getDoc(userRef);
      
      if (!userSnap.exists()) {
        await this.createFreeSubscription();
      } else {
        const userData = userSnap.data();
        this.userSubscription = userData.subscription || await this.createFreeSubscription();
      }

      await this.checkSubscriptionExpiry();
      
      return this.userSubscription;
    } catch (error) {
      console.error('שגיאה בטעינת מנוי:', error);
      return await this.createFreeSubscription();
    }
  }

  // יצירת מנוי חינמי למשתמש חדש
  async createFreeSubscription() {
    const subscription = {
      plan: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: null,
      cancelledDate: null,
      graceEndDate: null,
      usedStorage: 0,
      documentCount: 0,
      extraStorageGB: 0, // GB נוספים שנקנו (רק ל-Premium+)
      extraStoragePurchases: [] // היסטוריית רכישות
    };

    try {
      const userRef = this.fs.doc(this.db, `users/${this.currentUser}`);
      await this.fs.setDoc(userRef, {
        subscription: subscription
      }, { merge: true });
      
      this.userSubscription = subscription;
      return subscription;
    } catch (error) {
      console.error('שגיאה ביצירת מנוי:', error);
      return subscription;
    }
  }

  // בדיקת תפוגת מנוי
  async checkSubscriptionExpiry() {
    if (!this.userSubscription) return;

    const now = new Date();
    
    if (this.userSubscription.status === 'cancelled' && 
        this.userSubscription.graceEndDate) {
      const graceEnd = new Date(this.userSubscription.graceEndDate);
      
      if (now > graceEnd) {
        await this.downgradeToFreeAndCleanup();
      }
    }

    if (this.userSubscription.endDate) {
      const endDate = new Date(this.userSubscription.endDate);
      
      if (now > endDate && this.userSubscription.status === 'active') {
        await this.startGracePeriod();
      }
    }
  }

  // התחלת תקופת חסד של 20 ימים
  async startGracePeriod() {
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + 20);

    this.userSubscription.status = 'cancelled';
    this.userSubscription.graceEndDate = graceEnd.toISOString();

    await this.saveSubscription();
    
    console.warn(`⚠️ תקופת חסד החלה. המנוי יפוג ב-${graceEnd.toLocaleDateString('he-IL')}`);
  }

  // ירידה לחינמי ומחיקת קבצים עודפים
  async downgradeToFreeAndCleanup() {
    console.log('🔄 מעביר משתמש למנוי חינמי ומנקה קבצים...');
    
    const oldPlan = this.userSubscription.plan;
    
    this.userSubscription.plan = 'free';
    this.userSubscription.status = 'active';
    this.userSubscription.endDate = null;
    this.userSubscription.cancelledDate = null;
    this.userSubscription.graceEndDate = null;
    this.userSubscription.extraStorageGB = 0; // מאפס GB נוספים
    
    await this.saveSubscription();
    await this.cleanupOldFiles();
    
    return { oldPlan, newPlan: 'free' };
  }

  // מחיקת קבצים ישנים
  async cleanupOldFiles() {
    try {
      const freePlan = SUBSCRIPTION_PLANS.FREE;
      
      const docsRef = this.fs.collection(this.db, 'documents');
      const q = this.fs.query(docsRef, this.fs.where('owner', '==', this.currentUser));
      const snapshot = await this.fs.getDocs(q);
      
      let docs = [];
      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() });
      });

      docs.sort((a, b) => {
        const dateA = a.uploadDate ? new Date(a.uploadDate) : new Date(0);
        const dateB = b.uploadDate ? new Date(b.uploadDate) : new Date(0);
        return dateA - dateB;
      });

      let currentStorage = 0;
      let keptDocs = [];
      let deletedDocs = [];

      for (let i = docs.length - 1; i >= 0; i--) {
        const doc = docs[i];
        const fileSize = doc.fileSize || 0;

        if (currentStorage + fileSize <= freePlan.storage && 
            keptDocs.length < freePlan.maxDocuments) {
          keptDocs.push(doc);
          currentStorage += fileSize;
        } else {
          deletedDocs.push(doc);
        }
      }

      for (const doc of deletedDocs) {
        try {
          if (doc.fileURL) {
            const fileRef = this.fs.ref(window.storage, doc.fileURL);
            await this.fs.deleteObject(fileRef);
          }
          
          const docRef = this.fs.doc(this.db, `documents/${doc.id}`);
          await this.fs.deleteDoc(docRef);
          
          console.log(`🗑️ נמחק: ${doc.title || doc.id}`);
        } catch (error) {
          console.error(`שגיאה במחיקת ${doc.id}:`, error);
        }
      }

      console.log(`✅ ניקוי הושלם: נשמרו ${keptDocs.length} קבצים, נמחקו ${deletedDocs.length} קבצים`);
      
      this.userSubscription.usedStorage = currentStorage;
      this.userSubscription.documentCount = keptDocs.length;
      await this.saveSubscription();

      return { kept: keptDocs.length, deleted: deletedDocs.length };
    } catch (error) {
      console.error('שגיאה בניקוי קבצים:', error);
      throw error;
    }
  }

  // שמירת המנוי ב-Firestore
  async saveSubscription() {
    try {
      const userRef = this.fs.doc(this.db, `users/${this.currentUser}`);
      await this.fs.setDoc(userRef, {
        subscription: this.userSubscription
      }, { merge: true });
    } catch (error) {
      console.error('שגיאה בשמירת מנוי:', error);
    }
  }

  // עדכון מנוי חדש
  async upgradePlan(planId, autoRenew = true) {
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
    if (!plan) {
      throw new Error('תוכנית לא קיימת');
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    this.userSubscription.plan = plan.id;
    this.userSubscription.status = 'active';
    this.userSubscription.startDate = now.toISOString();
    this.userSubscription.endDate = endDate.toISOString();
    this.userSubscription.cancelledDate = null;
    this.userSubscription.graceEndDate = null;

    await this.saveSubscription();
    
    console.log(`✅ שודרג לתוכנית: ${plan.nameHe}`);
    return this.userSubscription;
  }

  // ========================================
  // 🆕 רכישת אחסון נוסף (Premium+ בלבד)
  // ========================================
  async purchaseExtraStorage(extraGB, paymentDetails = {}) {
    const currentPlan = this.getCurrentPlan();
    
    // ודא שיש מנוי פרימיום
    if (currentPlan.id !== 'premium' && currentPlan.id !== 'premium_plus') {
      throw new Error('רכישת אחסון נוסף זמינה רק למנוי פרימיום');
    }
    
    if (!extraGB || extraGB < 1) {
      throw new Error('יש לבחור לפחות 1GB');
    }
    
    // שנה את התוכנית ל-Premium+ אם זו הקנייה הראשונה
    if (currentPlan.id === 'premium') {
      this.userSubscription.plan = 'premium_plus';
    }
    
    // הוסף את ה-GB הנוספים
    const currentExtra = this.userSubscription.extraStorageGB || 0;
    this.userSubscription.extraStorageGB = currentExtra + extraGB;
    
    // שמור את הרכישה בהיסטוריה
    if (!this.userSubscription.extraStoragePurchases) {
      this.userSubscription.extraStoragePurchases = [];
    }
    
    this.userSubscription.extraStoragePurchases.push({
      date: new Date().toISOString(),
      amountGB: extraGB,
      price: extraGB * SUBSCRIPTION_PLANS.PREMIUM_PLUS.pricePerGB,
      paymentId: paymentDetails.orderId || null,
      paypalOrderId: paymentDetails.paypalOrderId || null
    });
    
    await this.saveSubscription();
    
    console.log(`✅ נוספו ${extraGB}GB. סה"כ נוסף: ${this.userSubscription.extraStorageGB}GB`);
    
    return {
      success: true,
      totalExtraGB: this.userSubscription.extraStorageGB,
      totalStorage: this.getTotalStorage()
    };
  }
  
  // קבלת סה"כ אחסון (כולל תוספות)
  getTotalStorage() {
    const plan = SUBSCRIPTION_PLANS[this.userSubscription?.plan?.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    
    if (this.userSubscription?.plan === 'premium_plus') {
      const extraGB = this.userSubscription.extraStorageGB || 0;
      const baseStorage = SUBSCRIPTION_PLANS.PREMIUM.storage; // 50GB
      return baseStorage + (extraGB * 1024 * 1024 * 1024);
    }
    
    return plan.storage;
  }

  // ביטול מנוי
  async cancelSubscription() {
    if (this.userSubscription.plan === 'free') {
      throw new Error('לא ניתן לבטל מנוי חינמי');
    }

    const now = new Date();
    this.userSubscription.cancelledDate = now.toISOString();

    await this.saveSubscription();
    
    console.log('✅ המנוי בוטל. יישאר פעיל עד:', this.userSubscription.endDate);
    return this.userSubscription;
  }

  // קבלת תוכנית המנוי הנוכחית (כולל אחסון נוסף)
  getCurrentPlan() {
    if (!this.userSubscription) return SUBSCRIPTION_PLANS.FREE;
    
    const basePlan = SUBSCRIPTION_PLANS[this.userSubscription.plan.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
    
    // אם זה Premium+ עם GB נוספים
    if (this.userSubscription.plan === 'premium_plus') {
      const extraGB = this.userSubscription.extraStorageGB || 0;
      const baseStorage = SUBSCRIPTION_PLANS.PREMIUM.storage; // 50GB
      const totalStorage = baseStorage + (extraGB * 1024 * 1024 * 1024);
      
      return {
        ...basePlan,
        storage: totalStorage,
        extraStorageGB: extraGB,
        nameHe: extraGB > 0 ? `פרימיום+ (${50 + extraGB}GB)` : 'פרימיום+'
      };
    }
    
    return basePlan;
  }

// במקום לסמוך על מספרים חלקיים מבחוץ – תמיד נרענן את האמת מפיירסטור
// במקום לסמוך על ערכים "חלקיים" מבחוץ – תמיד נרענן מהאמת ב-Firestore
async setAbsoluteUsage(bytes, docsCount) {
  try {
    console.log(
      "🔄 setAbsoluteUsage נקראה – מתעלם מהערכים שהועברו ומרענן שימוש מלא מ-Firestore"
    );

    // מאפסים cache כדי שהרענון יהיה אמיתי
    this._usageCache = null;
    this._cacheTimestamp = 0;

    // רענון מלא – סופר בעלות + משותפים לפי refreshUsageFromFirestore
    await this.refreshUsageFromFirestore(true);
  } catch (err) {
    console.error("❌ setAbsoluteUsage refresh failed:", err);
  }
}






// בדיקה אם מותר למשתמש הנוכחי להצטרף לתיקייה משותפת לפי מגבלת האחסון שלו
async canJoinSharedFolder(sharedFolderId) {
  const plan = this.getCurrentPlan();
  const totalStorage = this.getTotalStorage();

  // אם אין מגבלת אחסון (פרימיום וכו') – תמיד מותר
  if (!Number.isFinite(totalStorage) || totalStorage === Infinity) {
    return { allowed: true };
  }

  if (!this.db || !this.fs || !this.userEmail) {
    return {
      allowed: false,
      reason: "שגיאת מערכת: חסר חיבור למסד נתונים או משתמש לא מזוהה"
    };
  }

  // ודאי שהשימוש הנוכחי מעודכן
  await this.refreshUsageFromFirestore(true);

  const currentUsed = Number(this.userSubscription?.usedStorage) || 0;

  const docsRef = this.fs.collection(this.db, "documents");
  const q = this.fs.query(
    docsRef,
    this.fs.where("sharedFolders", "array-contains", sharedFolderId)
  );

  const snap = await this.fs.getDocs(q);

  if (snap.empty) {
    // תיקייה ריקה – אין בעיה
    return { allowed: true, folderBytes: 0, projectedBytes: currentUsed };
  }

  let folderBytes = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};

    if (data._trashed || data.deletedAt || data.trashed) return;

    const size =
      Number(data.fileSize) ||
      Number(data.size) ||
      Number(data.file_size) ||
      0;

    if (size > 0 && Number.isFinite(size)) {
      folderBytes += size;
    }
  });

  const projected = currentUsed + folderBytes;

  if (projected > totalStorage) {
    return {
      allowed: false,
      folderBytes,
      projectedBytes: projected,
      reason:
        `לא ניתן להצטרף לתיקייה הזו בתוכנית הנוכחית שלך.\n\n` +
        `גודל התיקייה: ${this.formatBytes(folderBytes)}\n` +
        `הקבצים שכבר יש לך: ${this.formatBytes(currentUsed)}\n` +
        `מגבלת האחסון בתוכנית ${plan.nameHe}: ${this.formatBytes(totalStorage)}`
    };
  }

  return {
    allowed: true,
    folderBytes,
    projectedBytes: projected
  };
}



  // בדיקה אם פעולה מותרת
  async canPerformAction(action, data = {}) {
    const plan = this.getCurrentPlan();
    
    switch (action) {
      case 'upload_file':
        if (data.fileSize > plan.maxFileSize) {
          return {
            allowed: false,
            reason: `גודל הקובץ חורג מהמותר (${this.formatBytes(plan.maxFileSize)})`
          };
        }
        
        const newStorage = this.userSubscription.usedStorage + data.fileSize;
        const totalStorage = this.getTotalStorage();
        
        if (totalStorage !== Infinity && newStorage > totalStorage) {
          return {
            allowed: false,
            reason: `חריגה ממכסת האחסון (${this.formatBytes(totalStorage)})`
          };
        }
        
        if (plan.maxDocuments !== Infinity && 
            this.userSubscription.documentCount >= plan.maxDocuments) {
          return {
            allowed: false,
            reason: `הגעת למכסת המסמכים המקסימלית (${plan.maxDocuments})`
          };
        }
        
        return { allowed: true };

      case 'create_folder':
        if (plan.id === 'free' && 
            this.userSubscription.documentCount >= plan.maxDocuments) {
          return {
            allowed: false,
            reason: 'הגעת למכסת המסמכים. מחק מסמכים או שדרג מנוי'
          };
        }
        return { allowed: true };

      case 'share_document':
        const sharedUsers = data.sharedUsers || 0;
        if (plan.maxSharedUsers !== Infinity && 
            sharedUsers >= plan.maxSharedUsers) {
          return {
            allowed: false,
            reason: `הגעת למספר המקסימלי של משתמשים משותפים (${plan.maxSharedUsers})`
          };
        }
        return { allowed: true };

      case 'share_folder':
        if (!plan.fullFolderSharing) {
          return {
            allowed: false,
            reason: 'שיתוף תיקיות זמין רק ממנוי Standard ומעלה'
          };
        }
        return { allowed: true };

      case 'use_ocr':
        if (!plan.ocrFeatures) {
          return {
            allowed: false,
            reason: 'OCR זמין רק ממנוי Advanced ומעלה'
          };
        }
        return { allowed: true };

      case 'use_ai_search':
        if (!plan.aiSearch) {
          return {
            allowed: false,
            reason: 'חיפוש AI זמין רק ממנוי Pro ומעלה'
          };
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }

  // עדכון שימוש באחסון
// 🆕 מערכת Cache חכמה
  _usageCache = null;
  _cacheTimestamp = 0;
  _cacheLifetime = 60000; // דקה אחת

  /**
   * רענון מהיר מ-Firestore (עם cache)
   */
// 📦 רענון שימוש באחסון *רק* על מסמכים שהמשתמש הבעלים שלהם
// 📦 רענון שימוש באחסון – מסמכים בבעלותי + מסמכים שמשותפים איתי
// ריענון שימוש אמיתי מפיירסטור – כולל קבצים משותפים
async refreshUsageFromFirestore(force = false) {
  if (!this.db || !this.fs || !this.currentUser) return;

  const now = Date.now();

  // cache קטן כדי לא לחשב כל שנייה
  if (!force && this._usageCache && (now - (this._cacheTimestamp || 0) < 30_000)) {
    return this._usageCache;
  }

  const docsRef = this.fs.collection(this.db, "documents");

  // 🔹 כל הקבצים שאני הבעלים שלהם
  const qOwned = this.fs.query(
    docsRef,
    this.fs.where("owner", "==", this.currentUser)
  );

  // 🔹 כל הקבצים שמשותפים איתי
  const qShared = this.fs.query(
    docsRef,
    this.fs.where("sharedWith", "array-contains", this.currentUser)
  );

  const [ownedSnap, sharedSnap] = await Promise.all([
    this.fs.getDocs(qOwned),
    this.fs.getDocs(qShared),
  ]);

  // מאחדים את התוצאות לפי id כדי שלא נספור פעמיים
  const byId = new Map();
  ownedSnap.forEach((docSnap) => {
    byId.set(docSnap.id, docSnap.data() || {});
  });
  sharedSnap.forEach((docSnap) => {
    byId.set(docSnap.id, docSnap.data() || {});
  });

  let totalBytes = 0;
  let docsCount = 0;

  for (const data of byId.values()) {
    // מדלגים על מה שבסל מחזור / נמחק
if (data.deletedAt || data.trashed) continue;
    const size =
      Number(data.fileSize) ||
      Number(data.size) ||
      Number(data.file_size) ||
      0;

    if (!size || !Number.isFinite(size)) continue;

    totalBytes += size;
    docsCount += 1;
  }

  const plan = this.getCurrentPlan();
  const totalStorage = this.getTotalStorage();

  // 🔒 חיתוך לפי מגבלת התוכנית – אצלך זה 200MB
  const clampedUsed =
    !Number.isFinite(totalStorage) || totalStorage === Infinity
      ? totalBytes
      : Math.min(totalBytes, totalStorage);

  const clampedDocs =
    plan.maxDocuments === Infinity
      ? docsCount
      : Math.min(docsCount, plan.maxDocuments);

  // שומרים במנוי
  this.userSubscription.usedStorage = clampedUsed;
  this.userSubscription.documentCount = clampedDocs;
  await this.saveSubscription();

  // cache פנימי
  this._usageCache = {
    usedStorage: clampedUsed,
    documentCount: clampedDocs,
  };
  this._cacheTimestamp = now;

  return this._usageCache;
}



  // 🔄 עדכון אחסון (מהיר - רק cache)
  async updateStorageUsage(bytesDelta = 0) {
    try {
      console.log('🔄 updateStorageUsage called with delta =', bytesDelta, '→ doing full refresh from Firestore');

      // מאפס cache כדי שהרענון יהיה אמיתי
      this._usageCache = null;
      this._cacheTimestamp = 0;

      // רענון מלא – זה *המקור היחיד לאמת*
      await this.refreshUsageFromFirestore(true);
    } catch (err) {
      console.error('❌ updateStorageUsage failed:', err);
    }
  }


  // 🔄 עדכון מסמכים (מהיר - רק cache)
  async updateDocumentCount(countDelta = 0) {
    try {
      console.log('🔄 updateDocumentCount called with delta =', countDelta, '→ recalculating from allDocsData');

      this._usageCache = null;
      this._cacheTimestamp = 0;

      if (typeof window.recalculateUserStorage === "function") {
        await window.recalculateUserStorage();
      } else {
        await this.refreshUsageFromFirestore(true);
      }
    } catch (err) {
      console.error('❌ updateDocumentCount failed:', err);
    }
  }


  // פורמט בייטים לקריא
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    if (bytes === Infinity) return '∞';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // קבלת אחוז השימוש באחסון
  getStoragePercentage() {
  const totalStorage = this.getTotalStorage();
  if (!Number.isFinite(totalStorage) || totalStorage <= 0 || totalStorage === Infinity) {
    return 0;
  }

  const used = Number(this.userSubscription.usedStorage);
  if (!Number.isFinite(used) || used <= 0) {
    return 0;
  }

  return Math.min(100, (used / totalStorage) * 100);
}


  // קבלת מידע מלא על המנוי
  getSubscriptionInfo() {
    // ✅ רענן ברקע אם צריך (לא חוסם!)
    if (!this._usageCache || (Date.now() - this._cacheTimestamp) > this._cacheLifetime) {
      // רענן ברקע ללא המתנה
      this.refreshUsageFromFirestore(false).catch(console.error);
    }
    
    const plan = this.getCurrentPlan();
    const sub = this.userSubscription || {};

    let storage = Number(sub.usedStorage);
    if (!Number.isFinite(storage) || storage < 0) storage = 0;

    let docs = Number(sub.documentCount);
    if (!Number.isFinite(docs) || docs < 0) docs = 0;
const totalStorage = this.getTotalStorage();

// 🧮 חישובי תצוגה
const realUsed = storage; // כמה באמת בשימוש (כולל חריגה)
const safeLimit = Number.isFinite(totalStorage) && totalStorage > 0 ? totalStorage : Infinity;

// מה נציג בפועל ב־UI (לא נעבור את הגבול)
const displayUsed =
  safeLimit === Infinity
    ? realUsed
    : Math.min(realUsed, safeLimit);

// כמה הוא מעבר למגבלה (אם בכלל)
const overBytes =
  safeLimit === Infinity
    ? 0
    : Math.max(0, realUsed - safeLimit);

return {
  plan: plan,
  status: sub.status || 'active',
  storage: {
    // ערכים אמיתיים ללוגיקה
    used: realUsed,
    limit: totalStorage,

    // כמה הוא מעל המגבלה
    overBytes,
    overFormatted: this.formatBytes(overBytes),

    percentage:
      !Number.isFinite(safeLimit) || safeLimit <= 0
        ? 0
        : Math.min(100, (realUsed / safeLimit) * 100),

    formatted: {
      // בתצוגה – לא נכתוב "300 מתוך 200" אלא "200 מתוך 200"
      used: this.formatBytes(displayUsed),
      limit: this.formatBytes(totalStorage),
      over: overBytes > 0 ? this.formatBytes(overBytes) : null
    }
  },
  documents: {
    count: docs,
    limit: plan.maxDocuments,
    percentage:
      !plan.maxDocuments || plan.maxDocuments === Infinity
        ? 0
        : Math.min(100, (docs / plan.maxDocuments) * 100)
  },
  dates: {
    start: sub.startDate || null,
    end: sub.endDate || null,
    cancelled: sub.cancelledDate || null,
    graceEnd: sub.graceEndDate || null
  }
};

  }


}

// ייצוא לשימוש גלובלי
if (typeof window !== 'undefined') {
  window.SubscriptionManager = SubscriptionManager;
  window.SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS;
}