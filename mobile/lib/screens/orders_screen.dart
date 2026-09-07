import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../models/order.dart';
import '../../providers/auth_provider.dart';
import 'login_screen.dart';
import '../../services/order_service.dart';
import 'package:intl/intl.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final OrderService _orderService = OrderService();
  List<Order> _orders = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadOrders);
  }

  Future<void> _loadOrders() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isAuthenticated) return;

    setState(() => _isLoading = true);
    try {
      _orders = await _orderService.getOrders();
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  String _formatNaira(double amount) {
    return '₦${NumberFormat('#,##0', 'en_US').format(amount)}';
  }

  String _capitalize(String status) {
    return status.split('_').map((w) => w[0].toUpperCase() + w.substring(1)).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    if (!authProvider.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Orders')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.receipt_long, color: AppColors.primary, size: 64),
              const SizedBox(height: 16),
              const Text('Login to view your orders'),
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
      appBar: AppBar(title: const Text('My Orders')),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _orders.isEmpty
              ? RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _loadOrders,
                  child: ListView(
                    children: const [
                      SizedBox(height: 120),
                      Icon(Icons.receipt_long,
                          color: AppColors.primary, size: 64),
                      SizedBox(height: 16),
                      Center(
                        child: Text('No orders yet',
                            style: TextStyle(color: AppColors.warmGray)),
                      ),
                      SizedBox(height: 8),
                      Center(
                        child: Text('Start shopping to see your orders',
                            style: TextStyle(color: AppColors.warmGray)),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _loadOrders,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final order = _orders[index];
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    order.orderNumber,
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.dark800,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _capitalize(order.status),
                                      style: const TextStyle(fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${order.items.length} item(s)',
                                style:
                                    const TextStyle(color: AppColors.warmGray),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                DateFormat('MMM d, yyyy').format(order.createdAt),
                                style:
                                    const TextStyle(color: AppColors.warmGray),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _formatNaira(order.total),
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => OrderDetailScreen(
                                            order: order,
                                          ),
                                        ),
                                      );
                                    },
                                    child: const Text('TRACK'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class OrderDetailScreen extends StatelessWidget {
  final Order order;

  const OrderDetailScreen({super.key, required this.order});

  String _formatNaira(double amount) {
    return '₦${NumberFormat('#,##0', 'en_US').format(amount)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(order.orderNumber)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'ORDER ${order.orderNumber}',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Placed on ${DateFormat('MMM d, yyyy h:mm a').format(order.createdAt)}',
            style: const TextStyle(color: AppColors.warmGray),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Items',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ...order.items.map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: AppColors.dark800,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: item.productImage != null
                                  ? Image.network(
                                      item.productImage!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) =>
                                          const Icon(Icons.shopping_bag,
                                              color: AppColors.dark700),
                                    )
                                  : const Icon(Icons.shopping_bag,
                                      color: AppColors.dark700),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.productName,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600)),
                                  Text('Qty: ${item.quantity}',
                                      style: const TextStyle(
                                          color: AppColors.warmGray,
                                          fontSize: 12)),
                                ],
                              ),
                            ),
                            Text(
                              _formatNaira(item.totalPrice),
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  SummaryRow(
                    label: 'Subtotal',
                    value: _formatNaira(order.subtotal),
                  ),
                  if (order.discount > 0)
                    SummaryRow(
                      label: 'Discount',
                      value: '-${_formatNaira(order.discount)}',
                      color: Colors.green,
                    ),
                  SummaryRow(
                    label: 'Delivery',
                    value: _formatNaira(order.deliveryFee),
                  ),
                  SummaryRow(
                    label: 'Tax',
                    value: _formatNaira(order.tax),
                  ),
                  const Divider(color: AppColors.dark700, height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total',
                          style: TextStyle(fontSize: 18)),
                      Text(
                        _formatNaira(order.total),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
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

class SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;

  const SummaryRow({
    super.key,
    required this.label,
    required this.value,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.warmGray)),
          Text(value,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: color ?? AppColors.white,
              )),
        ],
      ),
    );
  }
}