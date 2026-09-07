import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshToken = await _storage.read(key: 'refresh_token');
          if (refreshToken != null) {
            try {
              final response = await dio.post(
                '/auth/refresh',
                data: {'refresh_token': refreshToken},
              );
              final accessToken = response.data['access_token'];
              await _storage.write(key: 'access_token', value: accessToken);
              error.requestOptions.headers['Authorization'] = 'Bearer $accessToken';
              final retry = await dio.fetch(error.requestOptions);
              return handler.resolve(retry);
            } catch (_) {}
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    final response = await dio.get(path, queryParameters: query);
    return response.data;
  }

  Future<dynamic> post(String path, {dynamic data}) async {
    final response = await dio.post(path, data: data);
    return response.data;
  }

  Future<dynamic> patch(String path, {dynamic data}) async {
    final response = await dio.patch(path, data: data);
    return response.data;
  }

  Future<dynamic> delete(String path) async {
    final response = await dio.delete(path);
    return response.data;
  }
}