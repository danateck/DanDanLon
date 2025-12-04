// ═══════════════════════════════════════════════════════
// 🔄 מערכת ניהול שינוי תוכניות - NestyFile
// ═══════════════════════════════════════════════════════

// 📊 סדר תוכניות (מנמוכה לגבוהה)
const PLAN_HIERARCHY = {
  free: 0,
  standard: 1,
  advanced: 2,
  pro: 3,
  premium: 4,
  premium_plus: 5
};

// 💰 מחירי תוכניות בשקלים
const PLAN_PRICES_ILS = {
  free: 0,
  standard: 9,
  advanced: 39,
  pro: 59,
  premium: 99,
  premium_plus: 99 // בסיס + GB נוספים
};

// ═══════════════════════════════════════════════════════
// 🔍 בדיקת אפשרות שינוי תוכנית
// ═══════════════════════════════════════════════════════

/**
 * בדיקה האם ניתן לשנות תוכנית
 */
async function canChangePlan(currentPlan, newPlan) {
  // אם אין תוכנית נוכחית, אפשר לקנות כל תוכנית
  if (!currentPlan || currentPlan === 'free') {
    return {
      allowed: true,
      isUpgrade: true,
      message: 'שדרוג לתוכנית חדשה'
    };
  }
  
  const currentLevel = PLAN_HIERARCHY[currentPlan];
  const newLevel = PLAN_HIERARCHY[newPlan];
  
  // זה שדרוג
  if (newLevel > currentLevel) {
    return {
      allowed: true,
      isUpgrade: true,
      message: 'שדרוג תוכנית - יופעל מיד',
      immediateActivation: true
    };
  }
  
  // זה הורדת תוכנית
  if (newLevel < currentLevel) {
    // קבל תאריך חידוש
    const renewalDate = await getSubscriptionRenewalDate();
    const now = new Date();
    
    if (renewalDate && renewalDate > now) {
      const daysLeft = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));
      const dateStr = renewalDate.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return {
        allowed: false,
        isUpgrade: false,
        message: `לא ניתן להוריד תוכנית במהלך תקופת המנוי הנוכחית.`,
        details: `התוכנית הנוכחית שלך תסתיים ב-${dateStr} (עוד ${daysLeft} ימים).`,
        renewalDate: renewalDate,
        suggestion: 'תוכל לשנות תוכנית לאחר תום התקופה הנוכחית.'
      };
    }
    
    // אם אין תאריך חידוש, אפשר להוריד
    return {
      allowed: true,
      isUpgrade: false,
      message: 'הורדת תוכנית - תיכנס לתוקף בתאריך החידוש',
      immediateActivation: false
    };
  }
  
  // אותה תוכנית
  return {
    allowed: false,
    isUpgrade: false,
    message: 'זו התוכנית הנוכחית שלך'
  };
}

/**
 * טיפול בבחירת תוכנית
 */
async function handlePlanSelection(planId) {
  const currentUser = await getCurrentUser();
  const currentPlan = currentUser?.subscription?.plan || 'free';
  
  // בדוק אפשרות שינוי
  const changeCheck = await canChangePlan(currentPlan, planId);
  
  if (!changeCheck.allowed) {
    showPlanChangeBlockedModal(changeCheck);
    return;
  }
  
  // אם זה שדרוג - המשך לתשלום
  if (changeCheck.isUpgrade) {
    // Premium+ מטופל בנפרד
    if (planId === 'premium_plus') {
      await handlePremiumPlusUpgrade();
    } else {
      await renderPayPalButton(planId);
    }
  } else {
    // הורדה - תזמון לתאריך חידוש
    showPlanDowngradeConfirmation(planId, changeCheck);
  }
}

// ═══════════════════════════════════════════════════════
// 💎 טיפול ב-Premium+ (קניית GB נוספים)
// ═══════════════════════════════════════════════════════

/**
 * שדרוג ל-Premium+
 */
async function handlePremiumPlusUpgrade() {
  const currentUser = await getCurrentUser();
  const currentPlan = currentUser?.subscription?.plan || 'free';
  
  // רק למשתמשי Premium
  if (currentPlan !== 'premium') {
    showUpgradeModal({
      title: '💎 Premium+ זמין רק למשתמשי Premium',
      message: 'כדי לקנות GB נוספים, שדרג תחילה לתוכנית Premium.',
      action: 'שדרג ל-Premium',
      requiredPlan: 'premium'
    });
    return;
  }
  
  // פתח חלון בחירת GB
  showGBPurchaseModal();
}

/**
 * חלון בחירת GB
 */
function showGBPurchaseModal() {
  const modal = document.createElement('div');
  modal.className = 'upgrade-modal-backdrop';
  modal.innerHTML = `
    <div class="upgrade-modal" style="max-width: 600px;">
      <div class="upgrade-modal-header">
        <h2>💎 Premium+ - קניית אחסון נוסף</h2>
        <button class="upgrade-modal-close" onclick="this.closest('.upgrade-modal-backdrop').remove()">✖</button>
      </div>
      <div class="upgrade-modal-body">
        <p style="margin-bottom: 1.5rem;">כמה GB תרצה להוסיף לאחסון שלך?</p>
        
        <div style="background: #f0f9ff; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>📦 אחסון נוכחי:</span>
            <strong>50GB (Premium)</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>💰 מחיר:</span>
            <strong>₪1.5 לכל GB</strong>
          </div>
        </div>
        
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
          כמות GB להוספה:
        </label>
        <input 
          type="number" 
          id="gbAmountInput" 
          min="1" 
          max="1000" 
          value="10"
          style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; margin-bottom: 1rem;"
          oninput="updateGBPrice()"
        />
        
        <div id="gbPriceDisplay" style="background: #dcfce7; border: 2px solid #22c55e; border-radius: 8px; padding: 1rem; text-align: center;">
          <div style="font-size: 0.9rem; color: #166534; margin-bottom: 0.25rem;">סה"כ לתשלום:</div>
          <div style="font-size: 2rem; font-weight: bold; color: #15803d;">₪15</div>
          <div style="font-size: 0.85rem; color: #166534; margin-top: 0.25rem;">
            (10GB × ₪1.5)
          </div>
        </div>
        
        <div style="margin-top: 1rem; padding: 1rem; background: #fff7ed; border-radius: 8px; font-size: 0.9rem; color: #92400e;">
          💡 <strong>טיפ:</strong> ה-GB הנוספים יתווספו לתוכנית הנוכחית שלך ויחודשו אוטומטית בכל חודש.
        </div>
      </div>
      <div class="upgrade-modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.upgrade-modal-backdrop').remove()">ביטול</button>
        <button class="btn btn-primary" onclick="purchaseExtraGB()">
          💳 המשך לתשלום
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * עדכון מחיר GB בזמן אמת
 */
window.updateGBPrice = function() {
  const input = document.getElementById('gbAmountInput');
  const display = document.getElementById('gbPriceDisplay');
  
  const gb = parseInt(input.value) || 0;
  const price = gb * 1.5;
  
  display.innerHTML = `
    <div style="font-size: 0.9rem; color: #166534; margin-bottom: 0.25rem;">סה"כ לתשלום:</div>
    <div style="font-size: 2rem; font-weight: bold; color: #15803d;">₪${price.toFixed(2)}</div>
    <div style="font-size: 0.85rem; color: #166534; margin-top: 0.25rem;">
      (${gb}GB × ₪1.5)
    </div>
  `;
};

/**
 * קניית GB נוספים
 */
window.purchaseExtraGB = async function() {
  const input = document.getElementById('gbAmountInput');
  const gb = parseInt(input.value) || 0;
  
  if (gb < 1) {
    alert('נא להזין כמות GB חוקית');
    return;
  }
  
  const price = gb * 1.5;
  
  // סגור את המודל
  document.querySelector('.upgrade-modal-backdrop')?.remove();
  
  // פתח PayPal עם המחיר הדינמי
  await renderPayPalButtonForExtraGB(gb, price);
};

/**
 * רינדור כפתור PayPal ל-GB נוספים
 */
async function renderPayPalButtonForExtraGB(gb, price) {
  // יצירת container
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
  
  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 1rem;">
      <h3 style="margin: 0 0 0.5rem 0; color: #1a1a1a;">💎 Premium+ - ${gb}GB</h3>
      <p style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #2d6a4f;">₪${price.toFixed(2)}</p>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #666;">
        ${gb}GB אחסון נוסף × ₪1.5
      </p>
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
        return actions.order.create({
          purchase_units: [{
            description: `NestyFile Premium+ - ${gb}GB נוספים`,
            amount: {
              currency_code: 'ILS',
              value: price.toFixed(2)
            }
          }]
        });
      },
      
      onApprove: async function(data, actions) {
        const order = await actions.order.capture();
        
        // עדכן את המנוי
        await addExtraStorageToSubscription(gb, order);
        
        alert(`🎉 התשלום הצליח!\n\nהתווספו ${gb}GB לאחסון שלך.\n\nמזל טוב! 🎊`);
        
        document.getElementById('paypalButtonsContainer')?.remove();
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      
      onCancel: function() {
        alert('התשלום בוטל.');
      },
      
      onError: function(err) {
        console.error('❌ שגיאה ב-PayPal:', err);
        alert('⚠️ שגיאה במערכת התשלומים.');
      }
    });
    
    await buttons.render('#paypal-button-wrapper');
    
  } catch (error) {
    console.error('❌ שגיאה ביצירת כפתור PayPal:', error);
  }
}

// ═══════════════════════════════════════════════════════
// 🚫 חסימת הורדת תוכנית
// ═══════════════════════════════════════════════════════

/**
 * הצגת מסך חסימה
 */
function showPlanChangeBlockedModal(checkResult) {
  const modal = document.createElement('div');
  modal.className = 'upgrade-modal-backdrop';
  modal.innerHTML = `
    <div class="upgrade-modal">
      <div class="upgrade-modal-header">
        <h2>⏳ לא ניתן להוריד תוכנית</h2>
        <button class="upgrade-modal-close" onclick="this.closest('.upgrade-modal-backdrop').remove()">✖</button>
      </div>
      <div class="upgrade-modal-body">
        <p>${checkResult.message}</p>
        <p>${checkResult.details}</p>
        
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
          <strong>💡 טיפ:</strong> ${checkResult.suggestion}
        </div>
        
        ${checkResult.renewalDate ? `
          <div style="background: #f0f9ff; border-radius: 8px; padding: 1rem; margin-top: 1rem; text-align: center;">
            <div style="font-size: 0.9rem; color: #0369a1; margin-bottom: 0.25rem;">תאריך חידוש:</div>
            <div style="font-size: 1.3rem; font-weight: bold; color: #0c4a6e;">
              ${checkResult.renewalDate.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="upgrade-modal-footer">
        <button class="btn btn-primary" onclick="this.closest('.upgrade-modal-backdrop').remove();">
          הבנתי
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/**
 * אישור הורדת תוכנית (לעתיד)
 */
function showPlanDowngradeConfirmation(newPlan, checkResult) {
  const planName = PLAN_LIMITS[newPlan].name;
  
  const modal = document.createElement('div');
  modal.className = 'upgrade-modal-backdrop';
  modal.innerHTML = `
    <div class="upgrade-modal">
      <div class="upgrade-modal-header">
        <h2>⬇️ אישור הורדת תוכנית</h2>
        <button class="upgrade-modal-close" onclick="this.closest('.upgrade-modal-backdrop').remove()">✖</button>
      </div>
      <div class="upgrade-modal-body">
        <p>האם אתה בטוח שברצונך לעבור לתוכנית "${planName}"?</p>
        
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 1rem; margin-top: 1rem;">
          <strong>⚠️ שים לב:</strong><br>
          התוכנית החדשה תיכנס לתוקף רק בתאריך החידוש הבא.
        </div>
      </div>
      <div class="upgrade-modal-footer">
        <button class="btn btn-ghost" onclick="this.closest('.upgrade-modal-backdrop').remove()">ביטול</button>
        <button class="btn btn-primary" onclick="schedulePlanDowngrade('${newPlan}'); this.closest('.upgrade-modal-backdrop').remove();">
          אישור
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════
// 🔧 פונקציות עזר
// ═══════════════════════════════════════════════════════

/**
 * קבלת תאריך חידוש מנוי
 */
async function getSubscriptionRenewalDate() {
  const user = await getCurrentUser();
  const renewalTimestamp = user?.subscription?.renewalDate;
  
  if (renewalTimestamp) {
    return new Date(renewalTimestamp);
  }
  
  return null;
}

/**
 * הוספת GB נוספים למנוי
 */
async function addExtraStorageToSubscription(gb, paypalOrder) {
  const user = await getCurrentUser();
  
  // עדכן את המנוי
  const updatedSubscription = {
    ...user.subscription,
    plan: 'premium_plus',
    extraStorage: (user.subscription.extraStorage || 0) + (gb * 1024 * 1024 * 1024),
    extraStorageGB: (user.subscription.extraStorageGB || 0) + gb,
    lastPayment: {
      orderId: paypalOrder.id,
      amount: parseFloat(paypalOrder.purchase_units[0].amount.value),
      timestamp: new Date().toISOString(),
      type: 'extra_storage',
      gb: gb
    }
  };
  
  await updateUserSubscription(user.uid, updatedSubscription);
}

/**
 * תזמון הורדת תוכנית
 */
async function schedulePlanDowngrade(newPlan) {
  const user = await getCurrentUser();
  
  const updatedSubscription = {
    ...user.subscription,
    scheduledDowngrade: {
      plan: newPlan,
      scheduledDate: await getSubscriptionRenewalDate()
    }
  };
  
  await updateUserSubscription(user.uid, updatedSubscription);
  
  alert('✅ התוכנית החדשה תיכנס לתוקף בתאריך החידוש.');
}

// ═══════════════════════════════════════════════════════
// 📤 ייצוא
// ═══════════════════════════════════════════════════════

window.PlanChanges = {
  canChangePlan,
  handlePlanSelection,
  handlePremiumPlusUpgrade,
  PLAN_HIERARCHY,
  PLAN_PRICES_ILS
};

console.log('✅ מערכת ניהול שינוי תוכניות נטענה');