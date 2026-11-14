'use client';
import { useEffect } from 'react';

export function useModal(ref, open) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement;
    if (open && !dialog.open) { dialog.showModal(); dialog.scrollTop = 0; }
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
      if (open && previous?.isConnected) previous.focus?.({ preventScroll: true });
    };
  }, [open, ref]);
}
export function backdropClose(event, close) {
  const dialog = event.currentTarget, rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
}
