const assets = [];
const discoveryPoints = [];
const discoveryDates = [];
const root = document.getElementById("view-root"),
  toast = document.getElementById("toast"),
  breadcrumb = document.getElementById("breadcrumb");
const themeToggle = document.getElementById("themeToggle");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const sidebarToggle = document.getElementById("sidebarToggle");
const scrollToTopButton = document.createElement("button");
scrollToTopButton.className = "scroll-to-top";
scrollToTopButton.type = "button";
scrollToTopButton.setAttribute("aria-label", "Scroll to top");
scrollToTopButton.title = "Scroll to top";
scrollToTopButton.textContent = "↑";
document.body.appendChild(scrollToTopButton);
const pageLoader = document.createElement("div");
pageLoader.className = "page-loader";
pageLoader.setAttribute("aria-live", "polite");
pageLoader.innerHTML =
  '<div class="loader-core"><span class="loader-ring"></span><span>Loading</span></div>';
document.body.appendChild(pageLoader);
// Show the loading cover while the next page is opening.
function showPageLoader() {
  pageLoader.classList.add("visible");
}
// Hide the loading cover and clear the saved loading flag.
function hidePageLoader() {
  pageLoader.classList.remove("visible");
  sessionStorage.removeItem("sencyc-page-loading");
}
if (sessionStorage.getItem("sencyc-page-loading") === "true") showPageLoader();
// Keep the sidebar buttons and screen reader labels in sync with the sidebar.
function updateSidebarToggleState() {
  const isOpen = sidebar && sidebar.classList.contains("open");
  if (sidebarToggle) {
    sidebarToggle.setAttribute(
      "aria-label",
      isOpen ? "Expand navigation" : "Collapse navigation",
    );
    sidebarToggle.title = isOpen ? "Expand navigation" : "Collapse navigation";
  }
  if (mobileSidebarToggle) {
    mobileSidebarToggle.setAttribute("aria-expanded", String(isOpen));
    mobileSidebarToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
    mobileSidebarToggle.title = isOpen
      ? "Close navigation menu"
      : "Open navigation menu";
  }
}
// closeSidebar hides the menu and saves its collapsed state.
function closeSidebar() {
  sidebar.classList.add("collapsed");
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("visible");
  localStorage.setItem("sencyc-sidebar-collapsed", "true");
  updateSidebarToggleState();
}
// openSidebar shows the menu and saves its open state.
function openSidebar() {
  sidebar.classList.remove("collapsed");
  sidebar.classList.add("open");
  localStorage.setItem("sencyc-sidebar-collapsed", "false");
  if (window.innerWidth <= 900) sidebarBackdrop.classList.add("visible");
  updateSidebarToggleState();
}
// setTheme applies the selected color theme and saves it for the next visit.
function setTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("sencyc-theme", theme);
  scrollToTopButton.style.background = dark ? "#18a9a0" : "#14a29b";
  scrollToTopButton.style.color = "#ffffff";
  if (themeToggle) {
    themeToggle.title = dark ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.innerHTML = `<span class="theme-icon">${dark ? "☀" : "☾"}</span><span class="theme-label">${dark ? "Light mode" : "Dark mode"}</span>`;
  }
}
// Add the show-more control to the overview dashboard.
function setupOverviewDetails() {
  if (document.body.dataset.page !== "overview") return;
  const dashboard = document.querySelector(".dashboard-grid");
  const table = document.querySelector(".table-panel");
  if (!dashboard || !table) return;
  dashboard.classList.add("overview-extra", "is-hidden");
  table.classList.add("overview-extra", "is-hidden");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "show-more";
  toggle.innerHTML =
    '<span>Show more</span><span class="show-more-icon" aria-hidden="true"></span>';
  toggle.setAttribute("aria-expanded", "false");
  dashboard.parentElement.insertBefore(toggle, dashboard);
  toggle.onclick = () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.innerHTML = expanded
      ? '<span>Show more</span><span class="show-more-icon" aria-hidden="true"></span>'
      : '<span>Show less</span><span class="show-more-icon is-up" aria-hidden="true"></span>';
    dashboard.classList.toggle("is-hidden", expanded);
    table.classList.toggle("is-hidden", expanded);
    if (expanded) {
      dashboard.parentElement.insertBefore(toggle, dashboard);
    } else {
      table.insertAdjacentElement("afterend", toggle);
    }
  };
}
setTheme(localStorage.getItem("sencyc-theme") || "dark");
themeToggle.onclick = () =>
  setTheme(
    document.documentElement.dataset.theme === "dark" ? "light" : "dark",
  );
// setupMobileToggle connects the mobile menu button to the sidebar.
function setupMobileToggle() {
  const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
  if (!mobileSidebarToggle) return;
  mobileSidebarToggle.onclick = () => {
    const shouldOpen = !sidebar.classList.contains("open");
    if (shouldOpen) openSidebar();
    else closeSidebar();
  };
  // ensure ARIA state matches current sidebar
  mobileSidebarToggle.setAttribute(
    "aria-expanded",
    String(sidebar.classList.contains("open")),
  );
}
document.addEventListener("DOMContentLoaded", setupMobileToggle);
// also try immediately in case the element is already present
setupMobileToggle();
if (sidebarToggle) {
  sidebarToggle.onclick = () =>
    window.innerWidth <= 900
      ? sidebar.classList.contains("open")
        ? closeSidebar()
        : openSidebar()
      : sidebar.classList.contains("collapsed")
        ? openSidebar()
        : closeSidebar();
}
updateSidebarToggleState();
// notify shows a short message at the bottom of the page.
function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
// stat builds the HTML for one dashboard number card.
function stat(label, value, trend, icon, down = false) {
  return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><span class="trend ${down ? "down" : ""}">${trend}</span></div>`;
}
// discoveryChart builds the chart from the saved discovery data.
function discoveryChart() {
  return `<div class="chart-summary"><span><b>—</b> assets discovered</span><span class="chart-change">No scan data</span></div><div class="chart-shell"><div class="chart-y-axis"><span>—</span><span>—</span><span>—</span><span>—</span><span>0</span></div><div class="chart-area"><div class="chart"></div><div class="chart-labels"></div></div></div><div class="chart-legend"><span><i class="legend-dot"></i>Scan results will appear here when available</span></div>`;
}
// assetRows builds table rows for the given list of assets.
function assetRows(list = assets) {
  return list
    .map(
      (a) =>
        `<tr><td><a class="asset-link" href="#asset/${encodeURIComponent(a.name)}" data-open="${a.name}"><div class="asset-name">${a.name}</div></a><div class="asset-type">${a.type}</div></td><td>${a.ip}</td><td>${a.port}</td><td>${a.tech}</td><td><span class="pill ${a.risk.toLowerCase()}">${a.risk}</span></td><td><span class="pill active">${a.status}</span></td></tr>`,
    )
    .join("");
}
// assetDetail builds the detail page for one asset.
function assetDetail(name) {
  return `<div class="page asset-detail-page"><div class="detail-back"><a href="assets.html">← Back to assets</a></div><section class="panel empty"><strong>No asset data</strong>Asset details will appear when scan results are stored.</section></div>`;
}
// overview builds the main dashboard page.
function overview() {
  return `<div class="page"><div class="page-heading"><div><span class="eyebrow">Security overview</span><h1>Security overview</h1><p class="subtitle">Your attack surface overview.</p></div></div><section class="search-hero"><span class="eyebrow">Asset discovery</span><h2>Search your attack surface</h2><p>Search scan history by IP address or port.</p><div class="search-box"><input id="hero-search" placeholder="Enter an IP address or port"><select id="hero-search-limit" class="search-limit" title="Results limit"><option value="50">50 results</option><option value="100">100 results</option><option value="500">500 results</option></select><button class="button" data-search>Search</button></div></section><div class="stats-grid inventory-stats">${stat("Hosts", "—", "No data", "◈")}${stat("Open ports", "—", "No data", "⌁")}${stat("Certificates", "—", "No data", "◇")}${stat("Technologies", "—", "No data", "▦")}${stat("Domains", "—", "No data", "◎")}${stat("Findings", "—", "No data", "△")}</div><div class="dashboard-grid"><section class="panel"><div class="panel-header"><span class="panel-title">Asset discovery</span><span class="muted-link">No scan data</span></div>${discoveryChart()}</section><section class="panel"><div class="panel-header"><span class="panel-title">Recent activity</span></div><div class="panel empty">Scan activity will appear here when available.</div></section></div><section class="panel table-panel"><div class="panel-header"><span class="panel-title">Recently discovered assets</span><span class="muted-link" data-view-link="assets">View all assets →</span></div><div class="table-wrap"><table><thead><tr><th>Asset</th><th>IP address</th><th>Open ports</th><th>Technologies</th><th>Risk</th><th>Status</th></tr></thead><tbody><tr><td colspan="6" class="muted-link">No scan results available.</td></tr></tbody></table></div></section></div>`;
}
// listView builds either the asset table or the findings table.
function listView(title, subtitle, kind) {
  const isFind = kind === "findings";
  return `<div class="page"><div class="page-heading"><div><span class="eyebrow">${isFind ? "Risk management" : "Asset inventory"}</span><h1>${title}</h1><p class="subtitle">${subtitle}</p></div></div><div class="stats-grid">${stat(isFind ? "Open findings" : "Total assets", "—", "No data", "◈")}${stat("Critical", "—", "No data", "△")}${stat(isFind ? "Resolved this month" : "New this week", "—", "No data", "✦")}${stat("Monitored", "—", "No data", "✓")}</div><section class="panel table-panel"><div class="page-toolbar"><input class="filter-input" id="table-filter" placeholder="⌕  Filter ${isFind ? "findings" : "assets"}..." disabled><button class="button secondary small" disabled>${dropdown("All types")}</button><button class="button secondary small" disabled>${dropdown("Risk")}</button><span class="toolbar-spacer"></span><button class="button secondary small" data-action="export" disabled>Export CSV</button></div><div class="results-info">No scan results available.</div><div class="table-wrap"><table><thead><tr><th>${isFind ? "Finding" : "Asset"}</th><th>${isFind ? "Affected asset" : "IP address"}</th><th>${isFind ? "Category" : "Open ports"}</th><th>${isFind ? "Detected" : "Technologies"}</th><th>Risk</th><th>Status</th></tr></thead><tbody id="data-rows"><tr><td colspan="6" class="muted-link">No scan results available.</td></tr></tbody></table></div></section></div>`;
}
// dropdown builds the label and icon used by a menu control.
function dropdown(label) {
  return `<span class="dropdown-label">${label}</span><span class="dropdown-icon" aria-hidden="true"></span>`;
}
// Search scan history through the independent FastAPI data service.
const DATA_API = (
  window.SENCYC_API_BASE || "/api"
).replace(/\/$/, "");
const escapeSearchHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const formatSearchDate = (value) =>
  value ? new Date(value).toLocaleString() : "—";
async function searchDatabase(query, limit) {
  const status = document.getElementById("search-result-status");
  const body = document.getElementById("search-results");
  if (!status || !body) return;
  status.textContent = `Searching PostgreSQL for “${query}”…`;
  body.innerHTML =
    '<tr><td colspan="5" class="muted-link">Loading matching scan records…</td></tr>';
  try {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await fetch(`${DATA_API}/search?${params}`);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.detail || `API error ${response.status}`);
    status.textContent = data.length
      ? `${data.length} matching scan record${data.length === 1 ? "" : "s"} for “${query}”`
      : `No scan records matched “${query}”.`;
    body.innerHTML = data.length
      ? data
          .map(
            (row) =>
              `<tr><td>${escapeSearchHtml(row.ip)}</td><td>${row.port}</td><td>${escapeSearchHtml(row.protocol)}</td><td><span class="pill active">${escapeSearchHtml(row.state)}</span></td><td>${escapeSearchHtml(formatSearchDate(row.scanned_at))}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="5" class="muted-link">No matching database records.</td></tr>';
  } catch (error) {
    status.textContent = "Could not load search results.";
    body.innerHTML = `<tr><td colspan="5" class="muted-link">${escapeSearchHtml(error.message)}</td></tr>`;
  }
}
function searchView(query = "") {
  const initialQuery =
    query || new URLSearchParams(window.location.search).get("query") || "";
  const safeQuery = escapeSearchHtml(initialQuery);
  return `<div class="page"><div class="page-heading"><div><span class="eyebrow">Discovery</span><h1>Global search</h1><p class="subtitle">Search scan history by IP address or port.</p></div></div><section class="panel" style="margin-bottom:18px"><div class="search-box" style="border:1px solid var(--line);max-width:none"><input id="global-search" value="${safeQuery}" placeholder="Enter an IP address or port"><select id="global-search-limit" class="search-limit" title="Results limit"><option value="10">10 results</option><option value="25">25 results</option><option value="50" selected>50 results</option><option value="100">100 results</option><option value="250">250 results</option><option value="500">500 results</option></select><button class="button" data-search type="button">Search</button></div></section><section class="panel table-panel"><div class="panel-header"><span class="panel-title">Database search results</span></div><div class="results-info" id="search-result-status">${initialQuery ? "Loading search results…" : "Enter an IP address or port, then click Search."}</div><div class="table-wrap"><table><thead><tr><th>IP address</th><th>Port</th><th>Protocol</th><th>State</th><th>Observed at</th></tr></thead><tbody id="search-results"><tr><td colspan="5" class="muted-link">No search submitted yet.</td></tr></tbody></table></div></section></div>`;
}
// simplePage builds a page with a heading and supplied page content.
function simplePage(title, subtitle, eyebrow, body) {
  return `<div class="page"><div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><button class="button" data-action="create">+ Create new</button></div>${body}</div>`;
}
// render chooses a page, puts it on screen and connects its controls.
function render(view, extra = "") {
  let html =
    view === "asset-detail"
      ? assetDetail(extra)
      : view === "overview"
        ? overview()
        : view === "search"
          ? searchView(extra)
          : view === "assets"
            ? listView(
                "Assets",
                "Discover and manage everything exposed across your organization.",
                "Asset inventory",
                "assets",
              )
            : view === "findings"
              ? listView(
                  "Findings",
                  "Prioritize and remediate risks across your attack surface.",
                  "Risk management",
                  "findings",
                )
              : view === "watchlists"
                ? simplePage(
                    "Watchlists",
                    "Monitor saved searches and get notified when they change.",
                    "Continuous monitoring",
                    `<section class="panel empty"><strong>No watchlists</strong></section>`,
                  )
                : view === "alerts"
                  ? simplePage(
                      "Alerts",
                      "Stay informed when important changes happen.",
                      "Notifications",
                      `<section class="panel empty"><strong>No alerts</strong></section>`,
                    )
                  : view === "reports"
                    ? simplePage(
                        "Reports",
                        "Create and schedule security reports for your team.",
                        "Insights",
                        `<section class="panel empty"><strong>No reports generated</strong>Build an executive summary or detailed asset report in a few clicks.<br><br><button class="button" data-action="create">Generate a report</button></section>`,
                      )
                    : view === "integrations"
                      ? simplePage(
                          "Integrations",
                          "Connect Sencyc to the tools your team already uses.",
                          "Connections",
                          `<section class="panel empty"><strong>No integrations configured</strong></section>`,
                        )
                      : `<div class="page"><div class="page-heading"><div><span class="eyebrow">Workspace</span><h1>Settings</h1><p class="subtitle">Manage your profile, workspace, and notification preferences.</p></div></div><div class="settings-layout"><section class="panel settings-menu"><button class="active">Profile</button><button>Workspace</button><button>Notifications</button><button>Security</button><button>API keys</button><button>Audit log</button></section><section class="panel"><div class="panel-header"><span class="panel-title">Profile information</span><button class="button small" data-action="save">Save changes</button></div><div class="form-row"><div class="form-group"><label>First name</label><input value=""></div><div class="form-group"><label>Last name</label><input value=""></div></div><div class="form-group"><label>Email address</label><input value=""></div><div class="form-group"><label>Role</label><input value="" disabled></div></section></div></div>`;
  root.innerHTML = html;
  breadcrumb.textContent =
    view === "asset-detail"
      ? "Asset details"
      : view[0].toUpperCase() + view.slice(1);
  document
    .querySelectorAll(".nav-item")
    .forEach((item) =>
      item.classList.toggle("active", item.dataset.view === view),
    );
  bind();
}
// bind connects buttons, links and filters on the page to their actions.
function bind() {
  const currentView = document.body.dataset.page || "overview";
  const pagePrefix = window.location.pathname.includes("/pages/")
    ? ""
    : "pages/";
  document
    .querySelectorAll("[data-view]")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.view === currentView),
    );
  document.querySelectorAll("[data-view-link]").forEach(
    (e) =>
      (e.onclick = () => {
        if (e.dataset.viewLink === "assets")
          window.location.href = `${pagePrefix}assets.html`;
      }),
  );
  document
    .querySelectorAll("[data-action]")
    .forEach((e) => (e.onclick = () => notify("This action is unavailable.")));
  document.querySelectorAll("[data-query]").forEach(
    (e) =>
      (e.onclick = () => {
        const input = document.querySelector("#global-search");
        if (input) {
          input.value = e.dataset.query;
          input.focus();
        }
      }),
  );
  document.querySelectorAll("[data-search]").forEach((button) => {
    const submitSearch = () => {
      const input = document.querySelector("#global-search, #hero-search");
      const query = readSearchQuery(input);
      if (!query) return;
      const limitSelect = document.querySelector(
        "#global-search-limit, #hero-search-limit",
      );
      const limit = limitSelect ? limitSelect.value : "50";
      if (currentView === "search") {
        const url = new URL(window.location.href);
        url.searchParams.set("query", query);
        url.searchParams.set("limit", limit);
        window.history.replaceState({}, "", url);
        searchDatabase(query, limit);
      } else {
        window.location.href = `${pagePrefix}search.html?query=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`;
      }
    };
    button.onclick = submitSearch;
    const input = document.querySelector("#global-search, #hero-search");
    if (input)
      input.onkeydown = (event) => {
        if (event.key === "Enter") submitSearch();
      };
  });
  if (currentView === "search") {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("query");
    if (initialQuery) searchDatabase(initialQuery, params.get("limit") || "50");
  }
  document.querySelectorAll("[data-open]").forEach(
    (e) =>
      (e.onclick = (event) => {
        event.preventDefault();
        window.location.hash = `asset/${encodeURIComponent(e.dataset.open)}`;
        render("asset-detail", e.dataset.open);
      }),
  );
  const filter = document.getElementById("table-filter");
  if (filter)
    filter.oninput = () => {
      const term = filter.value.toLowerCase();
      document
        .querySelectorAll("#data-rows tr")
        .forEach(
          (row) =>
            (row.style.display = row.textContent.toLowerCase().includes(term)
              ? ""
              : "none"),
        );
    };
}
document.querySelectorAll(".nav-item").forEach((item) =>
  item.addEventListener("click", () => {
    sessionStorage.setItem("sencyc-page-loading", "true");
    showPageLoader();
  }),
);
document.querySelectorAll(".nav-section-toggle").forEach((toggle) => {
  toggle.onclick = () => {
    const section = toggle.closest(".nav-section");
    const isOpen = section.classList.toggle("open");
    localStorage.setItem(`sencyc-${section.dataset.section}-open`, isOpen);
    toggle.setAttribute("aria-expanded", isOpen);
    toggle.querySelector(".nav-section-icon").classList.toggle("is-up", isOpen);
  };
});
sidebarToggle.onclick = () =>
  window.innerWidth <= 900
    ? sidebar.classList.contains("open")
      ? closeSidebar()
      : openSidebar()
    : sidebar.classList.contains("collapsed")
      ? openSidebar()
      : closeSidebar();
sidebarBackdrop.onclick = closeSidebar;
// Show the scroll button after the page moves down.
window.addEventListener("scroll", () => {
  scrollToTopButton.classList.toggle("visible", window.scrollY > 80);
});
scrollToTopButton.onclick = () =>
  window.scrollTo({ top: 0, behavior: "smooth" });
const initialHash = decodeURIComponent(
  window.location.hash.replace(/^#asset\//, ""),
);
if (window.location.hash.startsWith("#asset/"))
  render("asset-detail", initialHash);
else render(document.body.dataset.page || "overview");
setupOverviewDetails();
requestAnimationFrame(() => setTimeout(hidePageLoader, 180));
// Open the selected asset when the address hash changes.
window.addEventListener("hashchange", () => {
  if (window.location.hash.startsWith("#asset/"))
    render(
      "asset-detail",
      decodeURIComponent(window.location.hash.replace(/^#asset\//, "")),
    );
});
