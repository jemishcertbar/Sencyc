const root = document.getElementById("view-root");
const breadcrumb = document.getElementById("breadcrumb");
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
    themeToggle.innerHTML = `<span class="theme-icon">${dark ? "☀" : "☾"}</span><span class="theme-label">${dark ? "Light Mode" : "Dark Mode"}</span>`;
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
// stat builds the HTML for one dashboard number card.
function stat(label, value, trend, icon, down = false) {
  return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><span class="trend ${down ? "down" : ""}">${trend}</span></div>`;
}
// discoveryChart builds the chart from the saved discovery data.
function discoveryChart() {
  return `<div class="chart-summary"><span><b>—</b> assets discovered</span><span class="chart-change">No scan data</span></div><div class="chart-shell"><div class="chart-y-axis"><span>—</span><span>—</span><span>—</span><span>—</span><span>0</span></div><div class="chart-area"><div class="chart"></div><div class="chart-labels"></div></div></div><div class="chart-legend"><span><i class="legend-dot"></i>Scan results will appear here when available</span></div>`;
}
// overview builds the main dashboard page.
function overview() {
  return `<div class="page"><div class="page-heading"><div><span class="eyebrow">Security overview</span><h1>Security overview</h1><p class="subtitle">Your attack surface overview.</p></div></div><section class="search-hero"><span class="eyebrow">Asset discovery</span><h2>Search your attack surface</h2><p>Search scan history by IP address or port.</p><div class="search-box"><input id="hero-search" placeholder="Enter an IP address or port"><button class="button" data-search>Search</button></div></section><div class="stats-grid inventory-stats">${stat("Hosts", "—", "No data", "◈")}${stat("Open ports", "—", "No data", "⌁")}${stat("Certificates", "—", "No data", "◇")}${stat("Technologies", "—", "No data", "▦")}${stat("Domains", "—", "No data", "◎")}${stat("Findings", "—", "No data", "△")}</div><div class="dashboard-grid"><section class="panel"><div class="panel-header"><span class="panel-title">Asset discovery</span><span class="muted-link">No scan data</span></div>${discoveryChart()}</section><section class="panel"><div class="panel-header"><span class="panel-title">Recent activity</span></div><div class="panel empty">Scan activity will appear here when available.</div></section></div><section class="panel table-panel"><div class="panel-header"><span class="panel-title">Recently discovered assets</span><span class="muted-link">Latest scan results</span></div><div class="table-wrap"><table><thead><tr><th>Asset</th><th>IP address</th><th>Open ports</th><th>Technologies</th><th>Risk</th><th>Status</th></tr></thead><tbody><tr><td colspan="6" class="muted-link">No scan results available.</td></tr></tbody></table></div></section></div>`;
}
// Search scan history through the independent FastAPI data service.
const DATA_API = (window.SENCYC_API_BASE || "/api").replace(/\/$/, "");
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
function updateTimelineFade(timeline) {
  const wrapper = timeline?.closest(".ip-history-scroll");
  if (!wrapper) return;
  const hasBefore = timeline.scrollTop > 2;
  const hasMore =
    timeline.scrollHeight > timeline.clientHeight + 1 &&
    timeline.scrollTop + timeline.clientHeight < timeline.scrollHeight - 2;
  wrapper.classList.toggle("has-before", hasBefore);
  wrapper.classList.toggle("has-more", hasMore);
}
async function searchDatabase(query) {
  const status = document.getElementById("search-result-status");
  const body = document.getElementById("search-results");
  if (!status || !body) return;
  status.textContent = `Searching PostgreSQL for “${query}”…`;
  body.innerHTML =
    '<tr><td colspan="5" class="muted-link">Loading matching scan records…</td></tr>';
  try {
    const page = Number(
      document.getElementById("search-page")?.dataset.page || 1,
    );
    const params = new URLSearchParams({
      q: query,
      limit: "500",
    });
    const response = await fetch(`${DATA_API}/search?${params}`);
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.detail || `API error ${response.status}`);
    const rowsFromApi = Array.isArray(payload) ? payload : payload.results;
    if (!Array.isArray(rowsFromApi))
      throw new Error("Unexpected search response from API.");
    const total = Array.isArray(payload) ? rowsFromApi.length : payload.total;
    const totalPages = Math.ceil(total / 10);
    const hasNextPage = page < totalPages;
    const rows = rowsFromApi.slice((page - 1) * 10, page * 10);
    status.textContent = rows.length
      ? `Showing ${(page - 1) * 10 + 1}–${(page - 1) * 10 + rows.length} results for “${query}”`
      : `No scan records matched “${query}”.`;
    body.innerHTML = rows.length
      ? rows
        .map((row) => {
          const ip = String(row.ip ?? "");
          const detailUrl = new URL(
            "asset-details.html",
            window.location.href,
          );
          detailUrl.searchParams.set("ip", ip);
          return `<tr><td><a href="${detailUrl.href}">${escapeSearchHtml(ip)}</a></td><td>${row.port}</td><td>${escapeSearchHtml(row.protocol)}</td><td><span class="pill active">${escapeSearchHtml(row.state)}</span></td><td>${escapeSearchHtml(formatSearchDate(row.scanned_at))}</td></tr>`;
        })
        .join("")
      : '<tr><td colspan="5" class="muted-link">No matching database records.</td></tr>';
    const pagination = document.getElementById("search-pagination");
    if (pagination)
      pagination.innerHTML = rows.length
        ? `<button class="button secondary small" data-page-prev ${page <= 1 ? "disabled" : ""}>Previous</button><span>Page ${page} of ${totalPages}</span><button class="button secondary small" data-page-next ${hasNextPage ? "" : "disabled"}>Next</button>`
        : "";
    pagination
      ?.querySelector("[data-page-prev]")
      ?.addEventListener("click", () => {
        document.getElementById("search-page").dataset.page = String(page - 1);
        searchDatabase(query);
      });
    pagination
      ?.querySelector("[data-page-next]")
      ?.addEventListener("click", () => {
        document.getElementById("search-page").dataset.page = String(page + 1);
        searchDatabase(query);
      });
  } catch (error) {
    status.textContent = "Could not load search results.";
    body.innerHTML = `<tr><td colspan="5" class="muted-link">${escapeSearchHtml(error.message)}</td></tr>`;
  }
}
async function loadIpDetails(ip) {
  const status = document.getElementById("ip-detail-status");
  const body = document.getElementById("ip-detail-rows");
  if (!status || !body) return;
  if (!ip) {
    status.textContent = "No IP address was provided.";
    body.innerHTML =
      '<tr><td colspan="4" class="muted-link">Open Asset details from a Search result.</td></tr>';
    const timeline = document.getElementById("ip-history-timeline");
    if (timeline)
      timeline.innerHTML =
        '<p class="muted-link">No IP address was provided.</p>';
    return;
  }
  document.getElementById("ip-address").textContent = ip;
  try {
    const params = new URLSearchParams({ ip });
    const response = await fetch(`${DATA_API}/asset-details?${params}`);
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.detail || `API error ${response.status}`);
    const rows = payload;
    if (!Array.isArray(rows))
      throw new Error("Unexpected asset details response from API.");
    const dates = rows
      .map((row) => row.scanned_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a));
    document.getElementById("ip-port-count").textContent = String(
      new Set(rows.map((row) => row.port)).size,
    );
    document.getElementById("ip-last-seen").textContent = dates.length
      ? escapeSearchHtml(formatSearchDate(dates[0]))
      : "—";
    status.textContent = rows.length
      ? `${rows.length} scan record${rows.length === 1 ? "" : "s"} found for this IP.`
      : "No scan records found for this IP.";
    body.innerHTML = rows.length
      ? rows
        .map(
          (row) =>
            `<tr><td>${row.port}</td><td>${escapeSearchHtml(row.protocol)}</td><td><span class="pill active">${escapeSearchHtml(row.state)}</span></td><td>${escapeSearchHtml(formatSearchDate(row.scanned_at))}</td></tr>`,
        )
        .join("")
      : '<tr><td colspan="4" class="muted-link">No port information available.</td></tr>';
    const timeline = document.getElementById("ip-history-timeline");
    if (timeline && !timeline.dataset.fadeBound) {
      timeline.addEventListener("scroll", () => updateTimelineFade(timeline), { passive: true });
      timeline.dataset.fadeBound = "true";
    }
    const history = [...rows].sort(
      (a, b) => new Date(a.scanned_at) - new Date(b.scanned_at),
    );
    if (timeline)
      timeline.innerHTML = history.length
        ? history
          .map(
            (row) =>
              `<article class="ip-history-item"><time>${escapeSearchHtml(formatSearchDate(row.scanned_at))}</time><strong>Port ${row.port}</strong><span class="ip-history-meta"><span>${escapeSearchHtml(row.protocol)}</span><span class="pill active">${escapeSearchHtml(row.state)}</span></span></article>`,
          )
          .join("")
        : '<p class="muted-link">No history available for this IP yet.</p>';
    requestAnimationFrame(() => updateTimelineFade(timeline));
  } catch (error) {
    status.textContent = "Could not load IP details.";
    body.innerHTML = `<tr><td colspan="4" class="muted-link">${escapeSearchHtml(error.message)}</td></tr>`;
    const timeline = document.getElementById("ip-history-timeline");
    if (timeline)
      timeline.innerHTML = `<p class="muted-link">${escapeSearchHtml(error.message)}</p>`;
  }
}
async function loadMonitor(page = 1) {
  const status = document.getElementById("monitor-status");
  const body = document.getElementById("monitor-results");
  if (!status || !body) return;
  const pageSize = 25;
  status.textContent = "Loading monitored hosts…";
  try {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });
    const response = await fetch(`${DATA_API}/monitor?${params}`);
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.detail || `API error ${response.status}`);
    if (!Array.isArray(payload.results))
      throw new Error("Unexpected monitor response from API.");
    const rows = payload.results;
    const total = Number(payload.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    status.textContent = total
      ? `Showing ${(page - 1) * pageSize + 1}–${Math.min((page - 1) * pageSize + rows.length, total)} of ${total} monitored hosts.`
      : "No monitored hosts are available yet.";
    body.innerHTML = rows.length
      ? rows
        .map(
          (row) =>
            `<tr><td>${escapeSearchHtml(row.ip)}</td><td>${row.open_ports}</td><td>${escapeSearchHtml(formatSearchDate(row.last_seen))}</td></tr>`,
        )
        .join("")
      : '<tr><td colspan="3" class="muted-link">No scan observations found.</td></tr>';
    const pagination = document.getElementById("monitor-pagination");
    if (pagination)
      pagination.innerHTML =
        totalPages > 1
          ? `<button class="button secondary small" data-monitor-prev ${page <= 1 ? "disabled" : ""}>Previous</button><span>Page ${page} of ${totalPages}</span><button class="button secondary small" data-monitor-next ${page >= totalPages ? "disabled" : ""}>Next</button>`
          : "";
    pagination
      ?.querySelector("[data-monitor-prev]")
      ?.addEventListener("click", () => loadMonitor(page - 1));
    pagination
      ?.querySelector("[data-monitor-next]")
      ?.addEventListener("click", () => loadMonitor(page + 1));
  } catch (error) {
    status.textContent = "Could not load monitored hosts.";
    body.innerHTML = `<tr><td colspan="3" class="muted-link">${escapeSearchHtml(error.message)}</td></tr>`;
  }
}

async function loadHistory(page = 1) {
  const status = document.getElementById("history-status");
  const body = document.getElementById("history-results");
  if (!status || !body) return;
  const pageSize = 25;
  status.textContent = "Loading scan history…";
  try {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });
    const response = await fetch(`${DATA_API}/history?${params}`);
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.detail || `API error ${response.status}`);
    if (!Array.isArray(payload.results))
      throw new Error("Unexpected history response from API.");
    const rows = payload.results;
    const total = Number(payload.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    status.textContent = total
      ? `Showing ${(page - 1) * pageSize + 1}–${Math.min((page - 1) * pageSize + rows.length, total)} of ${total} scan observations.`
      : "No scan history is available yet.";
    body.innerHTML = rows.length
      ? rows
        .map(
          (row) =>
            `<tr><td>${escapeSearchHtml(row.ip)}</td><td>${row.port}</td><td>${escapeSearchHtml(row.protocol)}</td><td><span class="pill active">${escapeSearchHtml(row.state)}</span></td><td>${escapeSearchHtml(formatSearchDate(row.scanned_at))}</td></tr>`,
        )
        .join("")
      : '<tr><td colspan="5" class="muted-link">No scan observations found.</td></tr>';
    const pagination = document.getElementById("history-pagination");
    if (pagination)
      pagination.innerHTML =
        totalPages > 1
          ? `<button class="button secondary small" data-history-prev ${page <= 1 ? "disabled" : ""}>Previous</button><span>Page ${page} of ${totalPages}</span><button class="button secondary small" data-history-next ${page >= totalPages ? "disabled" : ""}>Next</button>`
          : "";
    pagination
      ?.querySelector("[data-history-prev]")
      ?.addEventListener("click", () => loadHistory(page - 1));
    pagination
      ?.querySelector("[data-history-next]")
      ?.addEventListener("click", () => loadHistory(page + 1));
  } catch (error) {
    status.textContent = "Could not load scan history.";
    body.innerHTML = `<tr><td colspan="5" class="muted-link">${escapeSearchHtml(error.message)}</td></tr>`;
  }
}

function searchView(query = "") {
  const initialQuery =
    query || new URLSearchParams(window.location.search).get("query") || "";
  const safeQuery = escapeSearchHtml(initialQuery);
  return `<div class="page"><div class="page-heading"><div><span class="eyebrow">Discovery</span><h1>Global search</h1><p class="subtitle">Search scan history by IP address or port.</p></div></div><section class="panel" style="margin-bottom:18px"><div class="search-box" style="border:1px solid var(--line);max-width:none"><input id="global-search" value="${safeQuery}" placeholder="Enter an IP address or port"><button class="button" data-search type="button">Search</button></div></section><section class="panel table-panel"><div class="panel-header"><span class="panel-title">Database search results</span></div><div class="results-info" id="search-result-status">${initialQuery ? "Loading search results…" : "Enter an IP address or port, then click Search."}</div><div class="table-wrap"><table><thead><tr><th>IP address</th><th>Port</th><th>Protocol</th><th>State</th><th>Observed at</th></tr></thead><tbody id="search-results"><tr><td colspan="5" class="muted-link">No search submitted yet.</td></tr></tbody></table></div><div id="search-pagination" class="search-pagination"></div><span id="search-page" data-page="1" hidden></span></section></div>`;
}
// render chooses a page, puts it on screen and connects its controls.
function render(view, extra = "") {
  if (view === "asset-details") {
    breadcrumb.textContent = "Asset details";
    document
      .querySelectorAll(".nav-item")
      .forEach((item) =>
        item.classList.toggle("active", item.dataset.view === "search"),
      );
    loadIpDetails(new URLSearchParams(window.location.search).get("ip") || "");
    return;
  }
  const views = {
    overview,
    search: () => searchView(extra),
    monitor: () =>
      `<div class="page"><div class="page-heading"><div><span class="eyebrow">Workspace</span><h1>Monitor</h1><p class="subtitle">Monitor saved searches and review changes as scan data becomes available.</p></div></div><section class="panel table-panel"><div class="panel-header"><span class="panel-title">Monitored hosts</span></div><div class="results-info" id="monitor-status">Loading monitored hosts…</div><div class="table-wrap"><table><thead><tr><th>IP address</th><th>Open ports</th><th>Last observed</th></tr></thead><tbody id="monitor-results"><tr><td colspan="3" class="muted-link">Loading…</td></tr></tbody></table></div><div id="monitor-pagination" class="search-pagination"></div></section></div>`,
    history: () =>
      `<div class="page"><div class="page-heading"><div><span class="eyebrow">Workspace</span><h1>History</h1><p class="subtitle">Review scan observations recorded over time.</p></div></div><section class="panel table-panel"><div class="panel-header"><span class="panel-title">Scan history</span></div><div class="results-info" id="history-status">Loading scan history…</div><div class="table-wrap"><table><thead><tr><th>IP address</th><th>Port</th><th>Protocol</th><th>State</th><th>Observed at</th></tr></thead><tbody id="history-results"><tr><td colspan="5" class="muted-link">Loading…</td></tr></tbody></table></div><div id="history-pagination" class="search-pagination"></div></section></div>`,
  };
  root.innerHTML = (views[view] || overview)();
  breadcrumb.textContent =
    {
      overview: "Dashboard",
      search: "Search",
      monitor: "Monitor",
      history: "History",
    }[view] || "Dashboard";
  document
    .querySelectorAll(".nav-item")
    .forEach((item) =>
      item.classList.toggle("active", item.dataset.view === view),
    );
  bind();
  if (view === "monitor") loadMonitor();
  if (view === "history") loadHistory();
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
  document.querySelectorAll("[data-search]").forEach((button) => {
    const submitSearch = () => {
      const input = document.querySelector("#global-search, #hero-search");
      const query = readSearchQuery(input);
      if (!query) return;
      if (currentView === "search") {
        const url = new URL(window.location.href);
        url.searchParams.set("query", query);
        url.searchParams.delete("limit");
        window.history.replaceState({}, "", url);
        const pageControl = document.getElementById("search-page");
        if (pageControl) pageControl.dataset.page = "1";
        searchDatabase(query);
      } else {
        window.location.href = `${pagePrefix}search.html?query=${encodeURIComponent(query)}`;
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
    const initialQuery = new URLSearchParams(window.location.search).get(
      "query",
    );
    if (initialQuery) searchDatabase(initialQuery);
  }
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
render(document.body.dataset.page || "overview");
setupOverviewDetails();
requestAnimationFrame(() => setTimeout(hidePageLoader, 180));
