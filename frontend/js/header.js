// Load the shared header before app.js reads its controls.
const headerLoader = document.currentScript;
const sharedHeaderUrl = new URL("../header.html", headerLoader.src);
fetch(sharedHeaderUrl)
  .then((response) => {
    if (!response.ok) throw new Error(`Header request failed: ${response.status}`);
    return response.text();
  })
  .then((markup) => {
    const mount = document.getElementById("header-mount");
    mount.outerHTML = markup;
    injectMobileSidebarToggle();

    const app = document.createElement("script");
    app.src = new URL("app.js?v=6", headerLoader.src).href;
    document.body.appendChild(app);
  })
  .catch((error) => console.error("Could not load the shared header.", error));
