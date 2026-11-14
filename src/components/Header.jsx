'use client';
import BrandLogo from './BrandLogo';
export default function Header({onShop, active}) { return (<header className="header store-header">
<a className="wordmark" href="#" aria-label="Grain Labs home"><BrandLogo /></a>
<nav aria-label="Main navigation"><a href="#the-oats" aria-current={active === "the-oats" ? "location" : undefined}>Our oats</a><a className="nav-create" href="#make-my-oats" aria-current={active === "make-my-oats" ? "location" : undefined}><span aria-hidden="true">✳</span> Make my oats</a><a href="#our-story" aria-current={active === "our-story" ? "location" : undefined}>Our story</a></nav>
<button className="header-shop" onClick={onShop}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z M8 8V6a4 4 0 0 1 8 0v2"></path></svg><span>Shop oats</span></button>
</header>); }
