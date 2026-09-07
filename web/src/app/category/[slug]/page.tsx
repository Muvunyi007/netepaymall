'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at:desc');

  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/v1/categories/${params.slug}`);
        setCategory(response.data);
      } catch (error) {
        console.error('Failed to load category:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [params.slug]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!category) return;
      try {
        const sortParts = sortBy.split(':');
        const response = await api.get('/api/v1/products', {
          category_id: category.id,
          sort_by: sortParts[0],
          sort_order: sortParts[1],
        });
        setProducts(response.data || []);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };

    loadProducts();
  }, [category, sortBy]);

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
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-dark-400 mb-4 mt-8">
            <a href="/categories" className="hover:text-primary-500">Categories</a>
            <span className="mx-2">/</span>
            <span className="text-white">{category?.name}</span>
          </nav>

          <h1 className="font-display font-bold text-4xl mb-4">{category?.name}</h1>
          {category?.description && (
            <p className="text-dark-300 mb-8 max-w-2xl">{category.description}</p>
          )}

          <div className="flex justify-end mb-8">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input w-auto"
              aria-label="Sort products"
            >
              <option value="created_at:desc">Newest</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="name:asc">Name: A-Z</option>
            </select>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl mb-4">No products in this category yet</p>
              <p className="text-dark-400 mb-8">Check back soon!</p>
              <a href="/shop" className="btn-primary">Browse All Products</a>
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}