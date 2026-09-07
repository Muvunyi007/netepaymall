import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Premium E-Commerce Platform 2027',
  description: 'Premium products delivered directly to your door. Shop smart, live better.',
  keywords: ['ecommerce', 'online shopping', 'premium products', 'shop'],
  openGraph: {
    title: 'Premium E-Commerce Platform 2027',
    description: 'Premium products delivered directly to your door.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fff',
              border: '1px solid #27272a',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}