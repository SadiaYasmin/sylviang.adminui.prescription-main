import { Pipe, PipeTransform } from '@angular/core';
import { resolveAssetUrl } from '@app/shared/utils/asset-url.util';

@Pipe({ name: 'assetUrl', standalone: false })
export class AssetUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string | null {
    return resolveAssetUrl(url);
  }
}
