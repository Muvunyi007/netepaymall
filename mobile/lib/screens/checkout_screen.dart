import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/constants.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/order_service.dart';
import 'package:intl/intl.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final OrderService _orderService = OrderService();
  final _formKey = GlobalKey<FormState>();

  List<Address> _addresses = [];
  Address? _selectedAddress;
  String _paymentMethod = 'card';
  int _step = 1;
  bool _isLoading = false;
  bool _isProcessing = false;
  String? _orderNumber;

  final _labelController = TextEditingController(text: 'Home');
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _postalController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  @override
  void dispose() {
    _labelController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _postalController.dispose();
    super.dispose();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    try {
      final user = context.read<AuthProvider>().user;
      if (user != null) {
        final firstName = _firstNameController.text.isEmpty
            ? user.firstName
            : _firstNameController.text;
        final lastName = _lastNameController.text.isEmpty
            ? user.lastName
            : _lastNameController.text;
        _firstNameController.text = firstName;
        _lastNameController.text = lastName;
        if (user.phone != null) _phoneController.text = user.phone!;
      }
    } catch (_) {}
    setState(() => _isLoading = false);
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isProcessing = true);
    try {
      final api = ApiClient();
      final response = await api.post('/users/me/addresses', data: {
        'label': _labelController.text,
        'first_name': _firstNameController.text,
        'last_name': _lastNameController.text,
        'phone': _phoneController.text,
        'address_line1': _addressController.text,
        'city': _cityController.text,
        'state': _stateController.text,
        'postal_code': _postalController.text,
        'country': 'Nigeria',
        'is_default': true,
      });

      final parseAddress = Address.fromJson(response);
      setState(() {
        _addresses = [..._addresses, parseAddress];
        _selectedAddress = parseAddress;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save address: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }

    setState(() {
      _isProcessing = false;
      _step = 2;
    });
  }

  Future<void> _placeOrder() async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select or add a delivery address'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);
    try {
      final cartProvider = context.read<CartProvider>();

      // Create order
      final order = await _orderService.createOrder(
        deliveryAddressId: _selectedAddress!.id,
      );

      // Create payment
      final payment = await _orderService.createPayment(
        orderId: order['id'],
        provider: _paymentMethod,
      );

      // Verify payment
      await _orderService.verifyPayment(payment['id']);

      await cartProvider.clearCart();

      setState(() {
        _orderNumber = order['order_number'];
        _isProcessing = false;
      });
    } catch (e) {
      setState(() => _isProcessing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to place order: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();

    if (_orderNumber != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle,
                    color: Colors.green, size: 80),
                const SizedBox(height: 24),
                const Text(
                  'ORDER CONFIRMED!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Thank you for your purchase!'),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.darkCharcoal,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.dark700),
                  ),
                  child: Column(
                    children: [
                      const Text('Order Number',
                          style: TextStyle(color: AppColors.warmGray)),
                      const SizedBox(height: 4),
                      Text(
                        _orderNumber!,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('CONTINUE SHOPPING'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _step == 1
              ? _buildAddressStep()
              : _step == 2
                  ? _buildPaymentStep(cartProvider)
                  : _buildReviewStep(cartProvider),
    );
  }

  Widget _buildAddressStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Delivery Address',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'Where should we deliver your order?',
              style: TextStyle(color: AppColors.warmGray),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _labelController,
              decoration: const InputDecoration(
                labelText: 'Address Label',
                prefixIcon: Icon(Icons.label_outline, color: AppColors.warmGray),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _firstNameController,
                    decoration: const InputDecoration(labelText: 'First Name'),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _lastNameController,
                    decoration: const InputDecoration(labelText: 'Last Name'),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone Number'),
              validator: (value) =>
                  value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: 'Street Address',
                hintText: 'House number and street name',
              ),
              validator: (value) =>
                  value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _cityController,
                    decoration: const InputDecoration(labelText: 'City'),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _stateController,
                    decoration: const InputDecoration(labelText: 'State'),
                    validator: (value) =>
                        value == null || value.isEmpty ? 'Required' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _postalController,
              decoration: const InputDecoration(labelText: 'Postal Code'),
              validator: (value) =>
                  value == null || value.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isProcessing ? null : _saveAddress,
              child: Text(_isProcessing ? 'SAVING...' : 'CONTINUE TO PAYMENT'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentStep(CartProvider cartProvider) {
    final methods = <Map<String, dynamic>>[
      {'id': 'card', 'label': 'Card Payment', 'icon': Icons.credit_card,
       'desc': 'Visa, Mastercard, Verve'},
      {'id': 'mobile_money', 'label': 'Mobile Money',
       'icon': Icons.phone_android, 'desc': 'MoMo, Airtel Money'},
      {'id': 'bank', 'label': 'Bank Transfer', 'icon': Icons.account_balance,
       'desc': 'Direct bank transfer'},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Payment Method',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          ...methods.map((method) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: () => setState(() => _paymentMethod = method['id']!),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.darkCharcoal,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _paymentMethod == method['id']
                            ? AppColors.primary
                            : AppColors.dark700,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(method['icon'] as IconData,
                            color: AppColors.primary),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(method['label']!,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600)),
                              Text(method['desc']!,
                                  style: const TextStyle(
                                      color: AppColors.warmGray,
                                      fontSize: 12)),
                            ],
                          ),
                        ),
                        Icon(
                          _paymentMethod == method['id']
                              ? Icons.radio_button_checked
                              : Icons.radio_button_off,
                          color: _paymentMethod == method['id']
                              ? AppColors.primary
                              : AppColors.warmGray,
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              )),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Order Total',
                          style: TextStyle(color: AppColors.warmGray)),
                      Text(
                        '₦${NumberFormat('#,##0', 'en_US').format(cartProvider.total)}',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _isProcessing ? null : _placeOrder,
            child: Text(_isProcessing ? 'PROCESSING...' : 'PLACE ORDER'),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewStep(CartProvider cartProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Order Review',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          const Text('Review your order before confirming',
              style: TextStyle(color: AppColors.warmGray)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _isProcessing ? null : _placeOrder,
            child: Text(_isProcessing ? 'PLACING...' : 'CONFIRM ORDER'),
          ),
        ],
      ),
    );
  }
}