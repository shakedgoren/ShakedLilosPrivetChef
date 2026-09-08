import { useCallback, useRef, useState } from 'react';
import { CITIES } from '../data/shared';
import { hhmm, isAddressValid, toMinutes, type FulfillmentConfig } from './types';

/** שלבי ההזמנה · 0 = סגור, 6 = מסך האישור */
export const STEP = {
  closed: 0,
  ship: 1,
  time: 2,
  address: 3,
  pay: 4,
  done: 5,
  confirm: 6,
} as const;

export type Ship = 'self' | 'deliv' | null;

const TOAST_MS = 2800;

/**
 * מסירה ותשלום · הזרימה זהה בכל הקטגוריות ולכן היא יושבת כאן פעם אחת.
 * מה שמשתנה בין קטגוריות הוא רק חלונות הזמן והמינימום למשלוח.
 */
export function useFulfillment(cfg: FulfillmentConfig) {
  const fallback = cfg.clockFallback ?? '12:00';
  const [step, setStep] = useState<number>(STEP.closed);
  const [ship, setShip] = useState<Ship>(null);
  const [time, setTime] = useState<string | null>(null);
  const [clock, setClock] = useState(fallback);
  const [city, setCity] = useState(CITIES[0]);
  const [addr, setAddr] = useState('');
  const [pay, setPay] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* שעה מחוץ לטווח נתפסת פנימה · ההצמדה רצה ביציאה מהשדה, לא תוך כדי הקלדה */
  const clamp = useCallback(
    (v: string) => {
      const m = toMinutes(v);
      if (m === null) return fallback;
      return hhmm(Math.min(cfg.pickupTo, Math.max(cfg.pickupFrom, m)));
    },
    [cfg.pickupFrom, cfg.pickupTo, fallback],
  );

  const flash = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(true);
    toastTimer.current = setTimeout(() => setToast(false), TOAST_MS);
  }, []);

  const wantDelivery = useCallback(() => {
    const min = cfg.minMealsForDelivery;
    if (min !== undefined && (cfg.meals ?? 0) < min) {
      flash();
      return;
    }
    setShip('deliv');
    setTime(null);
    setStep(STEP.time);
  }, [cfg.minMealsForDelivery, cfg.meals, flash]);

  const wantPickup = useCallback(() => {
    setShip('self');
    setTime(null);
    setStep(STEP.time);
  }, []);

  const settleClock = useCallback(() => setClock((c) => clamp(c)), [clamp]);

  const clockNext = useCallback(() => {
    const c = clamp(clock);
    setClock(c);
    setTime(c);
    setStep(STEP.pay);
  }, [clamp, clock]);

  const pickSlot = useCallback((t: string) => {
    setTime(t);
    setStep(STEP.address);
  }, []);

  const addressOk = isAddressValid(addr);

  const addressNext = useCallback(() => {
    if (addressOk) setStep(STEP.pay);
  }, [addressOk]);

  const pickPay = useCallback((p: string) => {
    setPay(p);
    setStep(STEP.done);
  }, []);

  const open = useCallback(() => setStep(STEP.ship), []);

  const reset = useCallback(() => {
    setStep(STEP.closed);
    setShip(null);
    setTime(null);
    setPay(null);
  }, []);

  return {
    cfg,
    step, setStep, open, reset,
    ship, isDelivery: ship === 'deliv',
    time, clock, setClock, settleClock, clockNext, pickSlot,
    city, setCity, addr, setAddr, addressNext, addressOk,
    pay, pickPay,
    toast, wantDelivery, wantPickup,
  };
}

export type Fulfillment = ReturnType<typeof useFulfillment>;
