import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-black text-center px-4">
        <div>
          <p className="font-display font-extrabold text-9xl text-primary-500">404</p>
          <h1 className="font-display font-bold text-4xl mb-4 mt-4">Page Not Found</h1>
          <p className="text-dark-400 mb-8 max-w-md mx-auto">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn-primary">Back to Home</Link>
            <Link href="/shop" className="btn-secondary">Shop Products</Link>
          </div>
        </div>
      </main>
      <SupportWidget />
    </>
  );
}