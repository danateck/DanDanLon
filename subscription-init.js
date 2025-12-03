// ========================================
// 🚀 אתחול מערכת מנויים - גרסה מתוקנת
// ========================================

console.log('💎 טוען מערכת מנויים...');

let subscriptionManager = null;

// ========================================
// פונקציה ראשית - אתחול המערכת
// ========================================
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
        
        try {
          // ייבוא המחלקה
          const module = await import('./subscription-manager.js');
          const SubscriptionManager = module.SubscriptionManager;
          
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
            if (subscriptionManager) {
              subscriptionManager.checkSubscriptionExpiry();
            }
          }, 5 * 60 * 1000);
          
        } catch (error) {
          console.error('❌ שגיאה בטעינת מערכת מנויים:', error);
        }
        
      } else {
        console.log('⏳ ממתין להתחברות משתמש...');
      }
    });
    
  } catch (error) {
    console.error('❌ שגיאה באתחול מערכת מנויים:', error);
  }
}

// ========================================
// וידג'ט אחסון
// ========================================
function updateStorageWidget() {
  if (!subscriptionManager) return;
  
  const container = document.getElementById('storage-widget-container');
  if (!container) {
    console.warn('⚠️ לא נמצא storage-widget-container');
    return;
  }
  
  const info = subscriptionManager.getSubscriptionInfo();
  // 🔧 הסתר את הוידג'ט הישן
  const oldWidget = document.getElementById('storageWidget');
  if (oldWidget) {
    oldWidget.style.display = 'none';

  }

  
  container.innerHTML = `
    <div class="storage-widget-new" onclick="window.showSubscriptionSettings()">
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

// ========================================
// כפתור "המנוי שלי"
// ========================================
function addSubscriptionButton() {
  // נסה למצוא מקום מתאים להוסיף את הכפתור
  const sidebar = document.querySelector('.sidebar') || 
                  document.querySelector('aside') ||
                  document.querySelector('.user-panel');
  
  if (!sidebar) {
    console.warn('⚠️ לא נמצא מקום להוסיף כפתור מנוי');
    return;
  }
  
  // בדוק אם הכפתור כבר קיים
  if (document.getElementById('subscription-settings-btn')) {
    console.log('✅ כפתור מנוי כבר קיים');
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
  
  // מצא את הוידג'ט והוסף אחריו
  const widgetContainer = document.getElementById('storage-widget-container');
  if (widgetContainer && widgetContainer.parentNode) {
    widgetContainer.parentNode.insertBefore(btn, widgetContainer.nextSibling);
  } else {
    sidebar.appendChild(btn);
  }
  
  console.log('✅ כפתור מנוי נוסף');
}

// ========================================
// הצגת עמוד המנויים
// ========================================
window.showSubscriptionSettings = async function() {
  if (!subscriptionManager) {
    alert('מערכת מנויים לא אותחלה');
    return;
  }
  
  try {
    // ייבוא ה-UI
    const module = await import('./subscription-ui.js');
    const createSubscriptionSettingsPage = module.createSubscriptionSettingsPage;
    const subscriptionStyles = module.subscriptionStyles;
    
    // הוסף סטיילים אם עדיין לא קיימים
    if (!document.getElementById('subscription-styles')) {
      const styleDiv = document.createElement('div');
      styleDiv.id = 'subscription-styles';
      styleDiv.innerHTML = subscriptionStyles;
      document.head.appendChild(styleDiv);
    }
    
    // צור את העמוד
    const html = createSubscriptionSettingsPage(subscriptionManager);
    
    // נסה למצוא את התוכן הראשי
    const mainContent = document.getElementById('main-content') || 
                       document.querySelector('.main-content') ||
                       document.querySelector('.main-area') ||
                       document.querySelector('main') ||
                       document.querySelector('section');
    
    if (mainContent) {
      mainContent.innerHTML = html;
      console.log('✅ עמוד מנויים הוצג');
    } else {
      console.error('❌ לא נמצא אלמנט לתוכן ראשי');
      // הצג בחלון קופץ במקום
      const popup = window.open('', 'מנוי', 'width=800,height=600');
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>המנוי שלי</title>
            ${subscriptionStyles}
          </head>
          <body>
            ${html}
          </body>
          </html>
        `);
      }
    }
    
  } catch (error) {
    console.error('❌ שגיאה בהצגת הגדרות:', error);
    alert('שגיאה בטעינת עמוד המנויים: ' + error.message);
  }
};

// ========================================
// פונקציות גלובליות לכפתורים בעמוד המנויים
// ========================================

window.showUpgradePlans = function() {
  window.showSubscriptionSettings();
  setTimeout(() => {
    const plansSection = document.querySelector('.upgrade-plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
};

window.selectPlan = async function(planId) {
  alert('בקרוב: אינטגרציה עם מערכת תשלומים\n\nתוכנית נבחרה: ' + planId);
};

window.cancelSubscriptionDialog = async function() {
  const confirmed = confirm(
    '⚠️ האם אתה בטוח שברצונך לבטל את המנוי?\n\n' +
    '• המנוי ימשיך לעבוד עד סוף התקופה ששולמה\n' +
    '• לא תחויב בחודש הבא\n' +
    '• לאחר 20 ימים, קבצים עודפים ימחקו אוטומטית'
  );
  
  if (confirmed && subscriptionManager) {
    try {
      await subscriptionManager.cancelSubscription();
      alert('✅ המנוי בוטל. ימשיך לעבוד עד סוף התקופה');
      window.showSubscriptionSettings();
    } catch (error) {
      alert('❌ שגיאה בביטול המנוי: ' + error.message);
    }
  }
};

window.confirmCancelSubscription = async function() {
  await window.cancelSubscriptionDialog();
};

window.reactivateSubscription = async function() {
  if (!subscriptionManager) return;
  
  try {
    const info = subscriptionManager.getSubscriptionInfo();
    await subscriptionManager.upgradePlan(info.plan.id);
    alert('✅ המנוי הופעל מחדש בהצלחה!');
    window.showSubscriptionSettings();
  } catch (error) {
    alert('❌ שגיאה בהפעלת המנוי: ' + error.message);
  }
};

window.closeDialog = function() {
  const overlay = document.getElementById('eco-confirm-overlay');
  if (overlay) overlay.style.display = 'none';
};

// ========================================
// CSS
// ========================================
const styles = document.createElement('style');
styles.textContent = `
  /* כפתור המנוי שלי */
  .subscription-btn {
    display: flex;
    align-items: center;
    justify-content: center;
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
    width: calc(100% - 2rem);
  }
  
  .subscription-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }
  
  .subscription-btn:active {
    transform: translateY(0);
  }
  
  /* וידג'ט אחסון חדש */
  .storage-widget-new {
    background: var(--bg-card, white);
    border-radius: 12px;
    padding: 1rem;
    margin: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid var(--border-soft, #e0e0e0);
  }
  
  .storage-widget-new:hover {
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
    font-size: 0.95rem;
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
    border-radius: 4px;
  }
  
  .storage-widget-text,
  .storage-widget-docs,
  .storage-widget-plan {
    font-size: 0.85rem;
    color: var(--text-dark, #666);
    margin-bottom: 0.25rem;
  }
  
  .storage-widget-plan strong {
    color: var(--accent-strong, #333);
  }
  
  /* Dark mode */
  .theme-dark .storage-widget-new {
    background: #121816;
    border-color: rgba(82, 152, 115, 0.3);
  }
  
  .theme-dark .storage-widget-bar {
    background: rgba(82, 152, 115, 0.2);
  }
  
  .theme-dark .subscription-btn {
    background: linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%);
  }
  
  .theme-dark .storage-title {
    color: #e8f0ec;
  }
  
  .theme-dark .storage-widget-text,
  .theme-dark .storage-widget-docs,
  .theme-dark .storage-widget-plan {
    color: #b8c9c0;
  }
`;
document.head.appendChild(styles);

// ========================================
// התחל את האתחול
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSubscriptions);
} else {
  initSubscriptions();
}

console.log('✅ subscription-init.js נטען בהצלחה');