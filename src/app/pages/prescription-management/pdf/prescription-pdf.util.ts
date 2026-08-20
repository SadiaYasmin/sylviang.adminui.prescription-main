import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { IPrescriptionDocument } from '@core/interfaces/prescriptions/prescription.interface';

// A4 at 96dpi, matching TEMPLATE_PREVIEW_DESIGN_WIDTH/HEIGHT in template-preview.component.ts.
const PAGE_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;
const PAGE_MARGIN_PX = 24;
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_MARGIN_PX * 2;

// Union of the block-level class names used across all three template layouts — each
// matched element is treated as an atomic, unsplittable pagination unit (US-034: nothing
// is ever cut mid-element). Browser-native printing (the Print button) additionally gets
// `break-inside: avoid` on these same classes via each template's own print CSS, so the
// two pagination paths (native print vs. this programmatic PDF) stay visually consistent.
//
// Must cover every template's actual body block classes, not just header/footer/signoff —
// `.patient-block`/`.section`/`.card` never matched anything real (Classic uses
// `.patient-bar`/`.field-section`/`.rx-block`, Corporate uses `.rx-card`, the shared
// patient-info component is `.patient-info-block`). A stale/incomplete list here doesn't
// lose content anymore (see the pageStart fix below), but it does mean an unmatched block
// can get split awkwardly across a page boundary instead of staying whole.
const PAGE_UNIT_SELECTOR = [
  'header',
  'footer',
  '.patient-info-block',
  '.patient-bar',
  '.field-section',
  '.rx-block',
  '.rx-card',
  '.section',
  '.card',
  '.compact-grid',
  '.oe-block',
  '.rx-section',
  '.signoff',
  '.doctor-bar',
].join(', ');

interface PageRange {
  top: number;
  height: number;
}

/**
 * Packs the rendered prescription's block-level units into A4 content-height budgets —
 * a lightweight version of "measure, then pack" (no hidden-DOM pass needed since the
 * document is already rendered on-screen for the view page).
 */
function computePageRanges(root: HTMLElement): PageRange[] {
  const rootTop = root.getBoundingClientRect().top;
  const units = Array.from(root.querySelectorAll<HTMLElement>(PAGE_UNIT_SELECTOR));

  if (units.length === 0) {
    const height = root.scrollHeight;
    const pages: PageRange[] = [];
    for (let top = 0; top < height; top += CONTENT_HEIGHT_PX) {
      pages.push({ top, height: Math.min(CONTENT_HEIGHT_PX, height - top) });
    }
    return pages;
  }

  const ranges: PageRange[] = [];
  let pageStart = 0;
  let cursor = 0;

  for (const unit of units) {
    const unitTop = unit.getBoundingClientRect().top - rootTop;
    const unitBottom = unitTop + unit.offsetHeight;

    if (unitBottom - pageStart > CONTENT_HEIGHT_PX && cursor > pageStart) {
      ranges.push({ top: pageStart, height: cursor - pageStart });
      // Real bug (US-034 fallout): this used to jump straight to `unitTop`, silently
      // dropping everything between the previous unit's bottom (`cursor`) and this unit's
      // top from every page range — any content that fell in that gap (e.g. an unmatched
      // block between two matched units) was rasterized on no page at all. Starting the
      // next page at `cursor` instead makes the ranges tile the document with zero gaps,
      // regardless of which elements the selector above happens to match.
      pageStart = cursor;
    }
    cursor = Math.max(cursor, unitBottom);
  }
  ranges.push({ top: pageStart, height: cursor - pageStart });

  return ranges;
}

/**
 * Renders a small "Page X of Y" continuation header (US-034) above every page after the
 * first, so a loose printed sheet stays traceable back to the right prescription/patient.
 */
function buildContinuationHeader(doc: IPrescriptionDocument, pageNumber: number, totalPages: number): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `
    font-family: 'Manrope', sans-serif; font-size: 12px; color: #475569;
    display: flex; justify-content: space-between; padding: 4px 0 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 8px;
  `;
  el.innerHTML = `
    <span>${doc.hospitalSettings.name} &middot; ${doc.doctor.fullName} &middot; ${doc.patient.name}</span>
    <span>Page ${pageNumber} of ${totalPages}</span>
  `;
  return el;
}

/** US-033/034: client-side PDF export, paginated to true A4 boundaries. */
export async function downloadPrescriptionPdf(document_: IPrescriptionDocument): Promise<void> {
  const root = document.querySelector<HTMLElement>('.rx-print-root .tpv-outer, .rx-print-root');
  if (!root) return;

  const ranges = computePageRanges(root);
  const pdf = new jsPDF({ unit: 'px', format: [PAGE_WIDTH_PX, PAGE_HEIGHT_PX], compress: true });

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const canvas = await html2canvas(root, {
      scale: 2,
      y: range.top,
      height: range.height,
      windowWidth: PAGE_WIDTH_PX,
      useCORS: true,
    });

    if (i > 0) pdf.addPage([PAGE_WIDTH_PX, PAGE_HEIGHT_PX]);

    let contentTop = PAGE_MARGIN_PX;
    if (i > 0) {
      const header = buildContinuationHeader(document_, i + 1, ranges.length);
      document.body.appendChild(header);
      const headerCanvas = await html2canvas(header, { scale: 2 });
      document.body.removeChild(header);
      const headerHeightPx = (headerCanvas.height / headerCanvas.width) * (PAGE_WIDTH_PX - PAGE_MARGIN_PX * 2);
      pdf.addImage(headerCanvas.toDataURL('image/png'), 'PNG', PAGE_MARGIN_PX, contentTop, PAGE_WIDTH_PX - PAGE_MARGIN_PX * 2, headerHeightPx);
      contentTop += headerHeightPx + 6;
    }

    const imgWidth = PAGE_WIDTH_PX - PAGE_MARGIN_PX * 2;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', PAGE_MARGIN_PX, contentTop, imgWidth, imgHeight);
  }

  pdf.save(`${document_.displayCode}.pdf`);
}
