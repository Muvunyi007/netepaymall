import 'package:flutter/material.dart';

/// Fades + slides a child into view once when it is first built.
/// Used to give lists and cards a gentle, staggered feel on entry.
class AnimatedReveal extends StatefulWidget {
  final Widget child;
  final Curve curve;
  final Duration duration;
  final Offset offset;
  final double beginOpacity;
  final Duration delay;

  const AnimatedReveal({
    super.key,
    required this.child,
    this.curve = Curves.easeOut,
    this.duration = const Duration(milliseconds: 500),
    this.offset = const Offset(0, 0.12),
    this.beginOpacity = 0,
    this.delay = Duration.zero,
  });

  @override
  State<AnimatedReveal> createState() => _AnimatedRevealState();
}

class _AnimatedRevealState extends State<AnimatedReveal>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    final curved = CurvedAnimation(parent: _controller, curve: widget.curve);
    _opacity = Tween(begin: widget.beginOpacity, end: 1.0).animate(curved);
    _slide = Tween(begin: widget.offset, end: Offset.zero).animate(curved);
    if (widget.delay == Duration.zero) {
      _controller.forward();
    } else {
      Future.delayed(widget.delay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: widget.child,
      ),
    );
  }
}