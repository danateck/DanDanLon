// ========================================
// 🚀 אתחול פשוט למערכת מנויים
// ========================================

console.log('💎 טוען מערכת מנויים...');

// משתנה גלובלי למערכת המנויים
let subscriptionManager = null;

// פונקציה שמאתחלת את המערכת
async function initSubscriptions() {
  try {
    console.log('⏳ ממתין ל-Firebase...');
    
    // חכה ש-Firebase יהיה מוכן
    if (!window.db || !window.fs) {
      await new Promise((resolve) => {
        window.addEventListener('firebase-ready', resolve, { once: true });
      });
    }
    
    console.log('✅ Firebase מוכן');
    
    // חכה שהמשתמש יתחבר
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('👤 משתמש מחובר:', user.email);
        
        // ייבוא המחלקה
        const { SubscriptionManager } = await import('./subscription-manager.js');
        
        // יצירת מופע
        subscriptionManager = new SubscriptionManager(window.db, window.fs);
        
        // אתחול עם המשתמש
        await subscriptionManager.initialize(user.email);
        
        // חשוף גלובלית
        window.subscriptionManager = subscriptionManager;
        
        console.log('💎 מערכת מנויים פעילה!');
        console.log('📊 מנוי נוכחי:', subscriptionManager.getCurrentPlan().nameHe);
        
        // עדכן את הוידג'ט
        updateStorageWidget();
        
        // הוסף כפתור מנוי להגדרות
        addSubscriptionButton();
        
        // בדוק תפוגה כל 5 דקות
        setInterval(() => {
          subscriptionManager.checkSubscriptionExpiry();
        }, 5 * 60 * 1000);
        
      } else {
        console.log('⏳ ממתין להתחברות משתמש...');
      }
    });
    
  } catch (error) {
    console.error('❌ שגיאה באתחול מערכת מנויים:', error);
  }
}

// פונקציה שמעדכנת את וידג'ט האחסון
function updateStorageWidget() {
  if (!subscriptionManager) return;
  
  const container = document.getElementById('storage-widget-container');
  if (!container) {
    console.warn('⚠️ לא נמצא storage-widget-container');
    return;
  }
  
  const info = subscriptionManager.getSubscriptionInfo();
  
  container.innerHTML = `
    <div class="storage-widget" onclick="window.showSubscriptionSettings()">
      <div class="storage-widget-header">
        <span class="storage-icon">💾</span>
        <span class="storage-title">אחסון</span>
      </div>
      <div class="storage-widget-bar">
        <div class="storage-widget-fill" style="width: ${info.storage.percentage}%"></div>
      </div>
      <div class="storage-widget-text">
        ${info.storage.formatted.used} / ${info.storage.formatted.limit}
      </div>
      <div class="storage-widget-docs">
        ${info.documents.count} מסמכים
      </div>
      <div class="storage-widget-plan" style="margin-top: 0.5rem;">
        תוכנית: <strong>${info.plan.nameHe}</strong>
      </div>
    </div>
  `;
}

// פונקציה שמוסיפה כפתור "המנוי שלי"
function addSubscriptionButton() {
  // נסה למצוא את תפריט ההגדרות
  const settingsArea = document.querySelector('.user-panel') || 
                       document.querySelector('.sidebar');
  
  if (!settingsArea) {
    console.warn('⚠️ לא נמצא מקום להוסיף כפתור מנוי');
    return;
  }
  
  // בדוק אם הכפתור כבר קיים
  if (document.getElementById('subscription-settings-btn')) {
    return;
  }
  
  // יצור כפתור
  const btn = document.createElement('button');
  btn.id = 'subscription-settings-btn';
  btn.className = 'subscription-btn';
  btn.innerHTML = `
    <span style="font-size: 1.2rem;">💎</span>
    <span>המנוי שלי</span>
  `;
  btn.onclick = () => window.showSubscriptionSettings();
  
  // הוסף אחרי user-panel
  settingsArea.appendChild(btn);
  
  console.log('✅ כפתור מנוי נוסף');
}

// פונקציה שמציגה את עמוד המנויים
window.showSubscriptionSettings = async function() {
  if (!subscriptionManager) {
    alert('מערכת מנויים לא אותחלה');
    return;
  }
  
  try {
    // ייבוא ה-UI
    const { createSubscriptionSettingsPage, subscriptionStyles } = 
      await import('./subscription-ui.js');
    
    // הוסף סטיילים אם עדיין לא קיימים
    if (!document.getElementById('subscription-styles')) {
      const styleDiv = document.createElement('div');
      styleDiv.innerHTML = subscriptionStyles;
      document.head.appendChild(styleDiv);
    }
    
    // צור את העמוד
    const html = createSubscriptionSettingsPage(subscriptionManager);
    
    // הצג בתוכן הראשי
    const mainContent = document.getElementById('main-content') || 
                       document.querySelector('.main-content') ||
                       document.querySelector('main');
    
    if (mainContent) {
      mainContent.innerHTML = html;
    } else {
      console.error('❌ לא נמצא main-content');
    }
    
  } catch (error) {
    console.error('❌ שגיאה בהצגת הגדרות:', error);
  }
};

// CSS לכפתור ולוידג'ט
const styles = document.createElement('style');
styles.textContent = `
  /* כפתור המנוי שלי */
  .subscription-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    margin: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .subscription-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
  
  /* וידג'ט אחסון */
  .storage-widget {
    background: var(--bg-card, white);
    border-radius: 12px;
    padding: 1rem;
    margin: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s;
    border: 2px solid var(--border-soft, #e0e0e0);
  }
  
  .storage-widget:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  }
  
  .storage-widget-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .storage-icon {
    font-size: 1.25rem;
  }
  
  .storage-title {
    font-weight: 600;
    color: var(--text-mid, #333);
  }
  
  .storage-widget-bar {
    width: 100%;
    height: 8px;
    background: var(--border-soft, #e0e0e0);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .storage-widget-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    transition: width 0.3s ease;
  }
  
  .storage-widget-text,
  .storage-widget-docs,
  .storage-widget-plan {
    font-size: 0.85rem;
    color: var(--text-dark, #666);
  }
  
  .storage-widget-plan strong {
    color: var(--accent-strong, #333);
  }
  
  /* Dark mode */
  .theme-dark .storage-widget {
    background: #121816;
    border-color: rgba(82, 152, 115, 0.3);
  }
  
  .theme-dark .storage-widget-bar {
    background: rgba(82, 152, 115, 0.2);
  }
  
  .theme-dark .subscription-btn {
    background: linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%);
  }
`;
document.head.appendChild(styles);

// התחל את האתחול כשהדף נטען
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSubscriptions);
} else {
  initSubscriptions();
}

console.log('✅ subscription-init.js נטען');