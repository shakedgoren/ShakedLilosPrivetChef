import { I18nManager } from 'react-native';
import type { FlexStyle } from 'react-native';

/**
 * שורה שנשארת משמאל לימין גם כשהאפליקציה ב-RTL.
 * בקנבס יש שורות עם `direction: ltr` — שורת החודשים של הגרף וחצי הלוח.
 * ב-React Native אין `direction` בסגנון; RTL הופך גם `row` וגם `row-reverse`,
 * ולכן `row-reverse` תחת RTL מצייר בפועל משמאל לימין.
 */
export const LTR_ROW: FlexStyle['flexDirection'] = I18nManager.isRTL ? 'row-reverse' : 'row';
