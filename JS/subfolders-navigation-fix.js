// ===== תיקון מיידי - סינון תתי תיקיות =====
// הבעיה: הקוד לא מסנן כראוי כשלוחצים על תת-תיקייה

console.log("🔧 Loading IMMEDIATE subfolder filter fix...");

// שומר את הפונקציה המקורית
const originalOpenCategoryView = window.openCategoryView;

// פונקציה מתוקנת
window.openCategoryView = function(categoryName, subfolderName = null) {
  console.log("📂 Opening category:", categoryName, "subfolder:", subfolderName);

  const categoryTitle = document.getElementById("categoryTitle");
  const docsList = document.getElementById("docsList");
  const homeView = document.getElementById("homeView");
  const categoryView = document.getElementById("categoryView");

  if (!categoryTitle || !docsList) {
    console.error("❌ Category view elements not found");
    return;
  }

  // כותרת
  if (subfolderName) {
    categoryTitle.textContent = `${categoryName} → ${subfolderName}`;
  } else {
    categoryTitle.textContent = categoryName;
  }

  // שמירת התת-תיקייה הנוכחית
  window.currentSubfolderFilter = subfolderName || null;
  console.log("🔍 Current subfolder filter:", window.currentSubfolderFilter);

  // ציור כפתורי תתי-התיקיות
  if (typeof window.renderSubfoldersBar === "function") {
    window.renderSubfoldersBar(categoryName);
  }

  // סינון מסמכים - זה החלק החשוב! 🎯
  let docsForThisCategory = (window.allDocsData || []).filter(doc => {
    // בדיקות בסיסיות
    if (!doc || doc._trashed || doc.trashed) return false;
    
    // בדיקת קטגוריה - תומך גם במערך וגם במחרוזת
    let matchesCategory = false;
    if (Array.isArray(doc.category)) {
      matchesCategory = doc.category.includes(categoryName);
    } else if (typeof doc.category === "string") {
      matchesCategory = doc.category === categoryName;
    }
    
    if (!matchesCategory) return false;

    // 🎯 זה החלק המתוקן! בדיקת תת-תיקייה
    if (subfolderName) {
      // נסה למצוא את תת-התיקייה בכמה שדות אפשריים:
      const docSubfolder = 
        doc.subCategory ||           // השדה הנכון מהזיהוי האוטומטי
        doc.sub_category ||          // אולי כתוב עם underscore
        doc.subfolder ||             // אולי כתוב ככה
        doc.recipient ||             // לפעמים זה נשמר כ-recipient
        null;

      console.log("📄 Checking doc:", doc.title || doc.fileName);
      console.log("   Doc subfolder field:", docSubfolder);
      console.log("   Filter:", subfolderName);

      // בדיקה - תומך גם במערך וגם במחרוזת
      if (Array.isArray(docSubfolder)) {
        const matches = docSubfolder.includes(subfolderName);
        console.log("   Array check:", matches);
        return matches;
      } else if (typeof docSubfolder === "string") {
        const matches = docSubfolder === subfolderName;
        console.log("   String check:", matches);
        return matches;
      } else {
        console.log("   No subfolder field found");
        return false; // אין שדה תת-תיקייה - לא להציג
      }
    }
    
    // אם אין סינון תת-תיקייה - הצג הכל
    return true;
  });

  console.log("📊 Found", docsForThisCategory.length, "documents after filter");

  // מיון
  if (typeof sortDocs === "function") {
    docsForThisCategory = sortDocs(docsForThisCategory);
  }

  // ציור הכרטיסים
  docsList.innerHTML = "";
  docsList.classList.remove("shared-mode");
  
  if (docsForThisCategory.length === 0) {
    const msg = subfolderName 
      ? `אין מסמכים בתת-תיקייה "${subfolderName}"`
      : "אין מסמכים בתיקייה זו";
    docsList.innerHTML = `
      <div style="padding:2rem;text-align:center;opacity:0.6;">
        <div style="font-size: 3em; margin-bottom: 16px;">📭</div>
        <div>${msg}</div>
      </div>
    `;
  } else {
    docsForThisCategory.forEach(doc => {
      if (typeof buildDocCard === "function") {
        const card = buildDocCard(doc, "normal");
        docsList.appendChild(card);
      }
    });
  }

  // עדכון הכפתורים - סמן את הכפתור הנכון
  if (subfolderName) {
    setTimeout(() => {
      const subfoldersBar = document.getElementById("subfoldersBar");
      if (subfoldersBar) {
        const buttons = subfoldersBar.querySelectorAll(".tab-btn");
        buttons.forEach(btn => {
          const btnValue = btn.getAttribute("data-value");
          if (btnValue === subfolderName) {
            btn.classList.add("active");
          } else {
            btn.classList.remove("active");
          }
        });
      }
    }, 50);
  }

  if (homeView) homeView.classList.add("hidden");
  if (categoryView) categoryView.classList.remove("hidden");

  console.log("✅ Category view opened with", docsForThisCategory.length, "documents");
};

console.log("✅ IMMEDIATE subfolder filter fix loaded!");
console.log("📌 Now clicking on subfolders will actually filter documents!");
console.log("🎯 Searches in: subCategory, sub_category, subfolder, recipient");