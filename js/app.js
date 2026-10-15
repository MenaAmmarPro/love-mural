"use strict";

/*
 * love-mural — page logic.
 *
 * A shared canvas we fill in together. Marks are stored as normalised
 * coordinates (0..1) so the mural keeps its shape at any screen size.
 * Everything stays on this device in localStorage.
 */

(function () {
  var STORE = "mena-mural";

  var state = {
    strokes: [],
    color: "#ffffff",
    shape: "heart",
    size: 26
  };

  var canvas = null;
  var ctx = null;
  var pressing = false;
  var lastStamp = { x: -1, y: -1 };

  /* ---------------- storage ---------------- */

  function load() {
    state.strokes = [];
    var raw = null;
    try { raw = localStorage.getItem(STORE); } catch (e) { raw = null; }
    var s = null;
    if (raw) { try { s = JSON.parse(raw); } catch (e) { s = null; } }
    if (s && Array.isArray(s.strokes)) {
      s.strokes.forEach(function (m) {
        if (m && isFinite(m.x) && isFinite(m.y)) {
          state.strokes.push({
            x: clamp01(m.x),
            y: clamp01(m.y),
            c: typeof m.c === "string" ? m.c.slice(0, 24) : "#ffffff",
            s: typeof m.s === "string" ? m.s.slice(0, 12) : "heart",
            sz: isFinite(m.sz) ? Math.max(4, Math.min(120, m.sz)) : 26
          });
        }
      });
    }
    if (s && typeof s.color === "string") state.color = s.color;
    if (s && typeof s.shape === "string") state.shape = s.shape;
    if (s && isFinite(s.size)) state.size = Math.max(10, Math.min(60, s.size));
  }

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        strokes: state.strokes,
        color: state.color,
        shape: state.shape,
        size: state.size
      }));
    } catch (e) { /* ignore */ }
  }

  /* ---------------- helpers ---------------- */

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function note(message) { setText("save-note", message); }

  /* ---------------- drawing ---------------- */

  function drawShape(g, px, py, size, shape) {
    g.save();
    g.fillStyle = state.color;
    g.beginPath();
    if (shape === "dot") {
      g.arc(px, py, size / 2, 0, Math.PI * 2);
    } else if (shape === "star") {
      var spikes = 5;
      var outer = size / 2;
      var inner = outer * 0.42;
      for (var i = 0; i < spikes * 2; i += 1) {
        var r = (i % 2 === 0) ? outer : inner;
        var a = (Math.PI / spikes) * i - Math.PI / 2;
        var x = px + Math.cos(a) * r;
        var y = py + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
    } else if (shape === "spark") {
      g.moveTo(px, py - size / 2);
      g.quadraticCurveTo(px, py, px + size / 2, py);
      g.quadraticCurveTo(px, py, px, py + size / 2);
      g.quadraticCurveTo(px, py, px - size / 2, py);
      g.quadraticCurveTo(px, py, px, py - size / 2);
      g.closePath();
    } else {
      var t = size / 2;
      g.moveTo(px, py + t * 0.75);
      g.bezierCurveTo(px - t * 1.6, py - t * 0.5, px - t * 0.5, py - t * 1.3, px, py - t * 0.45);
      g.bezierCurveTo(px + t * 0.5, py - t * 1.3, px + t * 1.6, py - t * 0.5, px, py + t * 0.75);
      g.closePath();
    }
    g.fill();
    g.restore();
  }

  function redraw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.strokes.forEach(function (m) {
      var px = m.x * canvas.width;
      var py = m.y * canvas.height;
      var sz = m.sz * (canvas.width / 800);
      var saved = state.color;
      state.color = m.c;
      drawShape(ctx, px, py, sz, m.s);
      state.color = saved;
    });
    updateHint();
  }

  function updateHint() {
    var hint = document.getElementById("mural-hint");
    if (hint) hint.hidden = state.strokes.length > 0;
    setText("mural-count", state.strokes.length);
  }

  function stamp(nx, ny) {
    nx = clamp01(nx);
    ny = clamp01(ny);
    if (lastStamp.x >= 0 && Math.abs(nx - lastStamp.x) < 0.012 && Math.abs(ny - lastStamp.y) < 0.012) {
      return;
    }
    lastStamp.x = nx; lastStamp.y = ny;
    state.strokes.push({ x: nx, y: ny, c: state.color, s: state.shape, sz: state.size });
    if (ctx && canvas) {
      var savedColor = state.color;
      state.color = state.strokes[state.strokes.length - 1].c;
      drawShape(ctx, nx * canvas.width, ny * canvas.height, state.size * (canvas.width / 800), state.shape);
      state.color = savedColor;
    }
    save();
    updateHint();
  }

  /* ---------------- canvas sizing ---------------- */

  function resize() {
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    var cssW = rect && rect.width ? rect.width : canvas.width;
    var cssH = rect && rect.height ? rect.height : (cssW * 5 / 8);
    var dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    redraw();
  }

  /* ---------------- pointer handling ---------------- */

  function pointFrom(ev) {
    var rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    var w = rect.width || canvas.width;
    var h = rect.height || canvas.height;
    return {
      x: (ev.clientX - rect.left) / w,
      y: (ev.clientY - rect.top) / h
    };
  }

  function onDown(ev) {
    pressing = true;
    lastStamp.x = -1;
    var p = pointFrom(ev);
    stamp(p.x, p.y);
  }

  function onMove(ev) {
    if (!pressing) return;
    var p = pointFrom(ev);
    stamp(p.x, p.y);
  }

  function onUp() { pressing = false; lastStamp.x = -1; }

  /* ---------------- actions ---------------- */

  function undo() {
    if (!state.strokes.length) { note("The wall is already empty."); return; }
    state.strokes.pop();
    save();
    redraw();
    note("Took back the last mark.");
  }

  function clear() {
    state.strokes = [];
    save();
    redraw();
    note("The wall is clear \u2014 a fresh canvas whenever you're ready.");
  }

  function download() {
    if (!canvas || typeof canvas.toDataURL !== "function") return;
    try {
      var url = canvas.toDataURL("image/png");
      var a = document.createElement("a");
      a.href = url;
      a.download = "our-mural.png";
      if (a.click) a.click();
      note("Your mural is on its way \u2665");
    } catch (e) {
      note("Couldn't save the image here.");
    }
  }

  /* ---------------- wiring ---------------- */

  function setActive(container, target) {
    if (!container) return;
    var kids = container.children || [];
    for (var i = 0; i < kids.length; i += 1) {
      var cls = " " + (kids[i].className || "") + " ";
      kids[i].className = cls.replace(" is-active ", " ").replace(/^\s+|\s+$/g, "");
    }
    if (target) target.className = (target.className ? target.className + " " : "") + "is-active";
  }

  function wire() {
    var palette = document.getElementById("palette");
    if (palette) {
      var sws = palette.children || [];
      for (var i = 0; i < sws.length; i += 1) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var c = btn.getAttribute ? btn.getAttribute("data-color") : null;
            if (c) { state.color = c; save(); setActive(palette, btn); }
          });
        })(sws[i]);
      }
    }

    var brushes = document.getElementById("brushes");
    if (brushes) {
      var brs = brushes.children || [];
      for (var j = 0; j < brs.length; j += 1) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var s = btn.getAttribute ? btn.getAttribute("data-shape") : null;
            if (s) { state.shape = s; save(); setActive(brushes, btn); }
          });
        })(brs[j]);
      }
    }

    var slider = document.getElementById("size-slider");
    if (slider) slider.addEventListener("input", function () {
      state.size = Number(slider.value) || state.size;
      save();
    });

    var undoBtn = document.getElementById("undo-mural");
    if (undoBtn) undoBtn.addEventListener("click", undo);

    var clearBtn = document.getElementById("clear-mural");
    if (clearBtn) clearBtn.addEventListener("click", clear);

    var dl = document.getElementById("download-mural");
    if (dl) dl.addEventListener("click", download);

    var share = document.getElementById("share-button");
    if (share) share.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { note("Link copied \u2665"); })
          .catch(function () { note(url); });
        return;
      }
      note(url);
    });

    if (canvas && canvas.addEventListener) {
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointerleave", onUp);
    }

    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("resize", resize);
    }
  }

  /* ---------------- boot ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("mural-canvas");
    if (canvas && canvas.getContext) {
      ctx = canvas.getContext("2d");
    }
    load();
    resize();
    wire();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
  });
})();
