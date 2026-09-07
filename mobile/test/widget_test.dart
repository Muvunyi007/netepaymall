import 'package:flutter_test/flutter_test.dart';

import 'package:premium_mall/main.dart';

void main() {
  testWidgets('Premium Mall app builds', (WidgetTester tester) async {
    await tester.pumpWidget(const PremiumMallApp());
    await tester.pump();
    expect(find.byType(PremiumMallApp), findsOneWidget);
  });
}