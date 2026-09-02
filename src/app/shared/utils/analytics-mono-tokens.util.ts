/**
 * PrimeNG (Aura theme) resolves cross-component design-token references — e.g. a tab's
 * `activeColor: "{primary.color}"` — into literal CSS values once, at the app's single
 * global `:root` stylesheet. That means overriding `--p-primary-color` on an ancestor
 * element (see analytics-dashboard.component.scss) recolors Tailwind's `bg-primary`/
 * `text-primary` utilities (which do reference `var(--p-primary-color)` directly) but NOT
 * a PrimeNG component's own internal styles, which read their own already-resolved
 * `--p-<component>-<token>` variable instead.
 *
 * PrimeNG's supported fix for a single scoped instance is the `[dt]` input every component
 * accepts (see primeng's BaseComponent) — a local design-token override merged in just for
 * that instance. These are the analytics dashboard's teal equivalents of the tokens each
 * component would otherwise inherit from the app's global (emerald) preset.
 */

export const ANALYTICS_MONO_TABS_DT = {
  tab: { activeColor: '#0d9488', activeBorderColor: '#0d9488' },
  activeBar: { background: '#0d9488' },
};

export const ANALYTICS_MONO_SELECT_DT = {
  root: { focusBorderColor: '#14b8a6' },
  option: {
    selectedBackground: '#f0fdfa',
    selectedColor: '#0f766e',
    selectedFocusBackground: '#ccfbf1',
    selectedFocusColor: '#115e59',
  },
};

export const ANALYTICS_MONO_DATEPICKER_DT = {
  date: { selectedBackground: '#14b8a6', selectedColor: '#ffffff' },
};

/** Same idea, for a `pButton` (default/primary severity) — used by the Doctor/Staff Dashboard's queue-row action buttons. */
export const ANALYTICS_MONO_BUTTON_DT = {
  colorScheme: {
    light: {
      root: {
        primary: {
          background: '#0d9488',
          hoverBackground: '#0f766e',
          activeBackground: '#115e59',
          borderColor: '#0d9488',
          hoverBorderColor: '#0f766e',
          activeBorderColor: '#115e59',
        },
      },
    },
    dark: {
      root: {
        primary: {
          background: '#14b8a6',
          hoverBackground: '#2dd4bf',
          activeBackground: '#5eead4',
          borderColor: '#14b8a6',
          hoverBorderColor: '#2dd4bf',
          activeBorderColor: '#5eead4',
        },
      },
    },
  },
};
