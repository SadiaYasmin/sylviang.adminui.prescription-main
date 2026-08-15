import { Pipe, PipeTransform } from '@angular/core';
import { toBanglaDigits } from '@app/shared/utils/bangla-digits.util';

/** US-067: `{{ value | banglaDigits: language }}` — converts to Bangla numerals only when language is 'bn'. */
@Pipe({ name: 'banglaDigits', standalone: false })
export class BanglaDigitsPipe implements PipeTransform {
  transform(value: string | number | null | undefined, language?: 'en' | 'bn' | null): string {
    if (language !== 'bn') return value == null ? '' : String(value);
    return toBanglaDigits(value);
  }
}
