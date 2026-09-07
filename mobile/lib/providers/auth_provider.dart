import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;

  Future<void> loadInitial() async {
    _isLoading = true;
    notifyListeners();

    final hasToken = await _authService.hasToken();
    if (hasToken) {
      // Restore the last known user from cache immediately so the home
      // screen appears right away even when offline.
      _user = await _authService.getCachedUser();
      _isAuthenticated = _user != null;

      if (_isAuthenticated) {
        notifyListeners();
        // Silently refresh the user profile in the background.
        final freshUser = await _authService.getCurrentUser();
        if (freshUser != null && _user?.id == freshUser.id) {
          _user = freshUser;
        }
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final user = await _authService.login(email: email, password: password);
      _user = user;
      _isAuthenticated = true;
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final user = await _authService.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      );
      _user = user;
      _isAuthenticated = true;
      return true;
    } catch (e) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}