'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compare_price?: number;
    short_description?: string;
    images: { url: string; alt_text?: string }[];
    is_featured?: boolean;
    rating?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem, loadWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isHovered, setIsHovered] = useState(false);
  const [adding, setAdding] = useState(false);

  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const inWishlist = isInWishlist(product.id);

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await addItem(product.id);
      toast.success('Added to cart');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add items to your wishlist');
      return;
    }

    try {
      await toggleItem(product.id);
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update wishlist');
    }
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="product-card block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-dark-800">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-primary-500 text-dark-950 text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            inWishlist
              ? 'bg-primary-500 text-dark-950'
              : 'bg-black/60 backdrop-blur hover:bg-primary-500 hover:text-dark-950'
          }`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
        {product.rating ? (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-primary-500 font-semibold text-xs">
              ★ {Number(product.rating).toFixed(1)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <div>
            {product.compare_price && (
              <span className="text-dark-500 text-sm line-through mr-2">
                ₦{Number(product.compare_price).toLocaleString()}
              </span>
            )}
            <span className="text-primary-500 font-bold">
              ₦{Number(product.price).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            disabled={adding}
            onClick={handleAddToCart}
            className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-primary-500 hover:text-dark-950 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}