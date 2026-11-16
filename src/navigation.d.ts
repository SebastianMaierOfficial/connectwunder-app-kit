export interface NavigationItem { id: string; label: string; href: string; current?: boolean }
export interface NavigationModel {
  workspaceName: string;
  homeHref: string;
  items: NavigationItem[];
  label?: string;
  homeLabel?: string;
  emptyLabel?: string;
  legal?: { imprint: string; privacy: string } | null;
}
export interface ConnectWunderNavigationElement extends HTMLElement {
  allowedOrigins: string[];
  get model(): Readonly<NavigationModel> | null;
  set model(value: NavigationModel);
}
export declare function normalizeNavigation(model: NavigationModel, allowedOrigins: string[], baseOrigin: string): Readonly<NavigationModel>;
export declare function defineConnectWunderNavigation(tagName?: string): CustomElementConstructor;
declare global { interface HTMLElementTagNameMap { 'connectwunder-nav': ConnectWunderNavigationElement } }
