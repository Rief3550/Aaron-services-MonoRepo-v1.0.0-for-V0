// ========================================
// CONFIGURACIÓN PARA APP MÓVIL FLUTTER
// ========================================

// 📱 archivo: lib/config/api_config.dart (o similar)

class ApiConfig {
  // 🌐 IMPORTANTE: Cambiar según tu entorno
  
  // Para DISPOSITIVO FÍSICO (mismo WiFi que tu Mac):
  static const String baseUrl = 'http://192.168.1.72:3100';
  
  // Para EMULADOR ANDROID:
  // static const String baseUrl = 'http://10.0.2.2:3100';
  
  // Para EMULADOR iOS:
  // static const String baseUrl = 'http://localhost:3100';
  
  // Endpoints
  static const String authEndpoint = '/auth';
  static const String opsEndpoint = '/ops';
  
  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}

// ========================================
// CREDENCIALES DE PRUEBA
// ========================================
// Email: mobile@test.com
// Password: test123
// 
// Este usuario tiene:
// ✅ Estado ACTIVO
// ✅ Propiedad activa
// ✅ Suscripción activa
// ✅ Puede crear work orders
// ========================================

// ========================================
// EJEMPLO DE CREACIÓN DE WORK ORDER
// ========================================
/*
Future<void> createWorkOrder() async {
  final response = await http.post(
    Uri.parse('${ApiConfig.baseUrl}/ops/work-orders/request'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken', // Token obtenido del login
    },
    body: jsonEncode({
      'serviceCategory': 'plomería',
      'situacion': 'Fuga de agua en la cocina',
      'peligroAccidente': 'NO',
      'observaciones': 'Se cerró la llave de paso',
      'canal': 'APP',
    }),
  );
  
  if (response.statusCode == 201) {
    print('✅ Work order creada!');
    print(jsonDecode(response.body));
  } else {
    print('❌ Error: ${response.body}');
  }
}
*/

// ========================================
// VERIFICAR CONECTIVIDAD
// ========================================
/*
Future<bool> testConnection() async {
  try {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/auth/health'),
    ).timeout(Duration(seconds: 5));
    
    return response.statusCode == 200;
  } catch (e) {
    print('❌ No se puede conectar al backend: $e');
    return false;
  }
}
*/
