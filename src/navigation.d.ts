export type NavigationSection = 'dashboards' | 'primary' | 'settings' | 'developers';
export type NavigationIcon = 'dashboard'|'inbox'|'todos'|'people'|'companies'|'events'|'boards'|'documents'|'app'|'team'|'settings'|'news'|'help'|'code'|'book'|'area'|'account'|'notifications'|'workspace'|'billing'|'integrations'|'api-key'|'automation'|'history';
export declare const navigationIcons: readonly NavigationIcon[];
export interface NavigationItem { id: string; label: string; href: string; current?: boolean; section?: NavigationSection; icon?: NavigationIcon }
export interface NavigationModel {
  workspaceName: string;
  homeHref: string;
  items: NavigationItem[];
  presentation?: 'sidebar' | 'list';
  locale?: 'de' | 'en';
  activeId?: string;
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
