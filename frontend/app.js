/**
 * Evergreen Node 04 — Frontend Application
 * Sovereign Node 04 · Mobile-First Storefront
 *
 * Modules:
 *  - API client (talks to /backend Flask API)
 *  - Menu rendering & filtering
 *  - Cart management
 *  - WebRTC ACTIVATE SIGNAL component
 *  - Gemini Pro concierge placeholder
 */

/* ============================================================
   CONFIG
   ============================================================ */

const CONFIG = {
  // Point this at the Flask backend when running locally
  API_BASE: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api",

  // Gemini Pro — set your API key here when ready
  GEMINI_API_KEY: "",
  GEMINI_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
};

/* ============================================================
   UTILITY HELPERS
   ============================================================ */

function formatPrice(price) {
  return `£${Number(price).toFixed(2)}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast show${type === "error" ? " error" : ""}`;
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.className = "toast";
  }, 3500);
}

/* ============================================================
   API CLIENT
   ============================================================ */

const API = {
  async fetch(path, options = {}) {
    try {
      const res = await fetch(CONFIG.API_BASE + path, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (err) {
      // If API is unreachable, return demo data for offline/static use
      if (err instanceof TypeError && err.message.includes("fetch")) {
        return null; // handled by callers
      }
      throw err;
    }
  },

  getMenu(category, availableOnly) {
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (availableOnly) params.set("available_only", "true");
    const qs = params.toString() ? `?${params}` : "";
    return this.fetch(`/menu${qs}`);
  },

  createOrder(payload) {
    return this.fetch("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  health() {
    return this.fetch("/health");
  },
};

/* ============================================================
   DEMO MENU DATA (used when API is unreachable)
   ============================================================ */

const DEMO_MENU = [
  // Hot Drinks
  { id: 1,  name: "Americano",       description: "Bold espresso with hot water",                        category: "Hot Drinks",  price: 2.50, available: 1 },
  { id: 2,  name: "Flat White",      description: "Double ristretto with steamed milk",                  category: "Hot Drinks",  price: 3.00, available: 1 },
  { id: 3,  name: "Latte",           description: "Espresso with velvety steamed milk",                  category: "Hot Drinks",  price: 2.90, available: 1 },
  { id: 4,  name: "Cappuccino",      description: "Equal parts espresso, steamed milk, foam",            category: "Hot Drinks",  price: 2.90, available: 1 },
  { id: 5,  name: "Hot Chocolate",   description: "Rich Belgian chocolate blend",                        category: "Hot Drinks",  price: 2.80, available: 1 },
  { id: 6,  name: "Chai Latte",      description: "Spiced masala tea with steamed milk",                 category: "Hot Drinks",  price: 3.00, available: 1 },
  // Cold Drinks
  { id: 7,  name: "Iced Latte",      description: "Espresso over ice with cold milk",                    category: "Cold Drinks", price: 3.20, available: 1 },
  { id: 8,  name: "Cold Brew",       description: "12-hour cold-steeped smooth coffee",                  category: "Cold Drinks", price: 3.50, available: 1 },
  { id: 9,  name: "Lemonade",        description: "Freshly squeezed with sugar syrup",                   category: "Cold Drinks", price: 2.50, available: 1 },
  { id: 10, name: "Mango Lassi",     description: "Yoghurt-based mango smoothie",                        category: "Cold Drinks", price: 3.00, available: 1 },
  // Breakfast
  { id: 11, name: "Full English",    description: "Bacon, eggs, sausage, beans, toast, mushrooms",       category: "Breakfast",   price: 7.50, available: 1 },
  { id: 12, name: "Avocado Toast",   description: "Smashed avo on sourdough, chilli flakes",             category: "Breakfast",   price: 5.50, available: 1 },
  { id: 13, name: "Bacon Butty",     description: "Back bacon in a soft white bap",                      category: "Breakfast",   price: 3.50, available: 1 },
  { id: 14, name: "Pancakes",        description: "American-style with maple syrup and butter",          category: "Breakfast",   price: 5.50, available: 1 },
  // Lunch
  { id: 15, name: "Chicken Wrap",    description: "Grilled chicken, lettuce, tomato, mayo",              category: "Lunch",       price: 5.50, available: 1 },
  { id: 16, name: "BLT Sandwich",    description: "Bacon, lettuce, tomato on malted brown bread",        category: "Lunch",       price: 4.50, available: 1 },
  { id: 17, name: "Caesar Salad",    description: "Cos lettuce, croutons, parmesan, Caesar dressing",   category: "Lunch",       price: 6.00, available: 1 },
  { id: 18, name: "Veggie Burger",   description: "Beyond Meat patty, brioche bun, all the trimmings",  category: "Lunch",       price: 8.00, available: 1 },
  // Cakes
  { id: 19, name: "Victoria Sponge", description: "Light sponge, strawberry jam, vanilla buttercream",  category: "Cakes",       price: 3.50, available: 1 },
  { id: 20, name: "Brownie",         description: "Fudgy dark chocolate brownie square",                 category: "Cakes",       price: 2.50, available: 1 },
  { id: 21, name: "Scone",           description: "Plain scone with clotted cream and jam",              category: "Cakes",       price: 3.00, available: 1 },
  { id: 22, name: "Lemon Drizzle",   description: "Moist lemon cake with sugar glaze",                  category: "Cakes",       price: 3.00, available: 1 },
  // Snacks
  { id: 23, name: "Mixed Nuts",      description: "Roasted and salted mixed nut bag",                    category: "Snacks",      price: 2.00, available: 1 },
  { id: 24, name: "Nakd Bar",        description: "Natural fruit and nut bar",                           category: "Snacks",      price: 1.50, available: 1 },
  // Kids
  { id: 25, name: "Mini Pizza",      description: "Personal-size pizza with tomato and mozzarella",     category: "Kids",        price: 4.00, available: 1 },
  { id: 26, name: "Nuggets & Chips", description: "5 crispy chicken nuggets with skinny fries",         category: "Kids",        price: 4.50, available: 1 },
];

/* ============================================================
   MENU MODULE
   ============================================================ */

const Menu = (() => {
  let allItems = [];
  let activeCategory = "all";
  let searchQuery = "";

  function getCategories() {
    const cats = [...new Set(allItems.map(i => i.category))].sort();
    return cats;
  }

  function renderTabs() {
    const tabs = document.getElementById("categoryTabs");
    const categories = getCategories();
    // Keep the 'ALL' button, rebuild the rest
    tabs.innerHTML = `<button class="tab-btn active" data-category="all" role="tab">ALL</button>`;
    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "tab-btn";
      btn.dataset.category = cat;
      btn.setAttribute("role", "tab");
      btn.textContent = cat.toUpperCase();
      tabs.appendChild(btn);
    });

    tabs.addEventListener("click", e => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      activeCategory = btn.dataset.category;
      tabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  }

  function getFiltered() {
    let items = allItems;
    if (activeCategory !== "all") {
      items = items.filter(i => i.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        i => i.name.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q)
      );
    }
    return items;
  }

  function render() {
    const grid = document.getElementById("menuGrid");
    const loading = document.getElementById("menuLoading");
    if (loading) loading.remove();

    const items = getFiltered();
    grid.innerHTML = "";

    if (items.length === 0) {
      grid.innerHTML = `<p class="empty-state" style="grid-column:1/-1">No items found.</p>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement("article");
      card.className = "menu-card";
      card.setAttribute("role", "listitem");
      card.innerHTML = `
        <span class="menu-card-category">${escapeHtml(item.category)}</span>
        <h3 class="menu-card-name">${escapeHtml(item.name)}</h3>
        <p class="menu-card-desc">${escapeHtml(item.description || "")}</p>
        <div class="menu-card-footer">
          <span class="menu-card-price">${formatPrice(item.price)}</span>
          <button
            class="add-to-cart-btn"
            data-id="${item.id}"
            data-name="${escapeHtml(item.name)}"
            data-price="${item.price}"
            aria-label="Add ${escapeHtml(item.name)} to cart"
          >+ ADD</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // Delegate add-to-cart clicks
    grid.querySelectorAll(".add-to-cart-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        Cart.add({
          id: Number(btn.dataset.id),
          name: btn.dataset.name,
          price: Number(btn.dataset.price),
        });
        showToast(`${btn.dataset.name} added to order`);
      });
    });
  }

  async function init() {
    const data = await API.getMenu().catch(() => null);
    if (data && data.items) {
      allItems = data.items;
    } else {
      // Fallback to demo data
      allItems = DEMO_MENU;
      showToast("Running in offline demo mode — API not connected", "error");
    }
    renderTabs();
    render();
  }

  // Search
  document.getElementById("menuSearch").addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    render();
  });

  return { init, render };
})();

/* ============================================================
   CART MODULE
   ============================================================ */

const Cart = (() => {
  let items = []; // [{ id, name, price, quantity }]

  function updateBadge() {
    const total = items.reduce((s, i) => s + i.quantity, 0);
    document.getElementById("cartBadge").textContent = total;
  }

  function updateSummary() {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    document.getElementById("cartItemCount").textContent = count;
    document.getElementById("cartSubtotal").textContent = formatPrice(subtotal);
    document.getElementById("cartTotal").textContent = formatPrice(subtotal);
    updateBadge();
  }

  function render() {
    const container = document.getElementById("cartItems");
    const empty = document.getElementById("cartEmpty");

    if (items.length === 0) {
      container.innerHTML = "";
      if (empty) {
        empty.classList.remove("hidden");
        container.appendChild(empty);
      }
      updateSummary();
      return;
    }

    if (empty) empty.classList.add("hidden");
    container.innerHTML = "";

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">${formatPrice(item.price)} each</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">+</button>
        </div>
        <button class="remove-btn" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">✕</button>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === "inc") changeQty(id, 1);
        else changeQty(id, -1);
      });
    });

    container.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", () => remove(Number(btn.dataset.id)));
    });

    updateSummary();
  }

  function add(item) {
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ ...item, quantity: 1 });
    }
    render();
  }

  function changeQty(id, delta) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) items = items.filter(i => i.id !== id);
    render();
  }

  function remove(id) {
    items = items.filter(i => i.id !== id);
    render();
  }

  function clear() {
    items = [];
    render();
  }

  function getPayload(customerName, customerNote) {
    return {
      customer_name: customerName,
      customer_note: customerNote,
      items: items.map(i => ({ menu_item_id: i.id, quantity: i.quantity })),
    };
  }

  // Place order
  document.getElementById("placeOrderBtn").addEventListener("click", async () => {
    if (items.length === 0) {
      showToast("Add items to your order first", "error");
      return;
    }
    const btn = document.getElementById("placeOrderBtn");
    btn.disabled = true;
    btn.textContent = "PLACING ORDER…";

    const name = document.getElementById("customerName").value.trim();
    const note = document.getElementById("customerNote").value.trim();

    try {
      const result = await API.createOrder(getPayload(name, note));
      if (result) {
        document.getElementById("orderForm").classList.add("hidden");
        document.getElementById("orderConfirmation").classList.remove("hidden");
        showToast(`Order #${result.order_id} confirmed!`);
        clear();
      } else {
        // Demo mode — simulate success
        document.getElementById("orderForm").classList.add("hidden");
        document.getElementById("orderConfirmation").classList.remove("hidden");
        showToast("Order confirmed (demo mode)");
        clear();
      }
    } catch (err) {
      showToast(`Order failed: ${err.message}`, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "PLACE ORDER";
    }
  });

  document.getElementById("newOrderBtn").addEventListener("click", () => {
    document.getElementById("orderForm").classList.remove("hidden");
    document.getElementById("orderConfirmation").classList.add("hidden");
  });

  return { add, clear };
})();

/* ============================================================
   WEBRTC — ACTIVATE SIGNAL MODULE
   ============================================================ */

const Signal = (() => {
  let localStream = null;
  let peerConnection = null;
  let localPeerId = null;
  let active = false;

  // Simple peer ID generator (for standalone use without a signalling server)
  function generatePeerId() {
    return "NODE04-" + Math.random().toString(36).substring(2, 11).toUpperCase();
  }

  function log(message, level = "info") {
    const logEl = document.getElementById("signalLog");
    const line = document.createElement("div");
    line.className = `log-line${level === "error" ? " error" : level === "warn" ? " warn" : ""}`;
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    line.textContent = `[${ts}] ${message}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setStatus(state, label) {
    const indicator = document.getElementById("statusIndicator");
    const labelEl = document.getElementById("statusLabel");
    indicator.className = `status-indicator ${state}`;
    labelEl.textContent = label;
  }

  function init() {
    localPeerId = generatePeerId();
    document.getElementById("peerIdDisplay").value = localPeerId;
    log("Signal module initialised. Your peer ID: " + localPeerId);
  }

  document.getElementById("copyPeerIdBtn").addEventListener("click", () => {
    const val = document.getElementById("peerIdDisplay").value;
    if (val) {
      navigator.clipboard.writeText(val).then(() => showToast("Peer ID copied"));
    }
  });

  document.getElementById("activateSignalBtn").addEventListener("click", async () => {
    if (active) return;

    const remotePeerId = document.getElementById("remotePeerId").value.trim();
    log("Activating signal…");
    setStatus("connecting", "CONNECTING…");

    try {
      // Request camera/mic access
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      document.getElementById("localVideo").srcObject = localStream;
      log("Local media stream acquired");

      // Set up RTCPeerConnection
      const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
      peerConnection = new RTCPeerConnection({ iceServers });

      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.ontrack = e => {
        document.getElementById("remoteVideo").srcObject = e.streams[0];
        log("Remote stream received");
        setStatus("active", "SIGNAL ACTIVE");
      };

      peerConnection.onicecandidate = e => {
        if (e.candidate) {
          log("ICE candidate generated (manual exchange required for standalone mode)", "warn");
        }
      };

      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        log(`Connection state: ${state}`);
        if (state === "connected") {
          setStatus("active", "SIGNAL ACTIVE — CONNECTED");
          active = true;
          document.getElementById("activateSignalBtn").classList.add("hidden");
          document.getElementById("deactivateSignalBtn").classList.remove("hidden");
        } else if (state === "failed" || state === "disconnected") {
          setStatus("error", "SIGNAL ERROR");
          log("Connection failed or disconnected", "error");
        }
      };

      if (remotePeerId) {
        // Initiator: create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        log("SDP offer created. Share this with your peer: " + JSON.stringify(offer).slice(0, 80) + "…", "warn");
        log("NOTE: Full signalling server required for automated connection. WebRTC SDP exchange is active.", "warn");
      } else {
        log("No remote peer ID set. Waiting for incoming connection…", "warn");
        log("NOTE: Manual SDP exchange mode. Set up a signalling server for auto-pairing.", "warn");
      }

      setStatus("connecting", "AWAITING PEER…");
      active = true;
      document.getElementById("activateSignalBtn").classList.add("hidden");
      document.getElementById("deactivateSignalBtn").classList.remove("hidden");
      showToast("Signal activated — awaiting peer connection");

    } catch (err) {
      log(`Error activating signal: ${err.message}`, "error");
      setStatus("error", "SIGNAL ERROR");
      showToast(`Signal error: ${err.message}`, "error");
    }
  });

  document.getElementById("deactivateSignalBtn").addEventListener("click", () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;
    active = false;
    setStatus("idle", "SIGNAL INACTIVE");
    log("Signal deactivated");
    document.getElementById("activateSignalBtn").classList.remove("hidden");
    document.getElementById("deactivateSignalBtn").classList.add("hidden");
    showToast("Signal deactivated");
  });

  return { init };
})();

/* ============================================================
   GEMINI PRO CONCIERGE MODULE (Placeholder)
   ============================================================ */

const Concierge = (() => {
  // Simulated JARVIS responses for demo mode
  const DEMO_RESPONSES = [
    "I'd recommend our Flat White — a double ristretto with beautifully steamed milk, a favourite here at Evergreen. Can I add it to your order?",
    "Our Full English Breakfast is the most popular item on the menu. Served fresh every morning until 11:30. Would you like to order one?",
    "Evergreen Stretford is a community-owned café in Moss Park, Manchester. We're part of the Sovereign Node 04 initiative — locally owned, edge-powered infrastructure for the community.",
    "We serve a wide range of hot drinks, cold drinks, breakfast items, lunch mains, cakes, snacks, and kids' options. What are you in the mood for?",
    "Our daily specials change — ask a team member when you visit! I can help you browse our full menu or place an order.",
    "The JARVIS system is currently running in demo mode. Once connected to Google Gemini Pro, I'll be able to provide personalised recommendations and handle full conversational ordering.",
    "Is there anything else I can help you with? I can recommend dishes, answer questions about the café, or guide you through placing an order.",
  ];

  let responseIndex = 0;

  function appendMessage(text, role) {
    const chatWindow = document.getElementById("chatWindow");
    const div = document.createElement("div");
    div.className = `chat-message ${role === "user" ? "user-message" : "bot-message"}`;
    div.innerHTML = `
      <div class="message-avatar">${role === "user" ? "U" : "J"}</div>
      <div class="message-bubble">${escapeHtml(text)}</div>
    `;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  async function sendMessage(message) {
    if (!message.trim()) return;
    appendMessage(message, "user");
    document.getElementById("chatInput").value = "";

    // Attempt Gemini Pro API call if key is configured
    if (CONFIG.GEMINI_API_KEY) {
      try {
        const res = await fetch(
          `${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: message }] }],
            }),
          }
        );
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm unable to respond right now.";
        appendMessage(reply, "bot");
        return;
      } catch (err) {
        appendMessage("I'm having trouble connecting to the Gemini Pro API. Falling back to demo mode.", "bot");
      }
    }

    // Demo mode — cycle through pre-written responses
    setTimeout(() => {
      const reply = DEMO_RESPONSES[responseIndex % DEMO_RESPONSES.length];
      responseIndex++;
      appendMessage(reply, "bot");
    }, 600);
  }

  document.getElementById("chatSendBtn").addEventListener("click", () => {
    const input = document.getElementById("chatInput");
    sendMessage(input.value);
  });

  document.getElementById("chatInput").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const input = document.getElementById("chatInput");
      sendMessage(input.value);
    }
  });

  return {};
})();

/* ============================================================
   MOBILE NAV
   ============================================================ */

document.getElementById("menuToggle").addEventListener("click", () => {
  const nav = document.getElementById("mainNav");
  const isOpen = nav.classList.toggle("mobile-open");
  if (isOpen) {
    nav.style.cssText = `
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 60px;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.98);
      border-bottom: 1px solid #2a2a2a;
      padding: 1rem;
      gap: 0.5rem;
      z-index: 99;
    `;
  } else {
    nav.style.cssText = "";
  }
});

/* ============================================================
   BOOT
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // Check API health (non-blocking)
  API.health().then(data => {
    if (data) {
      console.log("[NODE04] API online:", data.message);
    }
  }).catch(() => {
    console.log("[NODE04] API offline — running in demo mode");
  });

  // Initialise modules
  await Menu.init();
  Signal.init();

  console.log("[ACTIVE_SIGNAL] SOVEREIGN_NODE_04 — Evergreen Stretford — Online");
});
