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

  function articleCard(a, srcMap, catMap, relMap) {
    var pub = a.published ? a.published : "";
    var col = a.collected ? a.collected : "";
    var label = srcLabelOf(a, srcMap);
    var srcKey = srcKeyOf(a);
    var catLabel = catMap[a.category] || a.category || "";
    relMap = relMap || {};
    var relLabel = relMap[a.relation] || "";
    var relSubLabel = relMap[a.relation_sub] || "";
    var points = (a.points || []).map(function (pt) {
      return "<li>" + esc(pt) + "</li>";
    }).join("");
    var pubText = esc(a.publisher || a.org || "");
    var srcClass = SRC_CLASS[a.source] || "src-generic";
    var link = a.url
      ? '<a class="source-link" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">出典</a>'
      : (a.source ? '<span class="src-note">' + esc(a.source) + "</span>" : "");
    var detail = a.deepdive
      ? '<a class="detail-link" href="../report/index.html?r=' + esc(a.deepdive) + '">詳細を読む（日本市場示唆つき）→</a>'
      : "";
    return (
      '<article class="article" data-source="' + esc(srcKey) + '" data-category="' + esc(a.category || "") + '" data-relation="' + esc(a.relation || "") + '" data-collected="' + esc(col) + '" data-published="' + esc(pub) + '">' +
        '<div class="top">' +
          '<span class="src-tag ' + srcClass + '">' + esc(label) + "</span>" +
          (catLabel ? '<span class="cat-tag">' + esc(catLabel) + "</span>" : "") +
          (relLabel ? '<span class="rel-tag rel-' + esc(a.relation || "") + '">' + esc(relLabel) + "</span>" : "") +
          (relSubLabel ? '<span class="rel-tag rel-sub">＋' + esc(relSubLabel) + "</span>" : "") +
          '<span class="date-tags">' +
            (pub ? '<span class="published-tag">公開 ' + esc(pub) + "</span>" : "") +
            (col ? '<span class="collected-tag">収集 ' + esc(col) + "</span>" : "") +
          "</span>" +
        "</div>" +
        "<h3>" + esc(a.title) + "</h3>" +
        '<p class="summary">' + esc(a.summary) + "</p>" +
        '<ul class="points">' + points + "</ul>" +
        (a.implication ? '<p class="impl-note"><span class="impl-note-label">市場への示唆</span>' + esc(a.implication) + "</p>" : "") +
        (detail ? '<div class="detail-row">' + detail + "</div>" : "") +
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
    if ((data.relations || []).length) {
      html += '<div class="grp"><span class="lbl">戦略区分</span>' +
        '<button class="chip active" data-group="relation" data-value="all">すべて</button>' +
        data.relations.map(function (c) {
          return '<button class="chip" data-group="relation" data-value="' + esc(c.key) + '">' + esc(c.label) + "</button>";
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
    var state = { source: "all", category: "all", relation: "all" };
    function apply() {
      var cards = document.querySelectorAll(".article");
      var shown = 0;
      cards.forEach(function (c) {
        var okS = state.source === "all" || c.getAttribute("data-source") === state.source;
        var okC = state.category === "all" || c.getAttribute("data-category") === state.category;
        var okR = state.relation === "all" || c.getAttribute("data-relation") === state.relation;
        var ok = okS && okC && okR;
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
  /* 決算期ラベルを短縮: 「2025年9月期」→「FY25/9」、「FY2024（2024年12月期）」→「FY24/12」 */
  function fyShort(period) {
    var s = String(period || "");
    var m = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月期/);
    if (m) return "FY" + m[1].slice(2) + "/" + m[2];
    var m2 = s.match(/FY(\d{4}).*?(\d{1,2})月期/);
    if (m2) return "FY" + m2[1].slice(2) + "/" + m2[2];
    var m3 = s.match(/(\d{4})/);
    if (m3) return "FY" + m3[1].slice(2);
    return "";
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
  /* 金額表示（安全HTMLを返す）。百万USDなら円換算（億円）を併記 */
  function moneyHtml(val, unit, usdjpy) {
    if (val == null) return "—";
    var base = esc(fmtNum(val) + (unit || ""));
    if (unit === "百万USD" && usdjpy) {
      var oku = (val * usdjpy) / 100; // 百万USD×レート=百万円 → ÷100で億円
      base += '<span class="kpi-fig-jpy">(約' + esc((Math.round(oku * 10) / 10).toLocaleString()) + '億円)</span>';
    }
    return base;
  }
  function kpiCard(a, catMap, usdjpy) {
    var col = a.collected || "";
    var catLabel = catMap[a.category] || a.category || "";
    var rev = moneyHtml(a.revenue, a.revenueUnit, usdjpy);
    var opp = moneyHtml(a.opProfit, a.opProfitUnit, usdjpy);
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
          '<div class="kpi-fig"><span class="kpi-fig-label">売上高</span><span class="kpi-fig-val">' + rev + "</span></div>" +
          '<div class="kpi-fig"><span class="kpi-fig-label">営業利益</span><span class="kpi-fig-val">' + opp + "</span></div>" +
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

  /* 時系列の折れ線グラフ（SVG・CDN非依存）を #kpi-timeseries に描画 */
  var TS_COLORS = ["#0017c1", "#0a7a52", "#9a4313", "#5b9bd5", "#6b7280", "#7a3da0", "#b08900", "#c0392b", "#117a8b"];
  function buildLineChart(seriesList, valueKey, opt) {
    // seriesList: [{company, points:[{label,fy,<valueKey>}]}], valueKey: "revenue"|"opMargin"
    var W = 560, H = 280, padL = 52, padR = 92, padT = 16, padB = 30;
    var allFy = {}, vals = [];
    seriesList.forEach(function (s) {
      s.points.forEach(function (p) {
        if (p[valueKey] != null) { allFy[p.fy] = (p.label || p.fy); vals.push(p[valueKey]); }
      });
    });
    var fys = Object.keys(allFy).map(Number).sort(function (a, b) { return a - b; });
    if (!fys.length) return "";
    var rawMin = Math.min.apply(null, vals), rawMax = Math.max.apply(null, vals);
    if (opt && opt.zeroBase) rawMin = Math.min(0, rawMin);
    if (rawMin === rawMax) { rawMax = rawMin + 1; }
    // 切りのよい目盛り（nice numbers）: 0起点で、4分割が綺麗な刻みに丸める
    function niceStep(range, ticks) {
      var rough = range / ticks;
      var mag = Math.pow(10, Math.floor(Math.log(rough) / Math.LN10));
      var norm = rough / mag;
      var step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
      return step * mag;
    }
    var TICKS = 4;
    var niceFrom = (opt && opt.zeroBase) ? 0 : null;
    var baseMin = (niceFrom != null) ? 0 : rawMin;
    var step = niceStep(rawMax - baseMin, TICKS);
    var minV = (niceFrom != null) ? 0 : Math.floor(rawMin / step) * step;
    var maxV = Math.ceil(rawMax / step) * step;
    if (minV === maxV) maxV = minV + step;
    var span = maxV - minV;
    function xOf(fy) {
      if (fys.length === 1) return (padL + (W - padR)) / 2;
      var i = fys.indexOf(fy);
      return padL + (W - padL - padR) * (i / (fys.length - 1));
    }
    function yOf(v) { return padT + (H - padT - padB) * (1 - (v - minV) / span); }
    var parts = [];
    // y軸グリッド（step刻みで切りのよい目盛り）
    for (var gv = minV; gv <= maxV + 1e-9; gv += step) {
      var gy = yOf(gv);
      var label = (opt && opt.pct)
        ? (Math.round(gv * 10) / 10) + "%"
        : Math.round(gv).toLocaleString();
      parts.push('<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" stroke="#eceef2"/>');
      parts.push('<text x="' + (padL - 6) + '" y="' + (gy + 3) + '" text-anchor="end" font-size="9" fill="#7c8696">' + label + '</text>');
    }
    // x軸ラベル
    fys.forEach(function (fy) {
      parts.push('<text x="' + xOf(fy) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="9" fill="#7c8696">' + esc(allFy[fy]) + '</text>');
    });
    // 各社の線＋点＋右端ラベル
    seriesList.forEach(function (s, idx) {
      var c = TS_COLORS[idx % TS_COLORS.length];
      var pts = s.points.filter(function (p) { return p[valueKey] != null; });
      if (!pts.length) return;
      var coords = pts.map(function (p) { return [xOf(p.fy), yOf(p[valueKey])]; });
      if (coords.length > 1) {
        var d = coords.map(function (c2, i) { return (i === 0 ? "M" : "L") + c2[0].toFixed(1) + "," + c2[1].toFixed(1); }).join(" ");
        parts.push('<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2"/>');
      }
      coords.forEach(function (c2) { parts.push('<circle cx="' + c2[0].toFixed(1) + '" cy="' + c2[1].toFixed(1) + '" r="3" fill="' + c + '"/>'); });
      var last = coords[coords.length - 1];
      parts.push('<text x="' + (last[0] + 6) + '" y="' + (last[1] + 3) + '" font-size="9" fill="' + c + '" font-weight="700">' + esc(s.company) + '</text>');
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="時系列グラフ">' + parts.join("") + '</svg>';
  }

  function renderKpiTimeseries() {
    var box = document.getElementById("kpi-timeseries");
    if (!box) return;
    fetch("../data/kyogo-kpi-timeseries.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (ts) {
        if (!ts) return;
        var multi = ts.series.filter(function (s) { return s.points.filter(function (p) { return p.revenue != null; }).length > 1; });
        var rev = buildLineChart(ts.series, "revenue", { zeroBase: true });
        var mgn = buildLineChart(ts.series.filter(function (s) { return s.points.some(function (p) { return p.opMargin != null; }); }), "opMargin", { pct: true });
        box.innerHTML =
          '<div class="kpi-chart-card"><h3 class="kpi-chart-title">売上高の推移（国内・通期）</h3>' + rev +
            '<p class="kpi-chart-note">単位：百万円。複数期あるのはINTLOOP・ギークス・TWOSTONE&Sons・ランサーズ（折れ線）。他社はNotion DBに通期1期のみのため点表示。決算期は会社ごとに異なる。</p></div>' +
          '<div class="kpi-chart-card"><h3 class="kpi-chart-title">営業利益率の推移（国内・通期）</h3>' + mgn +
            '<p class="kpi-chart-note">単位：%。利益率の改善/悪化の方向が分かる。ランサーズは増収より利益率改善が先行、ギークスはゲーム事業整理で一度低下後に回復。</p></div>';
      })
      .catch(function (e) { console.error(e); });
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
        var fy = fyShort(a.published);
        return '<div class="ch-row"><span class="ch-name"><span class="ch-co">' + esc(a.title) + '</span>' + (fy ? '<span class="ch-fy">' + esc(fy) + '</span>' : '') + '</span>' +
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
        var fyg = fyShort(a.published);
        return '<div class="ch-row"><span class="ch-name"><span class="ch-co">' + esc(a.title) + '</span>' + (fyg ? '<span class="ch-fy">' + esc(fyg) + '</span>' : '') + '</span>' +
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
    var srcMap = {}, catMap = {}, relMap = {};
    (data.sources || []).forEach(function (s) { srcMap[s.key] = s.label; });
    (data.categories || []).forEach(function (c) { catMap[c.key] = c.label; });
    (data.relations || []).forEach(function (c) { relMap[c.key] = c.label; });
    var isKpi = data.type === "kpi";
    if (isKpi) { wrap.classList.add("kpi-grid"); renderKpiCharts(data.articles || []); renderKpiTimeseries(); }
    wrap.innerHTML = (data.articles || []).map(function (a) {
      return isKpi ? kpiCard(a, catMap, data.usdjpy) : articleCard(a, srcMap, catMap, relMap);
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

  /* 変化シグナル・ボード（トップpage の #signal-board に描画） */
  var SIG_CLASS = { ai_commerce: "sig-ai", upstream: "sig-up", ma_alliance: "sig-ma", regulation_macro: "sig-reg" };
  function renderSignalBoard() {
    var box = document.getElementById("signal-board");
    if (!box) return;
    fetch("data/signals.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var typeMap = {};
        (data.types || []).forEach(function (t) { typeMap[t.key] = t.label; });
        // フィルタチップ
        var chips = '<button class="chip active" data-sigtype="all">すべて</button>' +
          (data.types || []).map(function (t) {
            return '<button class="chip" data-sigtype="' + esc(t.key) + '">' + esc(t.label) + "</button>";
          }).join("");
        // 日付の新しい順
        var sigs = (data.signals || []).slice().sort(function (a, b) {
          return (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
        });
        var cards = sigs.map(function (s) {
          var cls = SIG_CLASS[s.type] || "sig-reg";
          var imp = s.impact === "high"
            ? '<span class="sig-impact sig-high">影響大</span>'
            : '<span class="sig-impact sig-med">影響中</span>';
          return '<article class="sig-card ' + cls + '" data-sigtype="' + esc(s.type) + '">' +
            '<div class="sig-head"><span class="sig-type">' + esc(typeMap[s.type] || s.type) + "</span>" + imp +
              '<span class="sig-date">' + esc(s.date || "") + "</span></div>" +
            "<h3 class=\"sig-title\">" + esc(s.title) + "</h3>" +
            '<p class="sig-fact">' + esc(s.fact) + "</p>" +
            '<p class="sig-signal"><span class="sig-signal-label">何の予兆か</span>' + esc(s.signal) + "</p>" +
            '<p class="sig-actor">' + esc(s.actor || "") +
              (s.source
                ? (s.url
                    ? ' ・ <a class="sig-src sig-src-link" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.source) + '<span class="ms-ext" aria-hidden="true"> ↗</span></a>'
                    : ' ・ <span class="sig-src">' + esc(s.source) + "</span>")
                : "") + "</p>" +
            "</article>";
        }).join("");
        box.innerHTML =
          '<div class="sig-filters" id="sig-filters">' + chips + "</div>" +
          '<div class="sig-grid" id="sig-grid">' + cards + "</div>";
        // フィルタ動作
        box.querySelectorAll(".chip").forEach(function (chip) {
          chip.addEventListener("click", function () {
            box.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
            chip.classList.add("active");
            var v = chip.getAttribute("data-sigtype");
            box.querySelectorAll(".sig-card").forEach(function (c) {
              c.style.display = (v === "all" || c.getAttribute("data-sigtype") === v) ? "" : "none";
            });
          });
        });
        document.querySelectorAll("[data-sig-updated]").forEach(function (el) { el.textContent = data.updated || ""; });
        document.querySelectorAll("[data-sig-count]").forEach(function (el) { el.textContent = (data.signals || []).length; });
      })
      .catch(function (e) { console.error(e); });
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

  // ---- 法人×個人 市場構造マップ ----
  function renderMarketStructure() {
    var box = document.getElementById("market-structure");
    if (!box) return;
    fetch("data/market-structure.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var drivers = data.drivers || [];
        var sides = data.sides || [];
        var foundations = data.foundations || [];
        // 出典の表示（url があれば原典へのリンクにする）
        function srcHtml(label, url) {
          if (!label) return "";
          if (url) return '<a class="ms-src ms-src-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '<span class="ms-ext" aria-hidden="true"> ↗</span></a>';
          return '<span class="ms-src">' + esc(label) + "</span>";
        }
        // 市場の前提（土台）の帯
        var fh = "";
        if (foundations.length) {
          var FCLS = { labor: "ms-fnd-labor", rule: "ms-fnd-rule" };
          fh = '<div class="ms-fnd-wrap">' +
            (data.foundationsNote ? '<p class="ms-fnd-note">' + esc(data.foundationsNote) + "</p>" : "") +
            '<div class="ms-fnd-grid">';
          foundations.forEach(function (f) {
            var evi = "";
            if (Array.isArray(f.evidence) && f.evidence.length) {
              evi = '<ul class="ms-fnd-evi">';
              f.evidence.forEach(function (e) { evi += "<li>" + esc(e.fact) + srcHtml(e.source, e.url) + "</li>"; });
              evi += "</ul>";
            }
            fh += '<div class="ms-fnd ' + (FCLS[f.key] || "") + '">' +
              '<h3 class="ms-fnd-title">' + esc(f.title) + "</h3>" +
              '<p class="ms-fnd-what">' + esc(f.what) + "</p>" +
              '<p class="ms-fnd-impl"><span class="ms-impl-label">含意</span>' + esc(f.implication) + "</p>" +
              evi +
              "</div>";
          });
          fh += "</div><div class=\"ms-fnd-arrow\" aria-hidden=\"true\">この土台の上で、下の生成AIドライバーが需給を動かす ↓</div></div>";
        }
        // ドライバーの流れ（3段階）
        var dh = '<div class="ms-drivers">';
        drivers.forEach(function (d, i) {
          if (i > 0) dh += '<div class="ms-arrow" aria-hidden="true">→</div>';
          var evi = "";
          if (Array.isArray(d.evidence)) {
            evi = '<div class="ms-evi"><span class="ms-evi-label">根拠</span><ul class="ms-evi-list">';
            d.evidence.forEach(function (e) {
              evi += "<li>" + esc(e.fact) + srcHtml(e.source, e.url) + "</li>";
            });
            evi += "</ul></div>";
          } else if (d.evidence) {
            evi = '<p class="ms-driver-evi">根拠：' + esc(d.evidence) + "</p>";
          }
          var jpD = d.japan
            ? '<p class="ms-jp"><span class="ms-jp-label">日本市場での意味</span>' + esc(d.japan) + "</p>"
            : "";
          var flD = d.impact_fl
            ? '<p class="ms-fl"><span class="ms-fl-label">副業・FLマッチングへの影響</span>' + esc(d.impact_fl) + "</p>"
            : "";
          dh += '<div class="ms-driver">' +
            '<div class="ms-driver-head"><span class="ms-driver-no">' + esc(String(d.no)) + "</span>" +
            '<span class="ms-driver-title">' + esc(d.title) + "</span>" +
            '<span class="ms-driver-phase">' + esc(d.phase) + "</span></div>" +
            '<p class="ms-driver-what">' + esc(d.what) + "</p>" +
            '<p class="ms-driver-impl"><span class="ms-impl-label">含意</span>' + esc(d.implication) + "</p>" +
            jpD +
            flD +
            evi +
            "</div>";
        });
        dh += "</div>";
        // 需給マトリクス（法人/個人 × 現在進行/これから拡大）
        function cell(items, tag) {
          var h = '<div class="ms-cell"><span class="ms-cell-tag">' + esc(tag) + '</span><ul class="ms-list">';
          items.forEach(function (it) {
            h += "<li><b>" + esc(it.title) + "</b><span>" + esc(it.detail) + "</span>" +
              (it.fact ? '<span class="ms-fact">' + esc(it.fact) + "</span>" : "") +
              (it.source ? srcHtml(it.source, it.url) : "") +
              (it.japan ? '<span class="ms-jp"><span class="ms-jp-label">日本市場での意味</span>' + esc(it.japan) + "</span>" : "") +
              (it.impact_fl ? '<span class="ms-fl"><span class="ms-fl-label">副業・FLマッチングへの影響</span>' + esc(it.impact_fl) + "</span>" : "") +
              "</li>";
          });
          h += "</ul></div>";
          return h;
        }
        var mh = '<div class="ms-matrix">';
        mh += '<div class="ms-corner" aria-hidden="true"></div>';
        mh += '<div class="ms-colhead ms-col-now">現在進行</div>';
        mh += '<div class="ms-colhead ms-col-future">これから拡大（1〜3年）</div>';
        sides.forEach(function (s) {
          var sideCls = s.key === "corp" ? "ms-corp" : "ms-indiv";
          mh += '<div class="ms-rowhead ' + sideCls + '"><b>' + esc(s.label) + "</b><span>" + esc(s.desc) + "</span><em>" + esc(s.reading) + "</em></div>";
          mh += cell(s.now || [], s.label + " × 現在進行");
          mh += cell(s.future || [], s.label + " × これから拡大");
        });
        mh += "</div>";
        box.innerHTML = fh + dh + mh;
      })
      .catch(function () { /* 未配置でも無視 */ });
  }

  // ---- ホーム: いま市場で起きていること（横断要点）----
  var LINK_MAP = {
    "変化シグナル・ボード": "#signal-board",
    "法人×個人 市場構造マップ": "#market-structure",
    "競合調査": "kyogo-chosa/index.html",
    "間接競合": "kansetsu-kyogo/index.html",
    "AIと雇用": "koyo-hatarakikata/index.html",
    "雇用・働き方": "koyo-hatarakikata/index.html",
    "労働市場データ": "roudou-shijo/index.html",
    "法務・コンプライアンス": "houmu-compliance/index.html"
  };
  function renderHomeSummary() {
    var box = document.getElementById("home-summary");
    if (!box) return;
    fetch("data/home-summary.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        var cards = (d.takeaways || []).map(function (t, i) {
          var href = LINK_MAP[t.link] || "";
          var linkHtml = href
            ? '<a class="hs-link" href="' + esc(href) + '">' + esc(t.link) + " →</a>"
            : "";
          return '<article class="hs-card">' +
            '<span class="hs-num">' + (i + 1) + "</span>" +
            "<h3>" + esc(t.title) + "</h3>" +
            "<p>" + esc(t.body) + "</p>" +
            '<p class="hs-evi">根拠：' + esc(t.evidence) + "</p>" +
            linkHtml +
            "</article>";
        }).join("");
        box.innerHTML =
          '<div class="hs-lead">' +
            (d.headline ? "<h3>" + esc(d.headline) + "</h3>" : "") +
            (d.lead ? "<p>" + esc(d.lead) + "</p>" : "") +
          "</div>" +
          '<div class="hs-grid">' + cards + "</div>";
        if (d.updated) document.querySelectorAll("[data-home-updated]").forEach(function (el) { el.textContent = d.updated; });
      })
      .catch(function () { /* 未配置でも無視 */ });
  }

  // ---- 競合AI戦略 5類型マップ（トップpage の #competitor-ai-matrix）----
  function renderCompetitorAiMatrix() {
    var box = document.getElementById("competitor-ai-matrix");
    if (!box) return;
    fetch("data/competitor-ai-matrix.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var types = data.types || [];
        var cards = types.map(function (t) {
          var exs = (t.examples || []).map(function (e) {
            // 社名: 外部urlがあれば出典リンク
            var actor = e.url
              ? '<a class="cai-actor cai-actor-link" href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + esc(e.actor) + '<span class="ms-ext" aria-hidden="true"> ↗</span></a>'
              : '<span class="cai-actor">' + esc(e.actor) + "</span>";
            // 事実: deepdiveがあれば詳細ページへ
            var factHtml = e.deepdive
              ? '<a class="cai-fact-link" href="report/index.html?r=' + esc(e.deepdive) + '">' + esc(e.fact) + " →</a>"
              : '<span class="cai-fact">' + esc(e.fact) + "</span>";
            return '<li class="cai-ex">' + actor + factHtml + "</li>";
          }).join("");
          return '<article class="cai-card' + (t.highlight ? " cai-highlight" : "") + '">' +
            '<div class="cai-head"><span class="cai-key">' + esc(t.key) + "</span>" +
              '<h3 class="cai-label">' + esc(t.label) + "</h3>" +
              (t.highlight ? '<span class="cai-threat">最重要脅威</span>' : "") + "</div>" +
            '<p class="cai-desc">' + esc(t.desc) + "</p>" +
            '<ul class="cai-list">' + exs + "</ul>" +
            "</article>";
        }).join("");
        box.innerHTML = '<div class="cai-grid">' + cards + "</div>" +
          (data.note ? '<p class="cai-note">' + esc(data.note) + "</p>" : "");
        document.querySelectorAll("[data-cai-updated]").forEach(function (el) { el.textContent = data.updated || ""; });
      })
      .catch(function () { /* 未配置でも無視 */ });
  }

  // ---- レポート詳細ページ（report/index.html?r=slug）----
  function getQuery(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }
  // レポート内グラフ（CDN非依存・HTML/CSSバー）。deep-dive JSON の section.charts を描画
  var RTONE = { risk: "#c0392b", stable: "#6b7280", shift: "#b5681c", growth: "#0a7a52", change: "#0017c1", realized: "#0017c1", theoretical: "#a9c4ea", y2024: "#9aa3ad", y2026: "#0017c1" };
  function reportChart(c) {
    if (!c) return "";
    var inner = "";
    if (c.type === "flow") {
      inner = '<div class="rc-flow">';
      (c.questions || []).forEach(function (q) {
        inner += '<div class="rc-frow"><div class="rc-qbox">' + esc(q.q) + "</div>" +
          '<div class="rc-noarm">NO →</div>' +
          '<div class="rc-out rc-out-' + (q.noTone || "stable") + '">' + esc(q.noLabel) + "<b>" + q.noValue + "%</b></div></div>";
        if (q.yesLabel) {
          inner += '<div class="rc-yesline">すべて YES ↓</div>' +
            '<div class="rc-frow"><div class="rc-qbox rc-qfinal rc-out-' + (q.yesTone || "risk") + '">' + esc(q.yesLabel) + "<b>" + q.yesValue + "%</b></div></div>";
        } else {
          inner += '<div class="rc-yesline">YES ↓</div>';
        }
      });
      inner += "</div>";
    } else if (c.type === "grouped") {
      var gmax = c.max || (c.groups || []).reduce(function (m, g) { return Math.max(m, g.bars.reduce(function (mm, b) { return Math.max(mm, b.value); }, 0)); }, 1);
      inner = '<div class="rc-grouped">' + (c.groups || []).map(function (g) {
        var bars = g.bars.map(function (b) {
          var w = Math.max(1, (b.value / gmax) * 100), col = RTONE[b.tone] || "#6b7280";
          return '<div class="rc-grow"><span class="rc-gname">' + esc(b.name) + "</span>" +
            '<span class="rc-track"><span class="rc-fill" style="width:' + w + "%;background:" + col + '"></span></span>' +
            '<span class="rc-val" style="color:' + col + '">' + b.value + esc(c.unit || "%") + "</span></div>";
        }).join("");
        return '<div class="rc-ggroup"><div class="rc-glabel">' + esc(g.label) + (g.gap ? ' <span class="rc-gap">' + esc(g.gap) + "</span>" : "") + "</div>" + bars + "</div>";
      }).join("") + "</div>";
    } else if (!c.series) { return "";
    } else if (c.type === "stacked100") {
      var total = c.series.reduce(function (a, b) { return a + (b.value || 0); }, 0) || 100;
      var segs = c.series.map(function (s) {
        var w = 100 * (s.value / total);
        return '<div class="rc-seg" style="width:' + w + "%;background:" + (RTONE[s.tone] || "#6b7280") + '">' + (w >= 9 ? s.value + "%" : "") + "</div>";
      }).join("");
      var legend = c.series.map(function (s) {
        return '<span class="rc-leg"><i style="background:' + (RTONE[s.tone] || "#6b7280") + '"></i>' + esc(s.label) + " " + s.value + "%</span>";
      }).join("");
      inner = '<div class="rc-bar100">' + segs + '</div><div class="rc-legend">' + legend + "</div>";
    } else if (c.type === "bars") {
      var max = c.series.reduce(function (m, s) { return Math.max(m, s.value || 0); }, 1);
      inner = '<div class="rc-bars">' + c.series.map(function (s) {
        var w = Math.max(2, (s.value / max) * 100), col = RTONE[s.tone] || "#6b7280";
        return '<div class="rc-row"><span class="rc-lab">' + esc(s.label) + "</span>" +
          '<span class="rc-track"><span class="rc-fill" style="width:' + w + "%;background:" + col + '"></span></span>' +
          '<span class="rc-val" style="color:' + col + '">' + s.value + esc(c.unit || "%") + "</span></div>";
      }).join("") + "</div>";
    } else if (c.type === "diverge") {
      var dmax = c.max || c.series.reduce(function (m, s) { return Math.max(m, Math.abs(s.value || 0)); }, 1);
      inner = '<div class="rc-div">' + c.series.map(function (s) {
        var pct = Math.min(50, (Math.abs(s.value) / dmax) * 50), pos = s.value >= 0, col = RTONE[s.tone] || (pos ? "#0a7a52" : "#c0392b");
        var bar = pos
          ? '<span class="rc-dfill" style="left:50%;width:' + pct + "%;background:" + col + '"></span>'
          : '<span class="rc-dfill" style="right:50%;width:' + pct + "%;background:" + col + '"></span>';
        return '<div class="rc-drow"><span class="rc-dlab">' + esc(s.label) + '</span><span class="rc-dtrack">' + bar + '<span class="rc-dmid"></span></span><span class="rc-dval" style="color:' + col + '">' + (pos ? "+" : "") + s.value + esc(c.unit || "%") + "</span></div>";
      }).join("") + "</div>";
    } else { return ""; }
    return '<figure class="rc-fig">' + (c.title ? '<figcaption class="rc-title">' + esc(c.title) + "</figcaption>" : "") + inner +
      (c.caption ? '<p class="rc-cap">' + esc(c.caption) + "</p>" : "") +
      (c.source ? '<p class="rc-src">出典: ' + esc(c.source) + "</p>" : "") + "</figure>";
  }

  function renderReportDetail() {
    var box = document.getElementById("report-detail");
    if (!box) return;
    var slug = getQuery("r");
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      box.innerHTML = '<p class="empty" style="display:block">レポートが指定されていません。</p>';
      return;
    }
    fetch("../data/deep-dives/" + slug + ".json")
      .then(function (r) { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(function (d) {
        var gradeBadge = d.grade ? '<span class="rd-grade rd-grade-' + esc(String(d.grade).toLowerCase()) + '">重要度 ' + esc(d.grade) + "</span>" : "";
        var srcLink = d.url
          ? '<a class="rd-srclink" href="' + esc(d.url) + '" target="_blank" rel="noopener noreferrer">原典を開く（' + esc(d.source_label || d.publisher || "出典") + "） ↗</a>"
          : "";
        var backHref = d.backHref || "../koyo-hatarakikata/index.html";
        var backLabel = d.backLabel || "AIと雇用の一覧へ戻る";
        var head =
          '<div class="rd-head">' +
            '<a class="rd-back" href="' + esc(backHref) + '">← ' + esc(backLabel) + "</a>" +
            '<div class="rd-meta">' + gradeBadge +
              (d.publisher ? '<span class="rd-pub">' + esc(d.publisher) + "</span>" : "") +
              (d.published ? '<span class="rd-date">' + esc(d.published) + "</span>" : "") +
            "</div>" +
            "<h1>" + esc(d.reportTitle || slug) + "</h1>" +
            (d.tldr ? '<p class="rd-tldr"><span class="rd-tldr-label">結論</span>' + esc(d.tldr) + "</p>" : "") +
            srcLink +
          "</div>";
        var body = (d.sections || []).map(function (sec) {
          var paras = (sec.paragraphs || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
          var bullets = (sec.bullets && sec.bullets.length)
            ? '<ul class="rd-bullets">' + sec.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>"
            : "";
          var table = "";
          if (sec.table && sec.table.rows && sec.table.rows.length) {
            var th = (sec.table.headers || []).map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("");
            var rows = sec.table.rows.map(function (row) {
              return "<tr>" + row.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
            }).join("");
            table = '<div class="rd-table-wrap"><table class="rd-table">' +
              (sec.table.caption ? "<caption>" + esc(sec.table.caption) + "</caption>" : "") +
              (th ? "<thead><tr>" + th + "</tr></thead>" : "") +
              "<tbody>" + rows + "</tbody></table></div>";
          }
          var charts = (sec.charts || []).map(reportChart).join("");
          return '<section class="rd-section"><h2>' + esc(sec.heading || "") + "</h2>" + paras + charts + table + bullets + "</section>";
        }).join("");
        var foot = '<p class="rd-foot">本ページは公開レポートの要約と、日本市場・副業/フリーランスマッチング市場への一般的な示唆を整理したものです。正確な内容は' +
          (d.url ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener noreferrer">原典</a>' : "原典") +
          'をご確認ください。更新 ' + esc(d.updated || "") + "</p>";
        var hero = d.heroImage
          ? '<figure class="rd-hero"><img src="' + esc(d.heroImage.src) + '" alt="' + esc(d.heroImage.alt || d.reportTitle || "") + '" loading="lazy" decoding="async">' +
            (d.heroImage.caption ? '<figcaption>' + esc(d.heroImage.caption) + "</figcaption>" : "") + "</figure>"
          : "";
        box.innerHTML = head + hero + '<div class="rd-body">' + body + foot + "</div>";
        document.title = (d.reportTitle || "レポート詳細") + "｜リサーチ・ダッシュボード";
        // グローバルメニューの現在地を backHref に合わせて切り替え
        if (d.backHref) {
          var navAs = document.querySelectorAll(".gnav a");
          navAs.forEach(function (a) { a.classList.remove("active"); });
          var target = d.backHref.replace(/^\.\.\//, "");
          navAs.forEach(function (a) {
            if (a.getAttribute("href") === "../" + target) a.classList.add("active");
          });
        }
      })
      .catch(function () {
        box.innerHTML = '<p class="empty" style="display:block">レポートが見つかりませんでした。<a href="../koyo-hatarakikata/index.html">一覧へ戻る</a></p>';
      });
  }

  // ---- 職種別 AI影響 × プロ人材需要（市場構造マップ 個人セグメント詳細）----
  var JI_TC = { "代替": "down", "組み替え": "mid", "増幅": "amp", "影響小": "gray" };
  var JI_DM = { "増": "up", "横ばい": "gray", "減": "down" };
  var JI_TONE = { "底堅い": "steady", "下押し圧力": "push" };
  var JI_TC_ORDER = ["増幅", "組み替え", "代替", "影響小"];
  var JI_DM_ORDER = ["増", "横ばい", "減"];
  var JI_RANK = { "増": 2, "横ばい": 1, "減": 0 };
  var JI_REL = { high: "一次・主要", medium: "二次・専門", low: "要確認" };
  function jiShort(s) { return String(s || "").replace(/（.*?）/g, "").replace(/\(.*?\)/g, ""); }

  // 要約マトリクスで各セルに優先表示する代表職種（全体メッセージ＝AXニーズ①〜④と▲を可視化）。詳細マトリクスは全件表示のため無関係
  var JI_REP = { "AIエンジニア・機械学習エンジニア": 1, "情報セキュリティ": 1, "プロダクトマネージャー（PdM）": 1, "新規事業開発": 1, "データサイエンティスト": 1, "事業企画": 1, "マーケティング(デジタル)": 1, "人事企画（評価・配置・育成・組織設計）": 1, "ソフトウェアエンジニア（汎用）": 1, "法人営業(フィールドセールス)": 1, "カスタマーサクセス": 1, "人事（採用・労務）": 1 };
  // 2軸マトリクス（縦＝プロ人材需要、横＝業務変化）。opts.repMax で1セルの代表職種数を制限
  function jiMatrix(data, opts) {
    var jobs = data.jobs || [];
    var grid = {}; JI_DM_ORDER.forEach(function (d) { grid[d] = {}; JI_TC_ORDER.forEach(function (t) { grid[d][t] = []; }); });
    jobs.forEach(function (j) { if (grid[j.proDemand] && grid[j.proDemand][j.taskChange]) grid[j.proDemand][j.taskChange].push(j); });
    var tcsub = { "増幅": "AIで射程拡大", "組み替え": "役割が入れ替わる", "代替": "人の担当が減る", "影響小": "AI影響が小さい" };
    var prosub = { "増": "スポット外部調達が伸びる", "横ばい": "活用余地はあるが横ばい", "減": "外部委託に向かない" };
    var h = '<div class="ji-matwrap"><table class="ji-mat"><thead><tr><th class="ji-corner">プロ人材需要 ＼ 業務変化</th>';
    JI_TC_ORDER.forEach(function (t) { h += '<th class="ji-demh">' + esc(t) + "<small>" + esc(tcsub[t]) + "</small></th>"; });
    h += "</tr></thead><tbody>";
    JI_DM_ORDER.forEach(function (d) {
      h += '<tr><td class="ji-rowh ji-' + JI_DM[d] + '"><span class="ji-pill ji-' + JI_DM[d] + '">プロ人材 ' + esc(d) + "</span><small>" + esc(prosub[d]) + "</small></td>";
      JI_TC_ORDER.forEach(function (t) {
        var arr = grid[d][t];
        h += '<td class="ji-cell ji-' + JI_DM[d] + '">';
        if (arr.length) {
          h += '<div class="ji-celln">' + arr.length + "件</div>";
          var show;
          if (opts.repMax) { var reps = arr.filter(function (j) { return JI_REP[j.job]; }); var rest = arr.filter(function (j) { return !JI_REP[j.job]; }); show = reps.concat(rest).slice(0, opts.repMax); } else { show = arr; }
          show.forEach(function (j) {
            var up = (opts.arrows && JI_RANK[j.proDemand] > JI_RANK[j.demand]) ? '<span class="ji-arrow">▲</span>' : "";
            h += '<span class="ji-chip ji-' + JI_TC[t] + '">' + esc(jiShort(j.job)) + up + "</span>";
          });
          if (opts.repMax && arr.length > opts.repMax) h += '<span class="ji-more">他' + (arr.length - opts.repMax) + "件</span>";
        } else { h += '<span class="ji-empty">—</span>'; }
        h += "</td>";
      });
      h += "</tr>";
    });
    h += "</tbody></table></div>";
    return h;
  }

  function jiAxisDefs(data) {
    var ax = data.axes || {};
    function box(a, clsMap, withTone, withFlow, withPro) {
      if (!a) return "";
      var h = '<div class="ji-axbox"><div class="ji-axttl">' + esc(a.label) + "</div>";
      (a.values || []).forEach(function (v) { h += '<div class="ji-axrow"><span class="ji-pill ji-' + (clsMap[v] || "gray") + '">' + esc(v) + '</span><span class="ji-axd">' + esc((a.def || {})[v]) + "</span></div>"; });
      if (withFlow && a.flow) h += '<div class="ji-flow">' + esc(a.flow) + "</div>";
      if (withTone && a.tone) Object.keys(a.tone).forEach(function (t) { h += '<div class="ji-tonerow"><span class="ji-tonetag ji-' + JI_TONE[t] + '">' + esc(t) + '</span><span class="ji-axd">' + esc(a.tone[t]) + "</span></div>"; });
      if (withPro && a.proNote) h += '<div class="ji-flow"><b>プロ人材需要の併記：</b>' + esc(a.proNote) + "</div>";
      return h + "</div>";
    }
    return '<div class="ji-axdef">' +
      box(ax.taskChange, { "代替": "down", "組み替え": "mid", "増幅": "amp", "影響小": "gray" }, false, true, false) +
      box(ax.demand, { "増": "up", "横ばい": "gray", "減": "down" }, true, false, true) +
      "</div>";
  }

  function jiTable(data) {
    var jobs = data.jobs || [];
    var cats = [], byc = {};
    jobs.forEach(function (j) { var c = j.category; if (!byc[c]) { byc[c] = []; cats.push(c); } byc[c].push(j); });
    var h = "";
    cats.forEach(function (c) {
      h += '<div class="ji-cat">' + esc(c) + "（" + byc[c].length + "）</div>";
      h += '<div class="ji-twrap"><table class="ji-jt"><thead><tr><th>職種</th><th>業務変化</th><th>需要量変化<br><span class="ji-thsub">雇用／プロ人材(推論)</span></th><th>主要業務</th><th>業務変化の要因</th><th>需要量変化の要因</th><th>エビデンス</th><th>補足</th></tr></thead><tbody>';
      byc[c].forEach(function (j) {
        var tone = j.demandTone ? '<span class="ji-tonemini ji-' + JI_TONE[j.demandTone] + '">' + esc(j.demandTone) + "</span>" : "";
        var dem = '<div class="ji-demlines"><div class="ji-demline"><span class="ji-demk">雇用</span><span class="ji-badge ji-' + JI_DM[j.demand] + '">' + esc(j.demand) + "</span>" + tone + "</div>" +
          '<div class="ji-demline"><span class="ji-demk ji-pro">プロ人材</span><span class="ji-badge ji-' + JI_DM[j.proDemand] + '">' + esc(j.proDemand) + '</span><span class="ji-inf">推論</span></div></div>';
        var ev = (j.evidence || []).map(function (e) {
          var src = e.url ? '<a href="' + esc(e.url) + '" target="_blank" rel="noopener noreferrer">' + esc(e.source) + "</a>" : esc(e.source);
          var rel = e.reliability ? '<span class="ji-rel ji-rel-' + esc(e.reliability) + '">' + esc(JI_REL[e.reliability] || e.reliability) + "</span>" : "";
          var dt = e.date ? '<span class="ji-evdate">' + esc(e.date) + "</span>" : "";
          return '<div class="ji-evitem"><span class="ji-evq">「' + esc(e.quote) + '」</span><span class="ji-evsrc">— ' + src + dt + rel + "</span></div>";
        }).join("");
        h += "<tr>" +
          '<td class="ji-job">' + esc(j.job) + '<span class="ji-conf ji-conf-' + esc(j.confidence) + '">' + (j.confidence === "high" ? "確度高" : "確度中") + "</span></td>" +
          '<td class="ji-tc ji-' + JI_TC[j.taskChange] + '">' + esc(j.taskChange) + "</td>" +
          "<td>" + dem + "</td>" +
          "<td>" + esc(j.mainTasks) + "</td>" +
          "<td>" + esc(j.taskChangeReason) + "</td>" +
          '<td class="ji-dreason"><div class="ji-rk">雇用</div>' + esc(j.demandReason) + '<div class="ji-rk ji-pro">プロ人材（推論）</div>' + esc(j.proDemandReason) + "</td>" +
          '<td class="ji-ev">' + ev + "</td>" +
          '<td class="ji-note">' + esc(j.note) + "</td>" +
          "</tr>";
      });
      h += "</tbody></table></div>";
    });
    return h;
  }

  function renderJiSummary(box, data, detailHref) {
    var byPro = data.byProDemand || {};
    var lead = '<p class="ji-lead">市場構造マップの個人（供給側）を、主要39職種の単位で2軸に切り直した要約。縦＝<b>プロ人材（フリーランス・副業）への法人需要の変化（推論）</b>、横＝<b>業務変化</b>（AIで仕事の中身がどう変わるか）。<span class="ji-arrow">▲</span> は雇用需要より強い職種（正社員採用は横ばい・減でも外部スポット需要が伸びる）。</p>';
    var ins = '<div class="ji-insband">' +
      '<div class="ji-ins ji-up"><b>プロ人材需要 増（' + (byPro["増"] || 0) + "）</b>：AI高度人材＋企画・コンサル・専門職。外部スポット調達が伸びる最有望層。</div>" +
      '<div class="ji-ins ji-gray"><b>横ばい（' + (byPro["横ばい"] || 0) + "）</b>：対人の継続性が核の職種や、現場性の強い職種が中心。</div>" +
      '<div class="ji-ins ji-down"><b>減（' + (byPro["減"] || 0) + "）</b>：定型でフリーランス対象になりにくい職種（一般事務・量産ライター・定型翻訳）。</div></div>";
    var link = '<p class="ji-detaillink"><a href="' + esc(detailHref) + '">全39職種の判定表（業務変化・需要・根拠リンク付き）を見る →</a></p>';
    box.innerHTML = lead + jiMatrix(data, { repMax: 4, arrows: true }) + ins + link;
  }

  function renderJiDetail(box, data) {
    var head = '<p class="ji-lead">' + esc(data.pageDescription || "") + "</p>";
    var note = data.note ? '<div class="ji-callout">' + esc(data.note) + "</div>" : "";
    var matrix = '<h2 class="ji-h2">2軸マトリクス（縦＝プロ人材需要、横＝業務変化）</h2>' +
      '<p class="ji-sub"><span class="ji-arrow">▲</span> は雇用需要より強い職種（雇用＝採用ベースは横ばい・減でも、プロ人材＝フリーランス需要が伸びる）。</p>' +
      jiMatrix(data, { arrows: true });
    var defs = '<h2 class="ji-h2">2つの軸の定義</h2>' + jiAxisDefs(data);
    var table = '<h2 class="ji-h2">職種別 判定表（全' + (data.jobs || []).length + "職種）</h2>" +
      '<p class="ji-sub">「需要量変化」は雇用需要（採用ベース）とプロ人材需要（推論）を併記。エビデンス列は判定根拠の引用＋出典リンク＋公開日（<b>すべて2025年4月以降の公開情報</b>に限定）。信頼性タグ：<span class="ji-rel ji-rel-high">一次・主要</span>＝官公庁・調査発行元・主要メディア・企業公式／<span class="ji-rel ji-rel-medium">二次・専門</span>＝専門媒体・信頼できる二次／<span class="ji-rel ji-rel-low">要確認</span>＝個人ブログ・自社事例等。</p>' +
      jiTable(data);
    box.innerHTML = head + note + matrix + defs + table;
  }

  function renderJobImpact() {
    var sumBox = document.getElementById("job-impact-summary");
    var detBox = document.getElementById("job-impact-detail");
    if (!sumBox && !detBox) return;
    var path = detBox ? "../data/job-impact.json" : "data/job-impact.json";
    fetch(path)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        if (sumBox) renderJiSummary(sumBox, data, "shokushu-eikyo/index.html");
        if (detBox) renderJiDetail(detBox, data);
        document.querySelectorAll("[data-ji-updated]").forEach(function (el) { el.textContent = data.updated || ""; });
      })
      .catch(function (e) { console.error(e); });
  }

  // ---- 競合資産マップ（6セグメント保有量・トップpage の #competitor-asset-map）----
  function renderCompetitorAssetMap() {
    var box = document.getElementById("competitor-asset-map");
    if (!box) return;
    fetch("data/competitor-asset-map.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        var segs = d.segments || [], cos = d.companies || [];
        var demandN = segs.filter(function (s) { return s.side === "demand"; }).length;
        var supplyN = segs.filter(function (s) { return s.side === "supply"; }).length;
        function segOf(co, s) { return co.seg[String(s.id)] || co.seg[s.id]; }
        var scaleHtml = (d.scale || []).map(function (x) { return '<span class="cam-scn cam-s' + x.n + '">' + x.n + " " + esc(x.label) + "</span>"; }).join("");
        var confHtml = (d.confidence || []).map(function (x) { return '<span class="cam-ci"><span class="cam-cbadge cam-c' + esc(x.k) + '">' + esc(x.k) + "</span>" + esc(x.label) + "</span>"; }).join("");
        var thead = '<thead><tr class="cam-side"><th class="cam-blank"></th>' +
          '<th class="cam-demand" colspan="' + demandN + '">法人（需要側）</th>' +
          '<th class="cam-supply" colspan="' + supplyN + '">個人（供給側）</th></tr>' +
          '<tr class="cam-seg"><th class="cam-blank"></th>' +
          segs.map(function (s) { return "<th>" + esc(s.head) + "</th>"; }).join("") + "</tr></thead>";
        var tbody = "<tbody>" + cos.map(function (co) {
          var cells = segs.map(function (s) {
            var c = segOf(co, s);
            return '<td><div class="cam-cell cam-s' + c.s + '">' + c.s + '<span class="cam-conf">' + esc(c.c) + "</span>" +
              '<span class="cam-tip"><b>' + esc(co.name) + " ／ " + esc(s.full) + "</b><br>スコア " + c.s + "・確度 " + esc(c.c) + "<br>" + esc(c.r) +
              '<br><span class="cam-tipsrc">根拠タイプ: ' + esc(c.src) + "</span></span></div></td>";
          }).join("");
          return '<tr><td class="cam-rowhead">' + esc(co.name) + '<span class="cam-sub">' + esc(co.sub) + "</span></td>" + cells + "</tr>";
        }).join("") + "</tbody>";
        var heatmap = '<div class="cam-hmwrap"><table class="cam-hm">' + thead + tbody + "</table></div>";
        var insights = '<div class="cam-grid3">' + (d.insights || []).map(function (i) {
          return '<div class="cam-icard"><div class="cam-ih">' + esc(i.h) + '</div><p><span class="cam-who">' + esc(i.who) + "</span><br>" + esc(i.body) + "</p></div>";
        }).join("") + "</div>";
        var notes = (d.notes || []).map(function (n) { return '<div class="cam-note">' + esc(n) + "</div>"; }).join("");
        var details = cos.map(function (co) {
          var rows = segs.map(function (s) {
            var c = segOf(co, s);
            return '<tr><td class="cam-seglab">' + esc(s.full) + '</td><td><span class="cam-dsc cam-s' + c.s + '">' + c.s + "</span></td>" +
              '<td><span class="cam-cbadge cam-c' + esc(c.c) + '">' + esc(c.c) + "</span></td><td>" + esc(c.r) + '</td><td class="cam-dsrc">' + esc(c.src) + "</td></tr>";
          }).join("");
          return '<details class="cam-co"><summary>' + esc(co.name) + '<span class="cam-gr">' + esc(co.sub) + '</span><span class="cam-chev">▶</span></summary>' +
            '<div class="cam-cobody"><div class="cam-note cam-grade">出典・確度: ' + esc(co.grade) + "</div>" +
            '<table class="cam-dt"><thead><tr><th>セグメント</th><th>スコア</th><th>確度</th><th>根拠</th><th>根拠タイプ</th></tr></thead><tbody>' + rows + "</tbody></table></div></details>";
        }).join("");
        var caveats = '<ol class="cam-caveat">' + (d.caveats || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ol>";
        box.innerHTML =
          '<div class="cam-legends"><div class="cam-legbox"><div class="cam-lt">資産の保有量（5段階）</div><div class="cam-scale">' + scaleHtml + "</div></div>" +
          '<div class="cam-legbox"><div class="cam-lt">確度（各セル右上のバッジ）</div><div class="cam-confrow">' + confHtml + "</div></div></div>" +
          '<p class="cam-hint">セルにカーソルを合わせると根拠が表示されます。各社の詳細根拠・出典は下の「根拠と確度（社別）」を参照。</p>' +
          heatmap +
          '<h3 class="cam-h3">示唆 ― 資産はどこに集中しているか</h3>' + insights + notes +
          '<h3 class="cam-h3">根拠と確度（社別）</h3><p class="cam-hint">各社をクリックすると6セグメントの詳細（スコア・根拠・出典）を展開します。</p>' + details +
          '<h3 class="cam-h3">評価の前提と限界</h3>' + caveats;
        document.querySelectorAll("[data-cam-updated]").forEach(function (el) { el.textContent = d.updated || ""; });
      })
      .catch(function () { /* 未配置でも無視 */ });
  }

  // ---- 月次サマリー（トップpage の #mo-body・原典公開月ごと）----
  function moEmph(t) {
    var i = t.indexOf("―");
    if (i > 1) return "<b>" + esc(t.slice(0, i).replace(/\s+$/, "")) + "</b> ― " + esc(t.slice(i + 1).replace(/^\s+/, ""));
    return esc(t);
  }
  function renderHomeMonthly() {
    var body = document.getElementById("mo-body");
    var sel = document.getElementById("mo-month");
    if (!body) return;
    fetch("data/home-monthly.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.months || !data.months.length) return;
        var months = data.months.slice();
        function renderMonth(m) {
          if (!m) return;
          var lead = m.lead ? '<div class="hs-lead"><p>' + esc(m.lead) + "</p></div>" : "";
          // ①今月の要点（索引）
          var keys = m.keypoints || m.summary;
          var summary = "";
          if (keys && keys.length) {
            summary = '<div class="mo-summary-box"><ul class="mo-summary">' +
              keys.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>";
          }
          // ②今月の示唆（横断テーマの統合）
          var themesHtml = "";
          if (m.themes && m.themes.length) {
            themesHtml = '<h3 class="mo-h3">示唆（横断テーマ）</h3>' + m.themes.map(function (t) {
              function row(lab, txt) { return txt ? '<div class="mo-theme-row"><span class="mo-theme-lab">' + lab + '</span><span class="mo-theme-txt">' + esc(txt) + "</span></div>" : ""; }
              return '<div class="mo-theme"><p class="mo-theme-title">' + esc(t.title) + "</p>" +
                row("何が起きたか", t.what) + row("なぜ重要か", t.why) + row("市場への影響", t.move) + "</div>";
            }).join("");
          } else {
            var picks = m.pickups || m.topInsights;
            if (picks && picks.length) {
              themesHtml = '<h3 class="mo-h3">示唆（横断テーマ）</h3><ol class="mo-insights">' +
                picks.map(function (t) { return "<li>" + moEmph(t) + "</li>"; }).join("") + "</ol>";
            }
          }
          // ③論点・注視点（So What）
          var watchHtml = "";
          if (m.watchpoints && m.watchpoints.length) {
            if (typeof m.watchpoints[0] === "string") {
              watchHtml = '<h3 class="mo-h3">主要な論点</h3><ol class="mo-insights">' +
                m.watchpoints.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol>";
            } else {
              watchHtml = '<h3 class="mo-h3">主要な論点</h3>' + m.watchpoints.map(function (w) {
                function row(lab, txt) { return txt ? '<div class="mo-theme-row"><span class="mo-theme-lab">' + lab + '</span><span class="mo-theme-txt">' + esc(txt) + "</span></div>" : ""; }
                return '<div class="mo-theme"><p class="mo-theme-title">' + esc(w.question) + "</p>" +
                  row("今の読み", w.read) + row("分かれ目", w.branch) + row("見るべき指標", w.signal) + "</div>";
              }).join("");
            }
          }
          // 追加の問い（次に考えるべき問い）
          var qHtml = "";
          if (m.openQuestions && m.openQuestions.length) {
            qHtml = '<h3 class="mo-h3">さらに問う（次に考えるべき問い）</h3><ul class="mo-q">' +
              m.openQuestions.map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + "</ul>";
          }
          var cats = (m.categories || []).map(function (c) {
            var cards = (c.cards || []).map(function (card) {
              var badge = (card.grade === "S" || card.grade === "A") ? '<span class="mo-grade mo-grade-' + card.grade.toLowerCase() + '">' + card.grade + "</span>" : "";
              var detail = card.deepdive
                ? '<a class="detail-link" href="report/index.html?r=' + esc(card.deepdive) + '">詳細を読む →</a>' : "";
              var src = card.url
                ? '<a class="source-link" href="' + esc(card.url) + '" target="_blank" rel="noopener noreferrer">出典</a>' : "";
              return '<article class="mo-card"><div class="mo-card-top">' + badge +
                '<span class="cat-tag">' + esc(card.source_label || "") + "</span></div>" +
                "<h4>" + esc(card.title) + "</h4>" +
                (card.note ? '<p class="mo-card-note">' + esc(card.note) + "</p>" : "") +
                '<div class="mo-card-foot">' + detail + src + "</div></article>";
            }).join("");
            var intHtml = "";
            if (c.integratedPoints && c.integratedPoints.length) {
              intHtml = '<div class="mo-cat-int"><span class="mo-cat-int-label">統合示唆</span><ul class="mo-cat-plist">' +
                c.integratedPoints.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></div>";
            } else if (c.integrated) {
              intHtml = '<p class="mo-cat-int"><span class="mo-cat-int-label">統合示唆</span>' + esc(c.integrated) + "</p>";
            }
            return '<div class="mo-cat"><div class="mo-cat-head"><h3>' + esc(c.name) + "</h3>" +
              (c.href ? '<a class="mo-cat-link" href="' + esc(c.href) + '">このテーマの全一覧へ →</a>' : "") + "</div>" +
              intHtml +
              '<div class="mo-card-grid">' + cards + "</div></div>";
          }).join("");
          var empty = "";
          if (m.emptyCategories && m.emptyCategories.length) {
            empty = '<p class="mo-empty">' + esc(m.label || m.month) + "に原典公開された新規の重要記事がないカテゴリ：" +
              m.emptyCategories.map(function (e) { return '<a href="' + esc(e.href) + '">' + esc(e.name) + "</a>"; }).join("・") +
              "（各テーマの全一覧へ）</p>";
          }
          body.innerHTML = lead + summary + themesHtml + watchHtml + '<h3 class="mo-h3">カテゴリ別の重要動向</h3>' + cats + empty + qHtml;
        }
        if (sel) {
          sel.innerHTML = months.map(function (m, i) {
            return '<option value="' + i + '">' + esc(m.label || m.month) + "</option>";
          }).join("");
          sel.addEventListener("change", function () { renderMonth(months[parseInt(sel.value, 10) || 0]); });
        }
        renderMonth(months[0]);
      })
      .catch(function () { /* 未配置でも無視 */ });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initThemePage();
    renderHomeMonthly();
    renderHomeSummary();
    renderSignalBoard();
    renderCompetitorAiMatrix();
    renderCompetitorAssetMap();
    renderMarketStructure();
    renderJobImpact();
    renderReportDetail();
  });
})();
