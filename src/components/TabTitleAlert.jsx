'use client';
import { useEffect } from 'react';

const AWAY_TITLE = '🥣 Oats are waiting for you! • Grain Labs';

export default function TabTitleAlert() {
  useEffect(() => {
    let cachedTitle = document.title || 'Grain Labs — Your morning, your way';

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (document.title !== AWAY_TITLE) {
          cachedTitle = document.title;
        }
        document.title = AWAY_TITLE;
      } else {
        document.title = cachedTitle;
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}

