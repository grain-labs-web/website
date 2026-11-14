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

    // Suppress Netlify badge / drawer in client DOM
    const removeBadge = () => {
      document.querySelectorAll('netlify-badge, [data-netlify-badge], #netlify-drawer, [data-netlify-drawer], .netlify-badge').forEach(el => el.remove());
    };
    removeBadge();
    const observer = new MutationObserver(removeBadge);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return null;
}

