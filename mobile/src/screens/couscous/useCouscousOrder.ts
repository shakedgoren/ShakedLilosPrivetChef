import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CITIES,
  CLOCK_FALLBACK,
  COUSCOUS_MENU,
  DELIVERY_MIN_MEALS,
  clampPickupClock,
  countMeals,
  isAddressValid,
  orderLines,
  orderTotal,
} from '../../data/couscous';

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

export function useCouscousOrder() {
  const [qty, setQty] = useState<number[]>(() => COUSCOUS_MENU.map(() => 0));
  const [step, setStep] = useState<number>(STEP.closed);
  const [ship, setShip] = useState<Ship>(null);
  const [time, setTime] = useState<string | null>(null);
  const [clock, setClock] = useState(CLOCK_FALLBACK);
  const [city, setCity] = useState(CITIES[0]);
  const [addr, setAddr] = useState('');
  const [pay, setPay] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meals = countMeals(qty);
  const total = orderTotal(qty);
  const lines = useMemo(() => orderLines(qty), [qty]);
  const isDelivery = ship === 'deliv';

  /* עדכון כמות · תמיד מערך חדש, בלי לשנות את הקיים */
  const bump = useCallback((i: number, d: number) => {
    setQty((prev) => prev.map((v, k) => (k === i ? Math.max(0, v + d) : v)));
  }, []);

  const flash = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(true);
    toastTimer.current = setTimeout(() => setToast(false), TOAST_MS);
  }, []);

  /* מתחת למינימום המשלוח · הודעה, בלי לעבור שלב */
  const wantDelivery = useCallback(() => {
    if (meals < DELIVERY_MIN_MEALS) {
      flash();
      return;
    }
    setShip('deliv');
    setTime(null);
    setStep(STEP.time);
  }, [meals, flash]);

  const wantPickup = useCallback(() => {
    setShip('self');
    setTime(null);
    setStep(STEP.time);
  }, []);

  /* ההצמדה רצה ביציאה מהשדה, לא תוך כדי הקלדה */
  const settleClock = useCallback(() => setClock((c) => clampPickupClock(c)), []);

  const clockNext = useCallback(() => {
    const c = clampPickupClock(clock);
    setClock(c);
    setTime(c);
    setStep(STEP.pay);
  }, [clock]);

  const pickSlot = useCallback((t: string) => {
    setTime(t);
    setStep(STEP.address);
  }, []);

  const addressNext = useCallback(() => {
    if (isAddressValid(addr)) setStep(STEP.pay);
  }, [addr]);

  const pickPay = useCallback((p: string) => {
    setPay(p);
    setStep(STEP.done);
  }, []);

  const reset = useCallback(() => {
    setStep(STEP.closed);
    setShip(null);
    setTime(null);
    setPay(null);
  }, []);

  return {
    qty, bump, meals, total, lines,
    step, setStep, ship, isDelivery,
    time, clock, setClock, settleClock, clockNext, pickSlot,
    city, setCity, addr, setAddr, addressNext, addressOk: isAddressValid(addr),
    pay, pickPay,
    toast, wantDelivery, wantPickup, reset,
  };
}
