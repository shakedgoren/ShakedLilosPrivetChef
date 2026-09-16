import type { ViewStyle } from 'react-native';

/**
 * `pointerEvents` כסגנון ולא כ-prop.
 *
 * ⚠ **ריאקט־נייטיב הוציא את ה-prop משימוש** · `props.pointerEvents`
 * מדפיס אזהרה בכל רינדור, וזו אחת האזהרות שהצטברו לבאנר השחור
 * שנראה מעל כפתור הכניסה בבילד הפיתוח. 16 בספטמבר 2026.
 */
export const NO_TOUCH: ViewStyle = { pointerEvents: 'none' };
export const PASS_TOUCH: ViewStyle = { pointerEvents: 'box-none' };
