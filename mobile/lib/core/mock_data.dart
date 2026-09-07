import '../models/product.dart';

/// Static demo catalogue used as a graceful fallback whenever the live API
/// is unreachable or returns nothing, so the app always looks full and
/// browsable on the phone.
class MockData {
  MockData._();

  static String _img(int seed) =>
      'https://picsum.photos/seed/pm$seed/500/500';

  static final List<Category> categories = [
    Category(
        id: 'm-cat-1', name: 'Electronics', slug: 'electronics',
        description: 'Phones, laptops & accessories'),
    Category(
        id: 'm-cat-2', name: 'Fashion', slug: 'fashion',
        description: 'Clothing, shoes & bags'),
    Category(
        id: 'm-cat-3', name: 'Home & Kitchen', slug: 'home-kitchen',
        description: 'Appliances & home essentials'),
    Category(
        id: 'm-cat-4', name: 'Beauty', slug: 'beauty',
        description: 'Skincare & cosmetics'),
    Category(
        id: 'm-cat-5', name: 'Sports', slug: 'sports',
        description: 'Fitness gear & wearables'),
  ];

  static final List<Product> products = [
    _p('m-p-1', 'Wireless Earbuds Pro', 'wireless-earbuds-pro',
        24900, 34900, 'SoundPeak', ['Electronics', 'Beauty']),
    _p('m-p-2', 'Smart Watch Series 6', 'smart-watch-series-6',
        129000, 160000, 'TimeCore', ['Electronics', 'Sports']),
    _p('m-p-3', 'Premium Sneakers', 'premium-sneakers',
        82000, 110000, 'UrbanStep', ['Fashion', 'Sports']),
    _p('m-p-4', 'Leather Backpack', 'leather-backpack',
        65000, 85000, 'UrbanStep', ['Fashion']),
    _p('m-p-5', 'Bluetooth Speaker', 'bluetooth-speaker',
        45000, 60000, 'SoundPeak', ['Electronics', 'Home & Kitchen']),
    _p('m-p-6', 'Stainless Cookware Set', 'stainless-cookware-set',
        98000, 125000, 'ChefPro', ['Home & Kitchen']),
    _p('m-p-7', 'Mechanical Keyboard', 'mechanical-keyboard',
        55000, 72000, 'KeyWiz', ['Electronics']),
    _p('m-p-8', 'Running Shoes', 'running-shoes',
        58000, 76000, 'UrbanStep', ['Fashion', 'Sports']),
    _p('m-p-9', 'Hydrating Face Serum', 'hydrating-face-serum',
        18000, 25000, 'GlowLab', ['Beauty']),
    _p('m-p-10', 'Air Purifier Mini', 'air-purifier-mini',
        120000, 150000, 'AeroPure', ['Home & Kitchen', 'Beauty']),
    _p('m-p-11', 'Fitness Tracker Band', 'fitness-tracker-band',
        36000, 48000, 'TimeCore', ['Sports', 'Electronics']),
    _p('m-p-12', 'Denim Jacket', 'denim-jacket',
        47000, 62000, 'UrbanStep', ['Fashion']),
  ];

  static Product _p(String id, String name, String slug, int price,
      int compare, String brand, List<String> cats) {
    return Product(
      id: id,
      name: name,
      slug: slug,
      shortDescription: 'High quality premium product for every day.',
      description: 'A beautifully designed, durable product built to '
          'premium standards and delivered right to your door.',
      price: price.toDouble(),
      comparePrice: compare.toDouble(),
      brand: brand,
      isActive: true,
      isFeatured: cats.contains('Electronics'),
      variants: const [],
      images: [ProductImage(id: '$id-img', url: _img(price ~/ 900), isPrimary: true)],
    );
  }
}