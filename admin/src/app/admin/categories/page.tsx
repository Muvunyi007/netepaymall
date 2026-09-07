'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/v1/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', parent_id: '' });
    setShowForm(true);
  };

  const openEdit = (category: any) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
      };
      if (form.parent_id) payload.parent_id = form.parent_id;
      if (editing) {
        await api.patch(`/api/v1/categories/${editing.id}`, payload);
      } else {
        await api.post('/api/v1/categories', payload);
      }
      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (category: any) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await api.delete(`/api/v1/categories/${category.id}`);
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-3xl">CATEGORIES</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-dark-800 text-left text-sm text-dark-400">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category: any) => (
                <tr key={category.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                  <td className="py-3 px-4 font-medium text-primary-500">{category.name}</td>
                  <td className="py-3 px-4 text-sm">{category.slug}</td>
                  <td className="py-3 px-4 text-sm text-dark-400">{category.description || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(category)}
                        className="p-2 rounded-lg border border-dark-700 hover:border-primary-500 transition-colors"
                        aria-label="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-dark-400">
                    No categories yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowForm(false)} />
          <div className="relative card w-full max-w-md">
            <h2 className="font-bold text-xl mb-4">
              {editing ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Electronics"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Category description"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}