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
  var revealEls = document.querySelectorAll(".reveal, .stagger, .lines, .unveil");
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

  /* Above-the-fold content sits inside the hero, which never crosses the
     observer's threshold on load - so play it straight away. */
  var heroEls = document.querySelectorAll(".hero .reveal, .hero .lines, .hero .stagger");
  if (heroEls.length) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        heroEls.forEach(function (el, i) {
          setTimeout(function () { el.classList.add("in"); }, reduce ? 0 : 90 * i);
        });
      });
    });
  }

  /* one-shot pearl sheen as cards arrive */
  var sheenEls = document.querySelectorAll(".sheen");
  if (sheenEls.length && "IntersectionObserver" in window && !reduce) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var delay = 120 * (+el.dataset.sheenIndex || 0);
        setTimeout(function () {
          el.classList.add("is-lit");
          setTimeout(function () { el.classList.remove("is-lit"); }, 1300);
        }, delay);
        sio.unobserve(el);
      });
    }, { threshold: 0.3 });
    sheenEls.forEach(function (el, i) { el.dataset.sheenIndex = i % 5; sio.observe(el); });
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
      var scale = host.classList.contains("hero__media") ? 1.09 : 1.12;
      img.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) scale(" + scale + ")";
    });
    ticking = false;
  }

  function onScroll() {
    onScrollHeader();
    if (!ticking) {
      window.requestAnimationFrame(function () {
        if (!reduce) parallax();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* moments carousel.
     Self-paced: it never holds the page scroll. It advances when the current
     dot's fill animation ends, so every pause source (hover, keyboard focus,
     off-screen, the pause button) freezes it by pausing that one animation. */
  var carousel = document.getElementById("momentCarousel");
  if (carousel) {
    var scenes = [].slice.call(carousel.querySelectorAll(".mscene"));
    var dotBtns = [].slice.call(carousel.querySelectorAll(".moments__dots button"));
    var toggle = carousel.querySelector(".moments__toggle");
    var cur = 0, userPaused = false, hovering = false, focusIn = false, inView = false;

    function go(i) {
      i = (i + scenes.length) % scenes.length;
      if (i === cur) return;
      scenes[cur].classList.remove("is-active");
      scenes[cur].setAttribute("aria-hidden", "true");
      dotBtns[cur].removeAttribute("aria-current");
      cur = i;
      scenes[cur].classList.add("is-active");
      scenes[cur].removeAttribute("aria-hidden");
      dotBtns[cur].setAttribute("aria-current", "true");
    }
    function sync() {
      carousel.classList.toggle("is-paused", userPaused || hovering || focusIn || !inView);
    }

    if (!reduce) carousel.classList.add("is-auto");
    carousel.addEventListener("animationend", function (e) {
      if (e.animationName === "mfill") go(cur + 1);
    });
    carousel.querySelector(".mnav--prev").addEventListener("click", function () { go(cur - 1); });
    carousel.querySelector(".mnav--next").addEventListener("click", function () { go(cur + 1); });
    dotBtns.forEach(function (b, idx) { b.addEventListener("click", function () { go(idx); }); });
    if (toggle) toggle.addEventListener("click", function () {
      userPaused = !userPaused;
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.setAttribute("aria-label", userPaused ? "Play the slideshow" : "Pause the slideshow");
      sync();
    });
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(cur - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { go(cur + 1); e.preventDefault(); }
    });
    carousel.addEventListener("mouseenter", function () { hovering = true; sync(); });
    carousel.addEventListener("mouseleave", function () { hovering = false; sync(); });
    carousel.addEventListener("focusin", function () { focusIn = true; sync(); });
    carousel.addEventListener("focusout", function (e) {
      if (!carousel.contains(e.relatedTarget)) { focusIn = false; sync(); }
    });

    /* horizontal swipe; vertical drags stay with the page (touch-action: pan-y) */
    var sx = 0, sy = 0, tracking = false;
    carousel.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button")) return;
      tracking = true; sx = e.clientX; sy = e.clientY;
    });
    carousel.addEventListener("pointerup", function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) go(cur + (dx < 0 ? 1 : -1));
    });
    carousel.addEventListener("pointercancel", function () { tracking = false; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting; sync();
      }, { threshold: 0.35 }).observe(carousel);
    } else { inView = true; }
    sync();
  }

  /* hero slideshow.
     Same clock as the moments carousel: the active marker's fill animation
     paces the slides, so every pause source (hover, keyboard focus, the hero
     scrolled away, a hidden tab, the pause button) just pauses that one
     animation. Slides cross-fade in place and each re-plays its copy. */
  var hero = document.querySelector("[data-hero-slider]");
  if (hero) {
    var hSlides = [].slice.call(hero.querySelectorAll(".hero__slide"));
    var hDots = [].slice.call(hero.querySelectorAll(".hero__dots button"));
    var hToggle = hero.querySelector(".hero__toggle");
    var hLive = hero.querySelector(".hero__slides");
    var hCur = 0, hUser = false, hHover = false, hFocus = false, hSeen = true;

    // later slides fetch their photographs only once the page has loaded,
    // so the first slide keeps the bandwidth to itself
    function hLoad() {
      hero.querySelectorAll("img[data-src]").forEach(function (im) {
        if (im.getAttribute("data-srcset")) im.srcset = im.getAttribute("data-srcset");
        im.src = im.getAttribute("data-src");
        im.removeAttribute("data-src");
      });
    }
    if (document.readyState === "complete") hLoad();
    else window.addEventListener("load", hLoad);

    function hReplay(slide) {
      var els = [].slice.call(slide.querySelectorAll(".reveal, .lines"));
      els.forEach(function (el) { el.classList.remove("in"); });
      void slide.offsetWidth;
      els.forEach(function (el, i) {
        setTimeout(function () { el.classList.add("in"); }, reduce ? 0 : 160 + 90 * i);
      });
    }
    function hGo(i) {
      i = (i + hSlides.length) % hSlides.length;
      if (i === hCur) return;
      hLoad();
      var from = hSlides[hCur], to = hSlides[i];
      from.classList.remove("is-active");
      from.setAttribute("aria-hidden", "true");
      from.inert = true;
      hDots[hCur].removeAttribute("aria-current");
      hCur = i;
      to.classList.add("is-active");
      to.removeAttribute("aria-hidden");
      to.inert = false;
      hDots[hCur].setAttribute("aria-current", "true");
      hReplay(to);
    }
    function hSync() {
      var paused = hUser || hHover || hFocus || !hSeen || document.hidden;
      hero.classList.toggle("is-paused", paused);
      if (hLive) hLive.setAttribute("aria-live", paused || reduce ? "polite" : "off");
    }

    hSlides.forEach(function (s, idx) {
      if (idx !== hCur) { s.setAttribute("aria-hidden", "true"); s.inert = true; }
    });
    if (!reduce) hero.classList.add("is-auto");
    else if (hToggle) hToggle.hidden = true;   // nothing moves on its own, so there is nothing to pause

    hero.addEventListener("animationend", function (e) {
      if (e.animationName === "hfill") hGo(hCur + 1);
    });
    var hPrev = hero.querySelector(".hnav--prev");
    var hNext = hero.querySelector(".hnav--next");
    if (hPrev) hPrev.addEventListener("click", function () { hGo(hCur - 1); });
    if (hNext) hNext.addEventListener("click", function () { hGo(hCur + 1); });
    hDots.forEach(function (b, idx) { b.addEventListener("click", function () { hGo(idx); }); });
    if (hToggle) hToggle.addEventListener("click", function () {
      hUser = !hUser;
      hToggle.setAttribute("aria-pressed", String(hUser));
      hToggle.setAttribute("aria-label", hUser ? "Play the slideshow" : "Pause the slideshow");
      hSync();
    });
    hero.addEventListener("keydown", function (e) {
      if (!e.target.closest(".hero__controls")) return;
      if (e.key === "ArrowLeft") { hGo(hCur - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { hGo(hCur + 1); e.preventDefault(); }
    });
    hero.addEventListener("mouseenter", function () { hHover = true; hSync(); });
    hero.addEventListener("mouseleave", function () { hHover = false; hSync(); });
    hero.addEventListener("focusin", function () { hFocus = true; hSync(); });
    hero.addEventListener("focusout", function (e) {
      if (!hero.contains(e.relatedTarget)) { hFocus = false; hSync(); }
    });
    document.addEventListener("visibilitychange", hSync);

    /* horizontal swipe on the photograph; vertical drags stay with the page */
    var hsx = 0, hsy = 0, hTrack = false;
    hero.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      hTrack = true; hsx = e.clientX; hsy = e.clientY;
    });
    hero.addEventListener("pointerup", function (e) {
      if (!hTrack) return;
      hTrack = false;
      var dx = e.clientX - hsx, dy = e.clientY - hsy;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) hGo(hCur + (dx < 0 ? 1 : -1));
    });
    hero.addEventListener("pointercancel", function () { hTrack = false; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        hSeen = entries[0].isIntersecting; hSync();
      }, { threshold: 0.3 }).observe(hero);
    }
    hSync();
  }

  /* -------------------------------------------------------------------
     Appointment form.
     The site is static, so a request is delivered two ways:
       1. WhatsApp - prefilled and addressed to the store the visitor picked.
          This is the guaranteed path, so the confirmation copy leads with it.
       2. A Google Sheet, via an Apps Script web app - the durable record.
          Paste the /exec URL into SHEET_ENDPOINT below; while it is empty the
          Sheet step is skipped and WhatsApp still works. See
          docs/APPOINTMENTS-SETUP.md for the script and the deploy steps.
     ------------------------------------------------------------------- */
  var SHEET_ENDPOINT = "";

  var STORE_WHATSAPP = { "Raipur": "919584411144", "Durg": "919244509870" };
  var FALLBACK_WHATSAPP = "919584411144";

  function apptMessage(d) {
    return [
      "New appointment request - Saheli Aurum",
      "",
      "Name: " + d.name,
      "Phone: " + d.phone,
      "Store: " + d.store,
      "Consultation: " + d.type,
      d.note ? "Notes: " + d.note : null
    ].filter(Boolean).join("\n");
  }

  /* Best-effort log to the Sheet. text/plain keeps this a CORS-simple request,
     so Apps Script never sees a preflight it cannot answer. sendBeacon goes
     first because it survives the navigation to WhatsApp. */
  function recordAppointment(d) {
    if (!SHEET_ENDPOINT) return false;
    var body = JSON.stringify(d);
    try {
      if (navigator.sendBeacon &&
          navigator.sendBeacon(SHEET_ENDPOINT, new Blob([body], { type: "text/plain;charset=utf-8" }))) {
        return true;
      }
    } catch (err) {}
    try {
      fetch(SHEET_ENDPOINT, {
        method: "POST", mode: "no-cors", keepalive: true,
        headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body
      });
      return true;
    } catch (err) { return false; }
  }

  var form = document.getElementById("apptForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var val = function (n) {
        var el = form.elements[n];
        return el ? String(el.value || "").trim() : "";
      };
      var data = {
        name: val("name"), phone: val("phone"), store: val("store"),
        type: val("type"), note: val("note"),
        page: location.pathname, submittedAt: new Date().toISOString()
      };

      recordAppointment(data);

      var wa = "https://wa.me/" + (STORE_WHATSAPP[data.store] || FALLBACK_WHATSAPP) +
               "?text=" + encodeURIComponent(apptMessage(data));

      /* The link inside the confirmation is the fallback for a blocked popup,
         so the visitor always has a way through. */
      var link = document.getElementById("apptWa");
      if (link) link.href = wa;
      var ok = document.getElementById("apptOk");
      if (ok) ok.hidden = false;
      form.querySelector('button[type="submit"]').textContent = "Continue on WhatsApp";

      window.open(wa, "_blank", "noopener");
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

  /* collection gallery sliders */
  document.querySelectorAll("[data-gslider]").forEach(function (sl) {
    var track = sl.querySelector(".gslider__track");
    var prev = sl.querySelector(".gnav--prev");
    var next = sl.querySelector(".gnav--next");
    if (!track || !prev || !next) return;

    function step() {
      var first = track.querySelector(".gitem");
      if (!first) return 220;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 12;
      return first.getBoundingClientRect().width + gap;
    }
    // scroll-snap parks the track a few px in and doesn't always fire a
    // scroll event for that adjustment, so keep a tolerance and re-sync
    // once the images have laid out.
    var TOL = 8;
    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      var still = max <= TOL;                     // everything already fits
      sl.classList.toggle("is-static", still);
      sl.classList.toggle("is-end", still || track.scrollLeft >= max - TOL);
      prev.disabled = still || track.scrollLeft <= TOL;
      next.disabled = still || track.scrollLeft >= max - TOL;
    }
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: reduce ? "auto" : "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: reduce ? "auto" : "smooth" }); });
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    if ("ResizeObserver" in window) new ResizeObserver(sync).observe(track);
    track.querySelectorAll("img").forEach(function (im) {
      if (!im.complete) im.addEventListener("load", sync, { once: true });
    });
    window.addEventListener("load", sync);
    sync();
  });

  /* home "shop by piece" sliders: each strip moves on its own beat. A second,
     inert copy of the cards lets a strip wrap without rewinding. Motion stops
     for reduced motion, off-screen strips, hidden tabs, hover or keyboard
     focus, a swipe or the arrows (for a few seconds), and the pause button. */
  var rails = [].slice.call(document.querySelectorAll("[data-prail]"));
  var railsOff = false;
  rails.forEach(function (rail, ri) {
    var track = rail.querySelector(".prail__track");
    if (!track) return;
    var n = track.children.length;
    if (n < 2) return;
    [].slice.call(track.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
      track.appendChild(c);
    });
    var dir = rail.getAttribute("data-dir") === "-1" ? -1 : 1;
    function step() { return track.children[1].offsetLeft - track.children[0].offsetLeft; }
    function loopW() { return track.children[n].offsetLeft - track.children[0].offsetLeft; }
    function go(d) {
      var w = loopW(), x = track.scrollLeft;
      // hop an exact copy-width first, so the next move always has room
      if (d > 0 && x >= w - 2) track.scrollLeft = x - w;
      else if (d < 0 && x <= 2) track.scrollLeft = x + w;
      track.scrollBy({ left: d * step(), behavior: reduce ? "auto" : "smooth" });
    }
    if (dir < 0) track.scrollLeft = loopW();

    var hover = false, seen = false, holdUntil = 0;
    function hold() { holdUntil = Date.now() + 7000; }
    var prev = rail.querySelector(".gnav--prev");
    var next = rail.querySelector(".gnav--next");
    if (prev) prev.addEventListener("click", function () { hold(); go(-1); });
    if (next) next.addEventListener("click", function () { hold(); go(1); });
    rail.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hover = true; });
    rail.addEventListener("pointerleave", function () { hover = false; });
    rail.addEventListener("focusin", function () { hover = true; });
    rail.addEventListener("focusout", function (e) { if (!rail.contains(e.relatedTarget)) hover = false; });
    track.addEventListener("touchstart", hold, { passive: true });
    track.addEventListener("wheel", function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) hold(); }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; }, { threshold: 0.35 }).observe(rail);
    } else {
      seen = true;
    }
    if (reduce) return;
    setTimeout(function () {
      setInterval(function () {
        if (railsOff || hover || !seen || document.hidden || Date.now() < holdUntil) return;
        go(dir);
      }, 3600);
    }, 700 + ri * 900);
  });
  var railToggle = document.querySelector("[data-pieces-toggle]");
  if (railToggle && rails.length && !reduce) {
    railToggle.hidden = false;
    railToggle.addEventListener("click", function () {
      railsOff = !railsOff;
      railToggle.setAttribute("aria-pressed", String(railsOff));
      railToggle.textContent = railsOff ? "Play the sliders" : "Pause the sliders";
    });
  }

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
