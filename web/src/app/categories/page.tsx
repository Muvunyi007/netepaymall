'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/api/v1/categories');
        setCategories(response.data || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-4xl mb-8 mt-8">
            SHOP BY <span className="text-primary-500">CATEGORY</span>
          </h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl mb-4">No categories yet</p>
              <p className="text-dark-400 mb-8">Check back soon for our curated collection</p>
              <a href="/shop" className="btn-primary">Browse All Products</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="card p-6 group hover:border-primary-500/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                    <span className="text-primary-500 font-bold text-2xl">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary-500 transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-dark-400 line-clamp-2">{category.description}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}