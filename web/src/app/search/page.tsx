'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Search, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  images: { url: string; alt_text?: string }[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get('/api/v1/products/search', { q: debouncedQuery });
        setProducts(response.data || []);
      } catch (error) {
        console.error('Search failed:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-4xl mb-8 mt-8">
            SEARCH <span className="text-primary-500">RESULTS</span>
          </h1>

          <div className="relative max-w-2xl mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="input pl-10"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <>
              <p className="text-dark-400 mb-6">
                {products.length} result{products.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : debouncedQuery ? (
            <div className="text-center py-20">
              <p className="text-2xl mb-4">No results for &quot;{debouncedQuery}&quot;</p>
              <p className="text-dark-400">Try different keywords or browse all products</p>
            </div>
          ) : null}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}