import 'package:flutter/material.dart';
import 'auth_notifier.dart';

class AuthScope extends InheritedNotifier<AuthNotifier> {
  const AuthScope({
    super.key,
    required AuthNotifier super.notifier,
    required super.child,
  });

  static AuthNotifier of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AuthScope>();
    assert(scope != null, 'No AuthScope found in context');
    return scope!.notifier!;
  }
}
