import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../models/product.dart';
import '../../providers/product_provider.dart';
import '../../widgets/product_card.dart';

class ShopScreen extends StatefulWidget {
  final Category? initialCategory;

  const ShopScreen({super.key, this.initialCategory});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  Category? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
    Future.microtask(() {
      final provider = context.read<ProductProvider>();
      provider.loadProducts(
        search: null,
        categoryId: _selectedCategory?.id,
      );
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _performSearch() {
    setState(() {
      _searchQuery = _searchController.text.trim();
    });
    context.read<ProductProvider>().loadProducts(search: _searchQuery);
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = context.watch<ProductProvider>();

    return Scaffold(
      appBar: AppBar(title: Text(_selectedCategory?.name ?? 'Shop')),
      body: Column(
        children: [
          if (_selectedCategory == null)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onSubmitted: (_) => _performSearch(),
                      decoration: InputDecoration(
                        hintText: 'Search products...',
                        hintStyle: const TextStyle(color: AppColors.warmGray),
                        prefixIcon: const Icon(Icons.search, color: AppColors.warmGray),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, color: AppColors.warmGray),
                                onPressed: () {
                                  _searchController.clear();
                                  _performSearch();
                                },
                              )
                            : null,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: productProvider.isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary))
                : productProvider.products.isEmpty
                    ? const Center(
                        child: Text(
                          'No products found',
                          style: TextStyle(color: AppColors.warmGray),
                        ),
                      )
                    : RefreshIndicator(
                        color: AppColors.primary,
                        onRefresh: () => productProvider.loadProducts(
                          search: _searchQuery,
                          categoryId: _selectedCategory?.id,
                        ),
                        child: GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.72,
                          ),
                          itemCount: productProvider.products.length,
                          itemBuilder: (context, index) {
                            return ProductCard(
                              product: productProvider.products[index],
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}