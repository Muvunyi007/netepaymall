'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Heart } from 'lucide-react';

interface WishlistItem {
  id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    compare_price?: number;
    images: { url: string; alt_text?: string }[];
  };
}

export default function WishlistPage() {
  const { items, isLoading, loadWishlist, removeItem } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    }
  }, [isAuthenticated, loadWishlist]);

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-32 pb-16 text-center px-4">
          <Heart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-3xl mb-2">Login to view your wishlist</h1>
          <p className="text-dark-400 mb-8">Sign in to see your saved items</p>
          <a href="/login" className="btn-primary">Login</a>
        </div>
        <SupportWidget />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-4xl mb-8 mt-8">
            MY <span className="text-primary-500">WISHLIST</span>
          </h1>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl mb-2">Your wishlist is empty</h2>
              <p className="text-dark-400 mb-8">Save products you love</p>
              <a href="/shop" className="btn-primary">Browse Products</a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item: any) => (
                <div key={item.id} className="product-card block">
                  <a href={`/product/${item.product.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-dark-800">
                      {item.product.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-primary-500 font-bold text-lg">
                          ₦{Number(item.product.price).toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeItem(item.product_id);
                          }}
                          className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SupportWidget />
    </>
  );
}