export interface IMenuItem {
  key?: string;
  title: string;
  href?: string;
  /**
   * Base path used for active-state matching when it must differ from `href`. `href` points
   * at one concrete landing route (e.g. `/quick-add/medicine`), but the item should stay
   * highlighted on any sibling under a shared prefix (`/quick-add/diagnosis`,
   * `/quick-add/follow-up`, …). Set this to that prefix (`/quick-add`); omit it and matching
   * falls back to `href`.
   */
  activeMatch?: string;
  icon: string;
  flags?: string[];
  /** Roles allowed to see this item; omit to show it to every authenticated role. */
  roles?: string[];
  subItems?: IMenuItem[];
  active: boolean;
  expanded?: boolean;
  order?: number;
  divider?: boolean;
}
