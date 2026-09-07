import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../models/product.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/whatsapp_service.dart';
import '../../services/call_service.dart';
import 'login_screen.dart';
import 'package:intl/intl.dart';

class ProductDetailScreen extends StatefulWidget {
  final String slug;

  const ProductDetailScreen({super.key, required this.slug});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  Product? _product;
  bool _isLoading = true;
  int _selectedImage = 0;
  String? _selectedVariantId;
  int _quantity = 1;
  bool _isAdding = false;

  final _whatsAppService = WhatsAppService();
  final _callService = CallService();

  @override
  void initState() {
    super.initState();
    _loadProduct();
  }

  Future<void> _loadProduct() async {
    try {
      final product =
          await context.read<ProductProvider>().getProduct(widget.slug);
      setState(() {
        _product = product;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  double get _activePrice {
    if (_selectedVariantId != null && _product != null) {
      for (final variant in _product!.variants) {
        if (variant.id == _selectedVariantId && variant.price != null) {
          return variant.price!;
        }
      }
    }
    return _product?.price ?? 0;
  }

  String _formatNaira(double amount) {
    return '₦${NumberFormat('#,##0', 'en_US').format(amount)}';
  }

  Future<void> _addToCart() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isAuthenticated) {
      Navigator.push(
          context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }

    setState(() => _isAdding = true);
    try {
      await context.read<CartProvider>().addToCart(
            productId: _product!.id,
            variantId: _selectedVariantId,
            quantity: _quantity,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Added to cart'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to add to cart'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isAdding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body:
            Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_product == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline,
                  color: AppColors.primary, size: 48),
              const SizedBox(height: 16),
              const Text('Product not found'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('GO BACK'),
              ),
            ],
          ),
        ),
      );
    }

    final product = _product!;
    final comparePrice = product.comparePrice ?? 0;
    final discount = comparePrice > product.price
        ? ((comparePrice - product.price) / comparePrice * 100).round()
        : 0;

    return Scaffold(
      appBar: AppBar(title: Text(product.name)),
      body: ListView(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Hero(
              tag: 'product-${product.id}',
              child: Image.network(
                product.primaryImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: AppColors.dark800,
                  child: const Center(
                    child: Icon(Icons.shopping_bag,
                        size: 64, color: AppColors.dark700),
                  ),
                ),
              ),
            ),
          ),
          if (product.images.length > 1)
            SizedBox(
              height: 80,
              child: ListView.separated(
                padding: const EdgeInsets.all(12),
                scrollDirection: Axis.horizontal,
                itemCount: product.images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () => setState(() => _selectedImage = index),
                    child: Container(
                      width: 70,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _selectedImage == index
                              ? AppColors.primary
                              : AppColors.dark700,
                          width: 2,
                        ),
                      ),
                      child: Image.network(
                        product.images[index].url,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.dark800,
                          child: const Icon(Icons.shopping_bag,
                              color: AppColors.dark700),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (product.brand != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      product.brand!,
                      style: const TextStyle(color: AppColors.warmGray),
                    ),
                  ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _formatNaira(_activePrice),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (discount > 0) ...[
                      const SizedBox(width: 12),
                      Text(
                        _formatNaira(comparePrice),
                        style: const TextStyle(
                          color: AppColors.warmGray,
                          decoration: TextDecoration.lineThrough,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
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
                    ],
                  ],
                ),
                if (product.variants.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text(
                    'Available Options',
                    style: TextStyle(fontSize: 16, color: AppColors.warmGray),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: product.variants.map((variant) {
                      final isSelected = _selectedVariantId == variant.id;
                      return ChoiceChip(
                        label: Text(variant.name),
                        selected: isSelected,
                        onSelected: (_) =>
                            setState(() => _selectedVariantId = variant.id),
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: isSelected ? AppColors.black : AppColors.white,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                        side: const BorderSide(color: AppColors.dark700),
                      );
                    }).toList(),
                  ),
                ],
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.dark700),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove,
                                color: AppColors.white),
                            onPressed: () => setState(() {
                              if (_quantity > 1) _quantity--;
                            }),
                          ),
                          Text(
                            '$_quantity',
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add, color: AppColors.white),
                            onPressed: () => setState(() => _quantity++),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                  ],
                ),
                if (product.description != null) ...[
                  const SizedBox(height: 24),
                  const Text(
                    'Description',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.description!,
                    style: const TextStyle(
                      color: AppColors.warmGray,
                      height: 1.5,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _callService.callSupport(),
                      icon: const Icon(Icons.phone, size: 20),
                      label: const Text('CALL'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _whatsAppService.openChat(
                        productName: product.name,
                      ),
                      icon: const Icon(Icons.chat, size: 20),
                      label: const Text('WHATSAPP'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25D366),
                        foregroundColor: AppColors.black,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: _isAdding ? null : _addToCart,
                icon: const Icon(Icons.shopping_cart),
                label: Text(_isAdding ? 'ADDING...' : 'ADD TO CART'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
