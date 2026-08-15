import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { parse } from 'nodejs-avro-phonetic';

const WORD_BOUNDARY = /[\s.,!?;:)("'—-]/;

/**
 * US-070: opt-in Bangla phonetic (Avro-style) typing on a clinical `<input>`/`<textarea>`.
 * Standard Avro-editor UX — the doctor types Banglish (e.g. "ami"), and on the next
 * word-boundary character (space/Enter/punctuation) that trailing word is replaced with its
 * Bengali transliteration ("আমি"). Purely additive to whatever ngModel/formControl is
 * already bound to the host element — mutates the DOM value then redispatches a native
 * `input` event so the existing value accessor picks up the change, rather than owning the
 * field's value itself.
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

    let wordStart = caret - 1;
    while (wordStart > 0 && !WORD_BOUNDARY.test(value[wordStart - 1])) {
      wordStart--;
    }
    const word = value.slice(wordStart, caret - 1);
    if (!/^[A-Za-z]+$/.test(word)) return;

    const converted = parse(word);
    if (converted === word) return;

    const newValue = value.slice(0, wordStart) + converted + value.slice(caret - 1);
    const newCaret = wordStart + converted.length + 1;

    this.replaying = true;
    element.value = newValue;
    element.setSelectionRange?.(newCaret, newCaret);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    this.replaying = false;
  }
}
