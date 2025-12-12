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
          
          // ⬇️ תיקון: עדכן ווידג'ט תמיד עם המידע המעודכן
          updateStorageWidget();

          
          // הוסף כפתור מנוי להגדרות
          addSubscriptionButton();
          
          // עדכן את UI התוכניות
          if (window.updateCurrentPlanUI) {
            window.updateCurrentPlanUI();
          }
          
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
// 🎯 וידג'ט אחסון מאוחד - מקור אמת יחיד!
// ========================================
async function updateStorageWidget() {
  if (!window.subscriptionManager) return;

  const widget = document.getElementById("storageWidget");
  if (!widget) {
    console.warn("⚠️ לא נמצא storageWidget");
    return;
  }

  const percentEl = document.getElementById("storageUsagePercent");
  const barFill = document.getElementById("storageUsageBarFill");
  const textEl = document.getElementById("storageUsageText");

  try {
    // 🔥 תיקון מרכזי: תמיד רענן מהשרת לפני תצוגה
    console.log('🔄 מרענן נתוני אחסון מהשרת...');
    await window.subscriptionManager.refreshUsageFromFirestore(true);

    // עכשיו קח את המידע המעודכן
    const info = window.subscriptionManager.getSubscriptionInfo();
    if (!info || !info.storage || !info.storage.formatted) {
      widget.style.visibility = "visible";
      return;
    }

    const percent = Math.round(info.storage.percentage || 0);
    const used   = info.storage.formatted.used;
    const limit  = info.storage.formatted.limit;

    // אחוז בצד שמאל
    if (percentEl) {
      percentEl.textContent = percent + "%";
    }

    // רוחב הפס
    if (barFill) {
      barFill.style.width = Math.min(percent, 100) + "%";

      // צבע לפי אחוז
      if (percent > 80) {
        barFill.style.backgroundColor = "#ef4444"; // אדום
      } else if (percent > 60) {
        barFill.style.backgroundColor = "#f59e0b"; // כתום
      } else {
        barFill.style.backgroundColor = "#10b981"; // ירוק
      }
    }

    // טקסט מתחת לפס - 🔥 תיקון: הצג את מספר המסמכים האמיתי
    if (textEl) {
      const docsCount = info.documents.count || 0;
      textEl.textContent = `בשימוש: ${used} מתוך ${limit} | ${docsCount} מסמכים`;
    }

    // אחרי שהכול מוכן – מראים
    widget.style.visibility = "visible";
    
  } catch (err) {
    console.error("❌ Error in updateStorageWidget:", err);
    widget.style.visibility = "visible";
  }
}


// שיהיה גם גלובלי כמו קודם
window.updateStorageWidget = updateStorageWidget;

// ========================================
// כפתור "המנוי שלי"
// ========================================
function addSubscriptionButton() {
  const existingBtn = document.getElementById('premiumBtn');
  
  if (existingBtn) {
    // הסר event listeners ישנים
    const newBtn = existingBtn.cloneNode(true);
    existingBtn.parentNode.replaceChild(newBtn, existingBtn);
    
    // שנה את הטקסט
    newBtn.innerHTML = `
      <span>פרימיום</span>
    `;
    
    // הוסף פעולה חדשה
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.showSubscriptionSettings();
    });
    
    console.log('✅ כפתור פרימיום עודכן');
  } else {
    console.warn('⚠️ לא נמצא כפתור פרימיום');
  }
}

// ========================================
// הצגת עמוד המנויים
// ========================================
window.showSubscriptionSettings = function() {
  const premiumPanel = document.getElementById('premiumPanel');
  if (premiumPanel) {
    premiumPanel.classList.remove('hidden');
    
    // עדכן את המידע בעמוד
    updateSubscriptionPageContent();
    
    console.log('✅ פאנל פרימיום נפתח');
  } else {
    console.warn('⚠️ לא נמצא premiumPanel');
  }


  // הצג מגבלות נוכחיות
  if (window.showCurrentLimitsInUI) {
    window.showCurrentLimitsInUI();
  }

};

// ========================================
// עדכון תוכן עמוד המנויים
// ========================================
function updateSubscriptionPageContent() {
  if (!subscriptionManager) return;
  



  const info = subscriptionManager.getSubscriptionInfo();
  const plan = info.plan;
  
  // חפש אלמנט להצגת מידע על המנוי הנוכחי
  const currentPlanInfo = document.getElementById('current-plan-info');
  if (currentPlanInfo) {
    const statusText = info.status === 'active' ? '✅ פעיל' : 
                      info.status === 'cancelled' ? '⚠️ בוטל' : 
                      '❌ פג תוקף';
    
    currentPlanInfo.innerHTML = `
      <div style="background: var(--bg-card); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: var(--text-dark);">המנוי שלי</h3>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>תוכנית:</span>
          <strong>${plan.nameHe}</strong>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>סטטוס:</span>
          <strong>${statusText}</strong>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>אחסון:</span>
        <strong dir="ltr">
            ${info.storage.formatted.used} מתוך ${info.storage.formatted.limit}
        </strong>
        </div>

        
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>מסמכים:</span>
          <strong>${info.documents.count}${plan.maxDocuments !== Infinity ? `/${plan.maxDocuments}` : ''}</strong>
        </div>
        
        ${info.dates.end ? `
          <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-soft);">
            <span>תוקף עד:</span>
            <strong>${new Date(info.dates.end).toLocaleDateString('he-IL')}</strong>
          </div>
        ` : ''}
        
        ${info.status === 'cancelled' && info.dates.graceEnd ? `
          <div style="background: #fef3c7; padding: 0.75rem; border-radius: 8px; margin-top: 1rem; font-size: 0.9rem;">
            ⚠️ המנוי בוטל ויפוג ב-${new Date(info.dates.graceEnd).toLocaleDateString('he-IL')}
          </div>
        ` : ''}
      </div>
    `;
  }
}

// ========================================
// פונקציות גלובליות לכפתורים
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
  // הפונקציה הזו מוחלפת על ידי premium-payments.js
  console.log('selectPlan called for:', planId);
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
      // אם זה מנוי אוטומטי PayPal
      if (window.cancelPayPalSubscription) {
        await window.cancelPayPalSubscription();
      } else {
        // מנוי רגיל
        await subscriptionManager.cancelSubscription();
        alert('✅ המנוי בוטל. ימשיך לעבוד עד סוף התקופה');
        window.showSubscriptionSettings();
      }
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
    alert('כדי להפעיל מחדש, בחר את התוכנית הרצויה למטה');
    window.showUpgradePlans();
  } catch (error) {
    alert('❌ שגיאה בהפעלת המנוי: ' + error.message);
  }
};

window.closeDialog = function() {
  const overlay = document.getElementById('eco-confirm-overlay');
  if (overlay) overlay.style.display = 'none';
};

// ========================================
// CSS משופר
// ========================================
const styles = document.createElement('style');
styles.textContent = `
  /* וידג'ט אחסון */
  .storage-widget-new {
    background: var(--bg-card, white);
    border-radius: 12px;
    padding: 1rem;
    margin: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid var(--border-soft, #e0e0e0);
    position: relative;
  }
  

  #storageWidget {
  visibility: hidden;
}



  .storage-widget-new:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    border-color: rgba(82, 152, 115, 0.5);
  }
  
  .storage-widget-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    position: relative;
  }
  
  .storage-icon {
    font-size: 1.25rem;
  }
  
  .storage-title {
    font-weight: 600;
    color: var(--text-mid, #333);
    font-size: 0.95rem;
    flex: 1;
  }
  
  .storage-warning-badge {
    font-size: 1rem;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
    transition: width 0.3s ease, background 0.3s ease;
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
  
  .storage-widget-warning {
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 6px;
    font-size: 0.8rem;
    color: #dc2626;
    line-height: 1.4;
  }
  
  /* Dark mode */
  .theme-dark .storage-widget-new {
    background: #121816;
    border-color: rgba(82, 152, 115, 0.3);
  }
  
  .theme-dark .storage-widget-bar {
    background: rgba(82, 152, 115, 0.2);
  }
  
  .theme-dark .storage-title {
    color: #e8f0ec;
  }
  
  .theme-dark .storage-widget-text,
  .theme-dark .storage-widget-docs,
  .theme-dark .storage-widget-plan {
    color: #b8c9c0;
  }
  
  .theme-dark .storage-widget-warning {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }

  .storage-percent {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-mid, #333);
  }

  .theme-dark .storage-percent {
    color: #e8f0ec;
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