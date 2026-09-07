import 'package:flutter/foundation.dart';
import '../../models/cart.dart';
import '../../services/cart_service.dart';

class CartProvider extends ChangeNotifier {
  final CartService _cartService = CartService();
  List<CartItem> _items = [];
  double _subtotal = 0;
  double _discount = 0;
  double _deliveryFee = 0;
  double _tax = 0;
  double _total = 0;
  bool _isLoading = false;

  List<CartItem> get items => _items;
  double get subtotal => _subtotal;
  double get discount => _discount;
  double get deliveryFee => _deliveryFee;
  double get tax => _tax;
  double get total => _total;
  bool get isLoading => _isLoading;
  int get itemCount => _items.length;

  Future<void> loadCart() async {
    _isLoading = true;
    notifyListeners();
    try {
      final details = await _cartService.getCartDetails();
      _items = (details['items'] as List<dynamic>? ?? [])
          .map((e) => CartItem.fromJson(e as Map<String, dynamic>))
          .toList();
      _subtotal = (details['subtotal'] as num?)?.toDouble() ?? 0;
      _discount = (details['discount'] as num?)?.toDouble() ?? 0;
      _deliveryFee = (details['delivery_fee'] as num?)?.toDouble() ?? 0;
      _tax = (details['tax'] as num?)?.toDouble() ?? 0;
      _total = (details['total'] as num?)?.toDouble() ?? 0;
    } catch (_) {}
    _isLoading = false;
    notifyListeners();
  }

  Future<void> addToCart({
    required String productId,
    String? variantId,
    int quantity = 1,
  }) async {
    await _cartService.addToCart(
      productId: productId,
      variantId: variantId,
      quantity: quantity,
    );
    await loadCart();
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    await _cartService.updateQuantity(itemId, quantity);
    await loadCart();
  }

  Future<void> removeItem(String itemId) async {
    await _cartService.removeItem(itemId);
    await loadCart();
  }

  Future<void> clearCart() async {
    await _cartService.clearCart();
    await loadCart();
  }
}