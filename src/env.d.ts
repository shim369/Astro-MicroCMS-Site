/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly MICROCMS_SERVICE_DOMAIN: string
	readonly MICROCMS_API_KEY: string
	readonly PUBLIC_RECAPTCHA_SITE_KEY?: string
}
