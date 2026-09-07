'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { Loader2, Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/api/v1/admin/settings');
      setSettings(response.data.data || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/v1/admin/settings', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const settingGroups = [
    {
      label: 'Business Information',
      keys: ['business_name', 'logo_url', 'support_email', 'business_hours', 'address'],
    },
    {
      label: 'Contact Configuration',
      keys: ['support_phone', 'whatsapp_number', 'default_whatsapp_message'],
    },
    {
      label: 'Finance',
      keys: ['currency', 'tax_rate', 'default_delivery_fee'],
    },
  ];

  return (
    <AdminLayout>
      <h1 className="font-bold text-3xl mb-8">SYSTEM SETTINGS</h1>

      <div className="space-y-8 max-w-2xl">
        <div className="card p-4">
          <h2 className="font-semibold mb-3 text-primary-500">WhatsApp Support</h2>
          <div className="mb-4">
            <label className="block text-sm text-dark-400 mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={settings.whatsapp_number || ''}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              className="input"
              placeholder="+250XXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Default WhatsApp Message</label>
            <textarea
              value={settings.default_whatsapp_message || ''}
              onChange={(e) => handleChange('default_whatsapp_message', e.target.value)}
              className="input min-h-[80px]"
              placeholder="Hello, I need help with my order..."
            />
          </div>
        </div>

        {settingGroups.map((group) => (
          <div key={group.label} className="card">
            <h2 className="font-semibold mb-4">{group.label}</h2>
            <div className="space-y-4">
              {group.keys.map((key) => (
                <div key={key}>
                  <label className="block text-sm text-dark-400 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={settings[key] || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save All Settings
        </button>
      </div>
    </AdminLayout>
  );
}