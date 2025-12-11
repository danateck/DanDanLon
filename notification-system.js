// ========================================
// 🔔 מערכת התראות לקבצים ממתינים
// ========================================

/**
 * מחלקה לניהול התראות בצד ימין עליון של המסך
 */
class NotificationBanner {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // יצירת container להתראות אם לא קיים
    if (!document.getElementById('notification-banner-container')) {
      const container = document.createElement('div');
      container.id = 'notification-banner-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
      `;
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = document.getElementById('notification-banner-container');
    }
  }

  /**
   * הצגת התראה על קבצים ממתינים
   */
  showPendingFilesAlert(count, totalSize) {
    const banner = document.createElement('div');
    banner.className = 'notification-banner pending-files';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">📂</div>
        <div class="banner-text">
          <div class="banner-title">קבצים ממתינים לשיתוף</div>
          <div class="banner-message">
            יש לך ${count} ${count === 1 ? 'קובץ' : 'קבצים'} (${this.formatBytes(totalSize)}) 
            שממתינים לשיתוף אך אין מספיק מקום באחסון.
          </div>
        </div>
        <button class="banner-close" onclick="this.closest('.notification-banner').remove()">×</button>
      </div>
      <div class="banner-actions">
        <button class="btn-view" onclick="window.pendingSharesManager.openPendingSharesModal(); this.closest('.notification-banner').remove();">
          👁️ צפה בקבצים
        </button>
        <button class="btn-upgrade" onclick="openUpgradeModal(); this.closest('.notification-banner').remove();">
          🚀 שדרג מנוי
        </button>
      </div>
    `;

    this.container.appendChild(banner);

    // אנימציה של כניסה
    setTimeout(() => banner.classList.add('show'), 10);

    // הסרה אוטומטית אחרי 15 שניות
    setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }, 15000);
  }

  /**
   * הצגת התראה על חריגה ממגבלת אחסון
   */
  showStorageFullAlert(used, limit) {
    const banner = document.createElement('div');
    banner.className = 'notification-banner storage-full';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">⚠️</div>
        <div class="banner-text">
          <div class="banner-title">האחסון מלא!</div>
          <div class="banner-message">
            השתמשת ב-${this.formatBytes(used)} מתוך ${this.formatBytes(limit)}.
            למחוק קבצים או לשדרג את המנוי כדי להוסיף עוד.
          </div>
        </div>
        <button class="banner-close" onclick="this.closest('.notification-banner').remove()">×</button>
      </div>
      <div class="banner-actions">
        <button class="btn-upgrade" onclick="openUpgradeModal(); this.closest('.notification-banner').remove();">
          🚀 שדרג מנוי
        </button>
        <button class="btn-manage" onclick="openStorageManagementModal(); this.closest('.notification-banner').remove();">
          🗑️ נקה קבצים
        </button>
      </div>
    `;

    this.container.appendChild(banner);
    setTimeout(() => banner.classList.add('show'), 10);

    // הסרה אוטומטית אחרי 20 שניות
    setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }, 20000);
  }

  /**
   * הצגת התראת הצלחה
   */
  showSuccessAlert(message) {
    const banner = document.createElement('div');
    banner.className = 'notification-banner success';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">✅</div>
        <div class="banner-text">
          <div class="banner-title">הצלחה!</div>
          <div class="banner-message">${message}</div>
        </div>
        <button class="banner-close" onclick="this.closest('.notification-banner').remove()">×</button>
      </div>
    `;

    this.container.appendChild(banner);
    setTimeout(() => banner.classList.add('show'), 10);

    setTimeout(() => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }, 5000);
  }

  /**
   * פורמט בייטים
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// ========================================
// 🎨 CSS למערכת ההתראות
// ========================================
const notificationStyles = `
<style>
.notification-banner {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
  overflow: hidden;
  opacity: 0;
  transform: translateX(400px);
  transition: all 0.3s ease;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  border: 1px solid #e0e0e0;
}

.notification-banner.show {
  opacity: 1;
  transform: translateX(0);
}

.notification-banner.pending-files {
  border-left: 4px solid #ffc107;
}

.notification-banner.storage-full {
  border-left: 4px solid #dc3545;
}

.notification-banner.success {
  border-left: 4px solid #28a745;
}

.banner-content {
  display: flex;
  padding: 16px;
  gap: 12px;
  align-items: flex-start;
  direction: rtl;
}

.banner-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  font-weight: 700;
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 6px;
}

.banner-message {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.5;
}

.banner-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.2s;
}

.banner-close:hover {
  color: #dc3545;
}

.banner-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  margin-top: 8px;
  direction: rtl;
}

.banner-actions button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-view {
  background: #007bff;
  color: white;
}

.btn-view:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-upgrade {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-upgrade:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-manage {
  background: #6c757d;
  color: white;
}

.btn-manage:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

@media (max-width: 500px) {
  #notification-banner-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .banner-actions {
    flex-direction: column;
  }
  
  .banner-actions button {
    width: 100%;
  }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);

// ========================================
// 🔍 בדיקה אוטומטית של קבצים ממתינים
// ========================================

/**
 * בדיקה תקופתית של קבצים ממתינים
 */
class PendingFilesMonitor {
  constructor() {
    this.notificationBanner = new NotificationBanner();
    this.checkInterval = null;
    this.lastCheckTime = 0;
    this.hasShownNotification = false;
  }

  /**
   * התחלת ניטור
   */
  start() {
    // בדיקה מיידית
    this.check();

    // בדיקה כל 5 דקות
    this.checkInterval = setInterval(() => {
      this.check();
    }, 5 * 60 * 1000);
  }

  /**
   * עצירת ניטור
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * ביצוע בדיקה
   */
  async check() {
    try {
      // לא לבדוק יותר מדי בקצב גבוה
      const now = Date.now();
      if (now - this.lastCheckTime < 60000) { // דקה לפחות בין בדיקות
        return;
      }
      this.lastCheckTime = now;

      const pending = await window.pendingSharesManager.loadPendingShares();
      
      if (pending.length > 0 && !this.hasShownNotification) {
        // חישוב גודל כולל
        const totalSize = pending.reduce((sum, item) => sum + (item.fileSize || 0), 0);
        
        // הצגת התראה
        this.notificationBanner.showPendingFilesAlert(pending.length, totalSize);
        
        // מסמן שהצגנו התראה
        this.hasShownNotification = true;
        
        // איפוס הדגל אחרי שעה (כדי להציג שוב אם עדיין יש)
        setTimeout(() => {
          this.hasShownNotification = false;
        }, 60 * 60 * 1000);
      }
    } catch (error) {
      console.error('❌ Error checking pending files:', error);
    }
  }

  /**
   * בדיקת מצב אחסון
   */
  async checkStorageStatus() {
    try {
      if (!window.subscriptionManager) {
        return;
      }

      const info = await window.subscriptionManager.getSubscriptionInfo();
      const percentage = info.storage.percentage;

      // התראה אם מעל 90%
      if (percentage >= 90) {
        this.notificationBanner.showStorageFullAlert(
          info.storage.used,
          info.storage.limit
        );
      }
    } catch (error) {
      console.error('❌ Error checking storage:', error);
    }
  }
}

// ========================================
// 🚀 אתחול אוטומטי
// ========================================

// משתנה גלובלי
let pendingFilesMonitor = null;

// אתחול כשהדף נטען
window.addEventListener('load', () => {
  // המתן 2 שניות שהמשתמש יתחבר
  setTimeout(() => {
    pendingFilesMonitor = new PendingFilesMonitor();
    pendingFilesMonitor.start();
    
    // בדיקת אחסון גם כן
    pendingFilesMonitor.checkStorageStatus();
  }, 2000);
});

// עצירה כשהדף נסגר
window.addEventListener('beforeunload', () => {
  if (pendingFilesMonitor) {
    pendingFilesMonitor.stop();
  }
});

// ========================================
// 📦 ייצוא לשימוש גלובלי
// ========================================

if (typeof window !== 'undefined') {
  window.NotificationBanner = NotificationBanner;
  window.PendingFilesMonitor = PendingFilesMonitor;
  
  // פונקציות עזר
  window.showPendingFilesAlert = (count, totalSize) => {
    const banner = new NotificationBanner();
    banner.showPendingFilesAlert(count, totalSize);
  };
  
  window.showStorageFullAlert = (used, limit) => {
    const banner = new NotificationBanner();
    banner.showStorageFullAlert(used, limit);
  };
  
  window.showSuccessAlert = (message) => {
    const banner = new NotificationBanner();
    banner.showSuccessAlert(message);
  };
}

// ========================================
// 🎯 דוגמאות שימוש
// ========================================

/*

// דוגמה 1: הצגת התראה ידנית
window.showPendingFilesAlert(3, 150 * 1024 * 1024); // 3 קבצים, 150MB

// דוגמה 2: התראת אחסון מלא
window.showStorageFullAlert(200 * 1024 * 1024, 200 * 1024 * 1024); // 200MB מתוך 200MB

// דוגמה 3: התראת הצלחה
window.showSuccessAlert('הקובץ נוסף בהצלחה!');

// דוגמה 4: בדיקה ידנית
if (pendingFilesMonitor) {
  pendingFilesMonitor.check();
}

// דוגמה 5: עצירה והתחלה מחדש
pendingFilesMonitor.stop();
pendingFilesMonitor.start();

*/