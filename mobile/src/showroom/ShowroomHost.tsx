import React from 'react';
import { SHOWROOM } from '../showroom';
import { onShowroomRequest } from '../showroomCta';
import { EnquirySheet } from './EnquirySheet';

/**
 * מה שנפתח כשלוחצים ״להזמנה״ בגרסת הראווה.
 *
 * ⚠ **המאזין שהיה חסר** · `showroomCta.ts` הכריז ״נלחץ״ ורשם
 * אזהרה ביומן כשאין מי שיקשיב, כי כפתור שלא עושה כלום הוא באג.
 * זה המאזין.
 *
 * ⚠ **למה הטופס ולא הורדת האפליקציה · החלטה שצריכה אישור** ·
 * שקד ביקשה שהכפתור יוביל להורדת האפליקציה, והאפליקציות **עוד
 * לא בחנויות** (`ios` ו-`android` ריקים בנתונים). הבחירה כאן היא
 * הדבר היחיד שמייצר ערך היום: הלקוחה משאירה פרטים, שקד מקבלת
 * וואטסאפ, וההזמנה נסגרת בשיחה — בדיוק המסלול של עמוד הנחיתה.
 * ביום שהאפליקציות יעלו, השינוי הוא כאן בלבד.
 *
 * ⚠ **המיקום ניתן להזזה** · היום זו נקודת הכניסה היחידה שמחוברת.
 * בעמוד הנחיתה הטופס הוא מקטע משלו (`#event`), ואם שקד תרצה אותו
 * כך גם כאן — לשוני בתפריט התחתון או למקטע בדף הבית — הרכיב
 * עצמו לא משתנה, רק מי פותח אותו.
 *
 * ⚠ **לא מורכב מחוץ לגרסת הראווה** · באפליקציה הרגילה כפתורי
 * ההמשך ממשיכים להזמנה אמיתית, ואין מי שיכריז.
 */
export function ShowroomHost() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!SHOWROOM) return;
    return onShowroomRequest(() => setOpen(true));
  }, []);

  if (!SHOWROOM) return null;

  return <EnquirySheet open={open} onClose={() => setOpen(false)} />;
}
