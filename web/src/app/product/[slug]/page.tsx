'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';
import {
  Heart,
  ShoppingCart,
  Share2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Phone,
  MessageCircle,
  Star,
  Minus,
  Plus,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  images: { url: string; alt_text?: string }[];
  variants: { id: string; name: string; price?: number; options?: string }[];
  rating?: number;
  reviews_count?: number;
  stock_status?: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  is_verified?: boolean;
  created_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const { addItem } = useCartStore();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/v1/products/by-slug/${params.slug}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.slug]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!product?.id) return;
      try {
        const response = await api.get(`/api/v1/products/${product.id}/reviews`);
        setReviews(response.data?.reviews || []);
      } catch {
        setReviews([]);
      }
    };
    loadReviews();
  }, [product?.id]);

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = async () => {
    if (!product) return;

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

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addItem(product.id, selectedVariant || undefined, quantity);
      setAddedToCart(true);
      toast.success('Added to cart!');
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    try {
      await addItem(product.id, selectedVariant || undefined, quantity);
      toast.success('Proceeding to checkout...');
      window.location.href = '/checkout';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to proceed');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: `Check out ${product?.name} on our store!`,
        url: window.location.href,
      });
    } catch {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20 bg-black text-center px-4">
          <div>
            <AlertCircle className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h1 className="font-display font-bold text-3xl mb-2">Product Not Found</h1>
            <p className="text-dark-400 mb-8">This product may have been removed or is no longer available.</p>
            <a href="/shop" className="btn-primary">Continue Shopping</a>
          </div>
        </div>
        <SupportWidget />
      </>
    );
  }

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const activePrice = selectedVariant
    ? product.variants.find((v) => v.id === selectedVariant)?.price
    : product.price;

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+250XXXXXXXXX';
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250XXXXXXXXX';

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="aspect-square rounded-2xl bg-dark-800 overflow-hidden relative mb-4">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]?.url}
                    alt={product.images[selectedImage]?.alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-dark-400">No image available</span>
                  </div>
                )}
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-primary-500 text-dark-950 font-bold px-3 py-1 rounded">
                    -{discount}%
                  </span>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-primary-500'
                          : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={image.url} alt={image.alt_text} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <nav className="text-sm text-dark-400 mb-6">
                <a href="/shop" className="hover:text-primary-500">Shop</a>
                <span className="mx-2">/</span>
                <span className="text-white">{product.name}</span>
              </nav>

              <h1 className="font-display font-bold text-4xl mb-4">{product.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(product.rating || 0)
                          ? 'fill-primary-500 text-primary-500'
                          : 'text-dark-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-dark-400">
                  {product.rating || 'No'} ratings
                </span>
              </div>

              {product.short_description && (
                <p className="text-dark-300 mb-6">{product.short_description}</p>
              )}

              <div className="flex items-center gap-4 mb-8">
                {product.compare_price && (
                  <span className="text-2xl text-dark-400 line-through">
                    ₦{Number(product.compare_price).toLocaleString()}
                  </span>
                )}
                <span className="text-4xl font-bold text-primary-500">
                  ₦{Number(activePrice || product.price).toLocaleString()}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
                  product.stock_status === 'out_of_stock'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  <Check className="w-4 h-4" /> {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                </span>
              </div>

              {product.variants.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-3">Variants</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedVariant === variant.id
                            ? 'bg-primary-500 text-dark-950 border-primary-500'
                            : 'border-dark-700 hover:border-primary-500'
                        }`}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3 border border-dark-700 rounded-lg px-4 py-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-dark-400 hover:text-white"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-dark-400 hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={handleAddToCart}
                  className="btn-primary flex items-center gap-2 flex-1 min-w-[200px]"
                >
                  {addedToCart ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {addedToCart ? 'Added!' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="btn-secondary flex-1 min-w-[150px]"
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  className={`btn-ghost border rounded-lg px-4 ${
                    inWishlist
                      ? 'border-primary-500 text-primary-500'
                      : 'border-dark-700'
                  }`}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-primary-500 text-primary-500' : ''}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="btn-ghost border border-dark-700 rounded-lg px-4"
                  aria-label="Share product"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card p-4">
                  <Truck className="w-6 h-6 text-primary-500 mb-2" />
                  <p className="font-semibold text-sm">Fast Delivery</p>
                  <p className="text-xs text-dark-400">1-3 business days</p>
                </div>
                <div className="card p-4">
                  <RotateCcw className="w-6 h-6 text-primary-500 mb-2" />
                  <p className="font-semibold text-sm">Easy Returns</p>
                  <p className="text-xs text-dark-400">7-day return policy</p>
                </div>
                <div className="card p-4">
                  <ShieldCheck className="w-6 h-6 text-primary-500 mb-2" />
                  <p className="font-semibold text-sm">Secure Payment</p>
                  <p className="text-xs text-dark-400">Bank-level security</p>
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href={`tel:${supportPhone}`}
                  className="btn-secondary flex items-center gap-2 flex-1"
                >
                  <Phone className="w-5 h-5" /> Call Us
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I'm interested in ${product.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </a>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="mt-16 card p-8">
              <h2 className="font-display font-bold text-2xl mb-4">Description</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-dark-300 leading-relaxed">{product.description}</p>
              </div>
            </div>
          )}

          <div className="mt-16">
            <h2 className="font-display font-bold text-2xl mb-8">
              Customer <span className="text-primary-500">Reviews</span>
            </h2>

            {reviews.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-dark-400 mb-4">No reviews yet. Be the first to review this product!</p>
                {isAuthenticated && (
                  <a href={`/account/orders`} className="btn-secondary text-sm">
                    Write a review after purchase
                  </a>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="card p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center font-bold text-primary-500">
                        {review.user.first_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold">{review.user.first_name} {review.user.last_name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating
                                    ? 'fill-primary-500 text-primary-500'
                                    : 'text-dark-600'
                                }`}
                              />
                            ))}
                          </div>
                          {review.is_verified && (
                            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-dark-300">{review.comment}</p>}
                    <p className="text-xs text-dark-500 mt-3">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <SupportWidget />
    </>
  );
}