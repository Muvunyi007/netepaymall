import './globals.css';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'E-Commerce Admin Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">{children}</body>
    </html>
  );
}