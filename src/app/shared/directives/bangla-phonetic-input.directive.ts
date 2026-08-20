import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { toBangla } from '@subhesadek/avro-phonetic';

const WORD_BOUNDARY = /[\s.,!?;:)("'—-]/;
// Includes digits so a just-typed number (e.g. "3" in "3 din") converts to Bangla numerals
// (৩) along with the word around it — matches real Avro Keyboard behavior and the reference
// prototype's own `CONVERTIBLE_TOKEN_RE` (src/hooks/useAvroPhoneticInput.js). The previous
// letters-only regex here silently left every typed digit as plain ASCII.
const CONVERTIBLE_TOKEN = /[A-Za-z0-9]+$/;

/**
 * US-070: opt-in Bangla phonetic (Avro-style) typing on a clinical `<input>`/`<textarea>`.
 * Standard Avro-editor UX — the doctor types Banglish (e.g. "ami"), and on the next
 * word-boundary character (space/Enter/punctuation) that trailing word is replaced with its
 * Bengali transliteration ("আমি"). Purely additive to whatever ngModel/formControl is
 * already bound to the host element — mutates the DOM value then redispatches a native
 * `input` event so the existing value accessor picks up the change, rather than owning the
 * field's value itself.
 *
 * Uses `@subhesadek/avro-phonetic` (same package the reference prototype uses) — the
 * previously-used `nodejs-avro-phonetic` has a materially weaker/older rule table (e.g. it
 * transliterates "jor" to "জর" instead of the correct "জ্বর" for "fever"); this package
 * matches the prototype's actual typing behavior doctors compared against.
 *
 * Deliberately opt-in per host element (bound via `[appBanglaPhoneticInput]="enabled"`) —
 * doctors need to type plain English notes too, so this never runs unconditionally.
 */
@Directive({ selector: '[appBanglaPhoneticInput]', standalone: false })
export class BanglaPhoneticInputDirective {
  @Input('appBanglaPhoneticInput') enabled = false;

  private replaying = false;

  constructor(private readonly elementRef: ElementRef<HTMLInputElement | HTMLTextAreaElement>) {}

  @HostListener('input')
  onInput(): void {
    if (!this.enabled || this.replaying) return;

    const element = this.elementRef.nativeElement;
    const value = element.value;
    const caret = element.selectionStart ?? value.length;

    const triggerChar = caret > 0 ? value[caret - 1] : '';
    if (!triggerChar || !WORD_BOUNDARY.test(triggerChar)) return;

    const before = value.slice(0, caret - 1);
    const match = before.match(CONVERTIBLE_TOKEN);
    if (!match) return;

    const token = match[0];
    const converted = toBangla(token);
    if (converted === token) return;

    const wordStart = caret - 1 - token.length;
    const newValue = value.slice(0, wordStart) + converted + value.slice(caret - 1);
    const newCaret = wordStart + converted.length + 1;

    this.replaying = true;
    element.value = newValue;
    element.setSelectionRange?.(newCaret, newCaret);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    this.replaying = false;
  }
}
