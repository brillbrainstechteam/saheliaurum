/* Saheli Aurum — /new preview: the extra motion and page behaviours.
   Loads after the shared main.js, which already runs the hero, the rails,
   the moments carousel, reveals, marquees, galleries and the form. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var header = document.getElementById("siteHeader");

  /* header tucks away on the way down and returns on the way up;
     a rose-gold hairline reads how far down the page you are */
  var bar = document.createElement("div");
  bar.className = "np-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var open = header && header.classList.contains("nav-open");
    if (!open && y > 280 && y > lastY + 4) root.classList.add("np-hdr-hidden");
    else if (y < lastY - 4 || y < 280) root.classList.remove("np-hdr-hidden");
    lastY = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--np-p", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* figures count up as they arrive (the real value is already in the HTML) */
  var counters = [].slice.call(document.querySelectorAll("[data-count]"));
  function runCount(el) {
    var to = parseFloat(el.getAttribute("data-count"));
    var from = parseFloat(el.getAttribute("data-from") || "0");
    if (reduce) { el.textContent = to; return; }
    var t0 = null, dur = 1700;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = c.getAttribute("data-from") || "0"; cio.observe(c); });
  }

  /* shop lookbook: filter by piece and by material */
  var grid = document.querySelector("[data-lookbook]");
  if (grid) {
    var cards = [].slice.call(grid.querySelectorAll(".lb-card"));
    var state = { cat: "all", mat: "all" };
    var countEl = document.querySelector("[data-lb-count]");
    var emptyEl = document.querySelector("[data-lb-empty]");
    var apply = function () {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (state.cat === "all" || c.getAttribute("data-cat") === state.cat) &&
                 (state.mat === "all" || c.getAttribute("data-mat") === state.mat);
        if (ok) {
          if (c.hidden) {
            c.hidden = false;
            if (!reduce) {
              c.classList.add("is-entering");
              (function (card, delay) {
                setTimeout(function () { card.classList.remove("is-entering"); }, 30 + delay);
              })(c, Math.min(shown, 12) * 45);
            }
          }
          shown++;
        } else {
          c.hidden = true;
        }
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? " piece" : " pieces");
      if (emptyEl) emptyEl.hidden = shown > 0;
    };
    document.querySelectorAll("[data-lb-group]").forEach(function (g) {
      var key = g.getAttribute("data-lb-group");
      g.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-value]");
        if (!b) return;
        g.querySelectorAll("button[data-value]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        state[key] = b.getAttribute("data-value");
        apply();
      });
    });
    apply();
  }

  /* collections: the sticky index follows along and marks where you are */
  var idx = document.querySelector(".np-collections .col-index");
  if (idx && "IntersectionObserver" in window) {
    var inner = idx.querySelector(".col-index__inner") || idx;
    var links = {};
    idx.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].removeAttribute("aria-current"); });
        var a = links[en.target.id];
        if (!a) return;
        a.setAttribute("aria-current", "true");
        if (inner.scrollWidth > inner.clientWidth) {
          inner.scrollTo({ left: a.offsetLeft - inner.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? "auto" : "smooth" });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".col-band[id]").forEach(function (s) { bio.observe(s); });
  }

  /* appointment form: arrive pre-filled from the button that brought you,
     and quietly drop submissions that fill the hidden trap field */
  var form = document.getElementById("apptForm");
  if (form) {
    var q = new URLSearchParams(window.location.search);
    var types = { bridal: "Bridal Consultation", bespoke: "Bespoke Consultation", viewing: "Private Viewing", general: "General Enquiry" };
    var pick = function (select, text) {
      if (!select) return;
      [].forEach.call(select.options, function (o) { if (o.text === text || o.value === text) select.value = o.value; });
    };
    var t = q.get("type"), c = q.get("collection"), s = q.get("store");
    if (t && types[t]) pick(form.elements.type, types[t]);
    if (c) {
      pick(form.elements.type, types.viewing);
      if (form.elements.note && !form.elements.note.value) form.elements.note.value = "I'd like to see the " + c + " collection.";
    }
    if (s) pick(form.elements.store, s.charAt(0).toUpperCase() + s.slice(1));
    document.addEventListener("submit", function (e) {
      if (e.target !== form) return;
      var trap = form.elements.company;
      if (trap && trap.value) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
  }
})();
