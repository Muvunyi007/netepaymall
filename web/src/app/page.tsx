'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { SupportWidget } from '@/components/SupportWidget';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  short_description?: string;
  images: { url: string; alt_text?: string }[];
  is_featured?: boolean;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [featured, latest, cats] = await Promise.all([
          api.get('/api/v1/products/featured', { limit: 8 }),
          api.get('/api/v1/products/new', { limit: 8 }),
          api.get('/api/v1/categories'),
        ]);

        setFeaturedProducts(featured.data || []);
        setNewProducts(latest.data || []);
        setCategories(cats.data || []);
      } catch (error) {
        console.error('Failed to load home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />

        <section className="py-16 bg-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display font-bold text-3xl">
                FEATURED <span className="text-primary-500">PRODUCTS</span>
              </h2>
            </div>
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-dark-400 text-center py-12">
                Featured products are being added. Check back soon!
              </p>
            )}
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-dark-950 to-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display font-bold text-3xl mb-8">
              NEW <span className="text-primary-500">ARRIVALS</span>
            </h2>
            {newProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-dark-400 text-center py-12">
                New products arriving soon!
              </p>
            )}
          </div>
        </section>

        {categories.length > 0 && (
          <section className="py-16 bg-black">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-display font-bold text-3xl mb-8">
                SHOP BY <span className="text-primary-500">CATEGORY</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="block card p-6 hover:border-primary-500/50 transition-colors"
                  >
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-dark-400 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 bg-gradient-to-r from-dark-950 via-black to-dark-950 border-t border-dark-800">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="font-display font-bold text-4xl mb-4">
              READY TO <span className="text-primary-500">SHOP?</span>
            </h2>
            <p className="text-xl text-dark-300 mb-8">
              Join thousands of satisfied customers
            </p>
            <a href="/shop" className="btn-primary">
              Start Shopping
            </a>
          </div>
        </section>
      </main>
      <SupportWidget />
    </>
  );
}