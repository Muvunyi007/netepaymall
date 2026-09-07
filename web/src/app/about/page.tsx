'use client';

import { Navbar } from '@/components/Navbar';
import { SupportWidget } from '@/components/SupportWidget';
import { ShieldCheck, Truck, RotateCcw, CreditCard, Star, Headphones, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display font-bold text-5xl mb-8 mt-8 text-center">
            ABOUT <span className="text-primary-500">US</span>
          </h1>
          <p className="text-xl text-dark-300 text-center mb-16 max-w-3xl mx-auto">
            We are a premium e-commerce platform delivering high-quality products
            directly to your door. Our mission is to make luxury shopping accessible.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="card p-8 text-center">
              <Award className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Premium Quality</h3>
              <p className="text-dark-400">
                We carefully curate every product to ensure the highest standards of quality.
              </p>
            </div>
            <div className="card p-8 text-center">
              <Star className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Customer First</h3>
              <p className="text-dark-400">
                Your satisfaction is our priority. We provide exceptional service at every step.
              </p>
            </div>
            <div className="card p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">Secure Shopping</h3>
              <p className="text-dark-400">
                Bank-level security ensures your transactions are always safe and protected.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="card p-8">
              <h3 className="font-bold text-2xl mb-4 text-primary-500">Our Promise</h3>
              <div className="space-y-4 text-dark-300">
                <div className="flex gap-3">
                  <Truck className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p>Fast, reliable delivery with real-time order tracking</p>
                </div>
                <div className="flex gap-3">
                  <RotateCcw className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p>Easy 7-day returns and money-back guarantee</p>
                </div>
                <div className="flex gap-3">
                  <CreditCard className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p>Multiple secure payment options - card, mobile money, bank</p>
                </div>
                <div className="flex gap-3">
                  <Headphones className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p>24/7 customer support via phone, WhatsApp, and email</p>
                </div>
              </div>
            </div>
            <div className="card p-8">
              <h3 className="font-bold text-2xl mb-4 text-primary-500">Why Choose Us?</h3>
              <ul className="space-y-3 text-dark-300">
                <li>• Curated selection of premium products</li>
                <li>• Competitive prices and exclusive deals</li>
                <li>• Fast, reliable nationwide delivery</li>
                <li>• Genuine products with warranties</li>
                <li>• Professional customer support</li>
                <li>• Secure and convenient checkout</li>
              </ul>
            </div>
          </div>

          <div className="card p-12 text-center">
            <h2 className="font-display font-bold text-3xl mb-4">
              READY TO <span className="text-primary-500">SHOP?</span>
            </h2>
            <p className="text-xl text-dark-300 mb-8">Join thousands of happy customers today</p>
            <a href="/shop" className="btn-primary">Start Shopping</a>
          </div>
        </div>
      </main>
      <SupportWidget />
    </>
  );
}