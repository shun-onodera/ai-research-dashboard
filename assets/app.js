/* リサーチ・ダッシュボード — 最小JS（CDN非依存・多テーマ汎用） */
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

  /* data属性で読み込むJSONパスを解決 */
  function dataPath() {
    var el = document.querySelector("[data-json]");
    return el ? el.getAttribute("data-json") : null;
  }

  /* 情報源キー→配色クラス（AI活用は社名、他テーマは汎用色） */
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

  /* 情報源の表示ラベルとフィルタ用キーを解決 */
  function srcLabelOf(a, srcMap) {
    if (a.source && srcMap[a.source]) return srcMap[a.source];
    if (a.source_label) return a.source_label;
    if (a.source) return a.source;
    return "";
  }
  function srcKeyOf(a) {
    // フィルタの粒度: source（AI活用）または source_label（他テーマ）
    return a.source != null ? a.source : (a.source_label || "");
  }

  function articleCard(a, srcMap, catMap) {
    var pub = a.published ? a.published : "";
    var col = a.collected ? a.collected : "";
    var label = srcLabelOf(a, srcMap);
    var srcKey = srcKeyOf(a);
    var catLabel = catMap[a.category] || a.category || "";
    var points = (a.points || []).map(function (pt) {
      return "<li>" + esc(pt) + "</li>";
    }).join("");
    var pubText = esc(a.publisher || a.org || "");
    if (pub) pubText += (pubText ? "・" : "") + esc(pub);
    var srcClass = SRC_CLASS[a.source] || "src-generic";
    var link = a.url
      ? '<a class="source-link" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">出典</a>'
      : (a.source ? '<span class="src-note">' + esc(a.source) + "</span>" : "");
    return (
      '<article class="article" data-source="' + esc(srcKey) + '" data-category="' + esc(a.category || "") + '" data-collected="' + esc(col) + '">' +
        '<div class="top">' +
          '<span class="src-tag ' + srcClass + '">' + esc(label) + "</span>" +
          (catLabel ? '<span class="cat-tag">' + esc(catLabel) + "</span>" : "") +
          (col ? '<span class="collected-tag">収集 ' + esc(col) + "</span>" : "") +
        "</div>" +
        "<h3>" + esc(a.title) + "</h3>" +
        '<p class="summary">' + esc(a.summary) + "</p>" +
        '<ul class="points">' + points + "</ul>" +
        '<div class="foot">' +
          '<span class="pub2">' + pubText + "</span>" +
          link +
        "</div>" +
      "</article>"
    );
  }

  /* フィルタUIをJSONから動的生成 */
  function buildFilters(data) {
    var box = document.getElementById("filters");
    if (!box) return;
    var html = "";
    if ((data.sources || []).length) {
      html += '<div class="grp"><span class="lbl">情報源</span>' +
        '<button class="chip active" data-group="source" data-value="all">すべて</button>' +
        data.sources.map(function (s) {
          return '<button class="chip" data-group="source" data-value="' + esc(s.key) + '">' + esc(s.label) + "</button>";
        }).join("") + "</div>";
    }
    if ((data.categories || []).length) {
      html += '<div class="grp"><span class="lbl">カテゴリ</span>' +
        '<button class="chip active" data-group="category" data-value="all">すべて</button>' +
        data.categories.map(function (c) {
          return '<button class="chip" data-group="category" data-value="' + esc(c.key) + '">' + esc(c.label) + "</button>";
        }).join("") + "</div>";
    }
    html += '<div class="grp sort-grp"><span class="lbl">並び替え</span>' +
      '<label class="sort-label" for="sort">収集日</label>' +
      '<select id="sort" class="sort-select" aria-label="収集日で並び替え">' +
      '<option value="new">新しい順</option><option value="old">古い順</option></select></div>';
    box.innerHTML = html;
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
        document.querySelectorAll('.chip[data-group="' + group + '"]').forEach(function (c) {
          c.classList.remove("active");
        });
        chip.classList.add("active");
        state[group] = chip.getAttribute("data-value");
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
        if (av === bv) return (Number(a.dataset.idx) || 0) - (Number(b.dataset.idx) || 0);
        return mode === "old" ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
      });
      cards.forEach(function (c) { wrap.appendChild(c); });
    }
    sel.addEventListener("change", apply);
    apply();
  }

  function renderArticles(data) {
    var wrap = document.getElementById("articles");
    if (!wrap) return;
    var srcMap = {}, catMap = {};
    (data.sources || []).forEach(function (s) { srcMap[s.key] = s.label; });
    (data.categories || []).forEach(function (c) { catMap[c.key] = c.label; });
    wrap.innerHTML = (data.articles || []).map(function (a) {
      return articleCard(a, srcMap, catMap);
    }).join("");
    Array.prototype.slice.call(wrap.querySelectorAll(".article")).forEach(function (c, i) {
      c.dataset.idx = i;
    });
    buildFilters(data);
    initFilters();
    initSort();
  }

  function setUpdated(data) {
    document.querySelectorAll("[data-updated]").forEach(function (el) {
      el.textContent = data.updated || "";
    });
    document.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = (data.articles || []).length;
    });
    var desc = document.querySelector("[data-desc]");
    if (desc && data.description) desc.textContent = data.description;
  }

  function initThemePage() {
    var path = dataPath();
    if (!path) return;
    if (!document.getElementById("articles") && !document.getElementById("principles")) return;
    fetch(path)
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

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initThemePage();
  });
})();
