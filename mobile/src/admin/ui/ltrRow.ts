import { IS_RTL } from '../../theme/rtl';
import type { FlexStyle } from 'react-native';

/**
 * שורה שנשארת משמאל לימין גם כשהאפליקציה ב-RTL.
 * בקנבס יש שורות עם `direction: ltr` — שורת החודשים של הגרף וחצי הלוח.
 * ב-React Native אין `direction` בסגנון; RTL הופך גם `row` וגם `row-reverse`,
 * ולכן `row-reverse` תחת RTL מצייר בפועל משמאל לימין.
 */
export const LTR_ROW: FlexStyle['flexDirection'] = IS_RTL ? 'row-reverse' : 'row';
