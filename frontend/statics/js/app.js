const root = document.getElementById("view-root"), toast = document.getElementById("toast"), breadcrumb = document.getElementById("breadcrumb");
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
pageLoader.innerHTML = '<div class="loader-core"><span class="loader-ring"></span><span>Loading</span></div>';
document.body.appendChild(pageLoader);
function showPageLoader() {
  pageLoader.classList.add("visible");
}
function hidePageLoader() {
  pageLoader.classList.remove("visible");
  sessionStorage.removeItem("sencyc-page-loading");
}
if (sessionStorage.getItem("sencyc-page-loading") === "true") showPageLoader();
function closeSidebar() { sidebar.classList.add("collapsed"); sidebar.classList.remove("open"); sidebarBackdrop.classList.remove("visible"); localStorage.setItem("sencyc-sidebar-collapsed", "true") }
function openSidebar() { sidebar.classList.remove("collapsed"); sidebar.classList.add("open"); localStorage.setItem("sencyc-sidebar-collapsed", "false"); if (window.innerWidth <= 900) sidebarBackdrop.classList.add("visible") }
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
  toggle.innerHTML = '<span>Show more</span><span class="show-more-icon" aria-hidden="true"></span>';
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
themeToggle.onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
function notify(message) { toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2500) }
function stat(label, value, trend, icon, down = false) { return `<div class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><span class="trend ${down ? "down" : ""}">${trend}</span></div>` }
function discoveryChart() {
  return `<div class="chart-summary"><span><b>116</b> assets discovered</span><span class="chart-change">+18.4% <small>vs previous period</small></span></div><div class="chart-shell"><div class="chart-y-axis"><span>120</span><span>90</span><span>60</span><span>30</span><span>0</span></div><div class="chart-area"><div class="chart">${discoveryPoints.map((value, index) => `<span class="bar" style="height:${value / 1.25}%" title="${discoveryDates[index]}: ${value} assets"><i>${value}</i></span>`).join("")}</div><div class="chart-labels">${discoveryDates.map(date => `<span>${date}</span>`).join("")}</div></div></div><div class="chart-legend"><span><i class="legend-dot"></i>New assets discovered</span><span class="muted-link">Daily count · Last 30 days</span></div>`;
}
function assetRows(list = assets) { return list.map(a => `<tr><td><a class="asset-link" href="#asset/${encodeURIComponent(a.name)}" data-open="${a.name}"><div class="asset-name">${a.name}</div></a><div class="asset-type">${a.type}</div></td><td>${a.ip}</td><td>${a.port}</td><td>${a.tech}</td><td><span class="pill ${a.risk.toLowerCase()}">${a.risk}</span></td><td><span class="pill active">${a.status}</span></td></tr>`).join("") }
function assetDetail(name) {
  const asset = assets.find(item => item.name === name) || assets[0];
  const ports = asset.port.split(", ");
  const technologies = asset.tech.split(", ");
  const related = assets.filter(item => item.name !== asset.name).slice(0, 3);
  return `<div class="page asset-detail-page">
    <div class="detail-back"><a href="${document.body.dataset.page === "search" ? "search.html" : "assets.html"}">← Back to ${document.body.dataset.page === "search" ? "search results" : "assets"}</a></div>
    <section class="asset-detail-header">
      <div class="asset-detail-title"><span class="asset-detail-icon">◉</span><div><span class="eyebrow">${asset.type}</span><h1>${asset.name}</h1><p class="subtitle">Target ID: SCOPE-${asset.name.replace(/[^a-z0-9]/gi, "").toUpperCase()} &nbsp;·&nbsp; Resolved on monitored DNS</p></div></div>
      <div class="asset-detail-actions"><span class="pill ${asset.risk.toLowerCase()}">${asset.risk} risk</span><button class="button small">Rescan asset</button><button class="button secondary small">Watchlist</button></div>
    </section>
    <nav class="detail-tabs" aria-label="Asset details"><a class="active" href="#asset/${encodeURIComponent(asset.name)}">Overview</a><a href="#asset/${encodeURIComponent(asset.name)}/ports">Ports & services</a><a href="#asset/${encodeURIComponent(asset.name)}/technology">Technologies</a><a href="#asset/${encodeURIComponent(asset.name)}/findings">Findings</a><a href="#asset/${encodeURIComponent(asset.name)}/history">History</a></nav>
    <div class="asset-detail-grid">
      <section class="panel"><div class="panel-header"><span class="panel-title">Network identifiers</span><span class="pill active">${asset.status}</span></div><dl class="detail-list"><div><dt>Resolved IP</dt><dd>${asset.ip}</dd></div><div><dt>Asset type</dt><dd>${asset.type}</dd></div><div><dt>First discovered</dt><dd>2025-06-12</dd></div><div><dt>Last activity</dt><dd>4 mins ago</dd></div></dl></section>
      <section class="panel detail-visual"><div class="detail-map"><span>◌</span><i></i><i></i><i></i></div><small>Location: San Jose, CA, US</small><strong>37.3382° N&nbsp; · &nbsp;121.8863° W</strong></section>
      <section class="panel"><div class="panel-header"><span class="panel-title">WHOIS record registry</span></div><dl class="detail-list"><div><dt>Registrar</dt><dd>Amazon Registrar, Inc.</dd></div><div><dt>Contact</dt><dd>abuse@example.com</dd></div><div><dt>Renewal date</dt><dd class="warning-text">2028-13-14 (5 years remaining)</dd></div></dl></section>
      <section class="panel detail-wide"><div class="panel-header"><span class="panel-title">Open channels / port scan</span><span class="muted-link">Last scan · 4 mins ago</span></div><div class="detail-table"><div class="detail-table-row detail-table-head"><span>Port</span><span>Protocol</span><span>Service</span><span>Product version</span><span>State</span></div>${ports.map((port, index) => `<div class="detail-table-row"><span>${port}</span><span>${index === 0 ? "TCP" : "TCP"}</span><span>${index === 0 ? "HTTPS" : index === 1 ? "SSH" : "HTTP-Proxy"}</span><span>${index === 0 ? "nginx 1.21.4 (Ubuntu)" : index === 1 ? "OpenSSH 8.9p1" : "Nginx alternate backend"}</span><span class="status-text ${index === 2 ? "warning-text" : ""}">${index === 2 ? "EXPOSED" : "OPEN"}</span></div>`).join("")}</div></section>
      <section class="panel"><div class="panel-header"><span class="panel-title">Profile / technology stack</span></div><div class="technology-tags">${technologies.concat(["Cloudflare", "Let's Encrypt"]).map(technology => `<span><small>TECH</small><b>${technology}</b></span>`).join("")}</div></section>
      <section class="panel"><div class="panel-header"><span class="panel-title">Relative asset horizon</span></div><div class="related-assets">${related.map(item => `<a href="#asset/${encodeURIComponent(item.name)}" data-open="${item.name}"><b>${item.name}</b><small>${item.ip}</small><span class="pill ${item.risk.toLowerCase()}">${item.risk}</span></a>`).join("")}</div></section>
    </div>
  </div>`;
}
function overview() { return `<div class="page"><div class="page-heading"><div><span class="eyebrow">Security overview</span><h1>Good morning, Jordan</h1><p class="subtitle">Here is what is happening across your attack surface today.</p></div></div><section class="search-hero"><span class="eyebrow">Asset discovery</span><h2>Search your attack surface</h2><p>Find domains, IPs, technologies, certificates, and vulnerabilities in seconds.</p><div class="search-box"><input id="hero-search" placeholder="Try a domain, IP address, organization, or technology..."><button class="button" data-search>Search assets</button></div><div class="quick-searches"><span data-query="domain:acme.com">domain:acme.com</span><span data-query="severity:critical">severity:critical</span><span data-query="technology:nginx">technology:nginx</span><span data-query="port:22">port:22</span></div></section><div class="stats-grid inventory-stats">${stat("Hosts", "1,234", "↑ 12.4% this month", "◈")}${stat("Open ports", "232", "↑ 8 new this week", "⌁")}${stat("Certificates", "321", "7 expiring soon", "◇")}${stat("Technologies", "186", "Across 248 assets", "▦")}${stat("Domains", "248", "97% monitored", "◎")}${stat("Findings", "38", "12 critical", "△", true)}</div><div class="dashboard-grid"><section class="panel"><div class="panel-header"><span class="panel-title">Asset discovery</span><span class="muted-link">Last 30 days ▾</span></div>${discoveryChart()}</section><section class="panel"><div class="panel-header"><span class="panel-title">Recent activity</span><span class="muted-link">View all</span></div><div class="activity"><span class="activity-dot"></span><div><p><b>New subdomain discovered</b><br>dev-api.acme.com</p><small>12 minutes ago</small></div></div><div class="activity"><span class="activity-dot" style="background:#efad4c"></span><div><p><b>Certificate expires soon</b><br>staging.acme.com</p><small>1 hour ago</small></div></div><div class="activity"><span class="activity-dot" style="background:#e66b77"></span><div><p><b>Critical finding detected</b><br>203.0.113.42:8080</p><small>3 hours ago</small></div></div><div class="activity"><span class="activity-dot" style="background:#54b8a0"></span><div><p><b>Technology changed</b><br>acme.com</p><small>Yesterday</small></div></div></section></div><section class="panel table-panel"><div class="panel-header"><span class="panel-title">Recently discovered assets</span><span class="muted-link" data-view-link="assets">View all assets →</span></div><div class="table-wrap"><table><thead><tr><th>Asset</th><th>IP address</th><th>Open ports</th><th>Technologies</th><th>Risk</th><th>Status</th></tr></thead><tbody>${assetRows(assets.slice(0, 4))}</tbody></table></div></section></div>` }
function listView(title, subtitle, kind) {
  const isFind = kind === "findings";
  const rows = isFind
    ? assets.map((asset, index) => `<tr><td><a class="asset-link" href="#finding/${100 + index}" data-open="Finding-${100 + index}"><div class="asset-name">${["Exposed admin panel", "Outdated TLS version", "Publicly exposed SSH", "Missing security headers", "Subdomain takeover risk"][index]}</div></a><div class="asset-type">Finding-${100 + index}</div></td><td>${asset.name}</td><td>${["Exposure", "Configuration", "Network", "Web security", "DNS"][index]}</td><td>${index + 1} day${index ? "s" : ""} ago</td><td><span class="pill ${asset.risk.toLowerCase()}">${asset.risk}</span></td><td><span class="pill ${index === 3 ? "low" : "active"}">${index === 3 ? "In progress" : "Open"}</span></td></tr>`).join("")
    : assetRows();
  return `<div class="page"><div class="page-heading"><div><span class="eyebrow">${isFind ? "Risk management" : "Asset inventory"}</span><h1>${title}</h1><p class="subtitle">${subtitle}</p></div></div><div class="stats-grid">${stat(isFind ? "Open findings" : "Total assets", isFind ? "38" : "248", isFind ? "12 critical" : "↑ 12.4% vs last month", "◈")}${stat("Critical", isFind ? "12" : "18", isFind ? "Needs attention" : "↑ 4 this week", "△")}${stat(isFind ? "Resolved this month" : "New this week", isFind ? "24" : "34", isFind ? "↑ 18.2%" : "↑ 16.7%", "✦")}${stat("Monitored", isFind ? "92%" : "97%", isFind ? "of all findings" : "of all assets", "✓")}</div><section class="panel table-panel"><div class="page-toolbar"><input class="filter-input" id="table-filter" placeholder="⌕  Filter ${isFind ? "findings" : "assets"}..."><button class="button secondary small">${dropdown("All types")}</button><button class="button secondary small">${dropdown("Risk")}</button><span class="toolbar-spacer"></span><button class="button secondary small" data-action="export">Export CSV</button></div><div class="results-info">${isFind ? "38 findings" : "248 assets"} found · Updated just now</div><div class="table-wrap"><table><thead><tr><th>${isFind ? "Finding" : "Asset"}</th><th>${isFind ? "Affected asset" : "IP address"}</th><th>${isFind ? "Category" : "Open ports"}</th><th>${isFind ? "Detected" : "Technologies"}</th><th>Risk</th><th>Status</th></tr></thead><tbody id="data-rows">${rows}</tbody></table></div></section></div>`;
}
function dropdown(label) { return `<span class="dropdown-label">${label}</span><span class="dropdown-icon" aria-hidden="true"></span>` }
function searchView(query = "") { return `<div class="page"><div class="page-heading"><div><span class="eyebrow">Discovery</span><h1>Global search</h1><p class="subtitle">Search across every asset, service, and finding in your workspace.</p></div></div><section class="panel" style="margin-bottom:18px"><div class="search-box" style="border:1px solid var(--line);max-width:none"><input id="global-search" value="${query}" placeholder="Search domains, IPs, technologies, CVEs..."><button class="button" data-search>Search</button></div><div class="quick-searches" style="margin-top:12px"><span data-query="domain:acme.com">domain:acme.com</span><span data-query="type:ip">type:ip</span><span data-query="severity:critical">severity:critical</span></div></section><section class="panel table-panel"><div class="panel-header"><span class="panel-title">${query ? "Results for “" + query + "”" : "All indexed assets"}</span><span class="muted-link">248 results · Save search</span></div><div class="page-toolbar"><button class="button secondary small">${dropdown("All results")}</button><button class="button secondary small">${dropdown("Asset type")}</button><button class="button secondary small">${dropdown("Risk")}</button><span class="toolbar-spacer"></span><button class="button secondary small" data-action="export">Export</button></div><div class="table-wrap"><table><thead><tr><th>Asset</th><th>IP address</th><th>Open ports</th><th>Technologies</th><th>Risk</th><th>Status</th></tr></thead><tbody>${assetRows()}</tbody></table></div></section></div>` }
function simplePage(title, subtitle, eyebrow, body) { return `<div class="page"><div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><button class="button" data-action="create">+ Create new</button></div>${body}</div>` }
function render(view, extra = "") { let html = view === "asset-detail" ? assetDetail(extra) : view === "overview" ? overview() : view === "search" ? searchView(extra) : view === "assets" ? listView("Assets", "Discover and manage everything exposed across your organization.", "Asset inventory", "assets") : view === "findings" ? listView("Findings", "Prioritize and remediate risks across your attack surface.", "Risk management", "findings") : view === "watchlists" ? simplePage("Watchlists", "Monitor saved searches and get notified when they change.", "Continuous monitoring", `<section class="panel empty"><strong>No watchlists yet</strong>Create a watchlist from any search to track changes over time.<br><br><button class="button" data-action="create">Create your first watchlist</button></section>`) : view === "alerts" ? simplePage("Alerts", "Stay informed when important changes happen.", "Notifications", `<section class="panel"><div class="panel-header"><span class="panel-title">Alert rules</span><span class="muted-link">4 active rules</span></div><div class="activity"><span class="activity-dot"></span><div><p><b>Critical finding detected</b><br>All monitored assets · Email + in-app</p></div><span class="pill active">Active</span></div><div class="activity"><span class="activity-dot" style="background:#efad4c"></span><div><p><b>Certificate expires within 14 days</b><br>All domains · Email</p></div><span class="pill active">Active</span></div></section>`) : view === "reports" ? simplePage("Reports", "Create and schedule security reports for your team.", "Insights", `<section class="panel empty"><strong>No reports generated</strong>Build an executive summary or detailed asset report in a few clicks.<br><br><button class="button" data-action="create">Generate a report</button></section>`) : view === "integrations" ? simplePage("Integrations", "Connect Sencyc to the tools your team already uses.", "Connections", `<section class="panel"><div class="panel-header"><span class="panel-title">Available integrations</span></div><div class="stats-grid" style="margin:0">${stat("Slack", "Connect", "Send alerts to channels", "◈")}${stat("Jira", "Connect", "Create tickets from findings", "△")}${stat("Webhooks", "Connect", "Stream events to your tools", "⌘")}</div></section>`) : `<div class="page"><div class="page-heading"><div><span class="eyebrow">Workspace</span><h1>Settings</h1><p class="subtitle">Manage your profile, workspace, and notification preferences.</p></div></div><div class="settings-layout"><section class="panel settings-menu"><button class="active">Profile</button><button>Workspace</button><button>Notifications</button><button>Security</button><button>API keys</button><button>Audit log</button></section><section class="panel"><div class="panel-header"><span class="panel-title">Profile information</span><button class="button small" data-action="save">Save changes</button></div><div class="form-row"><div class="form-group"><label>First name</label><input value="Jordan"></div><div class="form-group"><label>Last name</label><input value="Davis"></div></div><div class="form-group"><label>Email address</label><input value="jordan.davis@acme.com"></div><div class="form-group"><label>Role</label><input value="Administrator" disabled></div></section></div></div>`; root.innerHTML = html; breadcrumb.textContent = view === "asset-detail" ? "Asset details" : view[0].toUpperCase() + view.slice(1); document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view)); bind() }
function bind() { const currentView = document.body.dataset.page || "overview"; document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === currentView)); document.querySelectorAll("[data-view-link]").forEach(e => e.onclick = () => { if (e.dataset.viewLink === "assets") window.location.href = "assets.html" }); document.querySelectorAll("[data-action]").forEach(e => e.onclick = () => notify(e.dataset.action === "export" ? "Export started. Your file will download shortly." : e.dataset.action === "save" ? "Settings saved successfully." : "This action is ready to connect to your backend.")); document.querySelectorAll("[data-query]").forEach(e => e.onclick = () => { const input = document.querySelector("#global-search"); if (input) { input.value = e.dataset.query; input.focus() } }); document.querySelectorAll("[data-search]").forEach(e => e.onclick = () => { const input = document.querySelector("#global-search, #hero-search"); const query = readSearchQuery(input); if (query) window.location.href = `search.html?query=${encodeURIComponent(query)}` }); document.querySelectorAll("[data-open]").forEach(e => e.onclick = event => { event.preventDefault(); window.location.hash = `asset/${encodeURIComponent(e.dataset.open)}`; render("asset-detail", e.dataset.open) }); const filter = document.getElementById("table-filter"); if (filter) filter.oninput = () => { const term = filter.value.toLowerCase(); document.querySelectorAll("#data-rows tr").forEach(row => row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none") } }
document.querySelectorAll(".nav-item").forEach(item => item.addEventListener("click", () => { sessionStorage.setItem("sencyc-page-loading", "true"); showPageLoader(); }));
document.querySelectorAll(".nav-section-toggle").forEach(toggle => {
  toggle.onclick = () => {
    const section = toggle.closest(".nav-section");
    const isOpen = section.classList.toggle("open");
    localStorage.setItem(`sencyc-${section.dataset.section}-open`, isOpen);
    toggle.setAttribute("aria-expanded", isOpen);
    toggle.querySelector(".nav-section-icon").classList.toggle("is-up", isOpen);
  };
});
sidebarToggle.onclick = () => window.innerWidth <= 900 ? (sidebar.classList.contains("open") ? closeSidebar() : openSidebar()) : (sidebar.classList.contains("collapsed") ? openSidebar() : closeSidebar());
sidebarBackdrop.onclick = closeSidebar;
window.addEventListener("scroll", () => {
  scrollToTopButton.classList.toggle("visible", window.scrollY > 80);
});
scrollToTopButton.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
const initialHash = decodeURIComponent(window.location.hash.replace(/^#asset\//, ""));
if (window.location.hash.startsWith("#asset/")) render("asset-detail", initialHash);
else render(document.body.dataset.page || "overview");
setupOverviewDetails();
requestAnimationFrame(() => setTimeout(hidePageLoader, 180));
window.addEventListener("hashchange", () => {
  if (window.location.hash.startsWith("#asset/")) render("asset-detail", decodeURIComponent(window.location.hash.replace(/^#asset\//, "")));
});
