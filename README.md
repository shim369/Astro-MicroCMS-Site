# Astro Base

Astro + microCMS で作ったポートフォリオサイトです。ブログ記事は microCMS から取得して静的生成し、お問い合わせフォームは Vercel Functions + nodemailer で Gmail に送信します。

## 技術構成

- [Astro](https://astro.build/) 3（静的出力）
- React（お問い合わせフォーム / react-hook-form）
- [microCMS](https://microcms.io/)（`microcms-js-sdk`）
- Vercel Functions（`api/contact.ts`）+ nodemailer
- Google reCAPTCHA v3（任意）
- Node.js 24.x

## ディレクトリ構成

```
/
├── api/
│   └── contact.ts          # お問い合わせ送信（Vercel Function）
├── public/
├── src/
│   ├── components/
│   │   └── ContactForm.tsx # お問い合わせフォーム
│   ├── layouts/
│   ├── lib/
│   │   └── microcms.ts     # microCMS クライアント / 記事取得
│   ├── pages/
│   │   ├── index.astro
│   │   └── articles/[slug].astro
│   ├── styles/
│   └── types/
│       └── article.ts      # 記事の型定義
└── package.json
```

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
| `npx vercel dev` | お問い合わせ API を含めてローカルで起動 |

`api/contact.ts` は Vercel Function のため、`npm run dev` では動きません。フォーム送信をローカルで試す場合は `vercel dev` を使ってください。

## デプロイ

Vercel にデプロイします。`package.json` の `engines` で Node.js 24.x を指定しています。microCMS の記事を更新したときは、再デプロイ（または microCMS の Webhook で Vercel の Deploy Hook を呼ぶ）で反映されます。
