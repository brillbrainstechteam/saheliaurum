/* Saheli Aurum — homepage interactions */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = window.matchMedia("(min-width: 861px)");
  var atelier = document.documentElement.classList.contains("theme-atelier");

  /* keep the alternate art direction active across the multipage site */
  if (atelier) {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var raw = link.getAttribute("href");
      if (!raw || raw.indexOf("mailto:") === 0 || raw.indexOf("tel:") === 0 || raw.indexOf("http") === 0) return;
      var target = new URL(raw, window.location.href);
      if (target.origin !== window.location.origin) return;
      target.searchParams.set("theme", "atelier");
      link.href = target.pathname.split("/").pop() + target.search + target.hash;
    });

    var original = document.createElement("a");
    original.className = "view-switch";
    original.href = window.location.pathname.split("/").pop() || "index.html";
    original.textContent = "View original";
    original.setAttribute("aria-label", "Open the original Saheli Aurum design");
    document.body.appendChild(original);
  }

  /* image-download deterrents (best-effort — web images are always fetchable via devtools) */
  var mediaSel = ".leaf__media,.hero__media,.bride__media,.world,.colgrid__item,.col-band__featbtn,.gitem,.split__media,.scheme__media,.shop-panel--image,.marquee--gallery,.craft__media,.page-hero,.filmband,.bespoke__img,.mscene";
  document.addEventListener("contextmenu", function (e) {
    var t = e.target;
    if (t && (t.tagName === "IMG" || t.tagName === "VIDEO" || (t.closest && t.closest(mediaSel)))) e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && (e.target.tagName === "IMG" || e.target.tagName === "VIDEO")) e.preventDefault();
  });

  /* year */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* header scrolled state */
  var header = document.getElementById("siteHeader");
  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();

  /* active route */
  var page = document.body ? document.body.getAttribute("data-page") : "";
  if (page) {
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      if (link.getAttribute("data-nav") === page) {
        link.classList.add("is-current");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* mobile nav */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  /* reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal, .stagger");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* hero parallax */
  var parallaxEls = document.querySelectorAll("[data-parallax] img");
  var ticking = false;
  function parallax() {
    parallaxEls.forEach(function (img) {
      var host = img.closest("[data-parallax]");
      var rect = host.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      var offset = (rect.top / window.innerHeight) * -40;
      var scale = host.classList.contains("hero__media") ? 1.04 : 1.12;
      img.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) scale(" + scale + ")";
    });
    ticking = false;
  }

  /* moments cinematic sequence */
  var scroller = document.getElementById("momentScroller");
  var scenes = scroller ? scroller.querySelectorAll(".mscene") : [];
  var dots = scroller ? scroller.querySelectorAll(".moments__nav li") : [];
  var current = 0;
  function setScene(i) {
    if (i === current) return;
    current = i;
    scenes.forEach(function (s, idx) { s.classList.toggle("is-active", idx === i); });
    dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === i); });
  }
  function moments() {
    if (!scroller || !desktop.matches) return;
    var rect = scroller.getBoundingClientRect();
    var total = scroller.offsetHeight - window.innerHeight;
    var progress = Math.min(1, Math.max(0, -rect.top / total));
    var idx = Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
    setScene(idx);
  }

  function onScroll() {
    onScrollHeader();
    if (!ticking) {
      window.requestAnimationFrame(function () {
        if (!reduce) parallax();
        moments();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { moments(); });

  /* ensure all scenes show if reduced-motion / non-desktop after load */
  function normalizeScenes() {
    if (!scroller) return;
    if (!desktop.matches) {
      scenes.forEach(function (s) { s.classList.add("is-active"); });
    } else {
      scenes.forEach(function (s, idx) { s.classList.toggle("is-active", idx === current); });
      moments();
    }
  }
  desktop.addEventListener("change", normalizeScenes);
  normalizeScenes();

  /* appointment form (demo — no data leaves the browser) */
  var form = document.getElementById("apptForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = document.getElementById("apptOk");
      form.querySelector('button[type="submit"]').textContent = "Request Sent";
      if (ok) ok.hidden = false;
    });
  }

  /* auto-scrolling marquee rails (seamless loop, pause on hover) */
  document.querySelectorAll(".marquee").forEach(function (m) {
    var track = m.querySelector(".marquee__track");
    if (!track) return;
    if (reduce) return;
    track.innerHTML = track.innerHTML + track.innerHTML; /* duplicate for seamless -50% loop */
    var n = track.children.length;
    track.style.setProperty("--mq-dur", Math.max(26, n * 3.4) + "s");
  });

  /* lightbox for collection galleries */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = document.getElementById("lbImg");
    var lbCap = document.getElementById("lbCap");
    var group = [];
    var gi = 0;
    function lbShow(i) {
      gi = (i + group.length) % group.length;
      var it = group[gi];
      lbImg.src = it.src;
      lbImg.alt = it.alt || "";
      if (lbCap) lbCap.textContent = it.cap || "";
    }
    function lbOpen(items, i) {
      group = items;
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lbShow(i);
    }
    function lbClose() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lbImg.src = "";
    }
    document.querySelectorAll("[data-lightbox]").forEach(function (band) {
      var btns = [].slice.call(band.querySelectorAll(".zoomable"));
      var name = band.id || "";
      var items = btns.map(function (b) {
        var im = b.querySelector("img");
        return { src: b.getAttribute("data-src") || (im && im.src), alt: im ? im.alt : "", cap: im ? im.alt : "" };
      });
      btns.forEach(function (b, idx) {
        b.addEventListener("click", function () { lbOpen(items, idx); });
      });
    });
    document.querySelectorAll("[data-open-gallery]").forEach(function (btn) {
      var band = btn.closest("[data-lightbox]");
      if (!band) return;
      var zs = [].slice.call(band.querySelectorAll(".zoomable"));
      var items = zs.map(function (b) {
        var im = b.querySelector("img");
        return { src: b.getAttribute("data-src") || (im && im.src), alt: im ? im.alt : "", cap: im ? im.alt : "" };
      });
      btn.addEventListener("click", function () { if (items.length) lbOpen(items, 0); });
    });
    var c = document.getElementById("lbClose");
    var n = document.getElementById("lbNext");
    var p = document.getElementById("lbPrev");
    if (c) c.addEventListener("click", lbClose);
    if (n) n.addEventListener("click", function () { lbShow(gi + 1); });
    if (p) p.addEventListener("click", function () { lbShow(gi - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lbClose();
      else if (e.key === "ArrowRight") lbShow(gi + 1);
      else if (e.key === "ArrowLeft") lbShow(gi - 1);
    });
  }
})();
