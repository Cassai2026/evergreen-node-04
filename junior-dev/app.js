/**
 * Evergreen Junior Dev Lab — app.js
 * Gamified menu data-entry for young contributors
 *
 * Features:
 *  - XP system with levels
 *  - Mission/achievement system
 *  - Badge unlocking
 *  - Item log
 *  - Backend API integration (with local demo fallback)
 */

/* ============================================================
   CONFIG
   ============================================================ */

const CONFIG = {
  API_BASE: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api",
  XP_PER_ITEM: 50,
  XP_BONUS_DESCRIPTION: 20,
  XP_PER_LEVEL: 200,
  MAX_LEVEL: 10,
};

/* ============================================================
   LEVEL / RANK SYSTEM
   ============================================================ */

const LEVEL_RANKS = [
  "Apprentice Dev",
  "Junior Developer",
  "Code Cadet",
  "Data Scout",
  "Menu Architect",
  "Logic Engineer",
  "Node Builder",
  "Senior Coder",
  "Sovereign Dev",
  "Master Engineer",
];

function getRank(level) {
  return LEVEL_RANKS[Math.min(level - 1, LEVEL_RANKS.length - 1)];
}

function xpForLevel(level) {
  return (level - 1) * CONFIG.XP_PER_LEVEL;
}

/* ============================================================
   STATE
   ============================================================ */

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("jd_state_node04") || "null");
    if (saved && typeof saved === "object") return saved;
  } catch (_) {}
  return {
    xp: 0,
    level: 1,
    streak: 0,
    totalItems: 0,
    categories: [],
    log: [],
    badges: [],
    lastSubmit: null,
  };
}

function saveState() {
  try {
    localStorage.setItem("jd_state_node04", JSON.stringify(state));
  } catch (_) {}
}

/* ============================================================
   MISSIONS
   ============================================================ */

const MISSIONS = [
  {
    id: "first_item",
    icon: "🌱",
    name: "First Item",
    desc: "Add your very first menu item",
    xpReward: 100,
    check: s => s.totalItems >= 1,
  },
  {
    id: "five_items",
    icon: "⭐",
    name: "Star Contributor",
    desc: "Add 5 menu items",
    xpReward: 200,
    check: s => s.totalItems >= 5,
  },
  {
    id: "ten_items",
    icon: "🔟",
    name: "Menu Master",
    desc: "Add 10 menu items",
    xpReward: 500,
    check: s => s.totalItems >= 10,
  },
  {
    id: "three_categories",
    icon: "🗂️",
    name: "Category Explorer",
    desc: "Add items in 3 different categories",
    xpReward: 150,
    check: s => (s.categories || []).length >= 3,
  },
  {
    id: "five_categories",
    icon: "🌍",
    name: "World Builder",
    desc: "Add items in 5 different categories",
    xpReward: 300,
    check: s => (s.categories || []).length >= 5,
  },
  {
    id: "streak_3",
    icon: "🔥",
    name: "On Fire!",
    desc: "Submit 3 items in a row without errors",
    xpReward: 150,
    check: s => s.streak >= 3,
  },
  {
    id: "streak_5",
    icon: "💥",
    name: "Unstoppable",
    desc: "Submit 5 items in a row without errors",
    xpReward: 300,
    check: s => s.streak >= 5,
  },
  {
    id: "level_5",
    icon: "🚀",
    name: "Mid-Node Rank",
    desc: "Reach Level 5",
    xpReward: 0,
    check: s => s.level >= 5,
  },
  {
    id: "level_10",
    icon: "👑",
    name: "Sovereign Engineer",
    desc: "Reach the maximum Level 10!",
    xpReward: 1000,
    check: s => s.level >= 10,
  },
];

/* ============================================================
   BADGES (shown in hero)
   ============================================================ */

const BADGE_DEFS = [
  { id: "first_item",   emoji: "🌱", label: "First Item" },
  { id: "five_items",   emoji: "⭐", label: "Star Contributor" },
  { id: "ten_items",    emoji: "🔟", label: "Menu Master" },
  { id: "streak_5",     emoji: "🔥", label: "Unstoppable" },
  { id: "level_10",     emoji: "👑", label: "Sovereign" },
];

/* ============================================================
   UI HELPERS
   ============================================================ */

function showToast(msg) {
  const el = document.getElementById("jdToast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2800);
}

function updateHUD() {
  document.getElementById("xpDisplay").textContent = state.xp;
  document.getElementById("levelDisplay").textContent = state.level;
  document.getElementById("streakDisplay").textContent = state.streak;

  // XP bar
  const levelXp = xpForLevel(state.level);
  const nextLevelXp = xpForLevel(state.level + 1);
  const progress = state.level >= CONFIG.MAX_LEVEL
    ? 100
    : Math.min(100, ((state.xp - levelXp) / (nextLevelXp - levelXp)) * 100);
  document.getElementById("xpBar").style.width = `${progress}%`;
}

function renderMissions() {
  const container = document.getElementById("missions");
  container.innerHTML = "";

  MISSIONS.forEach(m => {
    const completed = state.badges.includes(m.id) || m.check(state);
    const div = document.createElement("div");
    div.className = `mission-item${completed ? " completed" : ""}`;

    // Calculate progress for numeric missions
    let progressPct = 0;
    if (m.id === "five_items")      progressPct = Math.min(100, (state.totalItems / 5) * 100);
    else if (m.id === "ten_items")  progressPct = Math.min(100, (state.totalItems / 10) * 100);
    else if (m.id === "three_categories") progressPct = Math.min(100, ((state.categories || []).length / 3) * 100);
    else if (m.id === "five_categories")  progressPct = Math.min(100, ((state.categories || []).length / 5) * 100);
    else if (m.id === "streak_3")   progressPct = Math.min(100, (state.streak / 3) * 100);
    else if (m.id === "streak_5")   progressPct = Math.min(100, (state.streak / 5) * 100);
    else if (m.id === "level_5")    progressPct = Math.min(100, (state.level / 5) * 100);
    else if (m.id === "level_10")   progressPct = Math.min(100, (state.level / 10) * 100);
    else progressPct = completed ? 100 : 0;

    div.innerHTML = `
      <div class="mission-icon">${m.icon}</div>
      <div class="mission-info">
        <div class="mission-name">${m.name}</div>
        <div class="mission-desc">${m.desc}</div>
        <div class="mission-prog-bar">
          <div class="mission-prog-fill" style="width: ${progressPct}%"></div>
        </div>
      </div>
      <div class="mission-progress">
        <div class="mission-xp">${m.xpReward > 0 ? `+${m.xpReward} XP` : ""}</div>
        <div class="mission-check">${completed ? "✅" : "⬜"}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderBadges() {
  const container = document.getElementById("badgeDisplay");
  container.innerHTML = "";
  BADGE_DEFS.forEach(b => {
    const unlocked = state.badges.includes(b.id);
    const chip = document.createElement("span");
    chip.className = `badge-chip${unlocked ? " unlocked" : ""}`;
    chip.textContent = `${b.emoji} ${b.label}`;
    chip.title = unlocked ? "Unlocked!" : "Not yet unlocked";
    container.appendChild(chip);
  });
}

function renderLog() {
  const container = document.getElementById("itemLog");
  const empty = document.getElementById("logEmpty");

  if (state.log.length === 0) {
    container.innerHTML = "";
    if (empty) { empty.classList.remove("hidden"); container.appendChild(empty); }
    return;
  }

  if (empty) empty.classList.add("hidden");
  container.innerHTML = "";

  const CATEGORY_EMOJIS = {
    "Hot Drinks": "☕", "Cold Drinks": "🥤", "Breakfast": "🍳", "Lunch": "🥗",
    "Kids": "🧒", "Cakes": "🍰", "Snacks": "🍿", "Sides": "🥗", "Retail": "🛍️",
  };

  [...state.log].reverse().forEach(entry => {
    const div = document.createElement("div");
    div.className = "log-entry";
    const emoji = CATEGORY_EMOJIS[entry.category] || "📋";
    div.innerHTML = `
      <div class="log-entry-icon">${emoji}</div>
      <div class="log-entry-info">
        <div class="log-entry-name">${escapeHtml(entry.name)}</div>
        <div class="log-entry-meta">${escapeHtml(entry.category)} · £${Number(entry.price).toFixed(2)}</div>
      </div>
      <div class="log-entry-xp">+${entry.xpEarned} XP</div>
    `;
    container.appendChild(div);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

function showLevelUp(level) {
  const overlay = document.getElementById("levelUpOverlay");
  document.getElementById("levelUpNum").textContent = `Level ${level}`;
  document.getElementById("levelUpRank").textContent = getRank(level);
  overlay.classList.remove("hidden");
}

function checkMissions() {
  MISSIONS.forEach(m => {
    if (!state.badges.includes(m.id) && m.check(state)) {
      state.badges.push(m.id);
      if (m.xpReward > 0) {
        state.xp += m.xpReward;
        showToast(`🏆 Mission complete: ${m.name}! +${m.xpReward} XP`);
      } else {
        showToast(`🏆 Mission complete: ${m.name}!`);
      }
    }
  });
}

/* ============================================================
   FORM VALIDATION
   ============================================================ */

function validateForm() {
  let valid = true;

  const name = document.getElementById("itemName").value.trim();
  const nameEl = document.getElementById("itemName");
  const nameFb = document.getElementById("nameFeedback");
  if (!name) {
    nameFb.textContent = "Item name is required";
    nameEl.classList.add("error");
    valid = false;
  } else if (name.length < 2) {
    nameFb.textContent = "Name must be at least 2 characters";
    nameEl.classList.add("error");
    valid = false;
  } else {
    nameFb.textContent = "";
    nameEl.classList.remove("error");
    nameEl.classList.add("success");
  }

  const catSelect = document.getElementById("itemCategory");
  let category = catSelect.value;
  const catFb = document.getElementById("catFeedback");
  if (category === "New Category") {
    category = document.getElementById("newCategoryName").value.trim();
  }
  if (!category) {
    catFb.textContent = "Please select or enter a category";
    catSelect.classList.add("error");
    valid = false;
  } else {
    catFb.textContent = "";
    catSelect.classList.remove("error");
    catSelect.classList.add("success");
  }

  const priceVal = document.getElementById("itemPrice").value;
  const priceEl = document.getElementById("itemPrice");
  const priceFb = document.getElementById("priceFeedback");
  const price = parseFloat(priceVal);
  if (priceVal === "" || isNaN(price) || price < 0) {
    priceFb.textContent = "Enter a valid price (0 or above)";
    priceEl.classList.add("error");
    valid = false;
  } else {
    priceFb.textContent = "";
    priceEl.classList.remove("error");
    priceEl.classList.add("success");
  }

  return valid ? { name, category, price } : null;
}

/* ============================================================
   API SUBMISSION
   ============================================================ */

async function submitToAPI(payload) {
  try {
    const res = await fetch(`${CONFIG.API_BASE}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) return null; // API offline — demo mode
    throw err;
  }
}

/* ============================================================
   FORM SUBMISSION
   ============================================================ */

document.getElementById("addItemForm").addEventListener("submit", async e => {
  e.preventDefault();

  const data = validateForm();
  if (!data) {
    state.streak = 0;
    updateHUD();
    return;
  }

  const description = document.getElementById("itemDescription").value.trim();
  const payload = { ...data, description };

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "🚀 Sending…";

  try {
    await submitToAPI(payload);

    // Earn XP
    let xpEarned = CONFIG.XP_PER_ITEM;
    if (description.length > 10) xpEarned += CONFIG.XP_BONUS_DESCRIPTION;

    const prevLevel = state.level;
    state.xp += xpEarned;
    state.streak += 1;
    state.totalItems += 1;
    if (!state.categories) state.categories = [];
    if (!state.categories.includes(data.category)) {
      state.categories.push(data.category);
    }

    // Level-up check
    while (state.level < CONFIG.MAX_LEVEL && state.xp >= xpForLevel(state.level + 1)) {
      state.level += 1;
    }

    state.log.push({
      name: data.name,
      category: data.category,
      price: data.price,
      xpEarned,
      ts: Date.now(),
    });

    checkMissions();
    saveState();
    updateHUD();
    renderMissions();
    renderBadges();
    renderLog();

    // Success animation
    const burst = document.getElementById("successBurst");
    const burstEmojis = ["🎉", "⭐", "🔥", "💥", "🚀", "🌟"];
    document.getElementById("burstEmoji").textContent =
      burstEmojis[Math.floor(Math.random() * burstEmojis.length)];
    document.getElementById("burstText").textContent = `+${xpEarned} XP!`;
    burst.classList.remove("hidden");
    setTimeout(() => burst.classList.add("hidden"), 1600);

    // Level-up modal
    if (state.level > prevLevel) {
      setTimeout(() => showLevelUp(state.level), 500);
    }

    // Reset form
    document.getElementById("addItemForm").reset();
    document.getElementById("newCategoryGroup").classList.add("hidden");
    ["itemName", "itemCategory", "itemPrice"].forEach(id => {
      document.getElementById(id).classList.remove("success", "error");
    });
    document.getElementById("descCounter").textContent = "0";

  } catch (err) {
    state.streak = 0;
    updateHUD();
    showToast(`Error: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "🚀 ADD TO MENU";
  }
});

/* ============================================================
   CLEAR BUTTON
   ============================================================ */

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("addItemForm").reset();
  document.getElementById("newCategoryGroup").classList.add("hidden");
  document.getElementById("descCounter").textContent = "0";
  ["itemName", "itemCategory", "itemPrice", "itemDescription"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("success", "error");
  });
  ["nameFeedback", "catFeedback", "priceFeedback"].forEach(id => {
    document.getElementById(id).textContent = "";
  });
});

/* ============================================================
   CATEGORY SELECT — show/hide new category field
   ============================================================ */

document.getElementById("itemCategory").addEventListener("change", e => {
  const newCatGroup = document.getElementById("newCategoryGroup");
  if (e.target.value === "New Category") {
    newCatGroup.classList.remove("hidden");
    document.getElementById("newCategoryName").focus();
  } else {
    newCatGroup.classList.add("hidden");
  }
});

/* ============================================================
   DESCRIPTION CHAR COUNTER
   ============================================================ */

document.getElementById("itemDescription").addEventListener("input", e => {
  document.getElementById("descCounter").textContent = e.target.value.length;
});

/* ============================================================
   LEVEL-UP CLOSE
   ============================================================ */

document.getElementById("levelUpClose").addEventListener("click", () => {
  document.getElementById("levelUpOverlay").classList.add("hidden");
});

/* ============================================================
   BOOT
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  updateHUD();
  renderMissions();
  renderBadges();
  renderLog();
  console.log("[JUNIOR DEV LAB] Node 04 — Online. Current level:", state.level, "XP:", state.xp);
});
