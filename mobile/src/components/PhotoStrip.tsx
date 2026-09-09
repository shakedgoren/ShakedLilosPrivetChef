import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Photo } from './Photo';
import { radius } from '../theme/tokens';

type Props = {
  names: readonly string[];
  /** גובה האריח */
  height: number;
  /** רוחב אריח · בלי זה כל תמונה ממלאת את הרוחב */
  tileWidth?: number;
  rgb?: string;
};

/* מעל הסף הזה הנקודות נעשות עמוסות · מחליקים בלעדיהן */
const MAX_DOTS = 6;

/** קרוסלת תמונות אופקית · בית, שף וטאבון */
export function PhotoStrip({ names, height, tileWidth, rgb }: Props) {
  const [i, setI] = useState(0);
  const [pageW, setPageW] = useState(0);
  if (names.length === 0) return null;

  const paging = tileWidth == null;
  const shotW = tileWidth ?? (pageW || undefined);

  return (
    <View onLayout={(e) => setPageW(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        pagingEnabled={paging}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={tileWidth ? tileWidth + 10 : undefined}
        contentContainerStyle={tileWidth ? s.gap : undefined}
        onMomentumScrollEnd={(e) => {
          const w = tileWidth ? tileWidth + 10 : e.nativeEvent.layoutMeasurement.width;
          if (!w) return;
          setI(Math.round(e.nativeEvent.contentOffset.x / w));
        }}
      >
        {names.map((name) => (
          <Photo
            key={name}
            name={name}
            rgb={rgb}
            style={[s.shot, { height, width: shotW, borderRadius: radius.tile }]}
          />
        ))}
      </ScrollView>
      {paging && names.length > 1 && names.length <= MAX_DOTS ? (
        <View style={s.dots}>
          {names.map((name, k) => (
            <Pressable
              key={name}
              onPress={() => setI(k)}
              style={[s.dot, { width: k === i ? 16 : 5, opacity: k === i ? 1 : 0.35 }]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  gap: { gap: 10 },
  shot: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { height: 5, borderRadius: 999, backgroundColor: '#A85A28' },
});
