import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import 'login_screen.dart';
import 'checkout_screen.dart';
import 'package:intl/intl.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  String _formatNaira(double amount) {
    return '₦${NumberFormat('#,##0', 'en_US').format(amount)}';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    if (!authProvider.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cart')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.shopping_cart, color: AppColors.primary, size: 64),
              const SizedBox(height: 16),
              const Text('Login to view your cart'),
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

    final cartProvider = context.watch<CartProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
      body: cartProvider.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : cartProvider.items.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_cart_outlined,
                          color: AppColors.primary, size: 64),
                      SizedBox(height: 16),
                      Text('Your cart is empty',
                          style: TextStyle(color: AppColors.warmGray)),
                      SizedBox(height: 8),
                      Text('Discover our premium products',
                          style: TextStyle(color: AppColors.warmGray)),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    ...cartProvider.items.map((item) => _CartItemTile(
                          imageUrl: item.product.images.isNotEmpty
                              ? (item.product.images.first as Map)['url'] as String?
                              : null,
                          name: item.product.name,
                          price: item.totalPrice,
                          quantity: item.quantity,
                          onIncrement: () =>
                              cartProvider.updateQuantity(item.id, item.quantity + 1),
                          onDecrement: () =>
                              cartProvider.updateQuantity(item.id, item.quantity - 1),
                          onRemove: () => cartProvider.removeItem(item.id),
                        )),
                    const SizedBox(height: 20),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Items',
                                    style:
                                        TextStyle(color: AppColors.warmGray)),
                                Text(_formatNaira(cartProvider.subtotal),
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600)),
                              ],
                            ),
                            if (cartProvider.discount > 0)
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Discount',
                                        style: TextStyle(color: Colors.green)),
                                    Text(
                                        '-${_formatNaira(cartProvider.discount)}',
                                        style: const TextStyle(
                                          color: Colors.green,
                                          fontWeight: FontWeight.w600,
                                        )),
                                  ],
                                ),
                              ),
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 12),
                              child: Divider(color: AppColors.dark700),
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total',
                                    style: TextStyle(fontSize: 18)),
                                Text(
                                  _formatNaira(cartProvider.total),
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            ElevatedButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const CheckoutScreen(),
                                  ),
                                );
                              },
                              child: const Text('PROCEED TO CHECKOUT'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}

class _CartItemTile extends StatelessWidget {
  final String? imageUrl;
  final String name;
  final double price;
  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final VoidCallback onRemove;

  const _CartItemTile({
    required this.imageUrl,
    required this.name,
    required this.price,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.dark800,
                borderRadius: BorderRadius.circular(12),
              ),
              child: imageUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        imageUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(
                            Icons.shopping_bag,
                            color: AppColors.dark700),
                      ),
                    )
                  : const Icon(Icons.shopping_bag, color: AppColors.dark700),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '₦${NumberFormat('#,##0', 'en_US').format(price)}',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove, size: 18),
                      color: AppColors.white,
                      onPressed: onDecrement,
                    ),
                    Text('$quantity',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.add, size: 18),
                      color: AppColors.white,
                      onPressed: onIncrement,
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 18),
                  color: Colors.red,
                  onPressed: onRemove,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}