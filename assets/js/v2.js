/* Saheli Aurum — landing v2 ("Sheesh Mahal").
   main.js runs everything shared (header, reveals, carousel, sliders, form);
   this adds only what the mirror-hall hero needs. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hall = document.querySelector(".mh");
  if (!hall) return;

  /* the hero is on screen at load, so play its entrance straight away */
  var parts = hall.querySelectorAll(".reveal, .lines");
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      parts.forEach(function (el, i) {
        setTimeout(function () { el.classList.add("in"); }, reduce ? 0 : 110 * i);
      });
    });
  });

  /* the pointer is a light moving across the mirror mosaic */
  if (reduce || !window.matchMedia("(hover: hover)").matches) return;
  var raf = 0, mx = 66, my = 34;
  hall.addEventListener("pointermove", function (e) {
    var r = hall.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * 100;
    my = ((e.clientY - r.top) / r.height) * 100;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      hall.style.setProperty("--mx", mx.toFixed(1) + "%");
      hall.style.setProperty("--my", my.toFixed(1) + "%");
      raf = 0;
    });
  }, { passive: true });
})();
