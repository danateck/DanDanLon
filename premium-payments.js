// ========================================
// 💳 מערכת בחירת מנוי + PayPal + עדכון מנוי
// ========================================

console.log('💳 טוען מערכת תשלומים...');

// משתנה גלובלי לתוכנית שנבחרה
let selectedPlan = null;

// מחירי התוכניות (בשקלים)
const PLAN_PRICES = {
  free: 0,
  standard: 9,
  advanced: 39,
  pro: 59,
  premium: 99,
  premium_plus: 99
};

// מחירים ב-USD (עבור PayPal)
const PLAN_PRICES_USD = {
  free: 0,
  standard: 9,
  advanced: 39,
  pro: 59,
  premium: 99,
  premium_plus: 99
};

// שמות התוכניות בעברית
const PLAN_NAMES_HE = {
  free: 'חינם',
  standard: 'רגיל',
  advanced: 'מתקדם',
  pro: 'מקצועי',
  premium: 'פרימיום',
  premium_plus: 'פרימיום+'
};

// ========================================
// אתחול כפתורי בחירת תוכנית
// ========================================
function initPlanSelection() {
  console.log('🎯 מאתחל כפתורי בחירת תוכנית...');
  
  // מצא את כל הכפתורים עם data-select-plan
  const planButtons = document.querySelectorAll('[data-select-plan]');
  
  planButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const planId = btn.getAttribute('data-select-plan');
      
      console.log('📋 נבחרה תוכנית:', planId);
      selectedPlan = planId;
      
      // סמן את התוכנית שנבחרה
      document.querySelectorAll('.plan').forEach(p => p.classList.remove('selected'));
      const planCard = btn.closest('.plan');
      if (planCard) planCard.classList.add('selected');
      
      // הצג את כפתור PayPal
      await renderPayPalButton(planId);
    });
  });
  
  console.log('✅ כפתורי בחירה מוכנים:', planButtons.length);
}

// ========================================
// רינדור כפתור PayPal
// ========================================
// ========================================
// רינדור כפתור PayPal (כולל לוגיקת פרימיום+)
// ========================================
async function renderPayPalButton(planId) {
  // 🔧 צור container מחוץ לפאנל (או מצא אותו אם קיים)
  let container = document.getElementById('paypalButtonsContainer');
  
  if (!container) {
    // אם אין, צור אותו בסוף הדף
    container = document.createElement('div');
    container.id = 'paypalButtonsContainer';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10001;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 90%;
    `;
    document.body.appendChild(container);
    console.log('✅ יצרתי container חדש מחוץ לפאנל');
  }

  // בדוק אם PayPal זמין
  if (typeof paypal === 'undefined') {
    console.error('❌ PayPal SDK לא נטען');
    container.innerHTML = `
      <div style="text-align: center;">
        <p style="color: red; font-size: 1.2rem; margin-bottom: 1rem;">⚠️ שגיאה בטעינת מערכת תשלומים</p>
        <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">אנא נסי לרענן את הדף</p>
        <button onclick="this.parentElement.parentElement.remove()" style="padding: 0.5rem 1rem; cursor: pointer;">סגור</button>
      </div>
    `;
    return;
  }

  const planName = PLAN_NAMES_HE[planId];

  // ⭐️ מקרה מיוחד: פרימיום+
  if (planId === 'premium_plus') {
    const basePrice = PLAN_PRICES['premium_plus'];      // 99
    const pricePerGB = 1.5;                             // ₪1.5 לכל GB נוסף

    // UI לבחירת כמות GB
    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 1rem; position: relative;">
        <button onclick="document.getElementById('paypalButtonsContainer')?.remove()" 
                style="position: absolute; top: 0.25rem; right: 0.5rem; background: none; border: none; 
                       font-size: 1.5rem; cursor: pointer; color: #666;">✖</button>

        <h3 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">פרימיום+ – הרחבת אחסון</h3>
        <p style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #444;">
          יש לך כבר פרימיום (50GB). כאן אפשר לקנות <strong>אחסון נוסף</strong> מעל זה.
        </p>
      </div>

      <div style="margin-bottom: 1rem; text-align:right; direction:rtl;">
        <label for="pp_extra_gb" style="display:block; margin-bottom:0.25rem; font-size:0.9rem;">
          כמה GB נוספים תרצה לקנות?
        </label>
        <input id="pp_extra_gb" type="number" min="1" step="1" value="10"
               style="width:100%; padding:0.5rem 0.75rem; font-size:1rem;
                      border-radius:8px; border:1px solid #ccc; text-align:left;">
        <small style="display:block; margin-top:0.25rem; color:#555;">
          מחיר: ₪${basePrice} בסיס + ₪${pricePerGB.toFixed(2)} לכל 1GB נוסף
        </small>
      </div>

      <div id="pp_price_row" style="margin-bottom:1rem; font-size:1rem; font-weight:600; text-align:right; direction:rtl;">
        סה״כ לחיוב: <span id="pp_price_value"></span>
      </div>

      <div style="margin-bottom:1rem; text-align:center;">
        <button id="pp_continue_btn"
                style="padding:0.5rem 1.25rem; border-radius:9999px; border:none;
                       background:#2d6a4f; color:white; font-weight:600; cursor:pointer;">
          המשך לתשלום
        </button>
      </div>

      <div id="paypal-button-wrapper"></div>
    `;

    const extraInput = container.querySelector('#pp_extra_gb');
    const priceValueEl = container.querySelector('#pp_price_value');
    const continueBtn = container.querySelector('#pp_continue_btn');
    const wrapper = container.querySelector('#paypal-button-wrapper');

    function calcTotal() {
      let extraGB = parseInt(extraInput.value, 10);
      if (!Number.isFinite(extraGB) || extraGB < 1) extraGB = 1;
      extraInput.value = extraGB;
      const total = basePrice + extraGB * pricePerGB;
      priceValueEl.textContent = `₪${total.toFixed(2)} (כולל ${extraGB}GB נוספים)`;
      return { extraGB, total };
    }

    // חישוב ראשון
    calcTotal();

    extraInput.addEventListener('input', () => {
      calcTotal();
      // כשמשנים GB אחרי שכבר נוצר כפתור – פשוט ננקה, שיכינו חדש בלחיצה
      wrapper.innerHTML = '';
    });

    continueBtn.addEventListener('click', async () => {
      const { extraGB, total } = calcTotal();

      if (extraGB < 1) {
        alert('הכניסי לפחות 1GB נוסף 🙂');
        return;
      }

      wrapper.innerHTML = '';

      try {
        const buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
          },

          // יצירת הזמנה
          createOrder: function(data, actions) {
            console.log('🛒 יוצר הזמנה ב-PayPal (פרימיום+)...');
            return actions.order.create({
              purchase_units: [{
                description: `NestyFile - ${planName} + ${extraGB}GB נוספים`,
                amount: {
                  currency_code: 'ILS',
                  value: total.toFixed(2)
                }
              }]
            });
          },

          // אישור תשלום
          onApprove: async function(data, actions) {
            console.log('✅ תשלום אושר (פרימיום+)!');

            try {
              const order = await actions.order.capture();
              console.log('📦 פרטי הזמנה:', order);

              // עדכן את המנוי במערכת + שמירת ה-GB הנוספים
              await activateSubscription(planId, order, {
                extraGB,
                totalPriceILS: total
              });

              alert(`🎉 התשלום הצליח!\n\nהמנוי "פרימיום+" הופעל עם ${extraGB}GB נוספים.\n\nמזל טוב! 🎊`);

              document.getElementById('paypalButtonsContainer')?.remove();
              document.getElementById('premiumPanel')?.classList.add('hidden');

              setTimeout(() => {
                window.location.reload();
              }, 1000);

            } catch (error) {
              console.error('❌ שגיאה בעיבוד התשלום (פרימיום+):', error);
              alert('⚠️ התשלום עבר אך היתה בעיה בהפעלת המנוי. אנא פני לתמיכה.');
            }
          },

          onCancel: function(data) {
            console.log('🚫 התשלום בוטל על ידי המשתמש');
            alert('התשלום בוטל. אפשר לנסות שוב מתי שתרצי.');
          },

          onError: function(err) {
            console.error('❌ שגיאה ב-PayPal:', err);
            alert('⚠️ אירעה שגיאה במערכת התשלומים. אנא נסי שוב או פני לתמיכה.');
          }
        });

        await buttons.render('#paypal-button-wrapper');
        console.log('✅ כפתור PayPal (פרימיום+) רונדר בהצלחה');

      } catch (error) {
        console.error('❌ שגיאה ביצירת כפתור PayPal (פרימיום+):', error);
        wrapper.innerHTML = `
          <div style="text-align: center; padding: 1rem;">
            <p style="color: red;">⚠️ שגיאה בהכנת כפתור התשלום</p>
          </div>
        `;
      }
    });

    return; // ❗ סיימנו את המקרה של פרימיום+
  }

  // 🔹 כל שאר התוכניות – כמו שהיה קודם
  const price = PLAN_PRICES_USD[planId];
  console.log(`💰 מכין כפתור PayPal עבור ${planName} - ₪${price}`);

  // נקה כפתורים קודמים
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 1rem;">
      <h3 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">תשלום עבור ${planName}</h3>
      <p style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #2d6a4f;">₪${price}</p>
      <button onclick="document.getElementById('paypalButtonsContainer').remove()" 
              style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; 
                     font-size: 1.5rem; cursor: pointer; color: #666;">✖</button>
    </div>
    <div id="paypal-button-wrapper"></div>
  `;

  try {
    const buttons = paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: function(data, actions) {
        console.log('🛒 יוצר הזמנה ב-PayPal...');
        return actions.order.create({
          purchase_units: [{
            description: `NestyFile - ${planName}`,
            amount: {
              currency_code: 'ILS',
              value: price.toFixed(2)
            }
          }]
        });
      },
      onApprove: async function(data, actions) {
        console.log('✅ תשלום אושר!');
        try {
          const order = await actions.order.capture();
          console.log('📦 פרטי הזמנה:', order);

          await activateSubscription(planId, order);

          alert(`🎉 התשלום הצליח!\n\nהמנוי "${planName}" הופעל בהצלחה.\n\nמזל טוב! 🎊`);

          document.getElementById('paypalButtonsContainer')?.remove();
          document.getElementById('premiumPanel')?.classList.add('hidden');

          setTimeout(() => {
            window.location.reload();
          }, 1000);

        } catch (error) {
          console.error('❌ שגיאה בעיבוד התשלום:', error);
          alert('⚠️ התשלום עבר אך היתה בעיה בהפעלת המנוי. אנא פני לתמיכה.');
        }
      },
      onCancel: function(data) {
        console.log('🚫 התשלום בוטל על ידי המשתמש');
        alert('התשלום בוטל. את יכולה לנסות שוב מתי שתרצי.');
      },
      onError: function(err) {
        console.error('❌ שגיאה ב-PayPal:', err);
        alert('⚠️ אירעה שגיאה במערכת התשלומים. אנא נסי שוב או פני לתמיכה.');
      }
    });

    await buttons.render('#paypal-button-wrapper');
    console.log('✅ כפתור PayPal רונדר בהצלחה');

  } catch (error) {
    console.error('❌ שגיאה ביצירת כפתור PayPal:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <p style="color: red;">⚠️ שגיאה בהכנת כפתור התשלום</p>
      </div>
    `;
  }
}


// ========================================
// הפעלת מנוי במערכת (תומך בפרימיום+ עם GB נוספים)
// ========================================
async function activateSubscription(planId, paypalOrder, options = {}) {
  console.log(`🔄 מפעיל מנוי: ${planId}`);

  const extraGB = options.extraGB || 0;
  const totalPriceILS = options.totalPriceILS || null;

  try {
    if (!window.subscriptionManager) {
      console.error('❌ subscriptionManager לא זמין');
      throw new Error('מערכת מנויים לא אותחלה');
    }

    // שדרג את המנוי
    await window.subscriptionManager.upgradePlan(planId, true);

    // אם זה פרימיום+ – נשמור גם כמה GB נוספים נרכשו
    if (planId === 'premium_plus') {
      try {
        const mgr = window.subscriptionManager;
        if (mgr.userSubscription) {
          mgr.userSubscription.extraStorageGB = extraGB;
          await mgr.saveSubscription?.();
          console.log(`💾 נשמרו ${extraGB}GB נוספים במנוי Premium+`);
        }
      } catch (e) {
        console.warn('⚠️ לא הצלחתי לעדכן extraStorageGB במנוי:', e);
      }
    }

    console.log('✅ המנוי עודכן בהצלחה');

    // שליחה לשרת (אם תרצי לרשום תשלומים)
    try {
      const user = window.auth.currentUser;
      if (user) {
        await fetch('https://your-backend.com/api/payment-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userEmail: user.email,
            planId: planId,
            paypalOrderId: paypalOrder.id,
            amount: paypalOrder.purchase_units[0].amount.value,
            extraGB,
            totalPriceILS,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.warn('⚠️ לא ניתן לשלוח לשרת:', error);
    }

    return true;

  } catch (error) {
    console.error('❌ שגיאה בהפעלת מנוי:', error);
    throw error;
  }
}


// ========================================
// פונקציה לבדיקת מנוי נוכחי והצגת כפתור מתאים
// ========================================
function updateCurrentPlanUI() {
  if (!window.subscriptionManager) return;
  
  const currentPlan = window.subscriptionManager.getCurrentPlan();
  console.log('📊 מנוי נוכחי:', currentPlan.nameHe);
  
  // מצא את כל הכפתורים
  document.querySelectorAll('[data-select-plan]').forEach(btn => {
    const planId = btn.getAttribute('data-select-plan');
    
    if (planId === currentPlan.id) {
      // זה המנוי הנוכחי
      btn.disabled = true;
      btn.textContent = 'התוכנית הנוכחית ✓';
      btn.classList.add('btn-ghost');
      btn.classList.remove('btn-primary', 'btn-accent', 'btn-pro', 'btn-premium', 'btn-premium-plus');
    } else {
      // תוכנית אחרת - הפוך ללחיץ
      btn.disabled = false;
    }
  });
}

// ========================================
// CSS נוסף לכרטיס נבחר
// ========================================
const styles = document.createElement('style');
styles.textContent = `
  .plan.selected {
    border-color: #52997350 !important;
    box-shadow: 0 0 0 3px rgba(82, 152, 115, 0.2) !important;
    transform: scale(1.02);
  }
  
  .theme-dark .plan.selected {
    border-color: rgba(82, 152, 115, 0.6) !important;
    box-shadow: 0 0 0 3px rgba(82, 152, 115, 0.3) !important;
  }
`;
document.head.appendChild(styles);

// ========================================
// אתחול אוטומטי
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initPlanSelection();
      updateCurrentPlanUI();
    }, 500);
  });
} else {
  setTimeout(() => {
    initPlanSelection();
    updateCurrentPlanUI();
  }, 500);
}

// עדכן UI כאשר המנוי משתנה
window.addEventListener('subscription-updated', () => {
  updateCurrentPlanUI();
});

// חשוף גלובלית
window.initPlanSelection = initPlanSelection;
window.renderPayPalButton = renderPayPalButton;
window.activateSubscription = activateSubscription;

console.log('✅ מערכת תשלומים הופעלה בהצלחה');