'use client';
import PackViewer from './PackViewer';
export default function Hero({quantity,change,onShop,onCheckout}) { return (<section className="hero" id="the-oats">
<div className="hero-copy">
<p className="eyebrow"><span aria-hidden="true">✳</span> WOMEN’S OATS. YOUR KIND OF MORNING.</p>
<h1>Breakfast.<br />But make<br />it <span>yours.</span></h1>
<p className="intro">Chocolatey oats for your beautifully busy life.<br />Dress them up. Keep them simple. Do you.</p>
<div className="hero-actions"><button className="button" onClick={onShop}>Buy chocolate oats <span aria-hidden="true">↗</span></button><a className="text-link" href="#make-my-oats">Make my breakfast ↓</a></div>
<div className="hero-tags"><span>Rich chocolate</span><span>70 g pack</span><span>Made for your morning</span></div>
</div>
<div className="hero-art">
<span className="hero-doodle" aria-hidden="true">✳</span><span className="hero-sticker">YES,<br />CHOCOLATE<br />FOR BREAKFAST.</span>
<span className="scene-note" aria-hidden="true">your new morning crush.</span>
<PackViewer onSelect={onShop} />

<div className="hero-purchase"><div className="hero-product"><div><p className="eyebrow">THE CHOCOLATE ORIGINAL</p><h2>Women’s Oats</h2><p>Rich chocolate · 70 g pack</p></div><button className="hero-more" aria-label="View product pictures and details" onClick={onShop}>Details <span aria-hidden="true">↗</span></button></div><div className="hero-buy-row"><div className="quantity" role="group" aria-label="Number of packs"><button id="hero-minus" aria-label="Remove one pack" onClick={() => change(-1)} disabled={quantity <= 1}>−</button><output id="hero-quantity" aria-label="Packs" aria-live="polite">{quantity}</output><button id="hero-plus" aria-label="Add one pack" onClick={() => change(1)} disabled={quantity >= 20}>+</button></div><div className="hero-price"><strong id="hero-total">₹{299 * quantity}</strong><span>Free delivery</span></div><button id="hero-checkout" className="button" onClick={() => onCheckout()}>Checkout <span aria-hidden="true">↗</span></button></div><p className="hero-price-note">₹299 per 70 g pack · free delivery</p></div>
</div>
</section>); }
