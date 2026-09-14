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

  /* shop lookbook: filter by piece and by material. Each chip shows how many
     pieces it would leave, chips that would leave none step back, and the
     choice is kept in the address - so links (and the home "View all")
     land already filtered. */
  var grid = document.querySelector("[data-lookbook]");
  if (grid) {
    var cards = [].slice.call(grid.querySelectorAll(".lb-card"));
    var groups = [].slice.call(document.querySelectorAll("[data-lb-group]"));
    var countEl = document.querySelector("[data-lb-count]");
    var emptyEl = document.querySelector("[data-lb-empty]");
    var q0 = new URLSearchParams(window.location.search);
    var state = { cat: "all", mat: "all" };
    groups.forEach(function (g) {
      var key = g.getAttribute("data-lb-group"), want = q0.get(key);
      if (want && g.querySelector('button[data-value="' + want + '"]')) state[key] = want;
    });
    var matches = function (c, cat, mat) {
      return (cat === "all" || c.getAttribute("data-cat") === cat) && (mat === "all" || c.getAttribute("data-mat") === mat);
    };
    var paint = function () {
      groups.forEach(function (g) {
        var key = g.getAttribute("data-lb-group");
        g.querySelectorAll("button[data-value]").forEach(function (b) {
          var v = b.getAttribute("data-value");
          var n = cards.filter(function (c) { return key === "cat" ? matches(c, v, state.mat) : matches(c, state.cat, v); }).length;
          var tag = b.querySelector(".lb-chip__n");
          if (!tag) { tag = document.createElement("span"); tag.className = "lb-chip__n"; b.appendChild(tag); }
          tag.textContent = n;
          b.setAttribute("aria-pressed", String(v === state[key]));
          b.disabled = n === 0 && v !== state[key];
        });
      });
    };
    var apply = function (animate) {
      var shown = 0;
      cards.forEach(function (c) {
        if (matches(c, state.cat, state.mat)) {
          if (c.hidden) {
            c.hidden = false;
            if (animate && !reduce) {
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
      paint();
    };
    var syncUrl = function () {
      var p = new URLSearchParams(window.location.search);
      ["cat", "mat"].forEach(function (k) { if (state[k] === "all") p.delete(k); else p.set(k, state[k]); });
      var qs = p.toString();
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    };
    groups.forEach(function (g) {
      var key = g.getAttribute("data-lb-group");
      g.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-value]");
        if (!b || b.disabled) return;
        state[key] = b.getAttribute("data-value");
        apply(true);
        syncUrl();
      });
    });
    apply(false);
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
