import 'dart:async';
import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/product.dart';
import 'product_card.dart';

/// Auto-advancing, animated product carousel. Slides the featured products
/// one after another with a fade+slide transition, page dots, and swipe
/// support. Tapping a card opens the full product detail.
class CarouselSlider extends StatefulWidget {
  final List<Product> products;
  final Duration autoPlayInterval;

  const CarouselSlider({
    super.key,
    required this.products,
    this.autoPlayInterval = const Duration(seconds: 4),
  });

  @override
  State<CarouselSlider> createState() => _CarouselSliderState();
}

class _CarouselSliderState extends State<CarouselSlider> {
  final PageController _controller = PageController(viewportFraction: 0.85);
  Timer? _timer;
  int _current = 0;

  int get _count => widget.products.length;

  @override
  void initState() {
    super.initState();
    if (_count > 1) {
      _timer = Timer.periodic(widget.autoPlayInterval, (_) => _next());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (!mounted || _controller.hasClients) {
      final next = (_current + 1) % _count;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.products.isEmpty) {
      return const SizedBox(height: 220);
    }

    return Column(
      children: [
        SizedBox(
          height: 220,
          child: PageView.builder(
            controller: _controller,
            onPageChanged: (index) => setState(() => _current = index),
            itemCount: _count,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: ProductCard(product: widget.products[index]),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_count, (i) {
            final active = i == _current;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 22 : 7,
              height: 7,
              decoration: BoxDecoration(
                color: active ? AppColors.primary : AppColors.dark700,
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
        ),
      ],
    );
  }
}