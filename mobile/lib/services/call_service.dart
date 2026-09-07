import 'package:url_launcher/url_launcher.dart';

class CallService {
  static const String _supportNumber = '+250XXXXXXXXX';

  Future<void> callSupport() async {
    const url = 'tel:$_supportNumber';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  Future<void> callNumber(String number) async {
    final url = 'tel:$number';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }
}