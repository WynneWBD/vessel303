'use client';

import { useEffect } from 'react';

export default function ImageProtection() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        e.preventDefault();
      }
    };
    const dragHandler = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'IMG') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handler);
    document.addEventListener('dragstart', dragHandler);
    return () => {
      document.removeEventListener('contextmenu', handler);
      document.removeEventListener('dragstart', dragHandler);
    };
  }, []);

  return null;
}
