import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EnquiryService } from '../enquiry.service';

/** Where enquiries go. */
export const CONTACT_EMAIL = 'info.amsidel@gmail.com';

/*
 * No backend: the form posts straight from the browser to a form-to-email service.
 *
 * 1. Web3Forms (recommended, answers in about a second). Get a free access key at https://web3forms.com:
 *    enter CONTACT_EMAIL there, the key arrives in that inbox; paste it below.
 * 2. FormSubmit (used while no key is set). Works without sign-up but is slow: replies often take
 *    30-70 seconds and sometimes never come.
 *
 * Either way, if sending fails or takes too long, the visitor is offered a pre-filled email instead.
 */
export const WEB3FORMS_ACCESS_KEY = '';

const SLOW_HINT_MS = 6000;

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface Message {
  name: string;
  phone: string;
  email: string;
  note: string;
}

/** Sends the message; resolves when the service confirms delivery, rejects otherwise. */
async function deliver(m: Message, signal: AbortSignal): Promise<void> {
  const subject = `Website enquiry from ${m.name}`;
  const [url, body] = WEB3FORMS_ACCESS_KEY
    ? [
        'https://api.web3forms.com/submit',
        { access_key: WEB3FORMS_ACCESS_KEY, subject, from_name: 'IANEL website', name: m.name, phone: m.phone, email: m.email, message: m.note },
      ]
    : [
        `https://formsubmit.co/ajax/${CONTACT_EMAIL}`,
        { name: m.name, phone: m.phone, email: m.email, message: m.note, _replyto: m.email, _subject: subject, _template: 'table', _captcha: 'false' },
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
    const giveUp = setTimeout(() => abort.abort(), WEB3FORMS_ACCESS_KEY ? 20_000 : 90_000);
    const hint = setTimeout(() => this.slow.set(true), SLOW_HINT_MS);
    try {
      await deliver(v, abort.signal);
      this.status.set('sent');
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
    const body = `Name: ${v.name}\nPhone: ${v.phone}\nEmail: ${v.email}\n\n${v.note}`;
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Website enquiry from ' + v.name)}&body=${encodeURIComponent(body)}`;
  }

  protected again(): void {
    this.status.set('idle');
  }
}
