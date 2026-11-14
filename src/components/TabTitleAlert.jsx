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

    // Aggressively suppress Netlify badge and any container linking to netlify.com
    const purgeNetlify = () => {
      document.querySelectorAll('netlify-badge, netlify-drawer, [data-netlify-badge], [data-netlify-drawer], #netlify-drawer, .netlify-badge, iframe[src*="netlify"], div[id*="netlify"], div[class*="netlify"]').forEach(el => el.remove());
      document.querySelectorAll('a[href*="netlify.com"], a[href*="netlify.app"]').forEach(a => {
        const fixedContainer = a.closest('div[style*="fixed"], div[style*="position"], netlify-badge') || a;
        fixedContainer.style.setProperty('display', 'none', 'important');
        fixedContainer.remove();
      });
      document.querySelectorAll('div, aside, span, a').forEach(el => {
        if (el.textContent && el.textContent.includes('Powered by Netlify')) {
          const wrapper = el.closest('div[style*="fixed"], div[style*="absolute"]') || el;
          wrapper.style.setProperty('display', 'none', 'important');
          wrapper.remove();
        }
      });
    };
    purgeNetlify();
    const observer = new MutationObserver(purgeNetlify);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return null;
}

