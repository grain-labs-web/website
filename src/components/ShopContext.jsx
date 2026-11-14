'use client';
import { createContext, useContext } from 'react';

export const ShopContext = createContext(() => {});
export function ShopButton({ children, ...props }) {
  const openShop = useContext(ShopContext);
  return <button {...props} onClick={openShop}>{children}</button>;
}
