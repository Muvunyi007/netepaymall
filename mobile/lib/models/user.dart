class User {
  final String id;
  final String email;
  final String? phone;
  final String firstName;
  final String lastName;
  final String role;
  final bool isActive;
  final bool isVerified;
  final String? avatarUrl;

  User({
    required this.id,
    required this.email,
    this.phone,
    required this.firstName,
    required this.lastName,
    this.role = 'USER',
    this.isActive = true,
    this.isVerified = false,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      role: json['role'] ?? 'USER',
      isActive: json['is_active'] ?? true,
      isVerified: json['is_verified'] ?? false,
      avatarUrl: json['avatar_url'],
    );
  }

  String get fullName => '$firstName $lastName';
}

class Address {
  final String id;
  final String label;
  final String firstName;
  final String lastName;
  final String phone;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String postalCode;
  final String country;
  final bool isDefault;

  Address({
    required this.id,
    required this.label,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.postalCode,
    this.country = 'Nigeria',
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id']?.toString() ?? '',
      label: json['label'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      phone: json['phone'] ?? '',
      addressLine1: json['address_line1'] ?? '',
      addressLine2: json['address_line2'],
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      postalCode: json['postal_code'] ?? '',
      country: json['country'] ?? 'Nigeria',
      isDefault: json['is_default'] ?? false,
    );
  }
}