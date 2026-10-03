import React from 'react';
import { Modal } from 'react-native';
import { useNav } from './store';
import { PageWash } from '../components/PageWash';
import { LoginScreen } from '../screens/LoginScreen';

/**
 * שכבת ההתחברות · נפתחת מעל המסך הנוכחי מתוך חסם ההתחברות.
 * ⚠ חייבת להיות שכבה ולא מסך · מעבר אמיתי מפרק את מסך ההזמנה
 * ומאפס את הבחירות, בניגוד למה שהחסם מבטיח.
 */
export function LoginOverlay() {
  const { loginOverlay, closeLogin } = useNav();
  if (!loginOverlay) return null;
  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={closeLogin}>
      <PageWash />
      <LoginScreen mode="in" />
    </Modal>
  );
}
