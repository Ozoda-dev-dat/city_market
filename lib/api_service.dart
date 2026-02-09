import 'package:dio/dio.dart';

class ApiService {
  late Dio dio;
  static const String baseUrl = 'http://localhost:8000/api';

  ApiService() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 3),
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Mock JWT for now
        options.headers['Authorization'] = 'Bearer mock_jwt_token';
        return handler.next(options);
      },
    ));
  }

  Future<List<dynamic>> getProducts() async {
    try {
      final response = await dio.get('/products');
      return response.data;
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> createOrder(List<Map<String, dynamic>> items) async {
    try {
      final response = await dio.post('/orders', data: {'items': items});
      return response.data;
    } catch (e) {
      return null;
    }
  }
}
