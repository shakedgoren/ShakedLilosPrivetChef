import React from 'react';
import { View } from 'react-native';
import { SymbolView, type SFSymbol, type SymbolViewProps } from 'expo-symbols';

type Props = {
  ios: SFSymbol;
  web: string;
  size: number;
  color: string;
  animationSpec?: SymbolViewProps['animationSpec'];
  fallback?: React.ReactNode;
};

/** אייקון מערכת · SF Symbols ב-iOS, Material Symbols באנדרואיד */
export function IconGlyph({ ios, web, size, color, animationSpec, fallback }: Props) {
  const name = { ios, android: web, web } as SymbolViewProps['name'];
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      type="monochrome"
      resizeMode="scaleAspectFit"
      animationSpec={animationSpec}
      fallback={fallback ?? <View style={{ width: size, height: size }} />}
      style={{ width: size, height: size }}
    />
  );
}
