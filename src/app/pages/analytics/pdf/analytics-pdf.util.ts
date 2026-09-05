import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// A4 at 96dpi — same constants prescription-pdf.util.ts uses, kept local here since this
// util has no other reason to depend on the unrelated prescription-management feature.
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;
const PAGE_MARGIN_PX = 24;
const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - PAGE_MARGIN_PX * 2;

// html2canvas 1.4.x only understands legacy rgb()/rgba()/hsl()/hsla()/hex — it
// throws "Attempting to parse an unsupported color function" on CSS Color 4
// `color()`/`oklch()`/`oklab()`/`lab()`/`lch()`/`hwb()` plus the `color-mix()`/
// `light-dark()` wrappers PrimeNG v19's Aura theme tokens resolve to in
// getComputedStyle. Convert every such value to legacy rgb()/rgba() on the CLONE
// html2canvas rasterizes, right before it renders.
const UNSUPPORTED_COLOR_FN = /\b(?:oklch|oklab|lab|lch|hwb|color(?:-mix)?|light-dark)\s*\(/i;

// Convert a CSS Color 4 function value the html2canvas parser rejects into the plain
// 'rgb(r, g, b)' / 'rgba(r, g, b, a)' html2canvas understands, trying three strategies in
// order so it never depends on one browser's feature level:
//   1. Let a scratch canvas 2D context parse it (modern browsers normalize any CSS color).
//   2. Translate the common resolved form 'color(srgb R G B[/A])' directly — canvas 2D
//      doesn't accept CSS Color 4 on older Chromium (<112), but html2canvas still needs it.
//   3. A neutral legacy shade as a last resort — better than letting html2canvas throw,
//       which would abort the whole export.
function parseSrgbColor(value: string): string | null {
  const srgb =
    /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i.exec(value.trim());
  if (!srgb) return null;
  const r = Math.round(parseFloat(srgb[1]) * 255);
  const g = Math.round(parseFloat(srgb[2]) * 255);
  const b = Math.round(parseFloat(srgb[3]) * 255);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  if (srgb[4] !== undefined) {
    const raw = srgb[4].trim();
    const alpha = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
    if (Number.isNaN(alpha)) return null;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function normalizeColor(value: string): string {
  // The common computed form from Tailwind/PrimeNG (`color(srgb R G B [/ A])`)
  // is handled directly — the canvas path below preserves CSS Color 4 syntax
  // verbatim in modern Chromium (fillStyle stays `color(...)`), which would hand
  // the same unsupported value straight back to html2canvas.
  const direct = parseSrgbColor(value);
  if (direct) return direct;

  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillStyle = value;
      const normalized = ctx.fillStyle;
      // Only accept legacy syntax html2canvas understands — a preserved
      // `color(...)`/`color-mix` result (or a no-op `#000`) is not a fix.
      if (normalized && normalized !== '#000' && !UNSUPPORTED_COLOR_FN.test(normalized)) {
        return normalized;
      }
      // Chromium normalizes `color-mix(...)` to `color(srgb ...)` rather than
      // legacy rgb() — translate that resolved form manually.
      if (normalized) {
        const fromCanvas = parseSrgbColor(normalized);
        if (fromCanvas) return fromCanvas;
      }
    }
  } catch {
    // fall through to the neutral fallback
  }

  return 'rgb(100, 116, 139)';
}

// NOTE: kebab-case — Element.style.setProperty() silently ignores camelCase names
// ('backgroundColor'), so a camelCase list here would make the whole sanitize a no-op.
const COLOR_PROPS = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-block-start-color',
  'border-block-end-color',
  'border-inline-start-color',
  'border-inline-end-color',
  'outline-color',
  'text-decoration-color',
  '-webkit-text-stroke-color',
  'fill',
  'stroke',
] as const;

function sanitizeUnsupportedColors(clonedDoc: Document): void {
  const view = clonedDoc.defaultView;
  if (!view) return;

  // CSS Transitions outrank even inline `!important` while running, and Tailwind v4
  // interpolates transitioning colors in `oklab` — PrimeNG cards carry
  // `transition-property: color, background-color, border-color, ...`, so the very
  // act of sanitizing a color STARTS a transition in the clone and the computed
  // value stays `oklab(...)` forever (observed: inline=rgb !important yet
  // computed=oklab). html2canvas tries to set transitionProperty="none" while
  // cloning but immediately overwrites it when copying computed styles. Kill
  // transitions/animations first (both via blanket rule and per element, since the
  // cloner inlines the original transition), THEN fix colors.
  const killMotion = clonedDoc.createElement('style');
  killMotion.textContent = `
    * {
      transition: none !important;
      animation: none !important;
    }
  `;
  clonedDoc.head.appendChild(killMotion);

  // Pseudo-elements (::before/::after) aren't real DOM nodes — can't override their
  // computed style inline. PrimeNG's ripple/focus decorations lean on them with
  // color-mix()-derived colors, so the reliable fix is a blanket override rather than
  // trying to detect+patch each one; losing these purely decorative effects in a PDF
  // export is an acceptable trade-off. color: transparent (not inherit) so the inherited
  // resolved shade — often itself a CSS Color 4 value — can't resurface on html2canvas's
  // parser.
  const style = clonedDoc.createElement('style');
  style.textContent = `
    *::before, *::after {
      color: transparent !important;
      background-color: transparent !important;
      background-image: none !important;
      border-color: transparent !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
  `;
  clonedDoc.head.appendChild(style);

  const elements = clonedDoc.querySelectorAll<HTMLElement>('*');
  elements.forEach((el) => {
    try {
      // Cancel any running transition/animation before touching colors — otherwise
      // the edit itself transitions and computed values stay in oklab space.
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('animation', 'none', 'important');

      const computed = view.getComputedStyle(el);
      if (!computed) return;

      // FIRST drop toxic shorthands: html2canvas's cloner copies BOTH the shorthand
      // (`background`, `border`, ...) and the longhands into the clone's inline
      // style, and shorthand declared after a longhand wins the cascade — fixing
      // only `background-color` is silently reverted while inline
      // `background: oklab(...)` still stands (observed: inline=rgb(...) yet
      // computed=oklab(...)). Removing the shorthand first lets the sanitized
      // longhands set below stand (removing after would clear them again, since
      // they are linked to the shorthand expansion in CSSStyleDeclaration).
      for (const shorthand of [
        'background',
        'border',
        'border-color',
        'border-top',
        'border-right',
        'border-bottom',
        'border-left',
        'outline',
      ]) {
        const v = el.style.getPropertyValue(shorthand) || computed.getPropertyValue(shorthand);
        if (v && UNSUPPORTED_COLOR_FN.test(v)) {
          el.style.removeProperty(shorthand);
        }
      }

      // !important so the override beats any theme rule that applies !important itself.
      // Read via getPropertyValue (kebab-case); the camelCase index access
      // (computed[prop]) reads fine but setProperty(camelCase) is a silent no-op.
      for (const prop of COLOR_PROPS) {
        const value = computed.getPropertyValue(prop);
        if (value && UNSUPPORTED_COLOR_FN.test(value)) {
          el.style.setProperty(prop, normalizeColor(value), 'important');
        }
      }

    // Catch-all for logical/shorthand color props Tailwind emits
    // (border-color, border-block-end-color, background, ...) that html2canvas may
    // still parse — anything color-bearing that still holds an unsupported fn gets
    // normalized, so a future utility class can't re-break the export.
    for (let i = 0; i < computed.length; i++) {
      const name = computed.item(i);
      if (!name || name.startsWith('--')) continue;
      if ((COLOR_PROPS as readonly string[]).includes(name)) continue;
      if (!/color/i.test(name)) continue;
      const value = computed.getPropertyValue(name);
      if (value && UNSUPPORTED_COLOR_FN.test(value)) {
        try {
          el.style.setProperty(name, normalizeColor(value), 'important');
        } catch {
          // ignore — better to leave one odd shade than abort the export
        }
      }
    }

    const boxShadow = computed.getPropertyValue('box-shadow');
    if (boxShadow && UNSUPPORTED_COLOR_FN.test(boxShadow)) {
      el.style.setProperty('box-shadow', 'none', 'important');
    }
    const backgroundImage = computed.getPropertyValue('background-image');
    if (backgroundImage && UNSUPPORTED_COLOR_FN.test(backgroundImage)) {
      el.style.setProperty('background-image', 'none', 'important');
    }
    const textShadow = computed.getPropertyValue('text-shadow');
    if (textShadow && UNSUPPORTED_COLOR_FN.test(textShadow)) {
      el.style.setProperty('text-shadow', 'none', 'important');
    }
    } catch {
      // One unreadable element must never abort sanitizing the rest of the clone.
    }
  });
}

// html2canvas sizes its output canvas from the element's rendered height. A tab whose
// content legitimately spans thousands of rows would otherwise demand a multi-gigabyte
// canvas at scale 2 and crash the tab ("RESULT CODE HUNG"). Cap the CLONE's height to a
// generous few A4 pages — anything longer is an edge case where a truncated report beats a
// dead tab. Normal reports never reach this limit.
const MAX_EXPORT_HEIGHT_PX = 4800;

function clampExportHeight(clonedDoc: Document, tabKey: string): void {
  const el = clonedDoc.querySelector<HTMLElement>(`[data-pdf-tab="${tabKey}"]`);
  if (!el || el.scrollHeight <= MAX_EXPORT_HEIGHT_PX) return;
  el.style.maxHeight = `${MAX_EXPORT_HEIGHT_PX}px`;
  el.style.overflow = 'hidden';
}

/**
 * Client-side export of one analytics tab to PDF. Unlike prescription-pdf.util.ts, this
 * doesn't do block-aware pagination — a chart or table getting sliced across a page
 * boundary in a reporting export is a cosmetic issue, not a correctness one, so a plain
 * positional slice of one tall canvas into A4-height pages is enough here.
 *
 * Targets `[data-pdf-tab="<tabKey>"]` rather than "whichever tab looks visible" because
 * PrimeNG's Tabs keeps every tab panel in the DOM and only hides inactive ones via CSS —
 * the caller already knows which tab is active, so it's simplest to just ask for that one
 * by key.
 */
export async function downloadAnalyticsTabPdf(tabKey: string, title: string): Promise<void> {
  const el = document.querySelector<HTMLElement>(`[data-pdf-tab="${tabKey}"]`);
  if (!el) return;

  // foreignObjectRendering delegates painting to the browser's native SVG <foreignObject>
  // instead of html2canvas's own rasterizer, but Chromium silently produces a blank canvas
  // for it in most configurations — so we render with the default renderer and instead fix
  // the actual color-parsing bug by normalizing CSS Color 4 values to legacy rgb()/rgba()
  // on the clone html2canvas rasterizes (sanitizeUnsupportedColors). clampExportHeight runs
  // first as a guard so an unusually tall tab still exports (truncated) instead of crashing.
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    onclone: (clonedDoc) => {
      clampExportHeight(clonedDoc, tabKey);
      sanitizeUnsupportedColors(clonedDoc);
    },
  });
  const imgWidth = CONTENT_WIDTH_PX;
  const scale = imgWidth / canvas.width;
  const fullImgHeight = canvas.height * scale;

  const pdf = new jsPDF({ unit: 'px', format: [PAGE_WIDTH_PX, PAGE_HEIGHT_PX], compress: true });

  let renderedHeight = 0;
  let pageIndex = 0;

  while (renderedHeight < fullImgHeight) {
    if (pageIndex > 0) pdf.addPage([PAGE_WIDTH_PX, PAGE_HEIGHT_PX]);

    let contentTop = PAGE_MARGIN_PX;
    if (pageIndex === 0) {
      pdf.setFontSize(14);
      pdf.text(title, PAGE_MARGIN_PX, contentTop + 10);
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.text(`Generated ${new Date().toLocaleString()}`, PAGE_MARGIN_PX, contentTop + 24);
      pdf.setTextColor(0);
      contentTop += 36;
    }

    const availableHeight = PAGE_HEIGHT_PX - contentTop - PAGE_MARGIN_PX;
    const sliceHeightPx = Math.min(availableHeight, fullImgHeight - renderedHeight);
    const sourceY = renderedHeight / scale;
    const sourceHeight = sliceHeightPx / scale;

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.max(1, Math.round(sourceHeight));
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', PAGE_MARGIN_PX, contentTop, imgWidth, sliceHeightPx);

    renderedHeight += sliceHeightPx;
    pageIndex++;
  }

  pdf.save(`${title.replace(/[^a-z0-9]+/gi, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
