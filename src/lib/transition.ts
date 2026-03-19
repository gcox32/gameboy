export type TransitionDir = 'up' | 'down';

type VT = { finished: Promise<void> };
type DocWithVT = Document & { startViewTransition: (cb: () => void) => VT };

export function navigateWithTransition(
  push: (href: string) => void,
  href: string,
  dir: TransitionDir,
) {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) {
    push(href);
    return;
  }

  // Inject a <style> overriding the default (up) animations for the down direction.
  // We do this instead of a data-attribute selector because the browser evaluates
  // view-transition CSS before attribute mutations trigger a style recalculation.
  let injected: HTMLStyleElement | null = null;
  if (dir === 'down') {
    injected = document.createElement('style');
    injected.textContent = `
      ::view-transition-old(root) { animation: page-slide-down-out 1500ms cubic-bezier(0.4, 0, 0.2, 1) both; }
      ::view-transition-new(root) { animation: page-slide-down-in 1500ms cubic-bezier(0.4, 0, 0.2, 1) both; }
    `;
    document.head.appendChild(injected);
  }

  const t = (document as DocWithVT).startViewTransition(() => push(href));
  t.finished.finally(() => injected?.remove());
}
