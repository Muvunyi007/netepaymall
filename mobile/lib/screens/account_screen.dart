import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/constants.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import 'login_screen.dart';
import 'orders_screen.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final ApiClient _api = ApiClient();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  bool _isLoading = false;
  bool _showAddresses = false;
  bool _showPasswordForm = false;
  List<Address> _addresses = [];

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (context.read<AuthProvider>().isAuthenticated) {
        _loadAddresses();
      }
    });
  }

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  Future<void> _loadAddresses() async {
    try {
      final response = await _api.get('/users/me/addresses');
      if (!mounted) return;
      setState(() {
        _addresses = (response['data'] as List<dynamic>? ?? [])
            .map((e) => Address.fromJson(e as Map<String, dynamic>))
            .toList();
      });
    } catch (_) {}
  }

  Future<void> _changePassword() async {
    if (_newPasswordController.text.length < 6) {
      _showSnack('Password must be at least 6 characters', isError: true);
      return;
    }
    setState(() => _isLoading = true);
    try {
      await _api.post('/auth/change-password', data: {
        'old_password': _oldPasswordController.text,
        'new_password': _newPasswordController.text,
      });
      _oldPasswordController.clear();
      _newPasswordController.clear();
      setState(() => _showPasswordForm = false);
      _showSnack('Password updated successfully');
    } catch (_) {
      _showSnack('Failed to change password', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.darkCharcoal,
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.warmGray)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<AuthProvider>().logout();
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : AppColors.primary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    if (!authProvider.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Account')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.account_circle, color: AppColors.primary, size: 64),
              const SizedBox(height: 16),
              const Text('Login to manage your account'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                },
                child: const Text('LOGIN'),
              ),
            ],
          ),
        ),
      );
    }

    final user = authProvider.user;
    final String initials;
    if (user == null || (user.firstName.isEmpty && user.lastName.isEmpty)) {
      final email = user?.email ?? '';
      initials = email.isNotEmpty ? email[0].toUpperCase() : '?';
    } else {
      initials = '${user.firstName[0]}${user.lastName.isNotEmpty ? user.lastName[0] : ''}';
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Account')),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _loadAddresses,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        initials,
                        style: const TextStyle(
                          color: AppColors.black,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName.isEmpty == true ? 'Welcome' : user!.fullName,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user?.email ?? '',
                            style: const TextStyle(color: AppColors.warmGray, fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
            _MenuItem(
              icon: Icons.receipt_long,
              label: 'My Orders',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const OrdersScreen()),
                );
              },
            ),
            _MenuItem(
              icon: Icons.location_on_outlined,
              label: _showAddresses ? 'Hide Addresses' : 'My Addresses',
              onTap: () => setState(() => _showAddresses = !_showAddresses),
            ),
            _MenuItem(
              icon: Icons.lock_outline,
              label: _showPasswordForm ? 'Hide Change Password' : 'Change Password',
              onTap: () => setState(() => _showPasswordForm = !_showPasswordForm),
            ),
            _MenuItem(
              icon: Icons.logout,
              label: 'Logout',
              color: Colors.red.shade400,
              onTap: _logout,
            ),

            if (_showAddresses) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Addresses',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      if (_addresses.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Text(
                            'No saved addresses yet',
                            style: TextStyle(color: AppColors.warmGray),
                          ),
                        )
                      else
                        ..._addresses.map((address) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.home_outlined,
                                      color: AppColors.primary, size: 20),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${address.label}: ${address.addressLine1}',
                                          style: const TextStyle(
                                              fontWeight: FontWeight.w600),
                                        ),
                                        Text(
                                          '${address.city}, ${address.state} ${address.postalCode}',
                                          style: const TextStyle(
                                              color: AppColors.warmGray,
                                              fontSize: 13),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            )),
                    ],
                  ),
                ),
              ),
            ],

            if (_showPasswordForm) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Change Password',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _oldPasswordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Current Password',
                          prefixIcon: Icon(Icons.lock_outline, color: AppColors.warmGray),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _newPasswordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'New Password',
                          prefixIcon: Icon(Icons.lock_outline, color: AppColors.warmGray),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _changePassword,
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: AppColors.black,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('UPDATE PASSWORD'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: color ?? AppColors.primary),
        title: Text(label, style: TextStyle(color: color ?? AppColors.white)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.warmGray),
        onTap: onTap,
      ),
    );
  }
}