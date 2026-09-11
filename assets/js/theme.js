/* Alternate art-direction toggle — must run before paint to avoid a flash. */
(function () {
  try {
    if (new URLSearchParams(location.search).get("theme") === "atelier") {
      document.documentElement.classList.add("theme-atelier");
    }
  } catch (e) {}
})();
