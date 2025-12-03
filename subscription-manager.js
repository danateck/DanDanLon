// ========================================
// 📋 מערכת ניהול מנויים - NestyFile
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
    maxSharedFolders: 0, // רק מסמכים בודדים
    maxSharedProfiles: 0,
    autoSuggestCategory: true, // רק לפורמטים רגילים
    ocrFeatures: false,
    aiSearch: false,
    fullFolderSharing: false,
    features: [
      '200MB נפח אחסון',
      'עד 200 מסמכים',
      'גודל קובץ עד 5MB',
      'שיתוף אדם אחד',
      'שיתוף מסמכים בודדים בלבד',
      'הצעה אוטומטית לתיקייה'
    ]
  },
  STANDARD: {
    id: 'standard',
    name: 'Standard',
    nameHe: 'רגיל',
    price: 9,
    storage: 2 * 1024 * 1024 * 1024, // 2GB בבייטים
    maxDocuments: 1000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxSharedUsers: 5,
    maxSharedFolders: 5,
    maxSharedProfiles: 3,
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
    autoSuggestCategory: true,
    ocrFeatures: true, // OCR לתאריכים, ארגונים, נמענים
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
    maxSharedUsers: 20,
    maxSharedFolders: 40,
    maxSharedProfiles: 20,
    autoSuggestCategory: true,
    ocrFeatures: true,
    aiSearch: true, // חיפוש AI
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
    price: 99, // בסיס + תוספות
    pricePerGB: 1.5, // ₪1.5 לכל GB נוסף מעל 50GB
    storage: Infinity, // ללא הגבלה (בתשלום)
    maxDocuments: Infinity,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxSharedUsers: Infinity,
    maxSharedFolders: Infinity,
    maxSharedProfiles: Infinity,
    autoSuggestCategory: true,
    ocrFeatures: true,
    aiSearch: true,
    fullFolderSharing: true,
    features: [
      'אחסון ללא הגבלה',
      'מסמכים ללא הגבלה',
      'שיתוף ללא הגבלה',
      'OCR מלא',
      'חיפוש AI מתקדם',
      '₪1.5 לכל GB נוסף מעל 50GB'
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
        // משתמש חדש - צור מנוי חינמי
        await this.createFreeSubscription();
      } else {
        const userData = userSnap.data();
        this.userSubscription = userData.subscription || await this.createFreeSubscription();
      }

      // בדוק אם המנוי פג תוקף
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
      status: 'active', // active / cancelled / expired
      startDate: new Date().toISOString(),
      endDate: null, // מנוי חינמי אין תפוגה
      cancelledDate: null,
      graceEndDate: null, // תאריך סיום תקופת חסד (20 ימים)
      usedStorage: 0,
      documentCount: 0,
      extraStorageGB: 0 // רק ל-Premium+
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
    
    // אם המנוי בוטל וחלפה תקופת החסד
    if (this.userSubscription.status === 'cancelled' && 
        this.userSubscription.graceEndDate) {
      const graceEnd = new Date(this.userSubscription.graceEndDate);
      
      if (now > graceEnd) {
        // תקופת החסד נגמרה - עבור לחינמי ומחק עודפים
        await this.downgradeToFreeAndCleanup();
      }
    }

    // אם המנוי פג תוקף (תשלום לא עבר)
    if (this.userSubscription.endDate) {
      const endDate = new Date(this.userSubscription.endDate);
      
      if (now > endDate && this.userSubscription.status === 'active') {
        // המנוי פג - הפעל תקופת חסד של 20 ימים
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
    
    // שמור את התוכנית הקודמת לצורך התראה
    const oldPlan = this.userSubscription.plan;
    
    // עדכן למנוי חינמי
    this.userSubscription.plan = 'free';
    this.userSubscription.status = 'active';
    this.userSubscription.endDate = null;
    this.userSubscription.cancelledDate = null;
    this.userSubscription.graceEndDate = null;
    
    await this.saveSubscription();

    // מחק קבצים ישנים עד שנגיע ל-200MB
    await this.cleanupOldFiles();
    
    return { oldPlan, newPlan: 'free' };
  }

  // מחיקת קבצים ישנים (מהישן לחדש) עד שנגיע למגבלה
  async cleanupOldFiles() {
    try {
      const freePlan = SUBSCRIPTION_PLANS.FREE;
      
      // טען את כל המסמכים של המשתמש
      const docsRef = this.fs.collection(this.db, 'documents');
      const q = this.fs.query(docsRef, this.fs.where('owner', '==', this.currentUser));
      const snapshot = await this.fs.getDocs(q);
      
      let docs = [];
      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() });
      });

      // מיין לפי תאריך העלאה (מהישן לחדש)
      docs.sort((a, b) => {
        const dateA = a.uploadDate ? new Date(a.uploadDate) : new Date(0);
        const dateB = b.uploadDate ? new Date(b.uploadDate) : new Date(0);
        return dateA - dateB;
      });

      let currentStorage = 0;
      let keptDocs = [];
      let deletedDocs = [];

      // עבור על המסמכים מהחדש לישן
      for (let i = docs.length - 1; i >= 0; i--) {
        const doc = docs[i];
        const fileSize = doc.fileSize || 0;

        // אם עדיין יש מקום - שמור
        if (currentStorage + fileSize <= freePlan.storage && 
            keptDocs.length < freePlan.maxDocuments) {
          keptDocs.push(doc);
          currentStorage += fileSize;
        } else {
          // אין מקום - מחק
          deletedDocs.push(doc);
        }
      }

      // מחק את הקבצים העודפים
      for (const doc of deletedDocs) {
        try {
          // מחק מ-Storage
          if (doc.fileURL) {
            const fileRef = this.fs.ref(window.storage, doc.fileURL);
            await this.fs.deleteObject(fileRef);
          }
          
          // מחק מ-Firestore
          const docRef = this.fs.doc(this.db, `documents/${doc.id}`);
          await this.fs.deleteDoc(docRef);
          
          console.log(`🗑️ נמחק: ${doc.title || doc.id}`);
        } catch (error) {
          console.error(`שגיאה במחיקת ${doc.id}:`, error);
        }
      }

      console.log(`✅ ניקוי הושלם: נשמרו ${keptDocs.length} קבצים, נמחקו ${deletedDocs.length} קבצים`);
      
      // עדכן את נתוני השימוש
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
    endDate.setMonth(endDate.getMonth() + 1); // חודש מהיום

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

  // ביטול מנוי (ימשיך לעבוד עד סוף התקופה ששולמה)
  async cancelSubscription() {
    if (this.userSubscription.plan === 'free') {
      throw new Error('לא ניתן לבטל מנוי חינמי');
    }

    const now = new Date();
    this.userSubscription.cancelledDate = now.toISOString();
    // המנוי ימשיך לעבוד עד endDate

    await this.saveSubscription();
    
    console.log('✅ המנוי בוטל. יישאר פעיל עד:', this.userSubscription.endDate);
    return this.userSubscription;
  }

  // קבלת תוכנית המנוי הנוכחית
  getCurrentPlan() {
    if (!this.userSubscription) return SUBSCRIPTION_PLANS.FREE;
    return SUBSCRIPTION_PLANS[this.userSubscription.plan.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;
  }

  // בדיקה אם פעולה מותרת
  async canPerformAction(action, data = {}) {
    const plan = this.getCurrentPlan();
    
    switch (action) {
      case 'upload_file':
        // בדוק גודל קובץ
        if (data.fileSize > plan.maxFileSize) {
          return {
            allowed: false,
            reason: `גודל הקובץ חורג מהמותר (${this.formatBytes(plan.maxFileSize)})`
          };
        }
        
        // בדוק מכסת אחסון
        const newStorage = this.userSubscription.usedStorage + data.fileSize;
        if (plan.storage !== Infinity && newStorage > plan.storage) {
          return {
            allowed: false,
            reason: `חריגה ממכסת האחסון (${this.formatBytes(plan.storage)})`
          };
        }
        
        // בדוק מספר מסמכים
        if (plan.maxDocuments !== Infinity && 
            this.userSubscription.documentCount >= plan.maxDocuments) {
          return {
            allowed: false,
            reason: `הגעת למכסת המסמכים המקסימלית (${plan.maxDocuments})`
          };
        }
        
        return { allowed: true };

      case 'create_folder':
        // במנוי חינמי - רק אם יש מסמכים פנויים
        if (plan.id === 'free' && 
            this.userSubscription.documentCount >= plan.maxDocuments) {
          return {
            allowed: false,
            reason: 'הגעת למכסת המסמכים. מחק מסמכים או שדרג מנוי'
          };
        }
        return { allowed: true };

      case 'share_document':
        // בדוק מגבלת משתמשים משותפים
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
        // במנוי חינמי אסור שיתוף תיקיות
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
  async updateStorageUsage(changeInBytes) {
    this.userSubscription.usedStorage += changeInBytes;
    if (this.userSubscription.usedStorage < 0) {
      this.userSubscription.usedStorage = 0;
    }
    await this.saveSubscription();
  }

  // עדכון מספר מסמכים
  async updateDocumentCount(change) {
    this.userSubscription.documentCount += change;
    if (this.userSubscription.documentCount < 0) {
      this.userSubscription.documentCount = 0;
    }
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
    const plan = this.getCurrentPlan();
    if (plan.storage === Infinity) return 0;
    
    return Math.min(100, (this.userSubscription.usedStorage / plan.storage) * 100);
  }

  // קבלת מידע מלא על המנוי
  getSubscriptionInfo() {
    const plan = this.getCurrentPlan();
    const storage = this.userSubscription.usedStorage;
    const docs = this.userSubscription.documentCount;
    
    return {
      plan: plan,
      status: this.userSubscription.status,
      storage: {
        used: storage,
        limit: plan.storage,
        percentage: this.getStoragePercentage(),
        formatted: {
          used: this.formatBytes(storage),
          limit: this.formatBytes(plan.storage)
        }
      },
      documents: {
        count: docs,
        limit: plan.maxDocuments
      },
      dates: {
        start: this.userSubscription.startDate,
        end: this.userSubscription.endDate,
        cancelled: this.userSubscription.cancelledDate,
        graceEnd: this.userSubscription.graceEndDate
      }
    };
  }
}

// ייצוא לשימוש גלובלי
if (typeof window !== 'undefined') {
  window.SubscriptionManager = SubscriptionManager;
  window.SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS;
}
