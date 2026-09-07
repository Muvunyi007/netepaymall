'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Truck, ShieldCheck } from 'lucide-react';
import { gsap, prefersReducedMotion } from '@/lib/animations';

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      tl.fromTo('.hero-headline', {
        y: 60,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
      })
        .fromTo('.hero-subtitle', {
          y: 40,
          opacity: 0,
        }, {
          y: 0,
          opacity: 1,
          duration: 0.6,
        }, '-=0.4')
        .fromTo('.hero-cta', {
          y: 30,
          opacity: 0,
        }, {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.15,
        }, '-=0.3')
        .fromTo('.hero-visual', {
          scale: 0.9,
          opacity: 0,
        }, {
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: 'power2.out',
        }, '-=0.6')
        .fromTo('.hero-particle', {
          y: 100,
          opacity: 0,
        }, {
          y: 0,
          opacity: 1,
          duration: 1.5,
          stagger: 0.2,
        }, '-=0.8');
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-black"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,214,0,0.1),transparent_60%)]" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-3 h-3 bg-primary-500 rounded-full hero-particle glow" />
        <div className="absolute top-1/2 right-16 w-2 h-2 bg-gold-500 rounded-full hero-particle" />
        <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-primary-500/40 rounded-full hero-particle blur-sm" />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-white/50 rounded-full hero-particle" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="hero-visual inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-primary-500 font-medium">
                The Premium Collection 2027
              </span>
            </div>

            <h1 className="hero-headline font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6">
              SHOP <span className="text-primary-500">SMART.</span>
              <br />
              LIVE <span className="text-primary-500">BETTER.</span>
            </h1>

            <p className="hero-subtitle text-xl text-dark-300 mb-8 max-w-lg">
              Premium products delivered directly to your door.
              Experience luxury shopping with our curated selection.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/shop" className="hero-cta btn-primary flex items-center gap-2">
                SHOP NOW
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/categories" className="hero-cta btn-secondary">
                EXPLORE COLLECTION
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 border-t border-dark-800 pt-8">
              <div className="hero-visual flex items-center gap-3">
                <Truck className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="font-semibold">Fast Delivery</p>
                  <p className="text-sm text-dark-400">Within 48 hours</p>
                </div>
              </div>
              <div className="hero-visual flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="font-semibold">Secure Payment</p>
                  <p className="text-sm text-dark-400">100% protected</p>
                </div>
              </div>
              <div className="hero-visual flex items-center gap-3">
                <Star className="w-8 h-8 text-primary-500" />
                <div>
                  <p className="font-semibold">Top Rated</p>
                  <p className="text-sm text-dark-400">4.9/5 rating</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual relative hidden lg:block">
            <div className="relative w-full aspect-square rounded-2xl bg-gradient-to-br from-dark-800 to-dark-950 border border-dark-700 overflow-hidden glow animate-float">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-72 h-72 rounded-full bg-primary-500/10 border-2 border-primary-500/50 flex items-center justify-center mx-auto mb-6">
                    <div className="w-48 h-48 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <span className="text-8xl">🛍️</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-2xl">Premium Collection</h3>
                  <p className="text-dark-400 mt-2">Discover the luxury experience</p>
                </div>
              </div>

              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur rounded-lg p-4 animate-float" style={{ animationDelay: '1s' }}>
                <p className="text-xs text-dark-400">Featured Product</p>
                <p className="font-semibold">Premium Items</p>
              </div>

              <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur rounded-lg p-4 animate-float" style={{ animationDelay: '2s' }}>
                <p className="text-xs text-dark-400">Today&apos;s Deal</p>
                <p className="font-semibold text-primary-500">Up to 50% OFF</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}