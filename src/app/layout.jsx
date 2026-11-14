import './globals.css';
import TabTitleAlert from '../components/TabTitleAlert';

export const metadata = {
  title: 'Grain Labs — Your morning, your way',
  description: "Chocolate for breakfast? Absolutely. Meet Grain Labs Women's Oats and make a breakfast that's all yours.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};
export const viewport = { themeColor: '#ad175e' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TabTitleAlert />
        {children}
      </body>
    </html>
  );
}
