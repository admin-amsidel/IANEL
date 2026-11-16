import { Injectable, signal } from '@angular/core';

/** Lets a "Enquire about X" button pre-fill the contact form's note. */
@Injectable({ providedIn: 'root' })
export class EnquiryService {
  readonly product = signal<string | null>(null);

  enquire(name: string): void {
    this.product.set(name);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
