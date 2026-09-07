import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/api_client.dart';
import '../models/cart.dart';

class CartService {
  final ApiClient _api = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<List<CartItem>> getCart() async {
    final canRequest = await _hasToken();
    if (!canRequest) return [];

    final response = await _api.get('/cart');
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return (data['items'] as List<dynamic>? ?? [])
        .map((e) => CartItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> addToCart({
    required String productId,
    String? variantId,
    int quantity = 1,
  }) async {
    await _api.post('/cart/items', data: {
      'product_id': productId,
      'variant_id': variantId,
      'quantity': quantity,
    });
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    if (quantity <= 0) {
      await _api.delete('/cart/items/$itemId');
    } else {
      await _api.patch('/cart/items/$itemId', data: {'quantity': quantity});
    }
  }

  Future<void> removeItem(String itemId) async {
    await _api.delete('/cart/items/$itemId');
  }

  Future<void> clearCart() async {
    await _api.delete('/cart');
  }

  Future<Map<String, dynamic>> getCartDetails() async {
    final response = await _api.get('/cart');
    return response['data'] as Map<String, dynamic>? ?? {};
  }

  Future<bool> _hasToken() async {
    final token = await _storage.read(key: 'access_token');
    return token != null && token.isNotEmpty;
  }
}