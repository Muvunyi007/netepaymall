import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../models/product.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/product_card.dart';
import '../../widgets/animated_reveal.dart';
import '../../widgets/carousel_slider.dart';
import 'shop_screen.dart';
import 'wishlist_screen.dart';
import 'account_screen.dart';
import 'cart_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      final productProvider = context.read<ProductProvider>();
      final cartProvider = context.read<CartProvider>();
      final authProvider = context.read<AuthProvider>();
      await productProvider.loadHomeData();
      if (authProvider.isAuthenticated) {
        await cartProvider.loadCart();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();

    final screens = [
      const HomeScreen(),
      const ShopScreen(),
      const WishlistScreen(),
      const CartScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        backgroundColor: Colors.black,
        indicatorColor: Colors.transparent,
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined, color: Colors.white),
            selectedIcon: Icon(Icons.home, color: AppColors.primary),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.store_outlined, color: Colors.white),
            selectedIcon: Icon(Icons.store, color: AppColors.primary),
            label: 'Shop',
          ),
          const NavigationDestination(
            icon: Icon(Icons.favorite_border, color: Colors.white),
            selectedIcon: Icon(Icons.favorite, color: AppColors.primary),
            label: 'Whishlist',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: cartProvider.itemCount > 0,
              label: Text('${cartProvider.itemCount}'),
              child: const Icon(Icons.shopping_cart_outlined, color: Colors.white),
            ),
            selectedIcon: Badge(
              isLabelVisible: cartProvider.itemCount > 0,
              label: Text('${cartProvider.itemCount}'),
              child: const Icon(Icons.shopping_cart, color: AppColors.primary),
            ),
            label: 'Cart',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline, color: Colors.white),
            selectedIcon: Icon(Icons.person, color: AppColors.primary),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final productProvider = context.watch<ProductProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'P',
                style: TextStyle(
                  color: AppColors.black,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'PREMIUM',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const Text(
              'MALL',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ],
        ),
      ),
      body: productProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () => productProvider.loadHomeData(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  AnimatedReveal(
                    duration: const Duration(milliseconds: 600),
                    child: _HeroBanner(products: productProvider.featured),
                  ),
                  const SizedBox(height: 24),
                  const AnimatedReveal(
                    duration: Duration(milliseconds: 500),
                    offset: Offset(0, 0.08),
                    child: _SectionHeader(title: 'Featured Products', seeAll: true),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 240,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: productProvider.featured.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (context, index) {
                        return SizedBox(
                          width: 160,
                          child: ProductCard(product: productProvider.featured[index]),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                  const AnimatedReveal(
                    duration: Duration(milliseconds: 500),
                    offset: Offset(0, 0.08),
                    delay: Duration(milliseconds: 150),
                    child: _SectionHeader(title: 'Categories', seeAll: false),
                  ),
                  const SizedBox(height: 12),
                  AnimatedReveal(
                    duration: const Duration(milliseconds: 550),
                    offset: const Offset(0, 0.08),
                    delay: const Duration(milliseconds: 220),
                    child: SizedBox(
                      height: 100,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: productProvider.categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final category = productProvider.categories[index];
                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ShopScreen(initialCategory: category),
                                ),
                              );
                            },
                            child: Container(
                              width: 100,
                              decoration: BoxDecoration(
                                color: AppColors.darkCharcoal,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.dark700),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.category_outlined,
                                      color: AppColors.primary),
                                  const SizedBox(height: 8),
                                  Text(
                                    category.name,
                                    textAlign: TextAlign.center,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const AnimatedReveal(
                    duration: Duration(milliseconds: 500),
                    offset: Offset(0, 0.08),
                    delay: Duration(milliseconds: 300),
                    child: _SectionHeader(title: 'New Arrivals', seeAll: true),
                  ),
                  const SizedBox(height: 12),
                  AnimatedReveal(
                    duration: const Duration(milliseconds: 650),
                    offset: const Offset(0, 0.06),
                    delay: const Duration(milliseconds: 370),
                    child: GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.72,
                      ),
                      itemCount: productProvider.newArrivals.length,
                      itemBuilder: (context, index) {
                        return ProductCard(product: productProvider.newArrivals[index]);
                      },
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  final List<Product> products;
  const _HeroBanner({this.products = const []});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.darkCharcoal, AppColors.black],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.dark700),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'SHOP SMART.\nLIVE BETTER.',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              height: 1.15,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Swipe through our featured picks',
            style: TextStyle(color: AppColors.warmGray, fontSize: 13),
          ),
          const SizedBox(height: 16),
          CarouselSlider(products: products),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final bool seeAll;

  const _SectionHeader({required this.title, this.seeAll = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.white,
          ),
        ),
        if (seeAll)
          TextButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ShopScreen()),
              );
            },
            child: const Text(
              'See All',
              style: TextStyle(color: AppColors.primary, fontSize: 13),
            ),
          ),
      ],
    );
  }
}