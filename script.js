// ============================================================
//  NutriFlow – Central JavaScript Logic
//  Uses localStorage as a fake database for demo purposes
// ============================================================

// ── Seed demo data if localStorage is empty ─────────────────
(function seedDemoData() {
  if (!localStorage.getItem("nf_seeded")) {
    const demoListings = [
      {
        id: "L001",
        restaurant: "Green Garden Restaurant",
        foodName: "Rice & Dal",
        quantity: "25 kg",
        foodType: "Veg",
        location: "Sector 14, Delhi",
        contact: "9876543210",
        expiry: getTomorrowDate(),
        status: "pending",
        mealsEstimate: 50,
        timestamp: Date.now() - 3600000,
      },
      {
        id: "L002",
        restaurant: "Spice Route Cafe",
        foodName: "Mixed Vegetables",
        quantity: "15 kg",
        foodType: "Veg",
        location: "Connaught Place, Delhi",
        contact: "9123456789",
        expiry: getTodayDate(),
        status: "accepted",
        mealsEstimate: 30,
        timestamp: Date.now() - 7200000,
        acceptedBy: "Hope Foundation NGO",
      },
      {
        id: "L003",
        restaurant: "The Biryani House",
        foodName: "Chicken Biryani",
        quantity: "10 kg",
        foodType: "Non-Veg",
        location: "Lajpat Nagar, Delhi",
        contact: "9988776655",
        expiry: getTomorrowDate(),
        status: "completed",
        mealsEstimate: 20,
        timestamp: Date.now() - 86400000,
        acceptedBy: "Smile Foundation",
      },
    ];

    const demoNotifications = [
      {
        id: "N001",
        message: "Hope Foundation NGO accepted your food listing 'Rice & Dal'",
        time: "2 hours ago",
        read: false,
        type: "accepted",
      },
      {
        id: "N002",
        message: "You helped serve 30 meals through Spice Route Cafe listing!",
        time: "Yesterday",
        read: true,
        type: "impact",
      },
      {
        id: "N003",
        message: "New food available: Rice & Dal (25 kg) at Sector 14",
        time: "3 hours ago",
        read: false,
        type: "new",
      },
      {
        id: "N004",
        message: "Pickup confirmed for Spice Route Cafe – Mixed Vegetables",
        time: "5 hours ago",
        read: true,
        type: "pickup",
      },
    ];

    localStorage.setItem("nf_listings", JSON.stringify(demoListings));
    localStorage.setItem("nf_notifications", JSON.stringify(demoNotifications));
    localStorage.setItem("nf_seeded", "true");
  }
})();

// ── Utility helpers ──────────────────────────────────────────
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}
function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}
function generateId() {
  return "L" + Date.now().toString().slice(-6);
}
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} day(s) ago`;
}
function isExpiringSoon(dateStr) {
  const expiry = new Date(dateStr);
  const today = new Date();
  const diff = (expiry - today) / (1000 * 60 * 60 * 24);
  return diff <= 1;
}

// ── LocalStorage helpers ─────────────────────────────────────
function getListings() {
  return JSON.parse(localStorage.getItem("nf_listings") || "[]");
}
function saveListings(listings) {
  localStorage.setItem("nf_listings", JSON.stringify(listings));
}
function getNotifications() {
  return JSON.parse(localStorage.getItem("nf_notifications") || "[]");
}
function saveNotifications(notifs) {
  localStorage.setItem("nf_notifications", JSON.stringify(notifs));
}
function addNotification(message, type) {
  const notifs = getNotifications();
  notifs.unshift({
    id: "N" + Date.now(),
    message,
    time: "Just now",
    read: false,
    type,
  });
  saveNotifications(notifs);
}

// ── Status badge helper ──────────────────────────────────────
function statusBadge(status) {
  const map = {
    pending:
      '<span class="badge-pending">⏳ Pending</span>',
    accepted:
      '<span class="badge-accepted">✅ Accepted</span>',
    completed:
      '<span class="badge-completed">🏆 Completed</span>',
    "in-progress":
      '<span class="badge-inprogress">🚚 In Progress</span>',
  };
  return map[status] || '<span class="badge-pending">⏳ Pending</span>';
}

// ────────────────────────────────────────────────────────────
//  RESTAURANT DASHBOARD
// ────────────────────────────────────────────────────────────
function initRestaurantDashboard() {
  if (!document.getElementById("restaurantDash")) return;

  renderRestaurantStats();
  renderMyListings();
  renderRestaurantNotifications();

  const form = document.getElementById("addFoodForm");
  if (form) {
    // Set min expiry to today
    const expiryInput = document.getElementById("expiry");
    if (expiryInput) expiryInput.min = getTodayDate();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleAddFood();
    });
  }
}

function handleAddFood() {
  const foodName = document.getElementById("foodName").value.trim();
  const quantity = document.getElementById("quantity").value.trim();
  const unit = document.getElementById("unit").value;
  const foodType = document.getElementById("foodType").value;
  const location = document.getElementById("location").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const expiry = document.getElementById("expiry").value;

  if (!foodName || !quantity || !location || !contact || !expiry) {
    showToast("Please fill all required fields.", "error");
    return;
  }

  const listing = {
    id: generateId(),
    restaurant: "My Restaurant",
    foodName,
    quantity: `${quantity} ${unit}`,
    foodType,
    location,
    contact,
    expiry,
    status: "pending",
    mealsEstimate: Math.round(parseFloat(quantity) * 2),
    timestamp: Date.now(),
  };

  const listings = getListings();
  listings.unshift(listing);
  saveListings(listings);

  addNotification(
    `Your listing '${foodName}' has been posted successfully!`,
    "new"
  );

  showToast("Food listing added successfully! 🎉", "success");
  document.getElementById("addFoodForm").reset();
  document.getElementById("expiry").min = getTodayDate();

  renderMyListings();
  renderRestaurantStats();
  renderRestaurantNotifications();

  // Scroll to listings
  document
    .getElementById("myListings")
    .scrollIntoView({ behavior: "smooth" });
}

function renderMyListings() {
  const container = document.getElementById("listingsContainer");
  if (!container) return;
  const listings = getListings().filter(
    (l) => l.restaurant === "My Restaurant"
  );

  if (listings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <p>No food listings yet.</p>
        <p class="empty-sub">Add your first listing using the form above!</p>
      </div>`;
    return;
  }

  container.innerHTML = listings
    .map(
      (l) => `
    <div class="card listing-card" data-id="${l.id}">
      <div class="card-header-row">
        <div>
          <h3 class="card-title">${l.foodName}</h3>
          <p class="card-subtitle">${l.quantity} · ${l.foodType}</p>
        </div>
        <div class="card-badges">
          ${statusBadge(l.status)}
          ${
            isExpiringSoon(l.expiry)
              ? '<span class="badge-expiring">🔥 Expiring Soon</span>'
              : ""
          }
        </div>
      </div>
      <div class="card-meta">
        <span>📍 ${l.location}</span>
        <span>📅 Expires: ${l.expiry}</span>
        <span>📞 ${l.contact}</span>
      </div>
      ${
        l.acceptedBy
          ? `<p class="accepted-by">Accepted by: <strong>${l.acceptedBy}</strong></p>`
          : ""
      }
      <div class="card-footer-row">
        <span class="meals-count">🥗 ~${l.mealsEstimate} meals estimated</span>
        <span class="time-ago">${timeAgo(l.timestamp)}</span>
      </div>
    </div>`
    )
    .join("");
}

function renderRestaurantStats() {
  const listings = getListings().filter(
    (l) => l.restaurant === "My Restaurant"
  );
  const totalMeals = listings.reduce((s, l) => s + (l.mealsEstimate || 0), 0);
  const completed = listings.filter((l) => l.status === "completed").length;
  const pending = listings.filter((l) => l.status === "pending").length;

  const el = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  el("statMeals", totalMeals);
  el("statCompleted", completed);
  el("statPending", pending);
  el("impactMeals", totalMeals);
}

function renderRestaurantNotifications() {
  const container = document.getElementById("notifContainer");
  if (!container) return;
  const notifs = getNotifications().slice(0, 5);

  if (notifs.length === 0) {
    container.innerHTML =
      '<p class="empty-sub">No notifications yet.</p>';
    return;
  }

  container.innerHTML = notifs
    .map(
      (n) => `
    <div class="notif-item ${n.read ? "notif-read" : "notif-unread"}">
      <div class="notif-icon">${
        n.type === "accepted"
          ? "✅"
          : n.type === "impact"
          ? "🏆"
          : n.type === "pickup"
          ? "🚚"
          : "🔔"
      }</div>
      <div class="notif-body">
        <p>${n.message}</p>
        <span class="notif-time">${n.time}</span>
      </div>
      ${!n.read ? '<span class="notif-dot"></span>' : ""}
    </div>`
    )
    .join("");
}

// ────────────────────────────────────────────────────────────
//  NGO DASHBOARD
// ────────────────────────────────────────────────────────────
function initNGODashboard() {
  if (!document.getElementById("ngoDash")) return;
  renderAvailableFood();
  renderMyPickups();
  renderNGONotifications();
  renderNGOStats();
}

function renderAvailableFood() {
  const container = document.getElementById("availableFoodContainer");
  if (!container) return;

  const listings = getListings().filter((l) => l.status === "pending");

  if (listings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <p>No food available right now.</p>
        <p class="empty-sub">Check back soon – restaurants update listings throughout the day.</p>
      </div>`;
    return;
  }

  const distances = ["1.2 km", "2.4 km", "3.1 km", "0.8 km", "4.5 km"];

  container.innerHTML = listings
    .map(
      (l, i) => `
    <div class="card food-card" data-id="${l.id}">
      <div class="card-header-row">
        <div>
          <h3 class="card-title">${l.foodName}</h3>
          <p class="card-subtitle">${l.restaurant}</p>
        </div>
        <div class="card-badges">
          <span class="badge-type-${l.foodType === "Veg" ? "veg" : "nonveg"}">${
        l.foodType === "Veg" ? "🟢 Veg" : "🔴 Non-Veg"
      }</span>
          ${
            isExpiringSoon(l.expiry)
              ? '<span class="badge-expiring">🔥 Expiring Soon</span>'
              : ""
          }
        </div>
      </div>
      <div class="card-meta">
        <span>📦 ${l.quantity}</span>
        <span>📍 ${l.location}</span>
        <span>📏 ${distances[i % distances.length]} away</span>
        <span>📅 Expires: ${l.expiry}</span>
      </div>
      <div class="card-footer-row">
        <span class="meals-count">🥗 ~${l.mealsEstimate} meals</span>
        <button class="btn-accept" onclick="acceptFood('${l.id}')">
          Accept Pickup
        </button>
      </div>
    </div>`
    )
    .join("");
}

function acceptFood(id) {
  const listings = getListings();
  const idx = listings.findIndex((l) => l.id === id);
  if (idx === -1) return;

  // Show confirmation popup
  showConfirmPopup(listings[idx].foodName, function () {
    listings[idx].status = "accepted";
    listings[idx].acceptedBy = "Hope Foundation NGO";
    saveListings(listings);

    addNotification(
      `You accepted pickup for '${listings[idx].foodName}' from ${listings[idx].restaurant}`,
      "accepted"
    );
    addNotification(
      `Hope Foundation NGO accepted your listing '${listings[idx].foodName}'`,
      "accepted"
    );

    showToast(`Pickup accepted for ${listings[idx].foodName}! 🚚`, "success");
    renderAvailableFood();
    renderMyPickups();
    renderNGONotifications();
    renderNGOStats();
  });
}

function showConfirmPopup(foodName, onConfirm) {
  const overlay = document.getElementById("confirmOverlay");
  const foodNameEl = document.getElementById("popupFoodName");
  if (!overlay) return;
  if (foodNameEl) foodNameEl.textContent = foodName;

  overlay.classList.add("active");

  document.getElementById("confirmYes").onclick = function () {
    overlay.classList.remove("active");
    onConfirm();
  };
  document.getElementById("confirmNo").onclick = function () {
    overlay.classList.remove("active");
  };
}

function renderMyPickups() {
  const container = document.getElementById("myPickupsContainer");
  if (!container) return;

  const listings = getListings().filter(
    (l) => l.acceptedBy === "Hope Foundation NGO"
  );

  if (listings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <p>No pickups yet.</p>
        <p class="empty-sub">Accept available food to see your pickups here.</p>
      </div>`;
    return;
  }

  container.innerHTML = listings
    .map(
      (l) => `
    <div class="card pickup-card">
      <div class="card-header-row">
        <div>
          <h3 class="card-title">${l.foodName}</h3>
          <p class="card-subtitle">${l.restaurant}</p>
        </div>
        ${statusBadge(l.status)}
      </div>
      <div class="card-meta">
        <span>📦 ${l.quantity}</span>
        <span>📍 ${l.location}</span>
        <span>📞 ${l.contact}</span>
      </div>
      <div class="card-footer-row">
        <span class="meals-count">🥗 ~${l.mealsEstimate} meals</span>
        ${
          l.status === "accepted"
            ? `<button class="btn-progress" onclick="markInProgress('${l.id}')">Mark In Progress</button>`
            : ""
        }
        ${
          l.status === "in-progress"
            ? `<button class="btn-complete" onclick="markCompleted('${l.id}')">Mark Completed</button>`
            : ""
        }
      </div>
    </div>`
    )
    .join("");
}

function markInProgress(id) {
  const listings = getListings();
  const idx = listings.findIndex((l) => l.id === id);
  if (idx === -1) return;
  listings[idx].status = "in-progress";
  saveListings(listings);
  addNotification(
    `Pickup for '${listings[idx].foodName}' is now In Progress 🚚`,
    "pickup"
  );
  showToast("Status updated to In Progress!", "success");
  renderMyPickups();
  renderNGOStats();
}

function markCompleted(id) {
  const listings = getListings();
  const idx = listings.findIndex((l) => l.id === id);
  if (idx === -1) return;
  listings[idx].status = "completed";
  saveListings(listings);
  addNotification(
    `Pickup completed for '${listings[idx].foodName}'! 🏆 You helped serve ${listings[idx].mealsEstimate} meals!`,
    "impact"
  );
  showToast(
    `Amazing! You helped serve ${listings[idx].mealsEstimate} meals! 🏆`,
    "success"
  );
  renderMyPickups();
  renderNGOStats();
}

function renderNGONotifications() {
  const container = document.getElementById("ngoNotifContainer");
  if (!container) return;
  const notifs = getNotifications().slice(0, 6);

  if (notifs.length === 0) {
    container.innerHTML =
      '<p class="empty-sub">No notifications yet.</p>';
    return;
  }

  container.innerHTML = notifs
    .map(
      (n) => `
    <div class="notif-item ${n.read ? "notif-read" : "notif-unread"}">
      <div class="notif-icon">${
        n.type === "accepted"
          ? "✅"
          : n.type === "impact"
          ? "🏆"
          : n.type === "pickup"
          ? "🚚"
          : "🔔"
      }</div>
      <div class="notif-body">
        <p>${n.message}</p>
        <span class="notif-time">${n.time}</span>
      </div>
      ${!n.read ? '<span class="notif-dot"></span>' : ""}
    </div>`
    )
    .join("");
}

function renderNGOStats() {
  const listings = getListings();
  const myPickups = listings.filter(
    (l) => l.acceptedBy === "Hope Foundation NGO"
  );
  const completed = myPickups.filter((l) => l.status === "completed");
  const totalMeals = completed.reduce(
    (s, l) => s + (l.mealsEstimate || 0),
    0
  );
  const available = listings.filter((l) => l.status === "pending").length;

  const el = (id, val) => {
    const e = document.getElementById(id);
    if (e) e.textContent = val;
  };
  el("ngoStatMeals", totalMeals);
  el("ngoStatPickups", myPickups.length);
  el("ngoStatAvailable", available);
  el("ngoImpactMeals", totalMeals);
}

// ── Toast notification ───────────────────────────────────────
function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("toast-show"), 10);
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Mobile menu toggle ───────────────────────────────────────
function initMobileMenu() {
  const btn = document.getElementById("mobileMenuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      menu.classList.toggle("hidden");
    });
  }
}

// ── Smooth scroll for anchor links ──────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
        // Close mobile menu if open
        const menu = document.getElementById("mobileMenu");
        if (menu) menu.classList.add("hidden");
      }
    });
  });
}

// ── Animated counter for homepage ────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count);
          let current = 0;
          const step = Math.ceil(target / 60);
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current + (el.dataset.suffix || "");
            if (current >= target) clearInterval(timer);
          }, 25);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => observer.observe(c));
}

// ── Navbar scroll effect ─────────────────────────────────────
function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("navbar-scrolled");
    } else {
      navbar.classList.remove("navbar-scrolled");
    }
  });
}

// ── Tab switching (dashboard) ────────────────────────────────
function initTabs() {
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      const group = btn.dataset.group || "default";

      // Deactivate all tabs in group
      document
        .querySelectorAll(`[data-tab][data-group="${group}"]`)
        .forEach((b) => b.classList.remove("tab-active"));
      document
        .querySelectorAll(`[data-panel][data-group="${group}"]`)
        .forEach((p) => p.classList.add("hidden"));

      // Activate selected
      btn.classList.add("tab-active");
      const panel = document.querySelector(
        `[data-panel="${target}"][data-group="${group}"]`
      );
      if (panel) panel.classList.remove("hidden");
    });
  });
}

// ── Init everything on DOM ready ────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  initMobileMenu();
  initSmoothScroll();
  animateCounters();
  initNavbarScroll();
  initTabs();
  initRestaurantDashboard();
  initNGODashboard();
});
