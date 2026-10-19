'use client';

import { motion } from "framer-motion";
import React from "react";

type PlayfulShapeProps = {
  type?: 'circle' | 'triangle' | 'square' | 'donut' | 'blob';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  animation?: 'float' | 'pulse' | 'rotate' | 'none';
  className?: string;
};

export function PlayfulShape({
  type = 'circle',
  color = 'bg-pastel-blue',
  size = 'md',
  position = 'top-right',
  animation = 'float',
  className = ''
}: PlayfulShapeProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36'
  };

  // Position classes
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'center-left': 'top-1/2 -translate-y-1/2 left-0',
    'center-right': 'top-1/2 -translate-y-1/2 right-0'
  };

  // Animation variants
  const animations = {
    float: {
      animate: { y: [0, -15, 0] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    pulse: {
      animate: { scale: [1, 1.1, 1] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    rotate: {
      animate: { rotate: 360 },
      transition: { duration: 8, repeat: Infinity, ease: "linear" }
    },
    none: {
      animate: {},
      transition: {}
    }
  };

  // Shapes
  const shapes = {
    circle: `rounded-full ${sizeClasses[size]} ${color}`,
    triangle: `${sizeClasses[size]} triangle ${color}`,
    square: `${sizeClasses[size]} ${color}`,
    donut: `${sizeClasses[size]} rounded-full border-8 ${color.replace('bg-', 'border-')}`,
    blob: `${sizeClasses[size]} blob ${color}`
  };

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} ${shapes[type]} ${className}`}
      animate={animations[animation].animate}
      transition={animations[animation].transition}
    />
  );
}
