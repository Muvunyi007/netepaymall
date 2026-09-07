import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/api_client.dart';
import '../models/user.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<User> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    final response = await _api.post('/auth/register', data: {
      'email': email,
      'password': password,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
    });

    await _saveTokens(response);
    return User.fromJson(response['user']);
  }

  Future<User> login({
    required String email,
    required String password,
  }) async {
    final response = await _api.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    await _saveTokens(response);
    return User.fromJson(response['user']);
  }

  Future<User?> getCurrentUser() async {
    try {
      final response = await _api.get('/auth/me');
      return User.fromJson(response);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
    await _storage.delete(key: 'user');
  }

  Future<void> _saveTokens(Map<String, dynamic> response) async {
    await _storage.write(key: 'access_token', value: response['access_token']);
    await _storage.write(key: 'refresh_token', value: response['refresh_token']);
    await _storage.write(
        key: 'user', value: jsonEncode(response['user'] as Map<String, dynamic>));
  }

  Future<User?> getCachedUser() async {
    final raw = await _storage.read(key: 'user');
    if (raw == null || raw.isEmpty) return null;
    try {
      return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<bool> hasToken() async {
    final token = await _storage.read(key: 'access_token');
    return token != null && token.isNotEmpty;
  }
}