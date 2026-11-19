# Astro Base

Astro + microCMS で作ったポートフォリオサイトです。ブログ記事は microCMS から取得して静的生成し、お問い合わせフォームは Vercel Functions + nodemailer で Gmail に送信します。

## 技術構成

- [Astro](https://astro.build/) 3（静的出力）
- [microCMS](https://microcms.io/)（`microcms-js-sdk`）
- Sass（SCSS）
- GSAP 3 + ScrollTrigger（CDN から読み込み、トップページのアニメーション）
- 素の JavaScript（`public/home.js` / `public/site.js`。お問い合わせフォームの入力チェックと送信もここで行います）
- Vercel Functions（`api/contact.ts`）+ nodemailer
- Google reCAPTCHA v3（任意）
- Node.js 24.x

## ディレクトリ構成

```
/
├── api/
│   └── contact.ts             # お問い合わせ送信（Vercel Function）
├── public/
│   ├── home.js                # トップページの動き（GSAP）とお問い合わせフォーム
│   ├── site.js                # 下層ページ共通（メニュー、目次、読了バーなど）
│   └── img/
├── src/
│   ├── components/
│   │   ├── BlogCard.astro     # ブログカード
│   │   ├── SiteHeader.astro   # 下層ページ用ヘッダー
│   │   └── SiteFooter.astro   # 下層ページ用フッター
│   ├── layouts/
│   │   └── LayoutHome.astro   # 共通レイアウト（head / フォント）
│   ├── lib/
│   │   └── microcms.ts        # microCMS クライアント / 記事取得
│   ├── pages/
│   │   ├── index.astro        # トップページ
│   │   ├── articles/
│   │   │   ├── index.astro    # ブログ一覧
│   │   │   └── [slug].astro   # 記事ページ
│   │   ├── thanks.astro       # 送信完了
│   │   └── error.astro        # 送信失敗
│   ├── styles/
│   │   └── scss/              # 下記「スタイル」参照
│   └── types/
│       └── article.ts         # 記事の型定義
└── package.json
```

## スタイル

`src/styles/scss/style.scss` がエントリーで、各ページはこのファイルだけを読み込みます。

| ディレクトリ | 内容 |
| :--- | :--- |
| `abstracts/` | 変数（色・フォント・ブレイクポイント）と mixin（`mq()` など） |
| `base/` | リセット、CSS 変数（`:root`）、keyframes、スクロール表示と reduced motion |
| `components/` | 見出しラベル・ボタンなどの共通パーツ、カーソル、ローダー |
| `layout/` | ヘッダー、フッター |
| `sections/` | トップページの各セクション |
| `pages/` | ブログ一覧、記事ページ、thanks / error |

色は Sass 変数（`$yellow` など）で管理し、JS から参照できるよう同じ値を CSS 変数（`--yellow` など）としても出力しています。メディアクエリは `@include mq(md)` のように書きます。

## microCMS の設定

リスト形式の API を作成し、エンドポイントを `blogs` にします。

| フィールド ID | 種類 | 備考 |
| :--- | :--- | :--- |
| `title` | テキストフィールド | 記事タイトル |
| `content` | リッチエディタ | 本文 |
| `eyecatch` | 画像 | 一覧のサムネイル |
| `category` | コンテンツ参照 | 参照先に `name` フィールドを持つ |

記事の URL は `/articles/{コンテンツID}` です。

## 環境変数

`.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

| 変数 | 必須 | 説明 |
| :--- | :--- | :--- |
| `MICROCMS_SERVICE_DOMAIN` | ○ | microCMS のサービスドメイン（`xxx.microcms.io` の `xxx`） |
| `MICROCMS_API_KEY` | ○ | microCMS の API キー |
| `CONTACT_TO_EMAIL` | ○ | お問い合わせの送信先メールアドレス |
| `SMTP_USER` | ○ | 送信元の Gmail アドレス |
| `SMTP_PASS` | ○ | Gmail のアプリパスワード |
| `SMTP_HOST` | | 省略時 `smtp.gmail.com` |
| `SMTP_PORT` | | 省略時 `465` |
| `PUBLIC_RECAPTCHA_SITE_KEY` | | reCAPTCHA v3 のサイトキー。設定時のみフォームで reCAPTCHA を使用 |
| `RECAPTCHA_SECRET_KEY` | | reCAPTCHA v3 のシークレットキー。設定時のみサーバー側で検証 |

Vercel にデプロイする場合は、同じ変数を Vercel の Environment Variables にも設定してください。`MICROCMS_*` と `PUBLIC_RECAPTCHA_SITE_KEY` はビルド時に使われるため、変更後は再デプロイが必要です。

## コマンド

| コマンド | 内容 |
| :--- | :--- |
| `npm install` | 依存パッケージをインストール |
| `npm run dev` | 開発サーバーを起動（`localhost:4321`） |
| `npm run build` | `./dist/` に本番ビルドを出力 |
| `npm run preview` | ビルド結果をローカルでプレビュー |

`api/contact.ts` は Vercel Function ですが、`astro.config.mjs` の開発用ミドルウェアにより `npm run dev` でも `/api/contact` が動きます（`.env` の値が使われます）。

## デプロイ

Vercel にデプロイします。`package.json` の `engines` で Node.js 24.x を指定しています。microCMS の記事を更新したときは、再デプロイ（または microCMS の Webhook で Vercel の Deploy Hook を呼ぶ）で反映されます。
