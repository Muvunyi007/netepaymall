class Product {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? shortDescription;
  final double price;
  final double? comparePrice;
  final String? sku;
  final String? brand;
  final bool isActive;
  final bool isFeatured;
  final List<ProductImage> images;
  final List<ProductVariant> variants;
  final DateTime? createdAt;

  Product({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.shortDescription,
    required this.price,
    this.comparePrice,
    this.sku,
    this.brand,
    required this.isActive,
    this.isFeatured = false,
    this.images = const [],
    this.variants = const [],
    this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      shortDescription: json['short_description'],
      price: (json['price'] as num?)?.toDouble() ?? 0,
      comparePrice: (json['compare_price'] as num?)?.toDouble(),
      sku: json['sku'],
      brand: json['brand'],
      isActive: json['is_active'] ?? true,
      isFeatured: json['is_featured'] ?? false,
      images: (json['images'] as List<dynamic>? ?? [])
          .map((e) => ProductImage.fromJson(e as Map<String, dynamic>))
          .toList(),
      variants: (json['variants'] as List<dynamic>? ?? [])
          .map((e) => ProductVariant.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  /// The first real, loadable image URL for this product. Backend records may
  /// ship with placeholder hosts (e.g. images.example.com) that never resolve;
  /// those are ignored in favour of a stable visual so the catalogue always
  /// looks populated inside the app.
  String get primaryImageUrl {
    for (final image in images) {
      final url = image.url.trim();
      final invalid =
          url.isEmpty ||
          url.contains('images.example.com') ||
          url.contains('example.com');
      if (!invalid) return url;
    }
    // Deterministic stable visual derived from the product identity.
    final seed = (id.hashCode & 0xffffffff).toRadixString(16);
    return 'https://picsum.photos/seed/pm$seed/500/500';
  }
}

class ProductImage {
  final String id;
  final String url;
  final String? altText;
  final int sortOrder;
  final bool isPrimary;

  ProductImage({
    required this.id,
    required this.url,
    this.altText,
    this.sortOrder = 0,
    this.isPrimary = false,
  });

  factory ProductImage.fromJson(Map<String, dynamic> json) {
    return ProductImage(
      id: json['id']?.toString() ?? '',
      url: json['url'] ?? '',
      altText: json['alt_text'],
      sortOrder: json['sort_order'] ?? 0,
      isPrimary: json['is_primary'] ?? false,
    );
  }
}

class ProductVariant {
  final String id;
  final String name;
  final String? sku;
  final double? price;
  final double? comparePrice;
  final String? options;
  final bool isActive;

  ProductVariant({
    required this.id,
    required this.name,
    this.sku,
    this.price,
    this.comparePrice,
    this.options,
    this.isActive = true,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      sku: json['sku'],
      price: (json['price'] as num?)?.toDouble(),
      comparePrice: (json['compare_price'] as num?)?.toDouble(),
      options: json['options'],
      isActive: json['is_active'] ?? true,
    );
  }
}

class Category {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? imageUrl;

  Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.imageUrl,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      imageUrl: json['image_url'],
    );
  }
}