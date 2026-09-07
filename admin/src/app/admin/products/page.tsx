'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import {
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Star,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  brand: '',
  category_id: '',
  description: '',
  short_description: '',
  tags: '',
  price: '',
  compare_price: '',
  cost_price: '',
  is_active: true,
  is_featured: false,
  track_inventory: true,
  quantity: 0,
  low_stock_threshold: 10,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({ total: 0, total_pages: 1, has_next: false, has_previous: false });
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [gallery, setGallery] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/products', {
        params: { page, limit: ITEMS_PER_PAGE },
      });
      setProducts(response.data.data || []);
      setMeta(response.data.meta || {});
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setGallery([]);
    setFeedback(null);
    setShowModal(true);
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      slug: product.slug || '',
      sku: product.sku || '',
      brand: product.brand || '',
      category_id: product.category_id || '',
      description: product.description || '',
      short_description: product.short_description || '',
      tags: product.tags || '',
      price: product.price ?? '',
      compare_price: product.compare_price ?? '',
      cost_price: product.cost_price ?? '',
      is_active: product.is_active ?? true,
      is_featured: product.is_featured ?? false,
      track_inventory: product.inventory?.track_inventory ?? true,
      quantity: product.inventory?.quantity ?? 0,
      low_stock_threshold: product.inventory?.low_stock_threshold ?? 10,
    });
    const images = [...(product.images || [])]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .map((img: any) => img.url);
    setGallery(images);
    setFeedback(null);
    setShowModal(true);
  };

  const handleNameChange = (value: string) => {
    setForm((f: any) => ({
      ...f,
      name: value,
      slug: editingProduct ? f.slug : slugify(value),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFeedback({ type: 'error', text: "Izina (name) ni amenyo" });
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setFeedback({ type: 'error', text: 'Shyiramo price >= 0' });
      return;
    }
    if (!form.category_id) {
      setFeedback({ type: 'error', text: 'Hitamo category' });
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      sku: form.sku || null,
      brand: form.brand || null,
      category_id: form.category_id,
      description: form.description || null,
      short_description: form.short_description || null,
      tags: form.tags || null,
      price: Number(form.price),
      compare_price: form.compare_price !== '' ? Number(form.compare_price) : null,
      cost_price: form.cost_price !== '' ? Number(form.cost_price) : null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      image_urls: gallery.filter((url) => url.trim() !== ''),
      inventory: {
        quantity: Number(form.quantity) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 10,
        track_inventory: form.track_inventory,
      },
    };

    setSaving(true);
    setFeedback(null);
    try {
      if (editingProduct) {
        await api.patch(`/api/v1/admin/products/${editingProduct.id}`, payload);
        setFeedback({ type: 'success', text: 'Product updated successfully' });
      } else {
        await api.post('/api/v1/admin/products', payload);
        setFeedback({ type: 'success', text: 'Product created successfully' });
      }
      setTimeout(() => {
        setShowModal(false);
        loadProducts();
        setSaving(false);
      }, 600);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      const detail = error?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail?.message || 'Guhara byaje mu nkiranga. Ongera ugerageze.';
      setFeedback({ type: 'error', text: msg });
      setSaving(false);
    }
  };

  const handleDelete = async (product: any) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.delete(`/api/v1/admin/products/${product.id}`);
      loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
    return matchesSearch && matchesStatus;
  });

  const lowStockOf = (product: any) => {
    const inv = product.inventory;
    if (!inv || !inv.track_inventory) return null;
    return inv;
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-bold text-3xl">PRODUCTS</h1>
          <p className="text-sm text-dark-400 mt-1">
            {meta.total || 0} product(s) — manage catalogue, pricing, images &amp; stock
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card mb-6 p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="search"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                statusFilter === value
                  ? 'bg-primary-500 text-black'
                  : 'bg-dark-800 text-dark-400 hover:text-white'
              }`}
            >
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card py-20 text-center text-dark-400">
          <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Nta products ushaka zibonetse.
          <div className="mt-4">
            <button onClick={openCreate} className="btn-secondary">
              Add your first product
            </button>
          </div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="border-b border-dark-800 text-left text-xs uppercase tracking-wider text-dark-400">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: any) => {
                const inv = lowStockOf(product);
                return (
                  <tr key={product.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-dark-800 overflow-hidden flex-shrink-0 ring-1 ring-dark-700">
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-500">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{product.name}</p>
                            {product.is_featured && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-primary-500/15 text-primary-500">
                                <Star className="w-3 h-3" /> Featured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-dark-400">
                            {product.sku ? product.sku : product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 rounded bg-dark-800 text-xs">
                        {product.category?.name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-primary-500">
                        ₦{Number(product.price).toLocaleString()}
                      </p>
                      {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                        <p className="text-xs text-dark-400 line-through">
                          ₦{Number(product.compare_price).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {inv ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            inv.quantity <= inv.low_stock_threshold
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {inv.quantity} {inv.quantity <= inv.low_stock_threshold ? '(low)' : 'in stock'}
                        </span>
                      ) : (
                        <span className="text-xs text-dark-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 rounded-lg text-primary-500 hover:bg-primary-500/10 transition"
                          aria-label="Edit product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                          aria-label="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(meta.total_pages > 1 || filteredProducts.length === 0) && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-800">
              <p className="text-sm text-dark-400">
                Page {page} of {meta.total_pages || 1} · {meta.total || filteredProducts.length} products
              </p>
              <div className="flex gap-2">
                <button
                  disabled={!meta.has_previous}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 disabled:opacity-40 transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!meta.has_next}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 disabled:opacity-40 transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => !saving && setShowModal(false)} />
          <div className="relative card w-full max-w-4xl bg-dark-900 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-900 border-b border-dark-800 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-semibold text-xl">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="text-xs text-dark-400">Fill the fields, upload gallery images &amp; set price</p>
              </div>
              <button
                onClick={() => !saving && setShowModal(false)}
                className="p-2 rounded-lg hover:bg-dark-800 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-500 mb-3">
                Basic Info
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="input"
                    placeholder="e.g. Wireless Headphones Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                    className="input"
                    placeholder="auto-generated from name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input"
                    placeholder="e.g. WH-1000XM5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="input"
                    placeholder="e.g. Sony"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Category *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="input"
                  >
                    <option value="">— Hitamo category —</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Tags</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="input"
                    placeholder="comma separated"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-dark-400 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={form.short_description}
                    onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-dark-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input resize-none"
                  />
                </div>
              </div>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-500 mb-3">
                Pricing &amp; Inventory
              </h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Compare-at Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compare_price}
                    onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Cost Price (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Quantity in stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Low stock threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.track_inventory}
                      onChange={(e) => setForm({ ...form, track_inventory: e.target.checked })}
                      className="w-4 h-4 accent-[#FFD600]"
                    />
                    Track inventory
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mb-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#FFD600]"
                  />
                  Active (visible in store)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 accent-[#FFD600]"
                  />
                  Featured product
                </label>
              </div>

              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-500 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Gallery ({gallery.filter((u) => u.trim()).length})
              </h3>
              <div className="space-y-3 mb-2">
                {gallery.map((url, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-dark-800 ring-1 ring-dark-700 flex-shrink-0">
                      {url.trim() ? (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dark-500">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const next = [...gallery];
                        next[index] = e.target.value;
                        setGallery(next);
                      }}
                      className="input flex-1"
                      placeholder="https://.../image.jpg"
                    />
                    {index === 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-primary-500/15 text-primary-500 whitespace-nowrap">
                        <Star className="w-3 h-3" /> Cover
                      </span>
                    )}
                    <button
                      onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setGallery([...gallery, ''])}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> Add image URL
              </button>
              <p className="text-xs text-dark-500 mt-2">
                The first image is the cover. You can paste image URLs or use hosted images (Cloudinary, etc.).
              </p>

              {feedback && (
                <div
                  className={`mt-6 flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
                    feedback.type === 'success'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  {feedback.text}
                </div>
              )}

              <div className="flex gap-4 mt-6 justify-end border-t border-dark-800 pt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}