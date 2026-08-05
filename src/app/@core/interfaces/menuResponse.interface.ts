export interface IMenuItem {
  key?: string;
  title: string;
  href?: string;
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
