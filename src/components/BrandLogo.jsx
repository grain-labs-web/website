'use client';
import { useId } from 'react';

export default function BrandLogo() {
  const id = useId();
  return <svg className="brand-logo" viewBox="125 220 326 60" aria-hidden="true">
    <defs><filter id={id} colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" x="125" y="220" width="326" height="60"><feColorMatrix type="matrix" values="0 0 0 0 .678 0 0 0 0 .09 0 0 0 0 .369 0 -2 0 0 1.5" /></filter></defs>
    <image href="/assets/packaging-alternate.png" width="578" height="1280" filter={`url(#${id})`} />
  </svg>;
}
