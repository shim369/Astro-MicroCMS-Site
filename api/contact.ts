import nodemailer from 'nodemailer'

interface ContactBody {
	name?: string
	email?: string
	message?: string
	googleReCaptchaToken?: string
}

const json = (status: number, body: unknown) => Response.json(body, { status })

const verifyRecaptcha = async (secret: string, token: string) => {
	const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
		method: 'POST',
		body: new URLSearchParams({ secret, response: token }),
	})
	const result = (await res.json()) as { success: boolean; score?: number; action?: string }
	const ok = result.success && result.action === 'submit' && (result.score ?? 0) >= 0.5
	if (!ok) {
		console.warn('reCAPTCHA verification failed', result)
	}
	return ok
}

export async function POST(request: Request) {
	let body: ContactBody
	try {
		body = await request.json()
	} catch {
		return json(400, { error: 'Invalid JSON' })
	}
	const { name, email, message, googleReCaptchaToken } = body

	if (!name || !email || !message) {
		return json(400, { error: 'Missing required fields' })
	}
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json(400, { error: 'Invalid email' })
	}

	const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY
	if (recaptchaSecretKey) {
		if (!googleReCaptchaToken || !(await verifyRecaptcha(recaptchaSecretKey, googleReCaptchaToken))) {
			return json(403, { error: 'reCAPTCHA verification failed' })
		}
	}

	const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
	const smtpPort = Number(process.env.SMTP_PORT || '465')
	const smtpUser = process.env.SMTP_USER
	const transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: smtpPort === 465,
		auth: { user: smtpUser, pass: process.env.SMTP_PASS },
	})

	try {
		await transporter.sendMail({
			from: smtpUser,
			to: process.env.CONTACT_TO_EMAIL,
			replyTo: email,
			subject: `【Astro Base】お問い合わせ: ${name.replace(/[\r\n]/g, ' ')}`,
			text: `お名前: ${name}\nメールアドレス: ${email}\n\nメッセージ:\n${message}`,
		})
	} catch (err) {
		console.error('Failed to send contact mail', err)
		return json(500, { error: 'Failed to send mail' })
	}

	return json(200, { ok: true })
}
