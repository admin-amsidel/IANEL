import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EnquiryService } from '../enquiry.service';

/** Where enquiries go. */
export const CONTACT_EMAIL = 'info.amsidel@gmail.com';

/*
 * No backend: the form posts straight from the browser to a form-to-email service.
 * The first one that is configured below is used:
 *
 * 1. EmailJS (recommended: sends the branded email in email/enquiry-email.html). Free, 200 emails/month.
 *    Setup steps are in email/README.md; paste the three IDs below.
 * 2. Web3Forms (fast, plain default layout). Free access key from https://web3forms.com.
 * 3. FormSubmit (used while nothing is set). No sign-up, but slow (30-70 s) and needs a one-time
 *    "Activate Form" click in the CONTACT_EMAIL inbox.
 *
 * Either way, if sending fails or takes too long, the visitor is offered a pre-filled email instead.
 */
export const EMAILJS = { serviceId: '', templateId: '', publicKey: '' };
export const WEB3FORMS_ACCESS_KEY = '';

const SLOW_HINT_MS = 6000;

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface Message {
  name: string;
  phone: string;
  email: string;
  note: string;
  product: string;
}

const useEmailJs = () => !!(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

/** e.g. "16 Nov 2026, 11:52 pm IST" */
const receivedAt = () =>
  new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';

/** Sends the message; resolves when the service confirms delivery, rejects otherwise. */
async function deliver(m: Message, signal: AbortSignal): Promise<void> {
  const product = m.product || 'General enquiry';
  const subject = `New enquiry from ${m.name}${m.product ? ` · ${m.product}` : ''}`;

  if (useEmailJs()) {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS.serviceId,
        template_id: EMAILJS.templateId,
        user_id: EMAILJS.publicKey,
        template_params: {
          subject,
          name: m.name,
          phone: m.phone,
          email: m.email,
          message: m.note,
          product,
          received_at: receivedAt(),
          site_url: location.origin,
        },
      }),
      signal,
    });
    if (!res.ok) throw new Error((await res.text().catch(() => '')) || res.statusText);
    return;
  }

  // Fallback services render their own layout; tidy labels make it read well.
  const fields = { Name: m.name, Phone: m.phone, Email: m.email, Product: product, Message: m.note, Received: receivedAt() };
  const [url, body] = WEB3FORMS_ACCESS_KEY
    ? ['https://api.web3forms.com/submit', { access_key: WEB3FORMS_ACCESS_KEY, subject, from_name: 'IANEL website', replyto: m.email, ...fields }]
    : [
        `https://formsubmit.co/ajax/${CONTACT_EMAIL}`,
        { ...fields, _replyto: m.email, _subject: subject, _template: 'box', _captcha: 'false' },
      ];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  // Web3Forms answers success: true, FormSubmit answers success: "true"
  if (!res.ok || String(data?.success) !== 'true') throw new Error(data?.message || res.statusText);
}

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
})
export class Contact {
  private readonly fb = inject(FormBuilder);
  private readonly enquiry = inject(EnquiryService);
  protected readonly email = CONTACT_EMAIL;
  protected readonly status = signal<Status>('idle');
  protected readonly submitted = signal(false);
  /** Shown when the service is taking a while to answer. */
  protected readonly slow = signal(false);
  /** Product picked via "Enquire about X", shown as a tag in the email. */
  private product = '';

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+()\d\s-]{7,20}$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    note: ['', [Validators.required, Validators.maxLength(2000)]],
    _honey: [''], // spam trap: hidden from people, bots fill it in
  });

  constructor() {
    // "Enquire about X" on a product pre-fills the note
    effect(() => {
      const p = this.enquiry.product();
      if (!p) return;
      const note = this.form.controls.note;
      if (!note.value.trim() || note.value.startsWith("Hi IANEL team, I'm interested in")) {
        note.setValue(`Hi IANEL team, I'm interested in ${p}. Please share more details and a demo.`);
      }
      this.product = p;
      this.enquiry.product.set(null);
    });
  }

  protected invalid(name: 'name' | 'phone' | 'email' | 'note'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected async send(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid || this.status() === 'sending') {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v._honey) return;

    this.status.set('sending');
    this.slow.set(false);
    const abort = new AbortController();
    const giveUp = setTimeout(() => abort.abort(), useEmailJs() || WEB3FORMS_ACCESS_KEY ? 20_000 : 90_000);
    const hint = setTimeout(() => this.slow.set(true), SLOW_HINT_MS);
    try {
      await deliver({ ...v, product: this.product }, abort.signal);
      this.status.set('sent');
      this.product = '';
      this.form.reset();
      this.submitted.set(false);
    } catch (e) {
      console.warn('Contact form: sending failed', e);
      this.status.set('error');
    } finally {
      clearTimeout(giveUp);
      clearTimeout(hint);
      this.slow.set(false);
    }
  }

  /** Fallback: open the visitor's own mail app with the message filled in. */
  protected mailtoHref(): string {
    const v = this.form.getRawValue();
    const lines = [`Name:    ${v.name}`, `Phone:   ${v.phone}`, `Email:   ${v.email}`];
    if (this.product) lines.push(`Product: ${this.product}`);
    const body = `${lines.join('\n')}\n\n${v.note}`;
    const subject = `New enquiry from ${v.name}${this.product ? ` · ${this.product}` : ''}`;
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  protected again(): void {
    this.status.set('idle');
  }
}
