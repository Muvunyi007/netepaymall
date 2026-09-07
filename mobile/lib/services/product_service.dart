import '../core/api_client.dart';
import '../models/product.dart';

class ProductService {
  final ApiClient _api = ApiClient();

  Future<List<Product>> getProducts({
    int page = 1,
    int limit = 20,
    String? search,
    String? categoryId,
  }) async {
    final response = await _api.get('/products', query: {
      'page': page,
      'limit': limit,
      if (search != null && search.isNotEmpty) 'search': search,
      if (categoryId != null) 'category_id': categoryId,
    });

    return (response['data'] as List<dynamic>? ?? [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Product>> getFeatured({int limit = 10}) async {
    final response = await _api.get('/products/featured', query: {'limit': limit});
    return (response['data'] as List<dynamic>? ?? [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Product>> getNewArrivals({int limit = 10}) async {
    final response = await _api.get('/products/new', query: {'limit': limit});
    return (response['data'] as List<dynamic>? ?? [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Product> getProductBySlug(String slug) async {
    final response = await _api.get('/products/by-slug/$slug');
    return Product.fromJson(response['data']);
  }

  Future<List<Product>> searchProducts(String query) async {
    final response = await _api.get('/products/search', query: {'q': query});
    return (response['data'] as List<dynamic>? ?? [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Category>> getCategories() async {
    final response = await _api.get('/categories');
    return (response['data'] as List<dynamic>? ?? [])
        .map((e) => Category.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Product>> getWishlist() async {
    final response = await _api.get('/cart/wishlist');
    final data = response['data'] as List<dynamic>? ?? [];
    return data
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> addToWishlist(String productId) async {
    await _api.post('/cart/wishlist/$productId');
  }

  Future<void> removeFromWishlist(String productId) async {
    await _api.delete('/cart/wishlist/$productId');
  }
}