import React from 'react';

/** סרגל הניהול לא נכנס לבאנדל של האורחת */
export const AdminChrome = React.lazy(() =>
  import('../admin/AdminNav').then((m) => ({ default: m.AdminNav })),
);
