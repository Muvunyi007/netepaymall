'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingCart, User, Menu, X, Phone, MessageCircle, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { gsap } from '@/lib/animations';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/categories', label: 'Categories' },
  { href: '/deals', label: 'Deals' },
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const { itemCount } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (navRef.current) {
      gsap.to(navRef.current, {
        height: isScrolled ? '4rem' : '5rem',
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  }, [isScrolled]);

  return (
    <header
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg glow flex items-center justify-center">
            <span className="text-dark-950 font-bold text-xl">P</span>
          </div>
          <span className="font-display font-bold text-lg hidden sm:block">
            PREMIUM<span className="text-primary-500">MALL</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`btn-ghost ${
                pathname === item.href ? 'text-primary-500' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="btn-ghost"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link href="/wishlist" className="btn-ghost relative" aria-label="Wishlist">
            <Heart className="w-5 h-5" />
          </Link>

          <Link href="/cart" className="btn-ghost relative" aria-label="Cart">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-dark-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          <Link href={isAuthenticated ? '/account' : '/login'} className="btn-ghost" aria-label="Account">
            <User className="w-5 h-5" />
          </Link>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden btn-ghost"
            aria-label="Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {showSearch && (
        <div className="px-4 pb-4 md:px-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="search"
              placeholder="Search products..."
              className="input pl-10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = `/search?q=${e.currentTarget.value}`;
                }
              }}
            />
          </div>
        </div>
      )}

      {isOpen && (
        <div className="lg:hidden glass border-t border-dark-800 mt-1">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg hover:bg-dark-800 transition-colors ${
                  pathname === item.href ? 'text-primary-500' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-dark-800 my-2" />
            <div className="flex gap-2 px-4 py-2">
              <a
                href="tel:+250XXXXXXXXX"
                className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <Phone className="w-4 h-4" /> Call Us
              </a>
              <a
                href="https://wa.me/250XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}