// ========================================
// 🎨 ממשק משתמש לניהול מנויים
// ========================================

import { SUBSCRIPTION_PLANS } from './subscription-manager.js';

// יצירת עמוד הגדרות מנוי
export function createSubscriptionSettingsPage(subscriptionManager) {
  const info = subscriptionManager.getSubscriptionInfo();
  const plan = info.plan;
  const isActive = info.status === 'active';
  const isCancelled = info.status === 'cancelled';
  const isFree = plan.id === 'free';

  let html = `
    <div class="settings-section subscription-settings">
      <h2 class="settings-title">
        <span class="settings-icon">💎</span>
        המנוי שלי
      </h2>

      <!-- כרטיס המנוי הנוכחי -->
      <div class="current-plan-card ${plan.id}-plan">
        <div class="plan-header">
          <div class="plan-name-section">
            <h3 class="plan-name">${plan.nameHe}</h3>
            ${!isFree ? `<span class="plan-price">₪${plan.price}/חודש</span>` : '<span class="plan-price">חינם לתמיד</span>'}
          </div>
          <div class="plan-status-badge ${isActive ? 'active' : isCancelled ? 'cancelled' : 'expired'}">
            ${isActive ? '✓ פעיל' : isCancelled ? '⚠️ בוטל' : '✗ פג תוקף'}
          </div>
        </div>

        <!-- סטטוס מנוי -->
        ${renderSubscriptionStatus(info)}

        <!-- שימוש באחסון -->
        <div class="usage-section">
          <h4>שימוש באחסון</h4>
          <div class="storage-bar-container">
            <div class="storage-bar">
              <div class="storage-bar-fill" style="width: ${info.storage.percentage}%"></div>
            </div>
            <div class="storage-text">
              ${info.storage.formatted.used} / ${info.storage.formatted.limit}
              <span class="storage-percentage">(${info.storage.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        <!-- מספר מסמכים -->
        <div class="usage-section">
          <h4>מספר מסמכים</h4>
          <div class="documents-count">
            ${info.documents.count} / ${info.documents.limit === Infinity ? '∞' : info.documents.limit}
          </div>
        </div>

        <!-- תכונות המנוי -->
        <div class="plan-features">
          <h4>תכונות המנוי</h4>
          <ul class="features-list">
            ${plan.features.map(feature => `
              <li class="feature-item">
                <span class="feature-icon">✓</span>
                ${feature}
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- כפתורי פעולה -->
        <div class="plan-actions">
          ${renderPlanActions(plan, isActive, isCancelled)}
        </div>
      </div>

      <!-- תוכניות זמינות -->
      ${!isFree ? renderAvailablePlans(plan.id) : renderUpgradeOptions()}
    </div>
  `;

  return html;
}

// רינדור סטטוס המנוי
function renderSubscriptionStatus(info) {
  const { status, dates } = info;

  if (status === 'active' && dates.end) {
    const endDate = new Date(dates.end);
    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    
    return `
      <div class="subscription-status active">
        <p>
          <strong>המנוי פעיל עד:</strong> ${endDate.toLocaleDateString('he-IL')}
          <span class="days-left">(${daysLeft} ימים נותרו)</span>
        </p>
      </div>
    `;
  }

  if (status === 'cancelled' && dates.graceEnd) {
    const graceEnd = new Date(dates.graceEnd);
    const daysLeft = Math.ceil((graceEnd - new Date()) / (1000 * 60 * 60 * 24));
    
    return `
      <div class="subscription-status cancelled">
        <p>
          <strong>⚠️ המנוי בוטל</strong><br>
          תוכל להמשיך להשתמש עד: ${graceEnd.toLocaleDateString('he-IL')}
          <span class="days-left">(${daysLeft} ימים נותרים)</span><br>
          <small>לאחר מכן, הקבצים העודפים ימחקו אוטומטית והמנוי יעבור לחינמי</small>
        </p>
      </div>
    `;
  }

  if (info.plan.id === 'free') {
    return `
      <div class="subscription-status free">
        <p>
          <strong>מנוי חינמי לתמיד</strong><br>
          <small>שדרג לקבלת יותר אחסון ותכונות מתקדמות</small>
        </p>
      </div>
    `;
  }

  return '';
}

// רינדור כפתורי פעולה
function renderPlanActions(plan, isActive, isCancelled) {
  if (plan.id === 'free') {
    return `
      <button class="btn-upgrade" onclick="window.showUpgradePlans()">
        שדרג מנוי
      </button>
    `;
  }

  if (isCancelled) {
    return `
      <button class="btn-reactivate" onclick="window.reactivateSubscription()">
        הפעל מחדש את המנוי
      </button>
      <p class="cancel-note">המנוי לא יחודש אוטומטית</p>
    `;
  }

  if (isActive) {
    return `
      <button class="btn-cancel" onclick="window.cancelSubscriptionDialog()">
        ביטול מנוי
      </button>
      <p class="cancel-note">תוכל להמשיך להשתמש עד סוף התקופה ששולמה</p>
    `;
  }

  return '';
}

// רינדור תוכניות שדרוג
function renderUpgradeOptions() {
  const plans = [
    SUBSCRIPTION_PLANS.STANDARD,
    SUBSCRIPTION_PLANS.ADVANCED,
    SUBSCRIPTION_PLANS.PRO,
    SUBSCRIPTION_PLANS.PREMIUM
  ];

  return `
    <div class="upgrade-plans-section">
      <h3>שדרג את המנוי שלך</h3>
      <div class="plans-grid">
        ${plans.map(plan => `
          <div class="plan-card ${plan.id}">
            <div class="plan-card-header">
              <h4>${plan.nameHe}</h4>
              <div class="plan-card-price">
                ₪${plan.price}
                <span class="price-period">/חודש</span>
              </div>
            </div>
            <div class="plan-card-features">
              ${plan.features.slice(0, 4).map(f => `
                <div class="plan-feature-item">✓ ${f}</div>
              `).join('')}
              ${plan.features.length > 4 ? `<div class="more-features">+${plan.features.length - 4} עוד...</div>` : ''}
            </div>
            <button class="btn-select-plan" onclick="window.selectPlan('${plan.id}')">
              בחר תוכנית
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// רינדור תוכניות זמינות (למי שכבר משלם)
function renderAvailablePlans(currentPlanId) {
  const allPlans = Object.values(SUBSCRIPTION_PLANS).filter(p => p.id !== 'free' && p.id !== 'premium_plus');
  
  return `
    <div class="all-plans-section">
      <h3>תוכניות אחרות</h3>
      <div class="plans-comparison">
        ${allPlans.map(plan => `
          <div class="comparison-plan ${plan.id === currentPlanId ? 'current' : ''}">
            <div class="comparison-header">
              <h4>${plan.nameHe}</h4>
              <div class="comparison-price">₪${plan.price}/חודש</div>
              ${plan.id === currentPlanId ? '<span class="current-badge">המנוי שלך</span>' : ''}
            </div>
            <div class="comparison-storage">
              ${plan.storage === Infinity ? 'ללא הגבלה' : (plan.storage / (1024*1024*1024)) + 'GB'}
            </div>
            <div class="comparison-docs">
              ${plan.maxDocuments === Infinity ? 'מסמכים ללא הגבלה' : 'עד ' + plan.maxDocuments.toLocaleString('he-IL') + ' מסמכים'}
            </div>
            ${plan.id !== currentPlanId ? `
              <button class="btn-change-plan" onclick="window.selectPlan('${plan.id}')">
                ${plan.price > SUBSCRIPTION_PLANS[currentPlanId.toUpperCase()].price ? 'שדרג' : 'שנה'} לתוכנית זו
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// דיאלוג אישור ביטול מנוי
export function showCancelDialog(subscriptionManager) {
  const info = subscriptionManager.getSubscriptionInfo();
  const endDate = new Date(info.dates.end);
  
  return `
    <div class="cancel-dialog">
      <h3>⚠️ האם אתה בטוח שברצונך לבטל את המנוי?</h3>
      <div class="cancel-info">
        <p>אם תבטל עכשיו:</p>
        <ul>
          <li>✓ המנוי ימשיך לעבוד עד <strong>${endDate.toLocaleDateString('he-IL')}</strong></li>
          <li>✓ לא תחויב בחודש הבא</li>
          <li>⚠️ לאחר התאריך, תהיה לך תקופת חסד של 20 ימים</li>
          <li>⚠️ בתום תקופת החסד, קבצים עודפים ימחקו אוטומטית</li>
        </ul>
        <p class="warning-text">
          קבצים ימחקו מהישן לחדש עד שתגיע למגבלת החינמי (200MB / 200 מסמכים)
        </p>
      </div>
      <div class="cancel-actions">
        <button class="btn-confirm-cancel" onclick="window.confirmCancelSubscription()">
          כן, בטל מנוי
        </button>
        <button class="btn-keep-subscription" onclick="window.closeDialog()">
          לא, שמור מנוי
        </button>
      </div>
    </div>
  `;
}

// הוספת סטיילים
export const subscriptionStyles = `
<style>
/* ========================================
   סטיילים למערכת המנויים
   ======================================== */

.subscription-settings {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  margin-bottom: 2rem;
  color: var(--text-mid);
}

.settings-icon {
  font-size: 2rem;
}

/* כרטיס המנוי הנוכחי */
.current-plan-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-card);
  border: 2px solid var(--border-soft);
  margin-bottom: 2rem;
}

.current-plan-card.free-plan {
  border-color: #94a3b8;
}

.current-plan-card.standard-plan {
  border-color: #60a5fa;
}

.current-plan-card.advanced-plan {
  border-color: #a78bfa;
}

.current-plan-card.pro-plan {
  border-color: #f59e0b;
}

.current-plan-card.premium-plan {
  border-color: #ec4899;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(236, 72, 153, 0.05) 100%);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-soft);
}

.plan-name-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plan-name {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-mid);
  margin: 0;
}

.plan-price {
  font-size: 1.25rem;
  color: var(--accent-strong);
  font-weight: 500;
}

.plan-status-badge {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
}

.plan-status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.plan-status-badge.cancelled {
  background: #fed7aa;
  color: #92400e;
}

.plan-status-badge.expired {
  background: #fecaca;
  color: #991b1b;
}

/* סטטוס מנוי */
.subscription-status {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
}

.subscription-status.active {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}

.subscription-status.cancelled {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #92400e;
}

.subscription-status.free {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.days-left {
  font-weight: 600;
  color: var(--accent-strong);
}

/* שימוש באחסון */
.usage-section {
  margin-bottom: 1.5rem;
}

.usage-section h4 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: var(--text-mid);
}

.storage-bar-container {
  width: 100%;
}

.storage-bar {
  width: 100%;
  height: 24px;
  background: var(--border-soft);
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
}

.storage-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.3s ease;
}

.storage-text {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-dark);
  display: flex;
  justify-content: space-between;
}

.storage-percentage {
  font-weight: 600;
  color: var(--accent-strong);
}

.documents-count {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-strong);
}

/* תכונות */
.plan-features {
  margin-bottom: 1.5rem;
}

.plan-features h4 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  color: var(--text-mid);
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-app);
  border-radius: var(--radius-sm);
}

.feature-icon {
  color: #10b981;
  font-weight: bold;
}

/* כפתורי פעולה */
.plan-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-soft);
}

.btn-upgrade,
.btn-reactivate {
  padding: 0.75rem 1.5rem;
  background: var(--grad-btn);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow-btn);
}

.btn-upgrade:hover,
.btn-reactivate:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #dc2626;
  border: 2px solid #fecaca;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

.cancel-note {
  font-size: 0.85rem;
  color: var(--text-dark);
  margin: 0;
  text-align: center;
}

/* תוכניות שדרוג */
.upgrade-plans-section {
  margin-top: 3rem;
}

.upgrade-plans-section h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-mid);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
  border: 2px solid var(--border-soft);
  transition: transform 0.2s, box-shadow 0.2s;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
}

.plan-card.standard {
  border-color: #60a5fa;
}

.plan-card.advanced {
  border-color: #a78bfa;
}

.plan-card.pro {
  border-color: #f59e0b;
}

.plan-card.premium {
  border-color: #ec4899;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(236, 72, 153, 0.05) 100%);
}

.plan-card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-soft);
}

.plan-card-header h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: var(--text-mid);
}

.plan-card-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-strong);
}

.price-period {
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--text-dark);
}

.plan-card-features {
  margin-bottom: 1.5rem;
}

.plan-feature-item {
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.more-features {
  padding: 0.5rem 0;
  font-size: 0.85rem;
  color: var(--accent-soft);
  font-style: italic;
}

.btn-select-plan {
  width: 100%;
  padding: 0.75rem;
  background: var(--grad-btn);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-select-plan:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-btn);
}

/* דיאלוג ביטול */
.cancel-dialog {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-lg);
  max-width: 600px;
  margin: 2rem auto;
}

.cancel-dialog h3 {
  color: #dc2626;
  margin-bottom: 1.5rem;
}

.cancel-info {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.cancel-info ul {
  margin: 1rem 0;
  padding-right: 1.5rem;
}

.cancel-info li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.warning-text {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: var(--radius-sm);
  padding: 0.75rem;
  margin-top: 1rem;
  font-weight: 600;
  color: #92400e;
}

.cancel-actions {
  display: flex;
  gap: 1rem;
}

.btn-confirm-cancel {
  flex: 1;
  padding: 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}

.btn-keep-subscription {
  flex: 1;
  padding: 0.75rem;
  background: var(--grad-btn);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
  .subscription-settings {
    padding: 1rem;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .plan-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

/* Dark Mode Support */
.theme-dark .current-plan-card,
.theme-dark .plan-card {
  background: #121816;
  border-color: rgba(82, 152, 115, 0.3);
}

.theme-dark .subscription-status.active {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.theme-dark .subscription-status.cancelled {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fcd34d;
}

.theme-dark .storage-bar {
  background: rgba(82, 152, 115, 0.2);
}

.theme-dark .feature-item {
  background: #0a0f0d;
}
</style>
`;
