/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { ProductDial } from './product-dial/product-dial';
import { Contact } from './contact/contact';
import { PRODUCTS } from './products';
import { EnquiryService } from './enquiry.service';

/** The loader stays up at least this long, so the animated cloud is seen rather than flashing. */
const LOADER_MIN_MS = 1100;

@Component({
  selector: 'app-root',
  imports: [ProductDial, Contact],
  templateUrl: './app.html',
  host: { '(window:scroll)': 'onScroll()' },
})
export class App {
  protected readonly products = PRODUCTS;
  protected readonly enquiry = inject(EnquiryService);
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected readonly tech = [
    { group: 'Cloud & hosting', items: ['AWS', 'Google Cloud', 'Render', 'Supabase'] },
    { group: 'Backend', items: ['Java', 'Spring Boot', 'PostgreSQL', 'REST APIs'] },
    { group: 'Frontend', items: ['Angular', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3'] },
  ];
  protected readonly marquee = ['AWS', 'Google Cloud', 'Java', 'Spring Boot', 'Angular', 'PostgreSQL', 'Supabase', 'Render', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3'];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.hideLoader();
      // `muted` must be a property (not just the attribute) for browsers to allow autoplay
      const v = document.querySelector<HTMLVideoElement>('.about-media video');
      if (v) {
        v.muted = true;
        v.play().catch(() => this.videoPaused.set(true));
      }
      const off = [this.cursor(), this.magnetic(), this.tilt(), this.reveal()];
      destroyRef.onDestroy(() => off.forEach((f) => f()));
    });
  }

  /** Animated logo: starts muted (browsers only autoplay muted video); visitors can turn sound on or pause it. */
  protected readonly videoMuted = signal(true);
  protected readonly videoPaused = signal(false);

  protected toggleMute(v: HTMLVideoElement): void {
    this.videoMuted.set(!this.videoMuted());
    v.muted = this.videoMuted();
    if (!v.muted && v.paused) v.play().catch(() => {});
  }

  protected togglePlay(v: HTMLVideoElement): void {
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  protected onScroll(): void {
    this.scrolled.set(window.scrollY > 10);
  }

  protected go(e: Event, id: string): void {
    e.preventDefault();
    this.menuOpen.set(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private hideLoader(): void {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    const done = () => {
      const wait = Math.max(0, LOADER_MIN_MS - performance.now());
      setTimeout(() => loader.classList.add('is-hidden'), wait);
    };
    if (document.readyState === 'complete') done();
    else addEventListener('load', done, { once: true });
  }

  /** Custom cursor: a dot, an easing ring and a small label (e.g. "Explore") over interactive things. */
  private cursor(): () => void {
    const dot = document.querySelector<HTMLElement>('.cursor-dot');
    const ring = document.querySelector<HTMLElement>('.cursor-ring');
    const label = document.querySelector<HTMLElement>('.cursor-label');
    if (!dot || !ring || !label || !matchMedia('(hover:hover) and (pointer:fine)').matches) return () => {};
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf = 0;
    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as Element).closest?.('[data-hover], .slice, a, button, input, textarea');
      ring.classList.toggle('hover', !!t);
      const text = t?.closest('[data-cursor]')?.getAttribute('data-cursor');
      if (text) label.textContent = text;
      label.classList.toggle('show', !!text);
    };
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      label.style.transform = `translate(${rx}px,${ry + 44}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener('pointermove', move);
    addEventListener('pointerover', over);
    loop();
    return () => {
      removeEventListener('pointermove', move);
      removeEventListener('pointerover', over);
      cancelAnimationFrame(raf);
    };
  }

  /** Buttons lean towards the pointer. */
  private magnetic(): () => void {
    let last: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const b = (e.target as Element).closest?.<HTMLElement>('.magnetic') ?? null;
      if (last && last !== b) release(last);
      last = b;
      if (!b) return;
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    };
    const release = (b: HTMLElement) => {
      b.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), color .4s';
      b.style.transform = '';
      setTimeout(() => (b.style.transition = ''), 600);
    };
    addEventListener('pointermove', move);
    return () => removeEventListener('pointermove', move);
  }

  /** Cards tilt in 3D with a glow that follows the pointer. */
  private tilt(): () => void {
    let last: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const c = (e.target as Element).closest?.<HTMLElement>('.tilt') ?? null;
      if (last && last !== c) last.style.transform = '';
      last = c;
      if (!c) return;
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.transform = `perspective(900px) rotateX(${(y / r.height - 0.5) * -6}deg) rotateY(${(x / r.width - 0.5) * 6}deg) translateY(-4px)`;
      const glow = c.querySelector<HTMLElement>('.glow');
      if (glow) {
        glow.style.left = x + 'px';
        glow.style.top = y + 'px';
      }
    };
    addEventListener('pointermove', move);
    return () => removeEventListener('pointermove', move);
  }

  /** Sections fade up as they scroll into view. */
  private reveal(): () => void {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          io.unobserve(en.target);
        }),
      { threshold: 0.15 },
    );
    document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
      const d = el.dataset['delay'];
      if (d) el.style.transitionDelay = d + 's';
      io.observe(el);
    });
    return () => io.disconnect();
  }
}
