import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, useGSAP, ScrollTrigger };

export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const animateHeroEntrance = (ref: React.RefObject<HTMLElement>) => {
  const ctx = gsap.context(() => {
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.out' },
    });

    timeline
      .fromTo('.hero-headline', {
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
        rotateY: 15,
      }, {
        scale: 1,
        opacity: 1,
        rotateY: 0,
        duration: 1.2,
        ease: 'power2.out',
      }, '-=0.5');
  }, ref);

  return () => ctx.revert();
};

export const animateScrollEntrance = (selector: string, ref: React.RefObject<HTMLElement>) => {
  const ctx = gsap.context(() => {
    gsap.fromTo(
      selector,
      {
        y: 60,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: selector,
          start: 'top 85%',
        },
      }
    );
  }, ref);

  return () => ctx.revert();
};

export const animateFloat = (element: string, duration = 6) => {
  const ctx = gsap.context(() => {
    gsap.to(element, {
      y: -20,
      duration,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  });

  return () => ctx.revert();
};