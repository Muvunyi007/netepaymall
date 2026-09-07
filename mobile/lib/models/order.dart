class Order {
  final String id;
  final String orderNumber;
  final String status;
  final double subtotal;
  final double deliveryFee;
  final double tax;
  final double discount;
  final double total;
  final String? couponCode;
  final String? notes;
  final List<OrderItem> items;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.subtotal,
    required this.deliveryFee,
    required this.tax,
    required this.discount,
    required this.total,
    this.couponCode,
    this.notes,
    this.items = const [],
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number'] ?? '',
      status: json['status'] ?? 'pending',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      deliveryFee: (json['delivery_fee'] as num?)?.toDouble() ?? 0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      couponCode: json['coupon_code'],
      notes: json['notes'],
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class OrderItem {
  final String id;
  final String productId;
  final String? variantId;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String productName;
  final String? productImage;

  OrderItem({
    required this.id,
    required this.productId,
    this.variantId,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    required this.productName,
    this.productImage,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id']?.toString() ?? '',
      productId: json['product_id']?.toString() ?? '',
      variantId: json['variant_id']?.toString(),
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 0,
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0,
      productName: json['product_name'] ?? '',
      productImage: json['product_image'],
    );
  }
}