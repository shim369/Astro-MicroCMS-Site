import { useForm } from 'react-hook-form';

type FormValues = {
  name: string;
  email: string;
  message: string;
};

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onChange' });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const googleReCaptchaToken = await getRecaptchaToken();
      const response = await sendRequest({ ...data, googleReCaptchaToken });
      if (response.ok) {
        window.location.href = '/thanks';
      } else {
        window.location.href = '/error';
      }
    } catch (err) {
      window.location.href = '/error';
    }
  });

  return (
    <section className="bg-yellow" id="a04">
      <div className="container">
        <div className="contact">
          <h1>Contact</h1>
          <form className="form-box" onSubmit={onSubmit}>
            <div className="form-item">
              <input
                placeholder="Name"
                id="name"
                {...register('name', { required: 'Name is required' })}
                aria-describedby="error-name-required"
              />
              <span id="error-name-required" aria-live="assertive">
                {errors?.name && errors.name.message}
              </span>
              <input
                placeholder="Email"
                id="email"
                {...register('email', { required: 'Email is required' })}
                aria-describedby="error-email-required"
              />
              <span id="error-email-required" aria-live="assertive">
                {errors?.email && errors.email.message}
              </span>
              <textarea
                placeholder="Message"
                id="message"
                {...register('message', { required: 'Message is required' })}
                aria-describedby="error-message-required"
              />
              <span id="error-message-required" aria-live="assertive">
                {errors?.message && errors.message.message}
              </span>
              <button type="submit">Submit</button>
            </div>
          </form>
          <div className="contact-logo">ASTRO BASE</div>
        </div>
      </div>
    </section>
  );
}

const recaptchaSiteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY;

function loadRecaptcha() {
  return new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}&hl=en`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
}

async function getRecaptchaToken() {
  if (!recaptchaSiteKey) return undefined;
  await loadRecaptcha();
  await new Promise<void>((resolve) => window.grecaptcha.ready(resolve));
  return await window.grecaptcha.execute(recaptchaSiteKey, { action: 'submit' });
}

async function sendRequest(body: FormValues & { googleReCaptchaToken?: string }) {
  return await fetch('/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}
