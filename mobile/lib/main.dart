import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/product_provider.dart';
import 'screens/home_screen.dart';
import 'widgets/splash_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PremiumMallApp());
}

class PremiumMallApp extends StatelessWidget {
  const PremiumMallApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: const _AppView(),
    );
  }
}

class _AppView extends StatefulWidget {
  const _AppView();

  @override
  State<_AppView> createState() => _AppViewState();
}

class _AppViewState extends State<_AppView> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_initialize);
  }

  Future<void> _initialize() async {
    final authProvider = context.read<AuthProvider>();
    await authProvider.loadInitial();
    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Premium Mall',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: AnimatedSwitcher(
        duration: const Duration(milliseconds: 450),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        transitionBuilder: (child, animation) => FadeTransition(
          opacity: animation,
          child: child,
        ),
        child: !_ready
            ? const SplashScreen(key: ValueKey('splash'))
            : const MainScreen(key: ValueKey('main')),
      ),
    );
  }
}