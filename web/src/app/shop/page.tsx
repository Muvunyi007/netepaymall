'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  images: { url: string; alt_text?: string }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const sortOptions = [
  { value: 'created_at:desc', label: 'Newest' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'name:asc', label: 'Name: A-Z' },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [searchedQuery, setSearchedQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('created_at:desc');
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const debouncedQuery = useDebounce(searchedQuery, 500);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 12,
        sort_by: sortBy.split(':')[0],
        sort_order: sortBy.includes('asc') ? 'asc' : 'desc',
      };

      if (debouncedQuery) {
        params.search = debouncedQuery;
      }

      if (selectedCategory) {
        params.category_id = selectedCategory;
      }

      if (maxPrice < 1000000) {
        params.max_price = maxPrice;
      }

      const response = await api.get('/api/v1/products', params);
      setProducts(response.data || []);
      setTotalProducts(response.meta?.total || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, sortBy, selectedCategory, maxPrice]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/api/v1/categories');
        setCategories(response.data || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  const totalPages = Math.ceil(totalProducts / 12);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-4xl mb-8 mt-8">
            SHOP ALL <span className="text-primary-500">PRODUCTS</span>
          </h1>

          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="search"
                value={searchedQuery}
                onChange={(e) => {
                  setSearchedQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                className="input pl-10"
              />
              {searchedQuery && (
                <button
                  onClick={() => setSearchedQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="input w-auto"
              aria-label="Sort products"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-ghost flex items-center gap-2"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="card p-6 mb-8 animate-slide-down">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    !selectedCategory
                      ? 'bg-primary-500 text-dark-950 border-primary-500'
                      : 'border-dark-700 hover:border-primary-500'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-500 text-dark-950 border-primary-500'
                        : 'border-dark-700 hover:border-primary-500'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <h3 className="font-semibold mb-4">Max Price</h3>
              <div className="flex items-center gap-4 max-w-xs">
                <input
                  type="range"
                  min="0"
                  max="1000000"
                  step="10000"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    setPage(1);
                  }}
                  className="flex-1"
                />
                <span className="text-sm text-primary-500">
                  {maxPrice >= 1000000 ? 'Any' : `₦${maxPrice.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-2xl mb-4">No products found</p>
              <p className="text-dark-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-dark-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}