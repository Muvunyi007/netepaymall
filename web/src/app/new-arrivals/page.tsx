'use client';

import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { ProductCard } from '@/components/ProductCard';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get('/api/v1/products/new', { limit: 24 });
        setProducts(response.data || []);
      } catch (error) {
        console.error('Failed to load new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4 mt-8">
            <Sparkles className="w-8 h-8 text-primary-500" />
            <h1 className="font-display font-bold text-5xl">
              NEW <span className="text-primary-500">ARRIVALS</span>
            </h1>
          </div>
          <p className="text-xl text-dark-300 mb-12">
            Fresh from our collection - be the first to discover.
          </p>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl mb-4">New products coming soon</p>
              <p className="text-dark-400 mb-8">Check back for the latest additions</p>
              <a href="/shop" className="btn-primary">Browse Shop</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}