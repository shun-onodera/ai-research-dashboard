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
      '<article class="article" data-source="' + esc(srcKey) + '" data-category="' + esc(a.category || "") + '" data-collected="' + esc(col) + '" data-published="' + esc(pub) + '">' +
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
      '<select id="sort-key" class="sort-select" aria-label="並び替えの基準">' +
      '<option value="collected">収集日</option><option value="published">公開日</option></select>' +
      '<select id="sort-order" class="sort-select" aria-label="並び替えの順序">' +
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

  /* 公開日の表記ゆれ（2026-05 / 2024-12-19 / FY2025 / FY2026 第1四半期 / 空）を
     比較可能な YYYYMMDD 文字列に正規化。年→月→日の順に判定し、無い桁は 00 で補う。
     全く年が取れないものは "00000000"（最古扱い）。 */
  function pubKey(s) {
    s = String(s || "");
    var ym = s.match(/(\d{4})-(\d{2})(?:-(\d{2}))?/); // 2026-05 / 2026-05-21
    if (ym) return ym[1] + ym[2] + (ym[3] || "00");
    var fy = s.match(/FY\s?(\d{4})/i) || s.match(/(\d{4})\s*年/); // FY2025 / 2026年
    if (fy) return fy[1] + "0000";
    var y = s.match(/(\d{4})/);
    if (y) return y[1] + "0000";
    return "00000000";
  }

  function initSort() {
    var keySel = document.getElementById("sort-key");
    var orderSel = document.getElementById("sort-order");
    var wrap = document.getElementById("articles");
    if (!keySel || !orderSel || !wrap) return;
    function valOf(el, key) {
      if (key === "published") return pubKey(el.getAttribute("data-published"));
      return el.getAttribute("data-collected") || "";
    }
    function apply() {
      var cards = Array.prototype.slice.call(wrap.querySelectorAll(".article"));
      var key = keySel.value, order = orderSel.value;
      cards.sort(function (a, b) {
        var av = valOf(a, key), bv = valOf(b, key);
        if (av === bv) return (Number(a.dataset.idx) || 0) - (Number(b.dataset.idx) || 0);
        return order === "old" ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
      });
      cards.forEach(function (c) { wrap.appendChild(c); });
    }
    keySel.addEventListener("change", apply);
    orderSel.addEventListener("change", apply);
    apply();
  }

  /* KPIカード: 成長率・営業利益率の横棒バー＋数値＋背景テキスト */
  function fmtNum(n) {
    if (n == null) return "—";
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function barRow(label, val, unit, kind) {
    // val(%) を 0〜100 の幅に。負値は0幅＋負記号、上限は40%でフルとして視認性確保
    var n = (val == null) ? null : Number(val);
    var pct = (n == null) ? 0 : Math.max(0, Math.min(100, (Math.abs(n) / 40) * 100));
    var neg = (n != null && n < 0);
    var valText = (n == null) ? "未開示" : (n + unit);
    return (
      '<div class="kpi-row">' +
        '<span class="kpi-label">' + esc(label) + "</span>" +
        '<span class="kpi-track"><span class="kpi-fill kpi-' + kind + (neg ? " kpi-neg" : "") + '" style="width:' + pct + '%"></span></span>' +
        '<span class="kpi-val' + (neg ? " neg" : "") + '">' + esc(valText) + "</span>" +
      "</div>"
    );
  }
  function kpiCard(a, catMap) {
    var col = a.collected || "";
    var catLabel = catMap[a.category] || a.category || "";
    var rev = a.revenue != null ? (fmtNum(a.revenue) + (a.revenueUnit || "")) : "—";
    var opp = a.opProfit != null ? (fmtNum(a.opProfit) + (a.opProfitUnit || "")) : "—";
    return (
      '<article class="article kpi-card" data-source="' + esc(a.source_label || "") + '" data-category="' + esc(a.category || "") + '" data-collected="' + esc(col) + '" data-published="' + esc(a.published || "") + '">' +
        '<div class="top">' +
          '<span class="src-tag src-generic">' + esc(a.source_label || a.title) + "</span>" +
          (catLabel ? '<span class="cat-tag">' + esc(catLabel) + "</span>" : "") +
          (col ? '<span class="collected-tag">収集 ' + esc(col) + "</span>" : "") +
        "</div>" +
        "<h3>" + esc(a.title) + "</h3>" +
        '<p class="kpi-period">' + esc(a.fiscalPeriod || a.published || "") + "</p>" +
        '<div class="kpi-figures">' +
          '<div class="kpi-fig"><span class="kpi-fig-label">売上高</span><span class="kpi-fig-val">' + esc(rev) + "</span></div>" +
          '<div class="kpi-fig"><span class="kpi-fig-label">営業利益</span><span class="kpi-fig-val">' + esc(opp) + "</span></div>" +
        "</div>" +
        '<div class="kpi-bars">' +
          barRow("売上 前年比", a.yoyPct, "%", "growth") +
          barRow("営業利益 前年比", a.opYoyPct, "%", "growth2") +
          barRow("営業利益率", a.opMargin, "%", "margin") +
        "</div>" +
        '<p class="kpi-bg"><span class="kpi-bg-label">直近の動きの背景</span>' + esc(a.background || "") + "</p>" +
        (a.extra ? '<p class="kpi-extra">' + esc(a.extra) + "</p>" : "") +
        '<div class="foot">' +
          '<span class="pub2"></span>' +
          (a.source ? '<span class="src-note">' + esc(a.source) + "</span>" : "") +
        "</div>" +
      "</article>"
    );
  }

  /* 全社横断の比較バーチャート（#kpi-charts に描画） */
  function renderKpiCharts(articles) {
    var box = document.getElementById("kpi-charts");
    if (!box) return;
    // 売上ランキング（国内＝百万円のみ。通貨混在を避ける）
    var dom = articles.filter(function (a) { return a.revenueUnit === "百万円" && a.revenue != null; });
    var revSorted = dom.slice().sort(function (a, b) { return b.revenue - a.revenue; });
    var maxRev = revSorted.length ? revSorted[0].revenue : 1;
    function revBars() {
      return revSorted.map(function (a) {
        var w = Math.max(2, (a.revenue / maxRev) * 100);
        var oku = (a.revenue / 100).toFixed(0); // 百万円→億円概算表示
        return '<div class="ch-row"><span class="ch-name">' + esc(a.title) + '</span>' +
          '<span class="ch-track"><span class="ch-fill ch-rev" style="width:' + w + '%"></span></span>' +
          '<span class="ch-val">' + esc(fmtNum(a.revenue)) + '<small>百万円</small></span></div>';
      }).join("");
    }
    // 売上成長率ランキング（全社・百万円社のみ＝比較整合）。0基線で正負を左右に
    var grSorted = dom.filter(function (a) { return a.yoyPct != null; })
      .slice().sort(function (a, b) { return b.yoyPct - a.yoyPct; });
    var maxAbs = grSorted.reduce(function (m, a) { return Math.max(m, Math.abs(a.yoyPct)); }, 1);
    function growthBars() {
      return grSorted.map(function (a) {
        var n = a.yoyPct;
        var w = (Math.abs(n) / maxAbs) * 50; // 中央から最大50%
        var side = n >= 0 ? "pos" : "neg";
        var bar = n >= 0
          ? '<span class="ch-fill ch-gpos" style="left:50%;width:' + w + '%"></span>'
          : '<span class="ch-fill ch-gneg" style="right:50%;width:' + w + '%"></span>';
        return '<div class="ch-row"><span class="ch-name">' + esc(a.title) + '</span>' +
          '<span class="ch-track ch-track-mid">' + bar + '<span class="ch-mid"></span></span>' +
          '<span class="ch-val ' + side + '">' + (n >= 0 ? "+" : "") + n + '%</span></div>';
      }).join("");
    }
    box.innerHTML =
      '<div class="kpi-chart-card">' +
        '<h3 class="kpi-chart-title">売上高ランキング（国内・直近通期）</h3>' +
        '<div class="ch">' + revBars() + "</div>" +
        '<p class="kpi-chart-note">単位：百万円。海外2社（Upwork/Fiverr）は通貨が異なるため本グラフには含めていません（各社カードに数値表記）。</p>' +
      "</div>" +
      '<div class="kpi-chart-card">' +
        '<h3 class="kpi-chart-title">売上 前年比成長率（国内・直近通期）</h3>' +
        '<div class="ch">' + growthBars() + "</div>" +
        '<p class="kpi-chart-note">中央線が0%。右（青）が増収、左（オレンジ）が減収。決算期は会社ごとに異なります。</p>' +
      "</div>";
  }

  function renderArticles(data) {
    var wrap = document.getElementById("articles");
    if (!wrap) return;
    var srcMap = {}, catMap = {};
    (data.sources || []).forEach(function (s) { srcMap[s.key] = s.label; });
    (data.categories || []).forEach(function (c) { catMap[c.key] = c.label; });
    var isKpi = data.type === "kpi";
    if (isKpi) { wrap.classList.add("kpi-grid"); renderKpiCharts(data.articles || []); }
    wrap.innerHTML = (data.articles || []).map(function (a) {
      return isKpi ? kpiCard(a, catMap) : articleCard(a, srcMap, catMap);
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
