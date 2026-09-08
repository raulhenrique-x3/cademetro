import React from 'react';
import { Image, ImageStyle } from 'expo-image';
import { StyleProp } from 'react-native';

export interface SplashLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function SplashLogo({ size = 200, style }: SplashLogoProps) {
  return (
    <Image
      source={require('@/assets/images/splash-icon.png')}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      priority="high"
      accessibilityLabel="Cadê Metrô logo"
    />
  );
}
