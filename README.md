# A small journey

This is a static, mobile-first proposal experience for Vishwa. Open `index.html` locally to explore the front end, or deploy the folder to Vercel to enable the included YES-email endpoint.

## Personalising it

Edit [config.js](./config.js): names, messages, timeline moments, reasons, photo paths, audio URLs, and the final question all live there. Put any photos and licensed audio files in `assets/` and point to them from the configuration. The page gracefully works with no photos or audio set.

Music begins only after the visitor starts the journey, in line with browser autoplay rules. Each section fades to a configured track when one is provided.

## Acceptance email

`api/acceptance.js` is a Vercel serverless function. It emails `aryanpatel8561@gmail.com` after the YES action, while keeping all credentials on the server. Set these Vercel environment variables before relying on it:

```text
RESEND_API_KEY=
RESEND_FROM="Your Proposal <hello@your-verified-domain.com>"
APP_ORIGIN=https://your-domain.example
```

`RESEND_FROM` must use a domain you have verified with Resend. Optionally set `ACCEPTANCE_RECIPIENT` to override the recipient and configure `UPSTASH_REDIS_REST_URL` plus `UPSTASH_REDIS_REST_TOKEN` to store an auditable acceptance record for one year.

Do not add any of those values to `config.js` or client-side JavaScript.
