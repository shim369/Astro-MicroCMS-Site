# Astro Base

[English](./README.md) | **日本語**

Astro 7 と microCMS で作ったポートフォリオサイトです。ブログ記事はビルド時に microCMS から取得し、静的な HTML として出力します。お問い合わせフォームは Vercel Functions と nodemailer で Gmail から送信します。

デモ：https://astrobase.vercel.app/

## 技術構成

- [Astro](https://astro.build/) 7（静的出力）
  - **Content Layer**：microCMS の記事をビルド時にコンテンツコレクション `blogs` として取り込み、zod のスキーマで検証
  - **`astro:assets`**：microCMS のアイキャッチとローカル画像を WebP に変換し、`srcset` 付きで出力
  - **ClientRouter（View Transitions）**：ページを再読み込みせずに切り替え、ブログカードの画像を記事のアイキャッチへつなげてアニメーション
  - **`astro:env`**：環境変数の型と必須チェック
  - **Fonts API**：Montserrat と JetBrains Mono をビルド時に取り込み、自サイトから配信
  - **Prefetch**：リンクにマウスを乗せた時点で次のページを先読み
- [microCMS](https://microcms.io/)（`microcms-js-sdk`）
- Sass（SCSS）
- [GSAP](https://gsap.com/) 3 + ScrollTrigger（npm から導入し、トップページでだけ読み込み）
- 素の JavaScript モジュール（`src/scripts/`。UI フレームワークは使っていません）
- Vercel Functions（`api/contact.ts`）+ nodemailer
- Google reCAPTCHA v3（任意）
- Node.js 24.x

## ディレクトリ構成

```
/
├── api/
│   └── contact.ts             # お問い合わせ送信（Vercel Function）
├── public/
│   └── img/                   # CSS から参照する画像（ヒーローの背景など）
├── src/
│   ├── assets/img/            # <Image /> で最適化する画像
│   ├── components/
│   │   ├── BlogCard.astro     # ブログカード
│   │   ├── SiteHeader.astro   # 下層ページ用ヘッダー
│   │   └── SiteFooter.astro   # 下層ページ用フッター
│   ├── content.config.ts      # microCMS の記事を読み込むコンテンツコレクション
│   ├── layouts/
│   │   └── LayoutHome.astro   # 共通レイアウト（head・フォント・ClientRouter・スクリプト）
│   ├── lib/
│   │   ├── microcms.ts        # microCMS クライアントと記事の取得
│   │   └── posts.ts           # コレクションから記事を新しい順に取得
│   ├── pages/
│   │   ├── index.astro        # トップページ
│   │   ├── articles/
│   │   │   ├── index.astro    # ブログ一覧
│   │   │   └── [slug].astro   # 記事ページ
│   │   ├── thanks.astro       # 送信完了
│   │   └── error.astro        # 送信失敗
│   ├── scripts/
│   │   ├── lifecycle.js       # ClientRouter 用の、ページごとの初期化と後片付け
│   │   ├── layout.js          # ヘッダー・メニュー・トップへ戻る（全ページ）
│   │   ├── home.js            # トップページの動き・ターミナル演出・お問い合わせフォーム
│   │   └── article.js         # 記事ページの読了バーと目次
│   ├── styles/scss/           # 下記「スタイル」参照
│   └── types/
│       └── article.ts         # microCMS API レスポンスの型
├── astro.config.mjs
└── package.json
```

## しくみ

### ブログ記事

`src/content.config.ts` でコレクション `blogs` を定義しています。ローダーは `src/lib/microcms.ts` の `getArticles()` を呼び出します。ページは `src/lib/posts.ts` の `getPosts()` から記事を受け取り、並び順は microCMS と同じ新しい順です。記事は `/articles/{コンテンツID}` に生成され、前後の記事へのリンクが付きます。

### 画像

トップページの画像は `src/assets/img/` から読み込み、アイキャッチは microCMS の画像を使います（`image.domains` で `images.microcms-assets.io` を許可しています）。どちらも `<Image />` で出力するため、ビルド時にサイズを調整して WebP に変換されます。

### ページ遷移とスクリプト

`LayoutHome.astro` の `<ClientRouter />` により、ページは再読み込みされずに中身だけが入れ替わります。スクリプトは一度だけ読み込まれ、ページを移動しても再実行されません。そのため各スクリプトは、`src/scripts/lifecycle.js` の `onPage()` で初期化処理を登録しています。

- 初期化は `astro:page-load` で行います。このイベントは最初の表示と、ページを移動するたびに発生します。
- 渡された `signal` で登録したイベントリスナー、GSAP のアニメーション（`gsap.context` で元に戻す）、タイマー、Observer は、`astro:before-swap` で片付けます。

トップページのローダー（カウント表示）は最初に開いたときだけ表示します。他のページから戻ったときは、すぐにヒーローのイントロが始まります。

### お問い合わせフォーム

`src/scripts/home.js` で、入力中に必須チェックとメール形式のチェックを行います。送信時は、サイトキーが設定されていれば reCAPTCHA のトークンを取得してから、`/api/contact` に JSON で送ります。reCAPTCHA のスクリプトは送信するときに初めて読み込みます。

`api/contact.ts` はサーバー側でも必須項目とメール形式を確認します。`RECAPTCHA_SECRET_KEY` が設定されていれば、reCAPTCHA のスコアが 0.5 以上であることも確認します。そのうえで nodemailer で送信します。結果に応じて `/thanks` か `/error` に移動します。

## スタイル

`src/styles/scss/style.scss` が入口で、各ページはこのファイルだけを読み込みます。

| ディレクトリ | 内容 |
| :--- | :--- |
| `abstracts/` | 変数（色・フォント・ブレイクポイント）と mixin（`mq()` など） |
| `base/` | リセット、`:root` の CSS 変数、keyframes、スクロール表示と reduced motion |
| `components/` | 見出しラベル・ボタンなどの共通パーツ、カーソル、ローダー |
| `layout/` | ヘッダー、フッター |
| `sections/` | トップページの各セクション |
| `pages/` | ブログ一覧、記事ページ、thanks / error |

色は Sass 変数（`$yellow` など）で管理し、JavaScript から参照できるように同じ値を CSS 変数（`--yellow` など）としても出力しています。メディアクエリは `@include mq(md)` のように書きます。フォントは Fonts API が出力する CSS 変数（`--font-montserrat`、`--font-jetbrains-mono`）を使っています。

## microCMS の設定

リスト形式の API を作り、エンドポイントを `blogs` にします。

| フィールド ID | 種類 | 備考 |
| :--- | :--- | :--- |
| `title` | テキストフィールド | 記事タイトル |
| `content` | リッチエディタ | 本文 |
| `eyecatch` | 画像 | 一覧のサムネイルと記事上部の画像 |
| `category` | コンテンツ参照 | 参照先の API に `name` フィールドが必要 |

## 環境変数

`.env.example` をコピーして `.env` を作り、値を設定します。

```bash
cp .env.example .env
```

| 変数 | 必須 | 説明 |
| :--- | :---: | :--- |
| `MICROCMS_SERVICE_DOMAIN` | ✓ | microCMS のサービスドメイン（`xxx.microcms.io` の `xxx`） |
| `MICROCMS_API_KEY` | ✓ | microCMS の API キー |
| `CONTACT_TO_EMAIL` | ✓ | お問い合わせの送信先メールアドレス |
| `SMTP_USER` | ✓ | 送信元の Gmail アドレス |
| `SMTP_PASS` | ✓ | Gmail のアプリパスワード |
| `SMTP_HOST` | | 省略時は `smtp.gmail.com` |
| `SMTP_PORT` | | 省略時は `465` |
| `PUBLIC_RECAPTCHA_SITE_KEY` | | reCAPTCHA v3 のサイトキー。設定したときだけフォームで reCAPTCHA を使用 |
| `RECAPTCHA_SECRET_KEY` | | reCAPTCHA v3 のシークレットキー。設定したときだけサーバー側でトークンを検証 |

`MICROCMS_*` と `PUBLIC_RECAPTCHA_SITE_KEY` は `astro.config.mjs` の `env.schema` で定義し、`astro:env/server` と `astro:env/client` から読み込みます。`MICROCMS_*` が未設定だとビルドはエラーで止まります。SMTP と reCAPTCHA のシークレットは `api/contact.ts` だけが `process.env` から読み込みます。

## コマンド

| コマンド | 内容 |
| :--- | :--- |
| `npm install` | 依存パッケージをインストール |
| `npm run dev` | 開発サーバーを起動（`localhost:4321`） |
| `npm run build` | `./dist/` に本番ビルドを出力 |
| `npm run preview` | ビルド結果をローカルでプレビュー |

`api/contact.ts` は Vercel Function ですが、`astro.config.mjs` の開発用インテグレーションにより `npm run dev` でも動きます。このとき `.env` の値が使われます。

## デプロイ

Vercel にデプロイします。`package.json` の `engines` で Node.js 24.x を指定しています。環境変数は Vercel のプロジェクトにも同じものを設定してください。ビルド時に使う変数（`MICROCMS_*`、`PUBLIC_RECAPTCHA_SITE_KEY`）は、変更したあと再デプロイすると反映されます。

静的サイトなので、記事を追加・更新したときは再ビルドするまで反映されません。自動で再ビルドするには、Vercel のプロジェクトで Deploy Hook（Settings → Git → Deploy Hooks）を作り、その URL を microCMS の Webhook に登録します。Deploy Hook の URL を知っていれば誰でもデプロイを実行できるので、公開しないでください。
