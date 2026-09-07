'use client';

import { Phone, MessageCircle, Mail, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+250XXXXXXXXX';
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250XXXXXXXXX';

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 glass rounded-xl p-4 shadow-2xl animate-slide-up border border-dark-800">
          <h3 className="font-semibold mb-4 text-white">Need Help?</h3>
          <div className="space-y-3">
            <a
              href={`tel:${supportPhone}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <Phone className="w-5 h-5 text-primary-500" />
              <span className="text-sm">Call Support</span>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I need help with an order.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-green-800/20 hover:bg-green-800/40 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm">WhatsApp</span>
            </a>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com'}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <Mail className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Email</span>
            </a>
            <a
              href="/contact"
              className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <span className="text-sm">Help Center</span>
            </a>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary-500 glow flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Support"
      >
        <Phone className="w-6 h-6 text-dark-950" />
      </button>
    </div>
  );
}