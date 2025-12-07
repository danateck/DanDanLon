// ========================================
// 📋 מערכת ניהול מנויים - NestyFile
// גרסה מתוקנת עם תיקון באג 927GB
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
    maxSharedFolders: 1,
    maxSharedProfiles: 1,
    maxProfileInvitesPerProfile: 1,
    autoSuggestCategory: true,
    ocrFeatures: false,
    aiSearch: false,
    fullFolderSharing: true,
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
    price: 99,
    pricePerGB: 1.5,
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
    this.currentUser = userEmail;
    await this.loadUserSubscription();
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
        
        // 🔧 תיקון באג: ודא שהערכים תקינים
        this.sanitizeSubscription();
      }

      await this.checkSubscriptionExpiry();
      
      return this.userSubscription;
    } catch (error) {
      console.error('שגיאה בטעינת מנוי:', error);
      return await this.createFreeSubscription();
    }
  }

  // 🔧 פונקציה חדשה: נקה ערכים לא תקינים
  sanitizeSubscription() {
    if (!this.userSubscription) return;
    
    // תקן usedStorage
    let storage = Number(this.userSubscription.usedStorage);
    if (!Number.isFinite(storage) || storage < 0) {
      console.warn('⚠️ תוקן usedStorage לא תקין:', this.userSubscription.usedStorage);
      this.userSubscription.usedStorage = 0;
    }
    
    // תקן documentCount
    let docs = Number(this.userSubscription.documentCount);
    if (!Number.isFinite(docs) || docs < 0) {
      console.warn('⚠️ תוקן documentCount לא תקין:', this.userSubscription.documentCount);
      this.userSubscription.documentCount = 0;
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
      extraStorageGB: 0,
      extraStoragePurchases: []
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

  // שמירת מנוי
  async saveSubscription() {
    try {
      // 🔧 נקה לפני שמירה
      this.sanitizeSubscription();
      
      const userRef = this.fs.doc(this.db, `users/${this.currentUser}`);
      await this.fs.setDoc(userRef, {
        subscription: this.userSubscription
      }, { merge: true });
      
      console.log('✅ מנוי נשמר:', {
        storage: this.formatBytes(this.userSubscription.usedStorage),
        docs: this.userSubscription.documentCount
      });
    } catch (error) {
      console.error('שגיאה בשמירת מנוי:', error);
      throw error;
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
    
    await this.saveSubscription();
    
    console.log(`✅ הועבר מ-${oldPlan} ל-free`);
  }

  // שדרוג מנוי
  async upgradePlan(planId, paymentDetails = {}) {
    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
    if (!plan) {
      throw new Error('תוכנית לא קיימת');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    this.userSubscription.plan = planId.toLowerCase();
    this.userSubscription.status = 'active';
    this.userSubscription.startDate = now.toISOString();
    this.userSubscription.endDate = endDate.toISOString();
    this.userSubscription.cancelledDate = null;
    this.userSubscription.graceEndDate = null;

    if (paymentDetails.orderId) {
      this.userSubscription.lastPaymentOrderId = paymentDetails.orderId;
      this.userSubscription.lastPaymentDate = now.toISOString();
    }

    await this.saveSubscription();

    console.log(`✅ שודרג ל-${plan.nameHe}`);
    return this.userSubscription;
  }

  // הוספת אחסון נוסף (Premium+ בלבד)
  async addExtraStorage(extraGB, paymentDetails = {}) {
    if (this.userSubscription.plan !== 'premium_plus') {
      throw new Error('הוספת אחסון זמינה רק ב-Premium+');
    }
    
    if (extraGB < 1 || extraGB > 1000) {
      throw new Error('יש להוסיף בין 1GB ל-1000GB');
    }
    
    const currentExtra = this.userSubscription.extraStorageGB || 0;
    this.userSubscription.extraStorageGB = currentExtra + extraGB;
    
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

  // 🔧 קביעת שימוש מוחלט (לתיקון באגים)
  async setAbsoluteUsage(bytes, docsCount) {
    if (!this.userSubscription) return;

    const safeBytes = Number(bytes);
    const safeDocs = Number(docsCount);

    this.userSubscription.usedStorage = Number.isFinite(safeBytes) && safeBytes >= 0 ? safeBytes : 0;
    this.userSubscription.documentCount = Number.isFinite(safeDocs) && safeDocs >= 0 ? safeDocs : 0;

    console.log('✅ עודכן שימוש מוחלט:', {
      storage: this.formatBytes(this.userSubscription.usedStorage),
      docs: this.userSubscription.documentCount
    });

    await this.saveSubscription();
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

  // 🔧 עדכון שימוש באחסון - גרסה מתוקנת
  async updateStorageUsage(changeInBytes) {
    const delta = Number(changeInBytes);
    
    // וידוא שהדלתא תקינה
    if (!Number.isFinite(delta)) {
      console.error('❌ changeInBytes לא תקין:', changeInBytes);
      return;
    }

    if (!this.userSubscription) {
      console.warn('⚠️ אין userSubscription');
      return;
    }

    // וידוא שיש ערך התחלתי תקין
    if (typeof this.userSubscription.usedStorage !== 'number' || 
        !Number.isFinite(this.userSubscription.usedStorage)) {
      console.warn('⚠️ usedStorage לא תקין, מאתחל ל-0');
      this.userSubscription.usedStorage = 0;
    }

    // חשב ערך חדש
    const oldValue = this.userSubscription.usedStorage;
    const newValue = oldValue + delta;

    // וידוא שהערך החדש תקין
    if (!Number.isFinite(newValue) || newValue < 0) {
      console.error('❌ ערך חדש לא תקין:', { oldValue, delta, newValue });
      this.userSubscription.usedStorage = Math.max(0, oldValue); // שמור את הערך הישן או 0
    } else {
      this.userSubscription.usedStorage = newValue;
    }

    console.log('📊 עדכון אחסון:', {
      delta: this.formatBytes(delta),
      old: this.formatBytes(oldValue),
      new: this.formatBytes(this.userSubscription.usedStorage)
    });

    await this.saveSubscription();
  }

  // עדכון מספר מסמכים
  async updateDocumentCount(change) {
    const delta = Number(change);
    
    if (!Number.isFinite(delta)) {
      console.error('❌ change לא תקין במסמכים:', change);
      return;
    }
    
    if (typeof this.userSubscription.documentCount !== 'number') {
      this.userSubscription.documentCount = 0;
    }
    
    this.userSubscription.documentCount += delta;
    
    if (this.userSubscription.documentCount < 0) {
      console.warn('⚠️ מספר מסמכים שלילי, מאפס');
      this.userSubscription.documentCount = 0;
    }
    
    console.log('📄 עדכון מסמכים:', {
      delta,
      new: this.userSubscription.documentCount
    });
    
    await this.saveSubscription();
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
    const plan = this.getCurrentPlan();
    const sub = this.userSubscription || {};

    let storage = Number(sub.usedStorage);
    if (!Number.isFinite(storage) || storage < 0) storage = 0;

    let docs = Number(sub.documentCount);
    if (!Number.isFinite(docs) || docs < 0) docs = 0;

    const totalStorage = this.getTotalStorage();

    return {
      plan: plan,
      status: sub.status || 'active',
      storage: {
        used: storage,
        limit: totalStorage,
        percentage: this.getStoragePercentage(),
        formatted: {
          used: this.formatBytes(storage),
          limit: this.formatBytes(totalStorage)
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