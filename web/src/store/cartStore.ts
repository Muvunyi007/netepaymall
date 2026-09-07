import { create } from 'zustand';
import { api } from '@/lib/api';

interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  saved_for_later: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    compare_price?: number;
    images: { url: string; alt_text?: string }[];
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  };
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  itemCount: number;
  isLoading: boolean;
  addItem: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  couponCode: null,
  subtotal: 0,
  discount: 0,
  deliveryFee: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
  isLoading: false,

  addItem: async (productId: string, variantId?: string, quantity: number = 1) => {
    set({ isLoading: true });
    try {
      await api.post('/api/v1/cart/items', {
        product_id: productId,
        variant_id: variantId,
        quantity,
      });
      await get().loadCart();
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      await api.patch(`/api/v1/cart/items/${itemId}`, { quantity });
      await get().loadCart();
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId: string) => {
    set({ isLoading: true });
    try {
      await api.delete(`/api/v1/cart/items/${itemId}`);
      await get().loadCart();
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await api.delete('/api/v1/cart');
      set({ items: [], couponCode: null, subtotal: 0, discount: 0, total: 0, itemCount: 0 });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadCart: async () => {
    try {
      const response = await api.get('/api/v1/cart');
      const data = response.data;
      const itemCount = (data.items || []).reduce(
        (sum: number, item: CartItem) => sum + (item.quantity || 1),
        0
      );
      set({
        items: data.items || [],
        couponCode: data.coupon_code,
        subtotal: data.subtotal,
        discount: data.discount,
        deliveryFee: data.delivery_fee,
        tax: data.tax,
        total: data.total,
        itemCount,
      });
    } catch {
      set({ items: [], itemCount: 0 });
    }
  },

  applyCoupon: async (code: string) => {
    try {
      await api.post('/api/v1/cart/apply-coupon', { code });
      await get().loadCart();
    } catch (error) {
      throw error;
    }
  },
}));