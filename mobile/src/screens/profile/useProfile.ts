import { useCallback, useMemo, useState } from 'react';
import { PASS_MIN, PLACES, SEED, SHIP_CITIES, STREETS } from '../../data/profile';

export type Form = { name: string; phone: string; mail: string; addr: string };
export type Pass = { cur: string; next: string; again: string };

const EMPTY_PASS: Pass = { cur: '', next: '', again: '' };
const MAX_SUGGESTIONS = 4;

const trim = (v: string) => String(v ?? '').trim();
/** טלפון ישראלי · 05X ואחריו שבע ספרות, עם או בלי מקף */
const okPhone = (v: string) => /^0(5\d|[2-4,8-9])-?\d{7}$/.test(trim(v).replace(/\s/g, ''));
const okMail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trim(v));

/** העיר מתוך ״רחוב 14, עיר״ */
const cityOf = (v: string) => {
  const after = String(v ?? '').split(',').pop()?.trim() ?? '';
  return Object.keys(STREETS).find((c) => c === after) ?? '';
};

export function useProfile() {
  const [form, setForm] = useState<Form>({ ...SEED });
  /* מה שנשמר לאחרונה · מולו נמדד ״יש מה לשמור״ */
  const [base, setBase] = useState<Form>({ ...SEED });
  const [saved, setSaved] = useState(false);
  const [pass, setPass] = useState<Pass>(EMPTY_PASS);
  const [passOpen, setPassOpen] = useState(false);
  const [outOpen, setOutOpen] = useState(false);

  const set = useCallback((id: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [id]: v }));
    setSaved(false);
  }, []);

  const errors = {
    name: trim(form.name) === '',
    phone: !okPhone(form.phone),
    /* אימייל אינו חובה · נבדק רק אם הוקלד משהו */
    mail: trim(form.mail) !== '' && !okMail(form.mail),
    addr: trim(form.addr) === '',
  };
  const hasError = Object.values(errors).some(Boolean);
  const dirty = (Object.keys(base) as (keyof Form)[]).some((k) => form[k] !== base[k]);
  const canSave = !hasError && dirty;

  const save = useCallback(() => {
    if (!canSave) return;
    /* מה שנשמר הופך לבסיס החדש · ולכן הכפתור חוזר להיות אפור */
    setSaved(true);
    setBase({ ...form });
  }, [canSave, form]);

  /* ── סיסמה ── */
  const setPassField = useCallback(
    (id: keyof Pass, v: string) => setPass((p) => ({ ...p, [id]: v })),
    [],
  );
  const passErrors = {
    next: trim(pass.next) !== '' && trim(pass.next).length < PASS_MIN,
    again: trim(pass.again) !== '' && pass.again !== pass.next,
  };
  const passReady =
    trim(pass.cur) !== '' &&
    trim(pass.next).length >= PASS_MIN &&
    pass.again === pass.next &&
    !Object.values(passErrors).some(Boolean);

  const savePass = useCallback(() => {
    if (!passReady) return;
    setPassOpen(false);
    setPass(EMPTY_PASS);
    setSaved(true);
  }, [passReady]);

  const closePass = useCallback(() => {
    setPassOpen(false);
    setPass(EMPTY_PASS);
  }, []);

  /* ההשלמה · מחפשת גם ברחוב וגם בעיר, ומרכיבה ״רחוב מספר, עיר״ */
  const suggestions = useMemo(() => {
    const raw = trim(form.addr);
    const city = cityOf(raw);
    if (raw.length < 2 || city) return [];
    const num = raw.match(/\d+/)?.[0] ?? '';
    const words = raw.replace(/[,\d]/g, ' ').split(/\s+/).filter(Boolean);
    return PLACES.filter((pl) =>
      words.some((w) => pl.street.indexOf(w) === 0 || pl.city.indexOf(w) === 0),
    )
      .slice(0, MAX_SUGGESTIONS)
      .map((pl) => `${pl.street}${num ? ' ' + num : ''}, ${pl.city}`);
  }, [form.addr]);

  const city = cityOf(form.addr);
  const noShip = !!city && !SHIP_CITIES.includes(city);

  return {
    form, errors, saved, canSave, suggestions, noShip,
    pass, passErrors, passReady, passOpen, outOpen,
    set, save, setPassField, savePass, closePass,
    openPass: useCallback(() => setPassOpen(true), []),
    askOut: useCallback(() => setOutOpen(true), []),
    cancelOut: useCallback(() => setOutOpen(false), []),
  };
}
