import './globals.css';

export const metadata = {
  title: 'Grain Labs — Your morning, your way',
  description: "Chocolate for breakfast? Absolutely. Meet Grain Labs Women's Oats and make a breakfast that's all yours.",
};
export const viewport = { themeColor: '#ad175e' };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
