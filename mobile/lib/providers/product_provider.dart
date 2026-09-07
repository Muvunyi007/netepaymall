import 'package:flutter/foundation.dart' hide Category;
import '../../models/product.dart';
import '../../services/product_service.dart';
import '../../core/mock_data.dart';

class ProductProvider extends ChangeNotifier {
  final ProductService _productService = ProductService();
  List<Product> _featured = [];
  List<Product> _newArrivals = [];
  List<Category> _categories = [];
  List<Product> _products = [];
  bool _isLoading = false;

  List<Product> get featured => _featured;
  List<Product> get newArrivals => _newArrivals;
  List<Category> get categories => _categories;
  List<Product> get products => _products;
  bool get isLoading => _isLoading;

  Future<void> loadHomeData() async {
    _isLoading = true;
    notifyListeners();
    try {
      // Fetch each list independently so one failing endpoint never blanks
      // the others. Live backend data is preferred; the mock catalogue is
      // used only when a section truly has nothing to show (e.g. offline).
      final results = await Future.wait<Object>([
        _safeFeatured(),
        _safeNew(),
        _safeCategories(),
      ]);
      final featured = results[0] as List<Product>;
      final newArrivals = results[1] as List<Product>;
      final categories = results[2] as List<Category>;

      _featured = featured.isNotEmpty ? featured : MockData.products;
      _newArrivals = newArrivals.isNotEmpty ? newArrivals : MockData.products;
      _categories = categories.isNotEmpty ? categories : MockData.categories;
    } catch (_) {
      _featured = MockData.products;
      _newArrivals = MockData.products;
      _categories = MockData.categories;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<List<Product>> _safeFeatured() async {
    try {
      return await _productService.getFeatured();
    } catch (_) {
      return [];
    }
  }

  Future<List<Product>> _safeNew() async {
    try {
      return await _productService.getNewArrivals();
    } catch (_) {
      return [];
    }
  }

  Future<List<Category>> _safeCategories() async {
    try {
      return await _productService.getCategories();
    } catch (_) {
      return [];
    }
  }

  Future<void> loadProducts({String? search, String? categoryId}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final result = await _productService.getProducts(
        search: search,
        categoryId: categoryId,
        limit: 30,
      );
      _products = result.isNotEmpty ? result : MockData.products;
    } catch (_) {
      _products = MockData.products;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<Product> getProduct(String slug) async {
    try {
      return await _productService.getProductBySlug(slug);
    } catch (_) {
      return MockData.products.firstWhere(
        (p) => p.slug == slug,
        orElse: () => MockData.products.first,
      );
    }
  }
}