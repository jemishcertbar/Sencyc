// Return the SVG markup for a sidebar item icon.
function sidebarIcon(name) {
  const paths = {
    overview: '<path d="m3 10 5-5 5 5v5H9v-3H7v3H3z"/>',
    search: '<circle cx="7" cy="7" r="3.5"/><path d="m10 10 3 3"/>',
    monitor: '<path d="M2 8h2l2-4 3 8 2-4h3"/><path d="M2 14h12"/>',
    history: '<path d="M4 2h6l2 2v10H4z"/><path d="M10 2v3h2M6 8h4M6 11h4"/>',
  };
  return `<svg class="sidebar-icon-svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

// Build the sidebar and restore its saved open and collapsed sections.
function sidebarTemplate() {
  const workspaceOpen =
    localStorage.getItem("sencyc-workspace-open") !== "false";
  const pagePrefix = window.location.pathname.includes("/pages/")
    ? ""
    : "pages/";
  const homeLink = window.location.pathname.includes("/pages/")
    ? "../index.html"
    : "index.html";
  const sidebarCollapsed =
    localStorage.getItem("sencyc-sidebar-collapsed") === "true";
  return `<aside class="sidebar${sidebarCollapsed ? " collapsed" : ""}" id="sidebar">
    <div class="sidebar-header">
      <div class="brand" aria-label="Sencyc"><span class="brand-mark"><span class="brand-fallback">S</span><img class="brand-image" src="" alt="" /></span><span class="brand-name">Sencyc</span></div>
      <button class="sidebar-toggle" id="sidebarToggle" type="button" aria-label="Collapse navigation" title="Collapse navigation"><span class="chevron-icon sidebar-toggle-icon" aria-hidden="true"></span></button>
    </div>
    <nav class="nav">
      <a class="nav-item" data-view="overview" data-tooltip="Dashboard" title="Dashboard" href="${homeLink}"><span class="nav-icon">${sidebarIcon("overview")}</span><span class="nav-label-text">Dashboard</span></a>
      <a class="nav-item" data-view="search" data-tooltip="Search" title="Search" href="${pagePrefix}search.html"><span class="nav-icon">${sidebarIcon("search")}</span><span class="nav-label-text">Search</span></a>
      <div class="nav-section${workspaceOpen ? " open" : ""}" data-section="workspace">
        <button class="nav-section-toggle" type="button" aria-expanded="${workspaceOpen}"><span class="nav-section-label">Workspace</span><svg class="nav-section-icon${workspaceOpen ? " is-up" : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg></button>
        <div class="nav-section-items">
          <a class="nav-item" data-view="monitor" data-tooltip="Monitor" title="Monitor" href="${pagePrefix}monitor.html"><span class="nav-icon">${sidebarIcon("monitor")}</span><span class="nav-label-text">Monitor</span></a>
          <a class="nav-item" data-view="history" data-tooltip="History" title="History" href="${pagePrefix}history.html"><span class="nav-icon">${sidebarIcon("history")}</span><span class="nav-label-text">History</span></a>
        </div>
      </div>
    </nav>
    <div class="sidebar-footer"><div class="upgrade-card"><strong>Unlock more visibility</strong><p>Track unlimited assets with Pro.</p><button class="text-button">View plans <span>→</span></button></div></div>
  </aside><div class="sidebar-backdrop" id="sidebarBackdrop"></div>`;
}

// Add a menu button to the top bar when the page does not already have one.
function injectMobileSidebarToggle() {
  const topbar = document.querySelector(".topbar");
  if (!topbar || document.getElementById("mobileSidebarToggle")) return;
  const mobileToggle = document.createElement("button");
  mobileToggle.id = "mobileSidebarToggle";
  mobileToggle.type = "button";
  mobileToggle.className = "mobile-menu";
  mobileToggle.setAttribute("aria-label", "Open navigation menu");
  mobileToggle.setAttribute("aria-controls", "sidebar");
  mobileToggle.setAttribute("aria-expanded", "false");
  mobileToggle.title = "Open navigation menu";
  mobileToggle.innerHTML = '<span aria-hidden="true">☰</span>';
  topbar.insertBefore(mobileToggle, topbar.firstChild);
}

document.getElementById("sidebar-mount").outerHTML = sidebarTemplate();
injectMobileSidebarToggle();
