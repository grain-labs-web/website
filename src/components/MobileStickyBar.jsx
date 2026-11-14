'use client';
import { useEffect, useState } from 'react';

export default function MobileStickyBar({ onShop, hidden }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show once the user scrolls down past the main hero action area
      const shouldShow = window.scrollY > 380;
      setVisible(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (hidden || !visible) return null;

  return (
    <aside className="mobile-sticky-bar" aria-label="Quick order">
      <div className="mobile-sticky-content">
        <div className="mobile-sticky-info">
          <span className="mobile-sticky-badge" aria-hidden="true">🥣</span>
          <div>
            <strong>Women’s Oats</strong>
            <small>₹299 · Free Delivery</small>
          </div>
        </div>
        <button
          className="button mobile-sticky-cta"
          onClick={onShop}
          aria-label="Order Women's Oats for 299 rupees"
        >
          Buy Now <span aria-hidden="true">↗</span>
        </button>
      </div>
    </aside>
  );
}
