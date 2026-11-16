# IANEL Technologies website

Static, single-page Angular 21 site: no backend.

```bash
npm install
npm start          # http://localhost:4200
npm run build      # static output in dist/ianel-web/browser (host on any static host)
```

## Where things live

| What | File |
| --- | --- |
| Products (names, copy, colours, logos) | `src/app/products.ts` |
| Half-circle product dial + detail card | `src/app/product-dial/` |
| Contact form | `src/app/contact/` |
| Page sections, cursor, animations | `src/app/app.html`, `src/app/app.ts` |
| Theme + all styles | `src/styles.css` |
| Cloud page loader | `src/index.html` (sprite: `public/brand/loader-sprite.png`) |
| Animated logo video | `public/brand/ianel-animated.mp4` |

## Contact form email

The form posts from the browser to a form-to-email service that forwards it to
`info.amsidel@gmail.com` (`CONTACT_EMAIL` in `src/app/contact/contact.ts`).

**Recommended setup (fast, reliable):**
1. Go to https://web3forms.com, enter `info.amsidel@gmail.com` and request an access key.
2. The key arrives in that inbox. Paste it into `WEB3FORMS_ACCESS_KEY` in `src/app/contact/contact.ts`.
3. Rebuild.

Until a key is set, the form uses [FormSubmit](https://formsubmit.co), which needs no sign-up but is slow
(replies often take 30–70 seconds). After 6 seconds the visitor is told it is still sending and offered a
pre-filled email instead; the same link appears if sending fails.
Check the spam folder for the first messages from either service.
