'use client';

import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { Mail, MapPin, Phone, MessageCircle, Clock } from 'lucide-react';

const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+250XXXXXXXXX';
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '250XXXXXXXXX';
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com';

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-5xl mb-8 mt-8 text-center">
            CONTACT <span className="text-primary-500">US</span>
          </h1>
          <p className="text-xl text-dark-300 text-center mb-12 max-w-2xl mx-auto">
            Our dedicated support team is here to help you. Reach out anytime.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <a href={`tel:${supportPhone}`} className="card p-6 hover:border-primary-500/50 transition-colors">
              <Phone className="w-8 h-8 text-primary-500 mb-3" />
              <h3 className="font-semibold mb-1">Call Us</h3>
              <p className="text-dark-400 text-sm">{supportPhone}</p>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello, I need help.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 hover:border-green-500/50 transition-colors"
            >
              <MessageCircle className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="font-semibold mb-1">WhatsApp</h3>
              <p className="text-dark-400 text-sm">Chat with support</p>
            </a>
            <a href={`mailto:${supportEmail}`} className="card p-6 hover:border-blue-500/50 transition-colors">
              <Mail className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-dark-400 text-sm">{supportEmail}</p>
            </a>
            <div className="card p-6">
              <Clock className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="font-semibold mb-1">Business Hours</h3>
              <p className="text-dark-400 text-sm">Mon - Sat: 8AM - 8PM</p>
            </div>
          </div>

          <div className="card p-8 max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-2xl mb-6">Send us a message</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Message sent! We will get back to you shortly.');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-dark-400 mb-1">Name</label>
                <input type="text" required className="input" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Email</label>
                <input type="email" required className="input" placeholder="you@email.com" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Subject</label>
                <input type="text" required className="input" placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">Message</label>
                <textarea required className="input min-h-[120px]" placeholder="Write your message..." />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
      <SupportWidget />
    </>
  );
}