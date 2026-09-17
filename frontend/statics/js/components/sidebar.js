function sidebarIcon(name) {
  const paths = {
    overview: '<path d="m3 10 5-5 5 5v5H9v-3H7v3H3z"/>',
    search: '<circle cx="7" cy="7" r="3.5"/><path d="m10 10 3 3"/>',
    assets: '<path d="m8 2 5 3v6l-5 3-5-3V5z"/><path d="m3 5 5 3 5-3M8 8v6"/>',
    findings: '<path d="m8 2 6 11H2z"/><path d="M8 6v3M8 11h.01"/>',
    watchlists: '<path d="m8 2 1.8 3.7 4.2.6-3 2.9.7 4.1L8 11.4l-3.7 1.9.7-4.1-3-2.9 4.2-.6z"/>',
    alerts: '<path d="M4 10V7a4 4 0 0 1 8 0v3l1.3 1.5H2.7zM6.5 13.5h3"/>',
    reports: '<path d="M4 2h6l2 2v10H4z"/><path d="M10 2v3h2M6 8h4M6 11h4"/>',
    integrations: '<path d="M6 2v4M10 2v4M4 6h8v2a4 4 0 0 1-8 0zM8 12v2"/>',
    settings: '<circle cx="8" cy="8" r="2.2"/><path d="M8 2v1.3M8 12.7V14M2 8h1.3M12.7 8H14M3.8 3.8l.9.9M11.3 11.3l.9.9M12.2 3.8l-.9.9M4.7 11.3l-.9.9"/>'
  };
  return `<svg class="sidebar-icon-svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}

function sidebarTemplate() {
  const workspaceOpen = localStorage.getItem("sencyc-workspace-open") !== "false";
  const manageOpen = localStorage.getItem("sencyc-manage-open") === "true";

  const sidebarCollapsed = localStorage.getItem("sencyc-sidebar-collapsed") === "true";
  return `<aside class="sidebar${sidebarCollapsed ? " collapsed" : ""}" id="sidebar">
    <div class="sidebar-header">
      <div class="brand" aria-label="Sencyc"><span class="brand-mark"><span class="brand-fallback">S</span><img class="brand-image" src="" alt="" /></span><span class="brand-name">Sencyc</span></div>
      <button class="sidebar-toggle" id="sidebarToggle" type="button" aria-label="Collapse navigation" title="Collapse navigation"><span class="chevron-icon sidebar-toggle-icon" aria-hidden="true"></span></button>
    </div>
    <nav class="nav">
      <div class="nav-section${workspaceOpen ? " open" : ""}" data-section="workspace">
        <button class="nav-section-toggle" type="button" aria-expanded="${workspaceOpen}"><span class="nav-section-label">Workspace</span><span class="chevron-icon nav-section-icon${workspaceOpen ? " is-up" : ""}" aria-hidden="true"></span></button>
        <div class="nav-section-items">
          <a class="nav-item active" data-view="overview" data-tooltip="Overview" title="Overview" href="index.html"><span class="nav-icon">${sidebarIcon("overview")}</span><span class="nav-label-text">Overview</span></a>
          <a class="nav-item" data-view="search" data-tooltip="Global search" title="Global search" href="search.html"><span class="nav-icon">${sidebarIcon("search")}</span><span class="nav-label-text">Global search</span></a>
          <a class="nav-item" data-view="assets" data-tooltip="Assets" title="Assets" href="assets.html"><span class="nav-icon">${sidebarIcon("assets")}</span><span class="nav-label-text">Assets</span><span class="nav-count">248</span></a>
          <a class="nav-item" data-view="findings" data-tooltip="Findings" title="Findings" href="findings.html"><span class="nav-icon">${sidebarIcon("findings")}</span><span class="nav-label-text">Findings</span><span class="nav-count alert">12</span></a>
          <a class="nav-item" data-view="watchlists" data-tooltip="Watchlists" title="Watchlists" href="watchlists.html"><span class="nav-icon">${sidebarIcon("watchlists")}</span><span class="nav-label-text">Watchlists</span></a>
          <a class="nav-item" data-view="alerts" data-tooltip="Alerts" title="Alerts" href="alerts.html"><span class="nav-icon">${sidebarIcon("alerts")}</span><span class="nav-label-text">Alerts</span><span class="nav-count">4</span></a>
        </div>
      </div>
      <div class="nav-section${manageOpen ? " open" : ""}" data-section="manage">
        <button class="nav-section-toggle" type="button" aria-expanded="${manageOpen}"><span class="nav-section-label">Manage</span><span class="chevron-icon nav-section-icon${manageOpen ? " is-up" : ""}" aria-hidden="true"></span></button>
        <div class="nav-section-items">
          <a class="nav-item" data-view="reports" data-tooltip="Reports" title="Reports" href="reports.html"><span class="nav-icon">${sidebarIcon("reports")}</span><span class="nav-label-text">Reports</span></a>
          <a class="nav-item" data-view="integrations" data-tooltip="Integrations" title="Integrations" href="integrations.html"><span class="nav-icon">${sidebarIcon("integrations")}</span><span class="nav-label-text">Integrations</span></a>
          <a class="nav-item" data-view="settings" data-tooltip="Settings" title="Settings" href="settings.html"><span class="nav-icon">${sidebarIcon("settings")}</span><span class="nav-label-text">Settings</span></a>
        </div>
      </div>
    </nav>
    <div class="sidebar-footer"><div class="upgrade-card"><strong>Unlock more visibility</strong><p>Track unlimited assets with Pro.</p><button class="text-button">View plans <span>→</span></button></div></div>
  </aside><div class="sidebar-backdrop" id="sidebarBackdrop"></div>`;
}
document.getElementById("sidebar-mount").outerHTML = sidebarTemplate();
