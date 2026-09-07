import { create } from 'zustand';
import { api } from '@/lib/api';

export interface WishlistItem {
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

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  loadWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  itemCount: number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,
  itemCount: 0,

  addItem: async (productId: string) => {
    try {
      await api.post('/api/v1/wishlist/items', { product_id: productId });
      await get().loadWishlist();
    } catch (error) {
      throw error;
    }
  },

  removeItem: async (productId: string) => {
    try {
      await api.delete(`/api/v1/wishlist/items/${productId}`);
      await get().loadWishlist();
    } catch (error) {
      throw error;
    }
  },

  toggleItem: async (productId: string) => {
    const { isInWishlist } = get();
    if (isInWishlist(productId)) {
      await get().removeItem(productId);
    } else {
      await get().addItem(productId);
    }
  },

  loadWishlist: async () => {
    try {
      const response = await api.get('/api/v1/wishlist');
      const items = response.data?.items || [];
      set({ items, itemCount: items.length });
    } catch {
      set({ items: [], itemCount: 0 });
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some((item) => item.product_id === productId);
  },
}));