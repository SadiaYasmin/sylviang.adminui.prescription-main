import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { ShellModule } from './shell/shell.module';
import { ApiPrefixInterceptor } from './@core/interceptors/api-prefix.interceptor';
import { AuthInterceptor } from './@core/interceptors/auth.interceptor';
import { ErrorHandlerInterceptor } from './@core/interceptors/error-handler.interceptor';
import { RouteReuseStrategy, PreloadAllModules } from '@angular/router';
import { RouteReusableStrategy } from './@core/helpers/route-reusable-strategy';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot(),
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      onSameUrlNavigation: 'reload',
      paramsInheritanceStrategy: 'always',
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
    }),
    ShellModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [
    MessageService,
    ConfirmationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiPrefixInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlerInterceptor,
      multi: true,
    },
    {
      provide: RouteReuseStrategy,
      useClass: RouteReusableStrategy,
    },
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          // Without this, PrimeNG's Aura preset switches every PrimeNG
          // component to its dark palette based on the OS/browser
          // `prefers-color-scheme` media query, independent of this app's
          // own light/dark toggle (ThemeService, which only flips `.dark`
          // on <html> for its own CSS variables). That mismatch is why
          // PrimeNG controls (tabs, selects, inputs) could render dark while
          // the rest of a "light" page stayed light. Scoping PrimeNG's dark
          // mode to the same `.dark` class keeps both in sync.
          darkModeSelector: '.dark',
        },
      },
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
