import { h } from './dom';
import type { Ctx } from './ctx';
import { connectionSection } from './connectionSection';
import { dataSection } from './dataSection';

export function settingsView(ctx: Ctx): HTMLElement {
  return h('section', null, h('h2', null, 'Settings'), connectionSection(ctx), dataSection(ctx));
}
