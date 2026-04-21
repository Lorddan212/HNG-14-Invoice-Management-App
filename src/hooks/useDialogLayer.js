import { useEffect } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(focusableSelector)).filter(
    (element) => {
      return (
        element instanceof HTMLElement &&
        !element.hasAttribute('hidden') &&
        element.getClientRects().length > 0
      );
    },
  );
}

export function useDialogLayer(containerRef, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return undefined;
    }

    const container = containerRef.current;
    const previousActiveElement = document.activeElement;
    const { overflow } = document.body.style;

    document.body.style.overflow = 'hidden';

    const frame = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableElements(container);
      const initialFocusTarget = focusableElements[0] ?? container;
      initialFocusTarget.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(container);

      if (!focusableElements.length) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKeyDown);

      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [containerRef, isOpen, onClose]);
}
