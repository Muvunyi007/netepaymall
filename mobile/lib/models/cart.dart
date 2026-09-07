class CartItem {
  final String id;
  final String productId;
  final String? variantId;
  int quantity;
  final bool savedForLater;
  final CartProduct product;
  final CartVariant? variant;

  CartItem({
    required this.id,
    required this.productId,
    this.variantId,
    required this.quantity,
    this.savedForLater = false,
    required this.product,
    this.variant,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id']?.toString() ?? '',
      productId: json['product_id']?.toString() ?? '',
      variantId: json['variant_id']?.toString(),
      quantity: json['quantity'] ?? 1,
      savedForLater: json['saved_for_later'] ?? false,
      product: CartProduct.fromJson(json['product'] as Map<String, dynamic>? ?? {}),
      variant: json['variant'] != null
          ? CartVariant.fromJson(json['variant'] as Map<String, dynamic>)
          : null,
    );
  }

  double get unitPrice => variant?.price ?? product.price;
  double get totalPrice => unitPrice * quantity;
}

class CartProduct {
  final String id;
  final String name;
  final double price;
  final double? comparePrice;
  final List<dynamic> images;

  CartProduct({
    required this.id,
    required this.name,
    required this.price,
    this.comparePrice,
    this.images = const [],
  });

  factory CartProduct.fromJson(Map<String, dynamic> json) {
    return CartProduct(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      comparePrice: (json['compare_price'] as num?)?.toDouble(),
      images: json['images'] as List<dynamic>? ?? [],
    );
  }
}

class CartVariant {
  final String id;
  final String name;
  final double price;

  CartVariant({
    required this.id,
    required this.name,
    required this.price,
  });

  factory CartVariant.fromJson(Map<String, dynamic> json) {
    return CartVariant(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
    );
  }
}