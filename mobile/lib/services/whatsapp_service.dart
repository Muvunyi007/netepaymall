import 'package:url_launcher/url_launcher.dart';

class WhatsAppService {
  static const String _defaultNumber = '250XXXXXXXXX';

  Future<void> openChat({
    String? orderNumber,
    String? productName,
    String? orderStatus,
    String? context,
  }) async {
    const number = '250XXXXXXXXX';
    final message = _buildMessage(
      orderNumber: orderNumber,
      productName: productName,
      orderStatus: orderStatus,
      context: context,
    );

    final encoded = Uri.encodeComponent(message);
    final url = 'https://wa.me/$number?text=$encoded';

    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    }
  }

  String _buildMessage({
    String? orderNumber,
    String? productName,
    String? orderStatus,
    String? context,
  }) {
    if (orderNumber != null) {
      return 'Hello, I need help with my order $orderNumber.${orderStatus != null ? ' Status: $orderStatus.' : ''}';
    }
    if (productName != null) {
      return "Hello, I'm interested in $productName.";
    }
    if (context == 'payment') return 'Hello, I need help with a payment issue.';
    if (context == 'delivery') return 'Hello, I need help with my delivery.';
    if (context == 'return') return 'Hello, I would like to request a return.';
    return 'Hello, I need help.';
  }
}