import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useFocusTrap(containerRef, isOpen, onClose) {
  const previouslyFocused = useRef(null);
  const stableOnClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    previouslyFocused.current = document.activeElement;

    const getFocusable = () =>
      Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR));

    // Focus first focusable element after a microtask to let React render
    const rafId = requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        stableOnClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const elements = getFocusable();
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, stableOnClose, containerRef]);
}
