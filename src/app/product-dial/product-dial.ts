import { Component, computed, inject, signal } from '@angular/core';
import { PRODUCTS } from '../products';
import { EnquiryService } from '../enquiry.service';

/*
 * DIAL GEOMETRY
 * The products share the top half circle equally (4 products → 45° each). The selected slice pops out
 * and the pointer swings round the hub to it.
 */
const N = PRODUCTS.length;
const SLOTS = N;
const STEP = 180 / SLOTS; // 45°
const R_OUT = 460;
const R_IN = 236;
const GAP = 0.8;
const rad = (d: number) => (d * Math.PI) / 180;
const pt = (r: number, a: number): [number, number] => [r * Math.cos(rad(a)), r * Math.sin(rad(a))];

function sectorPath(a1: number, a2: number): string {
  const [x1, y1] = pt(R_OUT, a1), [x2, y2] = pt(R_OUT, a2), [x3, y3] = pt(R_IN, a2), [x4, y4] = pt(R_IN, a1);
  return `M${x1} ${y1} A${R_OUT} ${R_OUT} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${R_IN} ${R_IN} 0 0 0 ${x4} ${y4} Z`;
}

interface Slice {
  idx: number;
  product: number;
  base: number;
  d: string;
  label: string;
  num: string;
  numTransform: string;
  pop: string;
}

const SLICES: Slice[] = Array.from({ length: SLOTS }, (_, i) => {
  const base = -180 + STEP / 2 + i * STEP; // slot centre angle
  const [tx, ty] = pt((R_OUT + R_IN) / 2 + 6, base);
  const [ox, oy] = pt(18, base);
  return {
    idx: i,
    product: i % N,
    base,
    d: sectorPath(base - STEP / 2 + GAP, base + STEP / 2 - GAP),
    label: `translate(${tx} ${ty - 8})`,
    num: String((i % N) + 1).padStart(2, '0'),
    numTransform: `translate(${tx} ${ty + 24})`,
    pop: `translate(${ox}px, ${oy}px)`,
  };
});

@Component({
  selector: 'app-product-dial',
  templateUrl: './product-dial.html',
  host: { '(window:keydown)': 'onKey($event)' },
})
export class ProductDial {
  private readonly enquiry = inject(EnquiryService);
  protected readonly products = PRODUCTS;
  protected readonly slices = SLICES;
  protected readonly total = String(N).padStart(2, '0');

  protected readonly activeSlot = signal(-1);
  /** The product whose copy is on screen; trails the selection by a short fade. */
  protected readonly shown = signal(0);
  protected readonly swapping = signal(false);
  protected readonly current = computed(() => PRODUCTS[this.shown()]);
  protected readonly activeProduct = computed(() => SLICES[this.activeSlot()]?.product ?? 0);
  /** The pointer is drawn at the top (-90°); turn it to the selected slice. */
  protected readonly pointerTransform = computed(() => `rotate(${(SLICES[this.activeSlot()]?.base ?? -90) + 90}deg)`);

  private lockUntil = 0;
  private swapTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.select(0, true);
  }

  protected select(slotIdx: number, instant = false): void {
    const s = SLICES[slotIdx];
    if (!s) return;
    const prev = this.activeSlot();
    this.activeSlot.set(slotIdx);
    this.lockUntil = performance.now() + (instant ? 0 : 120); // stop hover jitter as the slice pops

    if (prev === -1 || SLICES[prev].product !== s.product) this.updateContent(s.product, instant);
  }

  private updateContent(pi: number, instant: boolean): void {
    document.documentElement.style.setProperty('--accent', PRODUCTS[pi].color);
    clearTimeout(this.swapTimer);
    if (instant) {
      this.shown.set(pi);
      return;
    }
    this.swapping.set(true);
    this.swapTimer = setTimeout(() => {
      this.shown.set(pi);
      this.swapping.set(false);
    }, 220);
  }

  protected fill(s: Slice): string {
    return s.idx === this.activeSlot() ? PRODUCTS[s.product].color : s.idx % 2 ? '#fafafb' : '#f3f4f7';
  }

  protected stroke(s: Slice): string {
    return s.idx === this.activeSlot() ? PRODUCTS[s.product].color : '#e8e9ee';
  }

  protected onEnter(s: Slice, e: PointerEvent): void {
    if (e.pointerType === 'touch') return;
    if (performance.now() < this.lockUntil || s.idx === this.activeSlot()) return;
    this.select(s.idx);
  }

  protected onClick(s: Slice): void {
    // first tap (touch) selects; clicking the selected slice opens its details
    if (s.idx !== this.activeSlot()) {
      this.select(s.idx);
      return;
    }
    this.openDetails();
  }

  protected openDetails(): void {
    document.getElementById('product-detail')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  protected onFocus(s: Slice): void {
    if (s.idx !== this.activeSlot()) this.select(s.idx);
  }

  protected onSliceKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openDetails();
    }
  }

  protected step(dir: 1 | -1): void {
    this.select((this.activeSlot() + dir + SLOTS) % SLOTS);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const t = e.target as HTMLElement | null;
    if (t && (t.closest('input, textarea, select') || t.isContentEditable)) return;
    this.step(e.key === 'ArrowRight' ? 1 : -1);
  }

  protected enquire(): void {
    this.enquiry.enquire(this.current().name);
  }
}
