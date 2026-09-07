import '../core/api_client.dart';
import '../models/order.dart';

class OrderService {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> createOrder({
    required String deliveryAddressId,
    String? couponCode,
    String? deliveryInstructions,
  }) async {
    final response = await _api.post('/orders', data: {
      'delivery_address_id': deliveryAddressId,
      'coupon_code': couponCode,
      'delivery_instructions': deliveryInstructions,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<List<Order>> getOrders() async {
    final response = await _api.get('/orders');
    return (response['data'] as List<dynamic>? ?? [])
        .map((e) => Order.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Order> getOrder(String orderId) async {
    final response = await _api.get('/orders/$orderId');
    return Order.fromJson(response['data']);
  }

  Future<Map<String, dynamic>> trackOrder(String orderId) async {
    final response = await _api.get('/orders/$orderId/tracking');
    return response['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> cancelOrder(String orderId) async {
    await _api.post('/orders/$orderId/cancel');
  }

  Future<Map<String, dynamic>> createPayment({
    required String orderId,
    required String provider,
  }) async {
    final response = await _api.post('/payments/create', data: {
      'order_id': orderId,
      'provider': provider,
    });
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyPayment(String paymentId) async {
    final response = await _api.post('/payments/$paymentId/verify');
    return response['data'] as Map<String, dynamic>;
  }
}