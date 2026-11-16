# Enquiry email (EmailJS)

The contact form sends the branded email in `enquiry-email.html` through [EmailJS](https://www.emailjs.com) (free: 200 emails/month).

## One-time setup

1. Sign up at https://dashboard.emailjs.com.
2. **Email Services → Add New Service → Gmail.** Connect `info.amsidel@gmail.com`. Copy the **Service ID**.
3. **Email Templates → Create New Template**, then fill in:
   - **Subject:** `{{subject}}`
   - **Content:** click **Edit Content → Code Editor** and paste all of `enquiry-email.html`.
   - **To Email:** `info.amsidel@gmail.com`
   - **From Name:** `IANEL website`
   - **Reply To:** `{{email}}` (so hitting Reply answers the visitor)

   Save, then copy the **Template ID**.
4. **Account → General:** copy the **Public Key**.
5. **Account → Security:** add `https://ianel.info-amsidel.workers.dev` (and your custom domain later) to the allowed domains.
6. Paste the three values into `EMAILJS` in `src/app/contact/contact.ts`, then commit and push.

Until those are set, the form falls back to Web3Forms or FormSubmit (their own plain layouts).

## Template variables

| Variable          | Example                         |
| ----------------- | ------------------------------- |
| `{{subject}}`     | New enquiry from Asha · Martiq  |
| `{{name}}`        | Asha Menon                      |
| `{{phone}}`       | +91 98765 43210                 |
| `{{email}}`       | asha@company.com                |
| `{{product}}`     | Martiq / General enquiry        |
| `{{message}}`     | the visitor's note              |
| `{{received_at}}` | 16 Nov 2026, 11:52 pm IST       |
| `{{site_url}}`    | https://ianel.info-amsidel.workers.dev |
