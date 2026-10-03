import React from 'react';
import { Text, View } from 'react-native';
import { MATERIAL_GLYPH } from './materialGlyphs';

type Props = {
  ios?: string;
  web: string;
  size: number;
  color: string;
  animationSpec?: unknown;
  fallback?: React.ReactNode;
};

/**
 * אותו סימן של Material Symbols, בלי גופן האייקונים המלא (~1MB).
 * בדפדפן expo-symbols ממילא לא מצייר SF Symbols.
 */
export function IconGlyph({ web, size, color, fallback }: Props) {
  const glyph = MATERIAL_GLYPH[web];
  if (!glyph) return <>{fallback ?? <View style={{ width: size, height: size }} />}</>;
  return (
    <Text
      style={{
        fontFamily: 'MaterialSymbolsSubset',
        color,
        fontSize: size,
        lineHeight: size,
        width: size,
        height: size,
      }}
    >
      {glyph}
    </Text>
  );
}
