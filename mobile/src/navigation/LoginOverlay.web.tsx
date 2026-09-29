import React from 'react';
import { Modal } from 'react-native';
import { useNav } from './store';
import { PageWash } from '../components/PageWash';

const LoginScreen = React.lazy(() =>
  import('../screens/LoginScreen').then((m) => ({ default: m.LoginScreen })),
);

/**
 * אותה שכבה · בדפדפן מסך ההתחברות (כולל גוגל) נטען רק כשהיא נפתחת.
 */
export function LoginOverlay() {
  const { loginOverlay, closeLogin } = useNav();
  if (!loginOverlay) return null;
  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={closeLogin}>
      <PageWash />
      <React.Suspense fallback={null}>
        <LoginScreen mode="in" />
      </React.Suspense>
    </Modal>
  );
}
