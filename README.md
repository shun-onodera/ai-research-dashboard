# リサーチ・ダッシュボード（公開サイト）

世界的に信頼できる情報源が公開する記事を、テーマ別に収集・要約して整理した静的サイトです。まずは「AI活用」テーマから公開しています。

- **公開URL**: GitHub Pages（`https://shun-onodera.github.io/ai-research-dashboard/` を想定）
- **デザイン**: デジタル庁デザインシステム／ダッシュボードデザイン実践ガイドブックを参考
- **技術**: 素のHTML/CSS/JS（ビルド不要・CDN非依存）

## 構成

```
.
├── index.html              トップ（テーマ一覧）
├── ai-katsuyo/index.html   AI活用テーマ（原則＋記事カード）
├── assets/style.css        デジタル庁準拠スタイル
├── assets/app.js           メニュー・データ読込・フィルタ（最小JS）
├── data/ai-katsuyo.json    AI活用の記事メタ（要約データ）
└── .nojekyll               GitHub Pages の Jekyll 処理を無効化
```

## 掲載方針（重要）

- 掲載するのは **各社公式の公開情報の要約のみ**。機密・社内情報・固有の事業データは一切含めません。
- 要約は理解の補助です。正確な内容は各記事の **原文（出典リンク）** をご確認ください。
- 個人の学習・整理を目的とした非公式のまとめです。

## 更新方法

1. `data/ai-katsuyo.json` の `articles` に記事メタ（title / source / publisher / published / category / url / summary / points）を追記
2. `updated` 日付を更新
3. コミットして push（GitHub Pages が自動反映）

> 将来的には収集〜サイト反映を自動化（スキル化）予定。

## ライセンス／クレジット

- 要約対象記事の著作権は各発行元（Anthropic / OpenAI / Google 等）に帰属します。本サイトは出典リンクを明示し、短い要約のみを掲載しています。
- デザイン参考：デジタル庁デザインシステム。
