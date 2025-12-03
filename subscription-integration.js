// // ========================================
// // 🔗 אינטגרציה של מערכת המנויים ל-main.js
// // ========================================

// // קוד זה צריך להתווסף ל-main.js או להיטען כמודול נפרד

// // ========================================
// // 1️⃣ אתחול מערכת המנויים
// // ========================================

// // הוספה ל-waitForFirebase() או לאחר אתחול Firebase:
// let subscriptionManager = null;

// async function initializeSubscriptionSystem() {
//   try {
//     // ייבוא המודולים
//     const { SubscriptionManager } = await import('./subscription-manager.js');
    
//     // יצירת מופע
//     subscriptionManager = new SubscriptionManager(window.db, window.fs);
    
//     // אתחול עם המשתמש הנוכחי
//     const currentUser = window.getCurrentUser();
//     if (currentUser) {
//       await subscriptionManager.initialize(currentUser);
//       console.log('✅ מערכת מנויים אותחלה:', subscriptionManager.getSubscriptionInfo());
      
//       // עדכן את ה-UI
//       updateSubscriptionUI();
      
//       // בדוק תפוגה כל 5 דקות
//       setInterval(() => {
//         subscriptionManager.checkSubscriptionExpiry();
//       }, 5 * 60 * 1000);
//     }
    
//     // חשוף גלובלית
//     window.subscriptionManager = subscriptionManager;
    
//   } catch (error) {
//     console.error('שגיאה באתחול מערכת מנויים:', error);
//   }
// }

// // ========================================
// // 2️⃣ עדכון פונקציית העלאת קבצים
// // ========================================

// // החלף את הפונקציה הקיימת uploadFileToStorage:
// async function uploadFileToStorage_WithSubscription(file, category, folder = null, profile = null) {
//   try {
//     // בדיקת הרשאות מנוי
//     const permission = await subscriptionManager.canPerformAction('upload_file', {
//       fileSize: file.size
//     });

//     if (!permission.allowed) {
//       showAlert(permission.reason, 'error');
//       return null;
//     }

//     // בצע את ההעלאה הרגילה
//     const result = await uploadFileToStorage(file, category, folder, profile);
    
//     if (result && result.downloadURL) {
//       // עדכן את השימוש באחסון
//       await subscriptionManager.updateStorageUsage(file.size);
//       await subscriptionManager.updateDocumentCount(1);
      
//       // עדכן UI
//       updateStorageWidget();
//     }
    
//     return result;
//   } catch (error) {
//     console.error('שגיאה בהעלאת קובץ:', error);
//     throw error;
//   }
// }

// // ========================================
// // 3️⃣ עדכון פונקציית מחיקת קבצים
// // ========================================

// // החלף את הפונקציה הקיימת deleteDocument:
// async function deleteDocument_WithSubscription(docId) {
//   try {
//     const docRef = window.fs.doc(window.db, `documents/${docId}`);
//     const docSnap = await window.fs.getDoc(docRef);
    
//     if (!docSnap.exists()) {
//       throw new Error('המסמך לא נמצא');
//     }
    
//     const docData = docSnap.data();
//     const fileSize = docData.fileSize || 0;
    
//     // מחק את המסמך
//     await deleteDocument(docId);
    
//     // עדכן את השימוש באחסון
//     await subscriptionManager.updateStorageUsage(-fileSize);
//     await subscriptionManager.updateDocumentCount(-1);
    
//     // עדכן UI
//     updateStorageWidget();
    
//     showAlert('המסמך נמחק בהצלחה', 'success');
//   } catch (error) {
//     console.error('שגיאה במחיקת מסמך:', error);
//     showAlert('שגיאה במחיקת המסמך', 'error');
//   }
// }

// // ========================================
// // 4️⃣ עדכון פונקציית יצירת תיקייה
// // ========================================

// async function createFolder_WithSubscription(folderName, category) {
//   try {
//     // בדיקת הרשאות
//     const permission = await subscriptionManager.canPerformAction('create_folder');
    
//     if (!permission.allowed) {
//       showAlert(permission.reason, 'error');
//       return;
//     }
    
//     // צור את התיקייה
//     await createFolder(folderName, category);
    
//   } catch (error) {
//     console.error('שגיאה ביצירת תיקייה:', error);
//     showAlert('שגיאה ביצירת התיקייה', 'error');
//   }
// }

// // ========================================
// // 5️⃣ עדכון פונקציית שיתוף
// // ========================================

// async function shareDocument_WithSubscription(docId, targetEmail) {
//   try {
//     // קבל את המסמך
//     const docRef = window.fs.doc(window.db, `documents/${docId}`);
//     const docSnap = await window.fs.getDoc(docRef);
    
//     if (!docSnap.exists()) {
//       throw new Error('המסמך לא נמצא');
//     }
    
//     const docData = docSnap.data();
//     const currentShared = docData.sharedWith || [];
    
//     // בדיקת הרשאות
//     const permission = await subscriptionManager.canPerformAction('share_document', {
//       sharedUsers: currentShared.length + 1
//     });
    
//     if (!permission.allowed) {
//       showAlert(permission.reason, 'error');
//       return;
//     }
    
//     // שתף את המסמך
//     await shareDocument(docId, targetEmail);
    
//   } catch (error) {
//     console.error('שגיאה בשיתוף מסמך:', error);
//     showAlert('שגיאה בשיתוף המסמך', 'error');
//   }
// }

// // ========================================
// // 6️⃣ וידג'ט תצוגת אחסון
// // ========================================

// function createStorageWidget() {
//   const info = subscriptionManager.getSubscriptionInfo();
  
//   return `
//     <div class="storage-widget" onclick="window.showSubscriptionSettings()">
//       <div class="storage-widget-header">
//         <span class="storage-icon">💾</span>
//         <span class="storage-title">אחסון</span>
//       </div>
//       <div class="storage-widget-bar">
//         <div class="storage-widget-fill" style="width: ${info.storage.percentage}%"></div>
//       </div>
//       <div class="storage-widget-text">
//         ${info.storage.formatted.used} / ${info.storage.formatted.limit}
//       </div>
//       <div class="storage-widget-plan">
//         תוכנית: ${info.plan.nameHe}
//       </div>
//     </div>
//   `;
// }

// function updateStorageWidget() {
//   const widget = document.getElementById('storage-widget-container');
//   if (widget && subscriptionManager) {
//     widget.innerHTML = createStorageWidget();
//   }
// }

// // ========================================
// // 7️⃣ עמוד הגדרות מנוי
// // ========================================

// async function showSubscriptionSettings() {
//   try {
//     const { createSubscriptionSettingsPage, subscriptionStyles } = await import('./subscription-ui.js');
    
//     // הוסף סטיילים אם עדיין לא קיימים
//     if (!document.getElementById('subscription-styles')) {
//       const styleElement = document.createElement('div');
//       styleElement.id = 'subscription-styles';
//       styleElement.innerHTML = subscriptionStyles;
//       document.head.appendChild(styleElement);
//     }
    
//     // צור את העמוד
//     const settingsHTML = createSubscriptionSettingsPage(subscriptionManager);
    
//     // הצג בממשק
//     const mainContent = document.getElementById('main-content');
//     if (mainContent) {
//       mainContent.innerHTML = settingsHTML;
//     }
    
//   } catch (error) {
//     console.error('שגיאה בהצגת הגדרות מנוי:', error);
//     showAlert('שגיאה בטעינת הגדרות המנוי', 'error');
//   }
// }

// // ========================================
// // 8️⃣ פונקציות לכפתורי המנוי
// // ========================================

// window.showUpgradePlans = function() {
//   showSubscriptionSettings();
//   // גלול לתוכניות
//   setTimeout(() => {
//     const plansSection = document.querySelector('.upgrade-plans-section');
//     if (plansSection) {
//       plansSection.scrollIntoView({ behavior: 'smooth' });
//     }
//   }, 100);
// };

// window.selectPlan = async function(planId) {
//   try {
//     // כאן תוסיפי אינטגרציה עם מערכת תשלומים (Stripe/PayPal וכו')
//     showAlert('בקרוב: אינטגרציה עם מערכת תשלומים', 'info');
    
//     // לבדיקות - אפשר לשדרג ישירות
//     // await subscriptionManager.upgradePlan(planId);
//     // showAlert(`שודרגת לתוכנית ${planId}!`, 'success');
//     // showSubscriptionSettings();
    
//   } catch (error) {
//     console.error('שגיאה בשדרוג:', error);
//     showAlert('שגיאה בשדרוג המנוי', 'error');
//   }
// };

// window.cancelSubscriptionDialog = async function() {
//   try {
//     const { showCancelDialog } = await import('./subscription-ui.js');
//     const dialogHTML = showCancelDialog(subscriptionManager);
    
//     // הצג דיאלוג
//     const overlay = document.getElementById('eco-confirm-overlay');
//     const msg = document.getElementById('eco-confirm-message');
    
//     if (overlay && msg) {
//       msg.innerHTML = dialogHTML;
//       overlay.style.display = 'flex';
//     }
    
//   } catch (error) {
//     console.error('שגיאה בהצגת דיאלוג ביטול:', error);
//   }
// };

// window.confirmCancelSubscription = async function() {
//   try {
//     await subscriptionManager.cancelSubscription();
    
//     showAlert('המנוי בוטל. ימשיך לעבוד עד סוף התקופה', 'success');
    
//     // סגור דיאלוג
//     const overlay = document.getElementById('eco-confirm-overlay');
//     if (overlay) overlay.style.display = 'none';
    
//     // רענן את עמוד ההגדרות
//     showSubscriptionSettings();
    
//   } catch (error) {
//     console.error('שגיאה בביטול מנוי:', error);
//     showAlert('שגיאה בביטול המנוי', 'error');
//   }
// };

// window.reactivateSubscription = async function() {
//   try {
//     const info = subscriptionManager.getSubscriptionInfo();
//     const plan = info.plan;
    
//     // הפעל מחדש
//     await subscriptionManager.upgradePlan(plan.id);
    
//     showAlert('המנוי הופעל מחדש בהצלחה!', 'success');
//     showSubscriptionSettings();
    
//   } catch (error) {
//     console.error('שגיאה בהפעלה מחדש:', error);
//     showAlert('שגיאה בהפעלת המנוי', 'error');
//   }
// };

// window.closeDialog = function() {
//   const overlay = document.getElementById('eco-confirm-overlay');
//   if (overlay) overlay.style.display = 'none';
// };

// // ========================================
// // 9️⃣ עדכון תפריט ההגדרות
// // ========================================

// function addSubscriptionToSettingsMenu() {
//   // מצא את תפריט ההגדרות
//   const settingsMenu = document.querySelector('.settings-menu');
  
//   if (settingsMenu) {
//     // הוסף כפתור מנוי
//     const subscriptionButton = document.createElement('button');
//     subscriptionButton.className = 'settings-menu-item';
//     subscriptionButton.innerHTML = `
//       <span class="settings-menu-icon">💎</span>
//       <span class="settings-menu-text">המנוי שלי</span>
//     `;
//     subscriptionButton.onclick = showSubscriptionSettings;
    
//     // הוסף כאיבר ראשון בתפריט
//     settingsMenu.insertBefore(subscriptionButton, settingsMenu.firstChild);
//   }
// }

// // ========================================
// // 🔟 CSS לוידג'ט האחסון
// // ========================================

// const storageWidgetStyles = `
// <style>
// .storage-widget {
//   background: var(--bg-card);
//   border-radius: var(--radius-md);
//   padding: 1rem;
//   margin: 1rem;
//   box-shadow: var(--shadow-card);
//   cursor: pointer;
//   transition: transform 0.2s, box-shadow 0.2s;
//   border: 2px solid var(--border-soft);
// }

// .storage-widget:hover {
//   transform: translateY(-2px);
//   box-shadow: var(--shadow-btn);
// }

// .storage-widget-header {
//   display: flex;
//   align-items: center;
//   gap: 0.5rem;
//   margin-bottom: 0.75rem;
// }

// .storage-icon {
//   font-size: 1.25rem;
// }

// .storage-title {
//   font-weight: 600;
//   color: var(--text-mid);
// }

// .storage-widget-bar {
//   width: 100%;
//   height: 8px;
//   background: var(--border-soft);
//   border-radius: 4px;
//   overflow: hidden;
//   margin-bottom: 0.5rem;
// }

// .storage-widget-fill {
//   height: 100%;
//   background: linear-gradient(90deg, #10b981 0%, #059669 100%);
//   transition: width 0.3s ease;
// }

// .storage-widget-text {
//   font-size: 0.85rem;
//   color: var(--text-dark);
//   margin-bottom: 0.25rem;
// }

// .storage-widget-plan {
//   font-size: 0.75rem;
//   color: var(--accent-soft);
//   font-weight: 500;
// }

// .theme-dark .storage-widget {
//   background: #121816;
//   border-color: rgba(82, 152, 115, 0.3);
// }

// .theme-dark .storage-widget-bar {
//   background: rgba(82, 152, 115, 0.2);
// }
// </style>
// `;

// // הוסף סטיילים
// if (!document.getElementById('storage-widget-styles')) {
//   const styleElement = document.createElement('div');
//   styleElement.id = 'storage-widget-styles';
//   styleElement.innerHTML = storageWidgetStyles;
//   document.head.appendChild(styleElement);
// }

// // ========================================
// // 📢 ייצוא פונקציות
// // ========================================

// export {
//   initializeSubscriptionSystem,
//   showSubscriptionSettings,
//   updateStorageWidget,
//   createStorageWidget,
//   addSubscriptionToSettingsMenu
// };
