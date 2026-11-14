import './globals.css';
import TabTitleAlert from '../components/TabTitleAlert';

const siteUrl = process.env.PUBLIC_ORIGIN || process.env.URL || 'https://grainlabs.netlify.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Grain Labs — Your morning, your way',
  description: "Chocolate for breakfast? Absolutely. Meet Grain Labs Women's Oats and make a breakfast that's all yours.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "Grain Labs — Women's Oats",
    description: "Chocolate for breakfast? Absolutely. Meet Grain Labs Women's Oats and make a breakfast that's all yours.",
    url: '/',
    siteName: 'Grain Labs',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Grain Labs Women's Oats — Chocolate for breakfast? Absolutely.",
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Grain Labs — Women's Oats",
    description: "Chocolate for breakfast? Absolutely. Meet Grain Labs Women's Oats and make a breakfast that's all yours.",
    images: ['/og-image.jpg'],
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
