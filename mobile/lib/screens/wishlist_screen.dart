import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../providers/auth_provider.dart';
import 'login_screen.dart';
import '../screens/product_detail_screen.dart';
import 'package:intl/intl.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  final ProductService _productService = ProductService();
  List<Product> _wishlist = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadWishlist);
  }

  Future<void> _loadWishlist() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isAuthenticated) return;

    setState(() => _isLoading = true);
    try {
      _wishlist = await _productService.getWishlist();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  void _toggleWishlist(Product product) async {
    final exists = _wishlist.any((w) => w.id == product.id);
    try {
      if (exists) {
        await _productService.removeFromWishlist(product.id);
        setState(() => _wishlist
            .removeWhere((w) => w.id == product.id));
      } else {
        await _productService.addToWishlist(product.id);
        setState(() => _wishlist.add(product));
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    if (!authProvider.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Wishlist')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.favorite_border,
                  color: AppColors.primary, size: 64),
              const SizedBox(height: 16),
              const Text('Login to view your wishlist'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                },
                child: const Text('LOGIN'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Wishlist')),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _wishlist.isEmpty
              ? RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _loadWishlist,
                  child: ListView(
                    children: const [
                      SizedBox(height: 120),
                      Icon(Icons.favorite_border,
                          color: AppColors.primary, size: 64),
                      SizedBox(height: 16),
                      Center(
                        child: Text('Your wishlist is empty',
                            style: TextStyle(color: AppColors.warmGray)),
                      ),
                      SizedBox(height: 8),
                      Center(
                        child: Text('Tap the heart on products you love',
                            style: TextStyle(color: AppColors.warmGray)),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _loadWishlist,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.62,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: _wishlist.length,
                    itemBuilder: (context, index) {
                      final product = _wishlist[index];
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ProductDetailScreen(
                                      slug: product.slug,
                                    ),
                                  ),
                                );
                              },
                              child: Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: AppColors.dark800,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: product.images.isNotEmpty
                                    ? ClipRRect(
                                        borderRadius:
                                            BorderRadius.circular(12),
                                        child: Image.network(
                                          (product.images.first
                                                  as Map)['url'] as String? ??
                                              '',
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) =>
                                              const Icon(
                                            Icons.image_not_supported_outlined,
                                            color: AppColors.dark700,
                                          ),
                                        ),
                                      )
                                    : const Icon(Icons.image_not_supported_outlined,
                                        color: AppColors.dark700),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  product.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.favorite, size: 18),
                                color: Colors.red,
                                onPressed: () => _toggleWishlist(product),
                                padding: EdgeInsets.zero,
                                constraints:
                                    const BoxConstraints(minWidth: 32),
                              ),
                            ],
                          ),
                          Text(
                            '₦${NumberFormat('#,##0', 'en_US').format(product.price)}',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
    );
  }
}