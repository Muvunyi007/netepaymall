'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Plus, Search, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
    sku: '',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/admin/products');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        await api.patch(`/api/v1/admin/products/${editingProduct.id}`, form);
      } else {
        await api.post('/api/v1/admin/products', form);
      }
      setShowModal(false);
      setEditingProduct(null);
      setForm({ name: '', price: '', sku: '', category_id: '', is_active: true });
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-3xl">PRODUCTS</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setForm({ name: '', price: '', sku: '', category_id: '', is_active: true });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-dark-800 text-left text-sm text-dark-400">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: any) => (
                <tr key={product.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-800 overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-dark-400">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{product.sku || '-'}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-primary-500">
                    ₦{Number(product.price).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setForm({
                            name: product.name,
                            price: product.price,
                            sku: product.sku || '',
                            category_id: product.category_id,
                            is_active: product.is_active,
                          });
                          setShowModal(true);
                        }}
                        className="text-primary-500 hover:text-primary-400"
                        aria-label="Edit product"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this product?')) {
                            try {
                              await api.delete(`/api/v1/admin/products/${product.id}`);
                              loadProducts();
                            } catch (error) {
                              console.error(error);
                            }
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative card w-full max-w-2xl bg-dark-900">
            <h2 className="font-semibold text-xl mb-6">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Price</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Active</label>
                <select
                  value={form.is_active ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                  className="input"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary">
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}