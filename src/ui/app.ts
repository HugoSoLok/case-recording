import { h } from './dom';
import type { Ctx, Deps, Route } from './ctx';
import { casesView } from './casesView';
import { caseView } from './caseView';
import { inputsView } from './inputsView';
import { settingsView } from './settingsView';

export function mountApp(root: HTMLElement, deps: Deps, initial: Route = { name: 'cases' }): void {
  let route: Route = initial;

  const ctx: Ctx = {
    deps,
    navigate(r) {
      route = r;
      render();
    },
    rerender: () => render(),
  };

  const view = (): HTMLElement => {
    switch (route.name) {
      case 'cases':
        return casesView(ctx);
      case 'case':
        return caseView(ctx, route.id);
      case 'inputs':
        return inputsView(ctx);
      case 'settings':
        return settingsView(ctx);
    }
  };

  const navButton = (label: string, target: Route['name'], to: Route) =>
    h('button', {
      type: 'button',
      textContent: label,
      className: route.name === target || (target === 'cases' && route.name === 'case') ? 'nav active' : 'nav',
      onclick: () => ctx.navigate(to),
    });

  function render() {
    root.replaceChildren(
      h(
        'header',
        null,
        h('h1', null, 'Case Recording'),
        h(
          'nav',
          null,
          navButton('Cases', 'cases', { name: 'cases' }),
          navButton('Template & rules', 'inputs', { name: 'inputs' }),
          navButton('Settings', 'settings', { name: 'settings' }),
        ),
      ),
      h('main', null, view()),
    );
  }

  render();
}
