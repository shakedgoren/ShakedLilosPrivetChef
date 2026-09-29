import React from 'react';

const Lazy = React.lazy(() =>
  import('./LottieConfetti').then((m) => ({ default: m.Confetti })),
);

/** קונפטי רק כשצריך · lottie לא נכנס לבאנדל של דף הבית */
export function Confetti(props: { onDone?: () => void }) {
  return (
    <React.Suspense fallback={null}>
      <Lazy {...props} />
    </React.Suspense>
  );
}
