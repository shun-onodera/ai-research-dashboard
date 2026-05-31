/* AI活用リサーチ ダッシュボード — 最小JS（CDN非依存） */
(function () {
  "use strict";

  /* モバイル: グローバルメニュー開閉 */
  function initNav() {
    var btn = document.querySelector(".navtoggle");
    var nav = document.querySelector(".gnav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* data属性で基準パスを解決（サブディレクトリからの相対参照に対応） */
  function dataPath() {
    var el = document.querySelector("[data-json]");
    return el ? el.getAttribute("data-json") : "data/ai-katsuyo.json";
  }

  var SRC_CLASS = { anthropic: "src-anthropic", openai: "src-openai", google: "src-google" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderPrinciples(p) {
    var box = document.getElementById("principles");
    if (!box || !p) return;
    var lis = p.items.map(function (it) {
      return "<li><b>" + esc(it.title) + "</b><span>" + esc(it.body) + "</span></li>";
    }).join("");
    box.innerHTML =
      "<h2>" + esc(p.title) + "</h2>" +
      "<p class='sub'>" + esc(p.subtitle) + "</p>" +
      "<ol>" + lis + "</ol>";
  }

  function articleCard(a, srcLabel, catLabel) {
    var pub = a.published ? a.published : "—";
    var col = a.collected ? a.collected : "";
    var points = (a.points || []).map(function (pt) {
      return "<li>" + esc(pt) + "</li>";
    }).join("");
    return (
      '<article class="article" data-source="' + esc(a.source) + '" data-category="' + esc(a.category) + '" data-collected="' + esc(col) + '">' +
        '<div class="top">' +
          '<span class="src-tag ' + (SRC_CLASS[a.source] || "") + '">' + esc(srcLabel) + "</span>" +
          '<span class="cat-tag">' + esc(catLabel) + "</span>" +
          (col ? '<span class="collected-tag">収集 ' + esc(col) + "</span>" : "") +
        "</div>" +
        "<h3>" + esc(a.title) + "</h3>" +
        '<p class="summary">' + esc(a.summary) + "</p>" +
        '<ul class="points">' + points + "</ul>" +
        '<div class="foot">' +
          '<span class="pub2">' + esc(a.publisher) + (pub !== "—" ? "・" + esc(pub) : "") + "</span>" +
          '<a class="source-link" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">原文</a>' +
        "</div>" +
      "</article>"
    );
  }

  function initFilters() {
    var chips = document.querySelectorAll(".chip");
    if (!chips.length) return;
    var state = { source: "all", category: "all" };

    function apply() {
      var cards = document.querySelectorAll(".article");
      var shown = 0;
      cards.forEach(function (c) {
        var okS = state.source === "all" || c.getAttribute("data-source") === state.source;
        var okC = state.category === "all" || c.getAttribute("data-category") === state.category;
        var ok = okS && okC;
        c.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      var empty = document.querySelector(".empty");
      if (empty) empty.style.display = shown === 0 ? "block" : "none";
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var group = chip.getAttribute("data-group");
        var val = chip.getAttribute("data-value");
        document.querySelectorAll('.chip[data-group="' + group + '"]').forEach(function (c) {
          c.classList.remove("active");
        });
        chip.classList.add("active");
        state[group] = val;
        apply();
      });
    });
  }

  function initSort() {
    var sel = document.getElementById("sort");
    var wrap = document.getElementById("articles");
    if (!sel || !wrap) return;
    function apply() {
      var cards = Array.prototype.slice.call(wrap.querySelectorAll(".article"));
      var mode = sel.value;
      cards.sort(function (a, b) {
        var av = a.getAttribute("data-collected") || "";
        var bv = b.getAttribute("data-collected") || "";
        // 同収集日内は元の並び（DOM順）を保つため index で安定化
        if (av === bv) {
          return (Number(a.dataset.idx) || 0) - (Number(b.dataset.idx) || 0);
        }
        return mode === "old" ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
      });
      cards.forEach(function (c) { wrap.appendChild(c); });
    }
    sel.addEventListener("change", apply);
    apply(); // 初期: 新しい順
  }

  function renderArticles(data) {
    var wrap = document.getElementById("articles");
    if (!wrap) return;
    var srcMap = {}, catMap = {};
    (data.sources || []).forEach(function (s) { srcMap[s.key] = s.label; });
    (data.categories || []).forEach(function (c) { catMap[c.key] = c.label; });
    wrap.innerHTML = (data.articles || []).map(function (a) {
      return articleCard(a, srcMap[a.source] || a.source, catMap[a.category] || a.category);
    }).join("");
    // 安定ソート用に元の並び順を記録
    Array.prototype.slice.call(wrap.querySelectorAll(".article")).forEach(function (c, i) {
      c.dataset.idx = i;
    });
    initFilters();
    initSort();
  }

  function setUpdated(data) {
    document.querySelectorAll("[data-updated]").forEach(function (el) {
      el.textContent = data.updated || "";
    });
    var count = document.querySelector("[data-count]");
    if (count) count.textContent = (data.articles || []).length;
  }

  function initThemePage() {
    if (!document.getElementById("articles") && !document.getElementById("principles")) return;
    fetch(dataPath())
      .then(function (r) { if (!r.ok) throw new Error("load failed"); return r.json(); })
      .then(function (data) {
        renderPrinciples(data.principles);
        renderArticles(data);
        setUpdated(data);
      })
      .catch(function (e) {
        var wrap = document.getElementById("articles");
        if (wrap) wrap.innerHTML = '<p class="empty" style="display:block">データの読み込みに失敗しました。</p>';
        console.error(e);
      });
  }

  /* 簡易ルータ不要。各ページ共通で初期化 */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initThemePage();
  });
})();
