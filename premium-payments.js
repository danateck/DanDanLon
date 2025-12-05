// ========================================
// 💳 מערכת תשלומים - עם Premium+ חד-פעמי
// ========================================

console.log('💳 טוען מערכת תשלומים...');

let selectedPlan = null;

// מחירי התוכניות (בשקלים)
const PLAN_PRICES = {
  free: 0,
  standard: 9,
  advanced: 35,
  pro: 59,
  premium: 99,
  premium_plus: 1.5 // מחיר ל-GB (לא מנוי חודשי!)
};

// מחירים ב-USD (עבור PayPal)
const PLAN_PRICES_USD = {
  free: 0,
  standard: 9,
  advanced: 35,
  pro: 59,
  premium: 99,
  premium_plus: 1.5 // מחיר ל-GB (לא מנוי חודשי!)
};

// PayPal Plan IDs למנויים חודשיים
const PAYPAL_PLAN_IDS = {
  standard: 'P-12703733LC5205622NEZPLPA',
  advanced: 'P-4T671886AR091433TNEZPWMI',
  pro: 'P-0UH3658873191311TNEZPX2Y',
  premium: 'P-2U729221CK555173MNEZPY4I'
};

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
  
  const planButtons = document.querySelectorAll('[data-select-plan]');
  
  planButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const planId = btn.dataset.selectPlan;

      // 🔒 בדיקת שנמוך (downgrade)
      if (window.subscriptionManager) {
        try {
          const info = window.subscriptionManager.getSubscriptionInfo();
          const currentPlan = info.plan;
          const currentPlanId = currentPlan.id;
          const currentPrice = currentPlan.price || 0;
          const targetPlan = window.SUBSCRIPTION_PLANS[planId.toUpperCase()];
          const targetPrice = targetPlan ? targetPlan.price || 0 : 0;

          const isDowngrade = targetPrice < currentPrice;

          if (
            isDowngrade &&
            currentPlanId !== "free" &&
            info.dates &&
            info.dates.end
          ) {
            const endDate = new Date(info.dates.end);
            const now = new Date();

            if (endDate > now) {
              alert(
                "⏳ אי אפשר לשנמך תוכנית לפני סוף התקופה ששולמה.\n" +
                "תוכלי לעבור לתוכנית זולה יותר רק בתאריך: " +
                endDate.toLocaleDateString("he-IL")
              );
              return;
            }
          }
        } catch (e) {
          console.warn("⚠️ לא הצלחתי לבדוק שנמוך:", e);
        }
      }

      selectedPlan = planId;
      
      // Premium+ = תשלום חד-פעמי, שאר התוכניות = מנוי חודשי
      if (planId === 'premium_plus') {
        renderPremiumPlusPayment();
      } else {
        renderPayPalSubscriptionButton(planId);
      }
    });
  });
  
  console.log('✅ כפתורי בחירה מוכנים:', planButtons.length);
}

// ========================================
// רינדור תשלום Premium+ (חד-פעמי)
// ========================================
function renderPremiumPlusPayment() {
  // בדוק שיש מנוי פרימיום
  if (!window.subscriptionManager) {
    alert('מערכת מנויים לא זמינה');
    return;
  }
  
  const currentPlan = window.subscriptionManager.getCurrentPlan();
  
  if (currentPlan.id !== 'premium' && currentPlan.id !== 'premium_plus') {
    alert('⚠️ פרימיום+ זמין רק למשתמשים עם מנוי פרימיום פעיל\n\nקודם קני מנוי פרימיום (₪99/חודש)');
    
    // פתח את כרטיס הפרימיום
    setTimeout(() => {
      const premiumCard = document.querySelector('[data-plan="premium"]');
      if (premiumCard) {
        premiumCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    return;
  }
  
  // צור container
  let container = document.getElementById('paypalButtonsContainer');
  
  if (!container) {
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
  }
  
  // בדוק אם PayPal זמין
  if (typeof paypal === 'undefined') {
    container.innerHTML = `
      <div style="text-align: center;">
        <p style="color: red; font-size: 1.2rem; margin-bottom: 1rem;">⚠️ שגיאה בטעינת מערכת תשלומים</p>
        <button onclick="this.parentElement.parentElement.remove()" style="padding: 0.5rem 1rem; cursor: pointer;">סגור</button>
      </div>
    `;
    return;
  }
  
  const info = window.subscriptionManager.getSubscriptionInfo();
  const currentExtraGB = info.storage.extra.gb;
  const currentTotalGB = 50 + currentExtraGB;
  
  // UI לבחירת GB
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 1rem; position: relative;">
      <button onclick="document.getElementById('paypalButtonsContainer')?.remove()" 
              style="position: absolute; top: 0; right: 0; background: none; border: none; 
                     font-size: 1.5rem; cursor: pointer; color: #666;">✖</button>
      
      <h3 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">🚀 הרחבת אחסון</h3>
      <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #666;">
        יש לך כרגע <strong>${currentTotalGB}GB</strong> אחסון
      </p>
      <p style="margin: 0; font-size: 0.85rem; color: #888;">
        (50GB בסיסי + ${currentExtraGB}GB שקנית)
      </p>
    </div>
    
    <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: right; direction: rtl;">
      <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; color: #0369a1; font-weight: 600;">
        💡 איך זה עובד?
      </p>
      <ul style="margin: 0; padding-right: 1.25rem; font-size: 0.85rem; color: #0c4a6e;">
        <li>קונים GB נוספים <strong>פעם אחת</strong></li>
        <li>התשלום <strong>חד-פעמי</strong> (לא חודשי)</li>
        <li>האחסון נוסף לתמיד</li>
        <li>המנוי החודשי נשאר ₪99</li>
      </ul>
    </div>
    
    <div style="margin-bottom: 1rem; text-align: right; direction: rtl;">
      <label for="extra_gb_input" style="display: block; margin-bottom: 0.5rem; font-size: 0.95rem; font-weight: 600;">
        כמה GB נוספים לקנות?
      </label>
      <input id="extra_gb_input" type="number" min="1" max="1000" step="1" value="10"
             style="width: 100%; padding: 0.75rem; font-size: 1rem; border: 2px solid #e5e7eb;
                    border-radius: 8px; text-align: center; font-weight: 600;">
      <small style="display: block; margin-top: 0.5rem; color: #6b7280; text-align: center;">
        מחיר: ₪${PLAN_PRICES.premium_plus} לכל 1GB
      </small>
    </div>
    
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                padding: 1rem; border-radius: 8px; margin-bottom: 1rem; color: white; text-align: center;">
      <div style="font-size: 0.85rem; margin-bottom: 0.25rem;">סה"כ לתשלום:</div>
      <div id="total_price_display" style="font-size: 2rem; font-weight: bold;">₪15</div>
      <div id="new_total_display" style="font-size: 0.85rem; opacity: 0.9;">סה"כ אחסון: 60GB</div>
    </div>
    
    <button id="continue_to_payment_btn" 
            style="width: 100%; padding: 1rem; background: #2d6a4f; color: white; border: none;
                   border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;
                   transition: background 0.2s;">
      המשך לתשלום
    </button>
    
    <div id="paypal_buttons_wrapper" style="margin-top: 1rem;"></div>
  `;
  
  const input = container.querySelector('#extra_gb_input');
  const totalPriceEl = container.querySelector('#total_price_display');
  const newTotalEl = container.querySelector('#new_total_display');
  const continueBtn = container.querySelector('#continue_to_payment_btn');
  const wrapper = container.querySelector('#paypal_buttons_wrapper');
  
  // חישוב מחיר
  function updatePrice() {
    let gb = parseInt(input.value, 10);
    if (!gb || gb < 1) gb = 1;
    if (gb > 1000) gb = 1000;
    input.value = gb;
    
    const price = gb * PLAN_PRICES.premium_plus;
    const newTotal = currentTotalGB + gb;
    
    totalPriceEl.textContent = `₪${price.toFixed(2)}`;
    newTotalEl.textContent = `סה"כ אחסון: ${newTotal}GB`;
    
    return { gb, price, newTotal };
  }
  
  // עדכון ראשוני
  updatePrice();
  
  // עדכון בזמן אמת
  input.addEventListener('input', () => {
    updatePrice();
    wrapper.innerHTML = ''; // נקה כפתור PayPal קודם
  });
  
  // כפתור המשך
  continueBtn.addEventListener('click', async () => {
    const { gb, price } = updatePrice();
    
    if (gb < 1) {
      alert('נא לבחור לפחות 1GB');
      return;
    }
    
    continueBtn.style.display = 'none';
    input.disabled = true;
    
    try {
      // צור כפתור PayPal לתשלום חד-פעמי
      const buttons = paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay'
        },
        
        createOrder: function(data, actions) {
          console.log(`🛒 יוצר הזמנה: ${gb}GB ב-₪${price}`);
          
          return actions.order.create({
            purchase_units: [{
              description: `NestyFile - ${gb}GB אחסון נוסף`,
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
            
            // הוסף את ה-GB למערכת
            await window.subscriptionManager.purchaseExtraStorage(gb, {
              orderId: order.id,
              paypalOrderId: data.orderID,
              amount: price
            });
            
            alert(
              `🎉 התשלום הצליח!\n\n` +
              `נוספו ${gb}GB לאחסון שלך\n` +
              `סה"כ אחסון: ${currentTotalGB + gb}GB\n\n` +
              `💡 זה תשלום חד-פעמי - המנוי החודשי שלך נשאר ₪99`
            );
            
            container?.remove();
            
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            
          } catch (error) {
            console.error('❌ שגיאה:', error);
            alert('⚠️ התשלום עבר אך היתה בעיה בהוספת האחסון. אנא פני לתמיכה.');
          }
        },
        
        onCancel: function() {
          console.log('🚫 התשלום בוטל');
          continueBtn.style.display = 'block';
          input.disabled = false;
          wrapper.innerHTML = '';
        },
        
        onError: function(err) {
          console.error('❌ שגיאה:', err);
          alert('⚠️ אירעה שגיאה במערכת התשלומים');
          continueBtn.style.display = 'block';
          input.disabled = false;
          wrapper.innerHTML = '';
        }
      });
      
      await buttons.render('#paypal_buttons_wrapper');
      console.log('✅ כפתור PayPal רונדר');
      
    } catch (error) {
      console.error('❌ שגיאה ביצירת כפתור:', error);
      alert('⚠️ שגיאה בהכנת כפתור התשלום');
      continueBtn.style.display = 'block';
      input.disabled = false;
    }
  });
  
  // Hover effect
  continueBtn.addEventListener('mouseenter', () => {
    continueBtn.style.background = '#1e5039';
  });
  continueBtn.addEventListener('mouseleave', () => {
    continueBtn.style.background = '#2d6a4f';
  });
}

// ========================================
// רינדור כפתור PayPal Subscription (מנויים חודשיים)
// ========================================
async function renderPayPalSubscriptionButton(planId) {
  let container = document.getElementById('paypalButtonsContainer');
  
  if (!container) {
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
  }

  if (typeof paypal === 'undefined') {
    console.error('❌ PayPal SDK לא נטען');
    container.innerHTML = `
      <div style="text-align: center;">
        <p style="color: red; font-size: 1.2rem; margin-bottom: 1rem;">⚠️ שגיאה בטעינת מערכת תשלומים</p>
        <button onclick="this.parentElement.parentElement.remove()" style="padding: 0.5rem 1rem; cursor: pointer;">סגור</button>
      </div>
    `;
    return;
  }

  const planName = PLAN_NAMES_HE[planId];
  const priceILS = PLAN_PRICES[planId];
  const priceUSD = PLAN_PRICES_USD[planId];
  const paypalPlanId = PAYPAL_PLAN_IDS[planId];

  if (planId === 'free') {
    alert('תוכנית החינם פעילה תמיד, אין צורך בתשלום');
    container.remove();
    return;
  }

  console.log(`💰 מכין מנוי PayPal עבור ${planName} - $${priceUSD}/חודש`);

  if (!paypalPlanId || paypalPlanId.startsWith('P-XX')) {
    container.innerHTML = `
      <div style="text-align: center;">
        <h3 style="color: #d32f2f; margin-bottom: 1rem;">⚠️ תוכנית לא מוגדרת</h3>
        <p style="font-size: 0.9rem; margin-bottom: 1rem;">
          יש להגדיר Plan ID ב-PayPal Dashboard תחילה
        </p>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="padding: 0.5rem 1rem; cursor: pointer;">סגור</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem; position: relative;">
      <button onclick="document.getElementById('paypalButtonsContainer')?.remove()" 
              style="position: absolute; top: 0; right: 0; background: none; border: none; 
                     font-size: 1.5rem; cursor: pointer; color: #666;">✖</button>
      
      <h3 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">מנוי ${planName}</h3>
      <p style="margin: 0 0 0.25rem 0; font-size: 1.75rem; font-weight: bold; color: #2d6a4f;">
        ₪${priceILS}
      </p>
      <p style="margin: 0; font-size: 0.9rem; color: #666;">
        חיוב אוטומטי כל חודש
      </p>
    </div>
    
    <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: right;">
      <p style="margin: 0; font-size: 0.85rem; color: #333; line-height: 1.6;">
        ✅ חיוב חודשי אוטומטי<br>
        ✅ ביטול בכל עת בהגדרות<br>
        ✅ התראה לפני כל חיוב
      </p>
    </div>
    
    <div id="paypal-subscription-wrapper"></div>
  `;

  try {
    const buttons = paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'subscribe'
      },
      
      createSubscription: function(data, actions) {
        console.log('🔄 יוצר מנוי ב-PayPal...');
        return actions.subscription.create({
          'plan_id': paypalPlanId
        });
      },
      
      onApprove: async function(data, actions) {
        console.log('✅ מנוי אושר!', data);
        
        try {
          const subscriptionId = data.subscriptionID;
          
          await activateSubscription(planId, {
            subscriptionId: subscriptionId,
            orderID: data.orderID
          });

          alert(`🎉 המנוי הופעל בהצלחה!\n\nמנוי: ${planName}\nמחיר: ₪${priceILS}/חודש`);

          container?.remove();
          document.getElementById('premiumPanel')?.classList.add('hidden');

          setTimeout(() => {
            window.location.reload();
          }, 1000);

        } catch (error) {
          console.error('❌ שגיאה:', error);
          alert('⚠️ המנוי אושר אך היתה בעיה. אנא פני לתמיכה.');
        }
      },
      
      onCancel: function() {
        console.log('🚫 המנוי בוטל');
        alert('המנוי בוטל. את יכולה לנסות שוב מתי שתרצי.');
      },
      
      onError: function(err) {
        console.error('❌ שגיאה:', err);
        alert('⚠️ אירעה שגיאה במערכת התשלומים');
      }
    });

    await buttons.render('#paypal-subscription-wrapper');
    console.log('✅ כפתור מנוי PayPal רונדר');

  } catch (error) {
    console.error('❌ שגיאה:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 1rem;">
        <p style="color: red;">⚠️ שגיאה בהכנת כפתור המנוי</p>
        <button onclick="document.getElementById('paypalButtonsContainer')?.remove()">סגור</button>
      </div>
    `;
  }
}

// ========================================
// הפעלת מנוי במערכת
// ========================================
async function activateSubscription(planId, paypalData) {
  console.log(`🔄 מפעיל מנוי: ${planId}`);

  try {
    if (!window.subscriptionManager) {
      throw new Error('מערכת מנויים לא אותחלה');
    }

    const subscriptionId = paypalData.subscriptionId;

    await window.subscriptionManager.upgradePlan(planId, true);

    if (window.subscriptionManager.userSubscription) {
      window.subscriptionManager.userSubscription.paypalSubscriptionId = subscriptionId;
      window.subscriptionManager.userSubscription.autoRenew = true;
      window.subscriptionManager.userSubscription.billingType = 'subscription';
      await window.subscriptionManager.saveSubscription();
    }

    console.log('✅ המנוי עודכן בהצלחה');

    return true;

  } catch (error) {
    console.error('❌ שגיאה:', error);
    throw error;
  }
}

// ========================================
// ביטול מנוי אוטומטי
// ========================================
async function cancelPayPalSubscription() {
  if (!window.subscriptionManager) return;

  try {
    const subscription = window.subscriptionManager.userSubscription;
    
    if (!subscription || !subscription.paypalSubscriptionId) {
      alert('❌ לא נמצא מנוי אוטומטי לביטול');
      return;
    }

    const confirmed = confirm(
      '⚠️ האם את בטוחה שברצונך לבטל את המנוי?\n\n' +
      '• המנוי ימשיך לעבוד עד סוף התקופה\n' +
      '• לא תחויבי בחודש הבא\n' +
      '• תוכלי להפעיל מחדש בכל עת'
    );

    if (!confirmed) return;

    await window.subscriptionManager.cancelSubscription();
    alert('✅ המנוי בוטל בהצלחה');
    window.location.reload();

  } catch (error) {
    console.error('❌ שגיאה:', error);
    alert('⚠️ שגיאה בביטול המנוי');
  }
}

// ========================================
// עדכון UI
// ========================================
function updateCurrentPlanUI() {
  if (!window.subscriptionManager) return;
  
  const info = window.subscriptionManager.getSubscriptionInfo();
  const currentPlan = info.plan;
  
  console.log('📊 מנוי נוכחי:', currentPlan.nameHe);
  
  document.querySelectorAll('[data-select-plan]').forEach(btn => {
    const planId = btn.getAttribute('data-select-plan');
    
    if (planId === currentPlan.id) {
      btn.disabled = true;
      btn.innerHTML = `
        <span style="font-size: 1.2rem;">✓</span>
        <span>תוכנית נוכחית</span>
      `;
      btn.style.opacity = '0.7';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  });
}

// ========================================
// אתחול
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

window.addEventListener('subscription-updated', () => {
  updateCurrentPlanUI();
});

window.initPlanSelection = initPlanSelection;
window.renderPayPalSubscriptionButton = renderPayPalSubscriptionButton;
window.renderPremiumPlusPayment = renderPremiumPlusPayment;
window.activateSubscription = activateSubscription;
window.cancelPayPalSubscription = cancelPayPalSubscription;
window.updateCurrentPlanUI = updateCurrentPlanUI;

console.log('✅ מערכת תשלומים הופעלה (עם Premium+ חד-פעמי)');