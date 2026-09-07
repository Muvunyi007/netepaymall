'use client';

import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { ProductCard } from '@/components/ProductCard';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const mockDeals = [
  {
    id: 'deal-1',
    name: 'Premium Product A',
    slug: 'premium-product-a',
    price: 15000,
    compare_price: 30000,
    images: [],
    is_featured: true,
  },
  {
    id: 'deal-2',
    name: 'Luxury Product B',
    slug: 'luxury-product-b',
    price: 25000,
    compare_price: 50000,
    images: [],
    is_featured: true,
  },
];

export default function DealsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await api.get('/api/v1/products/featured', { limit: 12 });
        setProducts(response.data || []);
      } catch (error) {
        console.error('Failed to load deals:', error);
        setProducts(mockDeals);
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
          <h1 className="font-display font-bold text-5xl mb-4 mt-8">
            HOT <span className="text-primary-500">DEALS</span>
          </h1>
          <p className="text-xl text-dark-300 mb-12">
            Exclusive discounts on premium products. Limited time offers!
          </p>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
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