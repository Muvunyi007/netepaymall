import 'package:flutter/material.dart';
import '../core/constants.dart';
import '../models/product.dart';
import '../screens/product_detail_screen.dart';
import 'package:intl/intl.dart';

class ProductCard extends StatelessWidget {
  final Product product;

  const ProductCard({super.key, required this.product});

  String formatNaira(double amount) {
    final format = NumberFormat('#,##0', 'en_US');
    return '₦${format.format(amount)}';
  }

  @override
  Widget build(BuildContext context) {
    final discount = product.comparePrice != null
        ? ((product.comparePrice! - product.price) / product.comparePrice! * 100).round()
        : 0;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          PageRouteBuilder(
            transitionDuration: const Duration(milliseconds: 350),
            pageBuilder: (_, animation, __) => ProductDetailScreen(slug: product.slug),
            transitionsBuilder: (_, animation, __, child) {
              return FadeTransition(opacity: animation, child: child);
            },
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkCharcoal,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.dark700),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: Hero(
                          tag: 'product-${product.id}',
                          child: ClipRRect(
                            borderRadius:
                                const BorderRadius.vertical(top: Radius.circular(16)),
                            child: Image.network(
                              product.primaryImageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const _Placeholder(),
                            ),
                          ),
                        ),
                ),
                if (discount > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '-$discount%',
                        style: const TextStyle(
                          color: AppColors.black,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (product.comparePrice != null)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            formatNaira(product.comparePrice!),
                            style: const TextStyle(
                              color: AppColors.warmGray,
                              decoration: TextDecoration.lineThrough,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      Text(
                        formatNaira(product.price),
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  const _Placeholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.dark800,
      child: const Center(
        child: Icon(Icons.shopping_bag, color: AppColors.dark700, size: 40),
      ),
    );
  }
}