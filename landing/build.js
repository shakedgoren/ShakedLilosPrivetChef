/* ==========================================================================
   BITE & TELL · בניית העמוד.
   ⚠ מצב הצבע · בהיר לפי ערכה 11 (לילך האפליקציה), כהה לפי ערכה 07 (שזיף).
   ⚠ פריסת התפריט נקבעת ב-CSS בלבד · אריחים בנייד, מגזין במחשב.
   ⚠ מאודות ומטה הכול ממורכז · לבקשת שקד, 22 בספטמבר 2026.
   ========================================================================== */

/** כותב טקסט לאלמנט אם הוא קיים · חוסך בדיקות חוזרות */
function set(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

/** ⚠ כל הכותרות באות מ-data.js · אין טקסט קשיח ב-HTML */
function buildCopy() {
  set('menuEye', MENU_INTRO.eyebrow);
  set('menuTitle', MENU_INTRO.title);
  set('galEye', GALLERY_COPY.eyebrow);
  set('galTitle', GALLERY_COPY.title);
  set('galSub', GALLERY_COPY.sub);
  set('evEye', EVENT_CARD.eyebrow);
  set('fTag', FOOTER.tagline);

}

/**
 * מצב פעיל בניווט · **נמדד בכל גלילה ולא דרך IntersectionObserver**.
 * ⚠ המשקיף התברר כלא אמין כאן: מקטע התפריט לבדו הוא כ-12,000 פיקסל,
 *   וכשכמה מקטעים חוצים את הרצועה בו-זמנית — האחרון שנורה ניצח,
 *   ולפעמים הוא לא היה זה שבמסך. כאן פשוט מחפשים בכל גלילה את
 *   המקטע שחוצה קו קבוע מתחת לניווט, וזו תשובה חד-משמעית.
 */
function buildSpy() {
  var links = Array.prototype.slice.call(document.querySelectorAll('#nv a'));
  if (!links.length) return;

  var rows = links
    .map(function (a) { return { a: a, el: document.querySelector(a.getAttribute('href')) }; })
    .filter(function (r) { return r.el; });
  if (!rows.length) return;

  function tick() {
    var nav = document.querySelector('.nav');
    var line = (nav ? nav.getBoundingClientRect().height : 0) + 40;
    var cur = null;

    rows.forEach(function (r) {
      var box = r.el.getBoundingClientRect();
      if (box.top <= line && box.bottom > line) cur = r;
    });
    /* בין מקטעים · נשארים על האחרון שכבר עברנו */
    if (!cur) {
      rows.forEach(function (r) {
        if (r.el.getBoundingClientRect().top <= line) cur = r;
      });
    }
    /* בתחתית העמוד תמיד מסמנים את המקטע האחרון */
    var doc = document.documentElement;
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) cur = rows[rows.length - 1];

    links.forEach(function (a) { a.classList.remove('on'); });
    if (cur) cur.a.classList.add('on');
  }

  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);
  tick();
}

function buildNav() {
  var nv = document.getElementById('nv');
  if (!nv) return;
  nv.innerHTML = NAV.map(function (i) {
    return '<a href="' + i.href + '">' + i.label + '</a>';
  }).join('');
}

/** כפתור עם אייקון · הטקסט מגיע מ-data-label שבתגית עצמה */
function dress(el, icon) {
  if (!el) return;
  var text = el.dataset.label || el.textContent.trim();
  el.innerHTML = ICON[icon] + '<span>' + text + '</span>';
}

function buildContact() {
  ['tel', 'tel2'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.href = 'tel:' + CONTACT.phoneTel;
    dress(el, 'phone');
  });
  ['wa', 'wa2'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.href = wa(CONTACT.waText);
    dress(el, 'wa');
  });
  /* ⚠ הסיום הוא מידע בלבד · בלי כפתורים ובלי ניווט · לבקשת שקד.
     הטלפון נשאר קישור כדי שאפשר יהיה לחייג ממנו בנייד, אבל הוא
     מעוצב כטקסט ולא ככפתור. */
  var n = document.getElementById('fnote');
  if (n) {
    n.innerHTML = FOOTER.address + '<i>·</i>' +
      '<a href="tel:' + CONTACT.phoneTel + '">' + CONTACT.phoneHuman + '</a>';
  }
}

/**
 * מצב הצבע · שלושה מצבים: בחירה מפורשת בהיר, בחירה מפורשת כהה,
 * וברירת המחדל שהולכת אחרי מערכת ההפעלה של המבקר.
 * ⚠ localStorage עלול לזרוק בחלון פרטי · לכן כל גישה עטופה.
 */
function buildTheme() {
  var btn = document.getElementById('themeBtn');
  if (!btn) return;
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return Boolean(media && media.matches);
  }

  /* שני האייקונים נשארים על המסילה · רק הכפתור העגול זז ביניהם */
  var sun = document.getElementById('mtSun');
  var moon = document.getElementById('mtMoon');
  if (sun) sun.innerHTML = ICON.sun;
  if (moon) moon.innerHTML = ICON.moon;

  function paint() {
    var dark = isDark();
    btn.setAttribute('aria-checked', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', dark ? 'מעבר למצב בהיר' : 'מעבר למצב כהה');
  }

  var saved = null;
  try { saved = localStorage.getItem('bt.theme'); } catch (e) { /* חלון פרטי */ }
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  paint();

  btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('bt.theme', next); } catch (e) { /* חלון פרטי */ }
    paint();
  });

  /* מי שלא בחר ידנית · ממשיך לעקוב אחרי המערכת */
  if (media && media.addEventListener) {
    media.addEventListener('change', function () {
      if (!root.hasAttribute('data-theme')) paint();
    });
  }
}

function buildAbout() {
  var sec = document.getElementById('about');
  if (sec) {
    var eye = sec.querySelector('.eye');
    var h = sec.querySelector('.h2');
    if (eye) eye.textContent = ABOUT.eyebrow;
    if (h) h.textContent = ABOUT.title;
  }
  set('abSub', ABOUT.sub);
  var t = document.getElementById('abtext');
  if (!t) return;
  /* ⚠ שבירות השורה של שקד נשמרות · \n הופך ל-<br> */
  t.innerHTML = ABOUT.lines.map(function (l) {
    var body = l.t.split('\n').join('<br>');
    if (l.pull) return '<p class="abPull">' + body + '</p>';
    if (l.end) return '<p class="abEnd">' + body + '</p>';
    return '<p>' + body + '</p>';
  }).join('');
}

/** ״מ-45 ₪״, או ״לפי הצעה״ לשף */
function priceText(c) { return c.price ? 'מ-' + c.price + ' ' + c.unit : c.unit; }

/**
 * כרטיס מנה · תמונה מצד אחד, השם והמחיר מצד שני.
 * ⚠ הצדדים מתחלפים בין מנה למנה · זה הקצב המדורג שבצילום המסך.
 */
function dishCard(d, i) {
  /* ⚠ **שכבת ריחוף על התמונה · 23 בספטמבר 2026** · שקד בחרה באפשרות ד
     מתוך ארבע התצוגות. התיאור חזר — אבל לא כטקסט קבוע מתחת לשם
     (משם היא הורידה אותו), אלא כשכבה שנפתחת על התמונה.
     ⚠ **בנייד אין ריחוף** · ולכן זו גם לחיצה, ו-`tabindex` נותן
     גישה מהמקלדת. מנה בלי `note` לא מקבלת שכבה בכלל. */
  var over = d.note
    ? '<div class="dOver"><p>' + d.note + '</p></div>'
    : '';
  var interactive = d.note ? ' tabindex="0" role="button" aria-label="תיאור המנה"' : '';
  return '<article class="dish">' +
    '<div class="dph' + (d.note ? ' hasOver' : '') + '"' + interactive + '>' +
      '<img src="' + d.img + '" alt="' + d.name + '" loading="lazy">' +
      '<span class="dno">' + String(i + 1).padStart(2, '0') + '</span>' +
      over +
    '</div>' +
    '<div class="dbd">' +
      '<h4>' + d.name + '</h4>' +
      '<span class="dpr">' + d.price + '</span>' +
    '</div></article>';
}

/** לחיצה על תמונת מנה · פותחת וסוגרת את השכבה בנייד */
function wireDishOverlays() {
  document.querySelectorAll('.dph.hasOver').forEach(function (ph) {
    function toggle() { ph.dataset.open = ph.dataset.open === 'true' ? 'false' : 'true'; }
    ph.addEventListener('click', toggle);
    ph.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}

/**
 * התפריט · לכל קטגוריה **עמוד מפוצל**: הכותרת והמלל נדבקים מימין
 * ולא זזים, והמנות נגללות משמאל. כשנגמרות המנות של קטגוריה —
 * מתחילה הבאה באותו מבנה.
 * ⚠ לפי צילום המסך ששקד שלחה · 22 בספטמבר 2026.
 * ⚠ סדר הצד הדביק: מספר · כותרת · כפתור הזמנה · יתרונות · כותרת
 *   משנה · הסיפור. הכפתור למעלה, כמו שביקשה.
 */
function buildMenu() {
  var all = document.getElementById('menuAll');
  if (!all) return;
  all.innerHTML = CATS.map(function (c) {
    /* ⚠ **שניהם, לא אחד מהם · 23 בספטמבר 2026** · עד היום זה היה
       או/או, ולכן כששקד הוסיפה שלוש הטבות לספיישל השורה
       ״חדש • משתנה • מוגבל״ הייתה נעלמת בשקט. היא לא ביקשה
       למחוק אותה, ולכן שתיהן מוצגות. */
    var perks =
      (c.perks
        ? '<ul class="perks">' + c.perks.map(function (p) {
            return '<li><span class="pe" aria-hidden="true">' + p.e + '</span>' + p.t + '</li>';
          }).join('') + '</ul>'
        : '') +
      (c.tagline ? '<p class="catTag">' + c.tagline + '</p>' : '');

    return '<section class="cat" id="cat-' + c.k + '" style="--cc:' + c.accent + '; --crgb:' + c.rgb + '">' +
      '<div class="catSplit">' +

        '<aside class="catSide">' +
          /* ⚠ הכותרת והכפתור בעטיפה אחת · הכפתור נתלה על תחתית
             הכותרת, ולכן הוא נשאר במקום גם בקטגוריה עם מילה אחת. */
          '<div class="catHead">' +
          '<span class="cno">' + c.n + '</span>' +
          /* ⚠ כל מילה בשורה משלה ובגודל אחר · המילה האחרונה היא
             הגדולה ביותר ובצבע הקטגוריה, כמו בצילום המסך. */
          '<h3 class="catBig">' + c.headLines.map(function (w, i) {
            var last = i === c.headLines.length - 1;
            var cls = last ? 'w-main' : (i % 2 === 0 ? 'w-mid' : 'w-small');
            return '<span class="' + cls + '">' + w + '</span>';
          }).join('') + '</h3>' +
          /* ⚠ **כפתור ״להזמנה״ הוסר · 23 בספטמבר 2026** · בקשת שקד:
             ״בוא נעיף רגע את הכפתור להזמנה מכל העמודים״. `ctaTo`
             נשאר בנתונים כדי שאפשר יהיה להחזיר אותו במילה אחת. */
          '</div>' +
          perks +
          '<p class="catSub">' + c.sub + '</p>' +
          '<div class="catStory">' + c.story.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div>' +
          (c.closing ? '<p class="catClose">' + c.closing + '</p>' : '') +
          /* ⚠ שורת ״N מנות · יום · שעה״ הוחלפה בשורה אחת נטויה עם 🗓️ */
          '<p class="catOpen"><span aria-hidden="true">🗓️</span>' + c.open + '</p>' +
          (c.foot ? '<p class="menuNote">' + c.foot + '</p>' : '') +
        '</aside>' +

        '<div class="catDishes">' +
          MENU[c.k].map(function (d, n) { return dishCard(d, n); }).join('') +
        '</div>' +

      '</div>' +
    '</section>';
  }).join('');
  wireDishOverlays();
}

/** הלשוניות מגלגלות לקטגוריה · לא מחליפות תצוגה */
function buildTabs() {
  var tabs = document.getElementById('menuTabs');
  if (!tabs) return;
  /* ⚠ **הלשונית היא עטיפה ולא כפתור · 23 בספטמבר 2026** · שקד בחרה
     באפשרות ג׳: כפתור ההזמנה יושב בתוך הלשונית הפעילה. קישור בתוך
     `<button>` הוא HTML לא תקין, ולכן הלשונית הפכה למעטפת שמכילה
     שני דברים — כפתור שמגלגל לקטגוריה, וקישור שמזמין.
     ⚠ הקישור מוסתר ב-`display:none` בלשוניות הלא-פעילות · כך הוא
     גם יוצא מסדר הטאבים ומעץ הנגישות בלי טיפול ידני. */
  tabs.innerHTML = CATS.map(function (c) {
    return '<div class="mtab" data-k="' + c.k + '" style="--tc:' + c.accent + '">' +
      '<button class="mtGo" type="button">' +
        '<img src="' + c.img + '" alt="" loading="lazy">' +
        '<span class="mtx"><b>' + c.title + '</b></span>' +
      '</button>' +
      '<a class="mtOrder" href="' + c.ctaTo + '">להזמנה</a>' +
    '</div>';
  }).join('');

  function offset() {
    var nav = document.querySelector('.nav');
    var bar = document.querySelector('.tabsBar');
    return (nav ? nav.getBoundingClientRect().height : 0) +
           (bar ? bar.getBoundingClientRect().height : 0) + 14;
  }

  /* ⚠ המאזין על הכפתור הפנימי בלבד · אחרת לחיצה על ״להזמנה״
     הייתה גם מגלגלת לקטגוריה וגם מנווטת. */
  Array.prototype.forEach.call(tabs.children, function (el) {
    var go = el.querySelector('.mtGo');
    if (go) go.addEventListener('click', function () {
      goToCat(el.dataset.k, offset());
    });
  });

  function mark(k) {
    Array.prototype.forEach.call(tabs.children, function (el) {
      var on = el.dataset.k === k;
      el.setAttribute('aria-current', on ? 'true' : 'false');
      if (on) el.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
  }
  mark(CATS[0].k);

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (r.isIntersecting) mark(r.target.id.replace('cat-', ''));
      });
    }, { rootMargin: '-26% 0px -64% 0px', threshold: 0 });
    CATS.forEach(function (c) {
      var el = document.getElementById('cat-' + c.k);
      if (el) io.observe(el);
    });
  }
}

function goToCat(k, off) {
  var t = document.getElementById('cat-' + k);
  if (!t) return;
  var calc = function () {
    var nav = document.querySelector('.nav');
    var bar = document.querySelector('.tabsBar');
    return (nav ? nav.getBoundingClientRect().height : 0) +
           (bar ? bar.getBoundingClientRect().height : 0) + 14;
  };
  var pad = off === undefined ? calc() : off;
  window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - pad, behavior: 'smooth' });
  /* תיקון אחרי שהאנימציה נרגעה · אותו טיפול כמו בשאר העוגנים */
  setTimeout(function () {
    var now = calc();
    if (Math.abs(t.getBoundingClientRect().top - now) > 8) {
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - now, behavior: 'instant' });
    }
  }, 700);
}

/* ------------------------------------------------------------------ */

function buildGallery() {
  var box = document.getElementById('galleryRails');
  if (!box) return;
  var lanes = 4, per = Math.ceil(GALLERY.length / lanes), html = '';
  for (var r = 0; r < lanes; r++) {
    var set = GALLERY.slice(r * per, (r + 1) * per);
    if (!set.length) continue;
    /* הסט פעמיים · כך הלולאה רציפה ובלי קפיצה בסוף */
    html += '<div class="grail" style="--dur:' + (54 + r * 11) + 's">' +
      set.concat(set).map(function (g) {
        return '<figure class="gshot"><img src="' + g.f + '" alt="' + g.t + '" loading="lazy">' +
          '<figcaption>' + g.t + '</figcaption></figure>';
      }).join('') + '</div>';
  }
  box.innerHTML = html;
}

function buildApp() {
  var box = document.getElementById('appBox');
  if (!box) return;
  var store = function (label, href, sub) {
    return href
      /* ⚠ שורה אחת · ״App Store · בקרוב״ · כמו בקנבס */
      ? '<a class="store" href="' + href + '" target="_blank" rel="noopener"><b>' + label + '</b><span> · ' + sub + '</span></a>'
      : '<span class="store off"><b>' + label + '</b><span> · ' + APP.soon + '</span></span>';
  };
  box.innerHTML =
    /* ⚠ שורת ״להזמנה״ · הייתה בקנבס של שקד */
    '<span class="eye">' + APP.eyebrow + '</span>' +
    '<h3>' + APP.title + '</h3>' +
    '<p>' + APP.body + '</p>' +
    '<div class="stores">' + store('App Store', APP.ios, 'להורדה') + store('Google Play', APP.android, 'להורדה') + '</div>' +
    '<p class="appnote">' + APP.note + '</p>' +
    '<a class="wabig" href="' + wa(CONTACT.waText) + '" target="_blank" rel="noopener">' +
      ICON.wa + '<span>' + APP.waBtn + '</span></a>';
}

/**
 * טופס האירוע · שדות בצורת גלולה עם אייקון בקצה, לפי ההשראה ששקד שלחה.
 * ⚠ האייקון יושב ב-inset-inline-end · בתמונה הוא בצד השמאלי של השדה
 *   בעוד הכיתוב מיושר לימין, וזה בדיוק קצה ה-end בעמוד ימין-לשמאל.
 */
function buildForm() {
  var f = document.getElementById('ev');
  if (!f) return;
  f.innerHTML = EVENT_FIELDS.map(function (x) {
    var id = 'f-' + x.id;
    var ph = x.ph || '';
    var inner;
    if (x.type === 'select') {
      inner = '<select name="' + x.id + '" id="' + id + '">' +
        x.opts.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>';
    } else if (x.type === 'textarea') {
      inner = '<textarea name="' + x.id + '" id="' + id + '" rows="3" placeholder="' + ph + '"></textarea>';
    } else {
      inner = '<input type="' + x.type + '" name="' + x.id + '" id="' + id + '" placeholder="' + ph + '">';
    }
    var cls = 'f' + (x.type === 'textarea' ? ' wide' : '') + (x.half ? ' half' : '');
    return '<div class="' + cls + '">' +
      '<label for="' + id + '">' + x.label + '</label>' + inner + '</div>';
  }).join('') +
    '<button type="submit" class="send"><span>' + EVENT_CARD.send + '</span>' + ICON.wa + '</button>';
  f.addEventListener('submit', function (e) { e.preventDefault(); sendEvent(f); });
}

/** הצד המילולי של כרטיס האירועים · כותרת, שורות יתרון ודרכי פנייה */
function buildEventText() {
  var box = document.getElementById('ecText');
  if (!box) return;
  box.innerHTML =
    /* ⚠ שלוש שורות כותרת · השלישית בגרדיאנט · עיצוב שקד מהקנבס */
    '<h2 class="ecTitle">' +
      '<span class="ecT1">' + EVENT_CARD.titleTop + '</span>' +
      '<span class="ecT2">' + EVENT_CARD.titleMid + '</span>' +
      '<span class="ecT3">' + EVENT_CARD.titleBig + '</span>' +
    '</h2>' +
    '<p class="ecLead">' + EVENT_CARD.accentLine + '</p>' +
    '<div class="ecBody">' + EVENT_CARD.body.map(function (t, i) {
      return '<p' + (i === 0 ? ' class="ecStrong"' : '') + '>' + t + '</p>';
    }).join('') + '</div>' +
    '<p class="ecServices">' + EVENT_CARD.services + '</p>' +
    '<div class="ecRows">' + EVENT_CARD.rows.map(function (r) {
      var inner = '<span class="ecIco">' + (ICON[r.ico] || '') + '</span><span>' + r.text + '</span>';
      if (r.ico === 'wa') {
        return '<a class="ecRow" href="' + wa(CONTACT.waText) + '" target="_blank" rel="noopener">' + inner + '</a>';
      }
      return r.href
        ? '<a class="ecRow" href="' + r.href + '">' + inner + '</a>'
        : '<span class="ecRow">' + inner + '</span>';
    }).join('') + '</div>';
}

function buildReveal() {
  var els = document.querySelectorAll('.up');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(els, function (el) { el.classList.add('seen'); });
    return;
  }
  var io = new IntersectionObserver(function (rows) {
    rows.forEach(function (r) {
      if (r.isIntersecting) { r.target.classList.add('seen'); io.unobserve(r.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
  Array.prototype.forEach.call(els, function (el) { io.observe(el); });
}

/**
 * הפתיח · **מסר המותג קבוע** · הפתיח מוכר את המותג ולא מוצר מסוים.
 * ⚠ סרט הקטגוריות ורצועת התמונות ירדו לבקשת שקד · הפתיח עומד לבדו.
 */
function buildHero() {
  set('slug', HERO.eyebrow);
  var h1 = document.getElementById('h1');
  if (h1) h1.innerHTML = '<em>' + HERO.title1 + '</em><span class="h1b">' + HERO.title2 + '</span>';

  var say = document.getElementById('hsay');
  if (say) {
    say.innerHTML = HERO.body.map(function (b) {
      return '<p>' + b.split('\n').join('<br>') + '</p>';
    }).join('');
  }

  /* ⚠ שורה אחת של צ׳יפים · כותרות הקבוצות ירדו בעיצוב של שקד */
  var chips = document.getElementById('chips');
  if (chips) {
    chips.innerHTML = HERO.chips.map(function (t) {
      return '<span>' + t + '</span>';
    }).join('');
  }

  var cta = document.getElementById('hcta');
  if (cta) {
    /* ⚠ **שורת השירותים והכפתורים באותה שורה · 23 בספטמבר 2026**
       בקשת שקד: ״שהכרטיסים יהיו באותה השורה כמו אירוח שף | עמדת
       טאבון... ואז הגובה של התמונה ייגמר שם״. השורה הייתה בתוך
       `#hsay` מתחת לפסקאות; עכשיו היא חולקת שורה עם הכפתורים,
       והפתיח מתקצר בשורה שלמה. */
    cta.innerHTML =
      '<p class="hline">' + HERO.line + '</p>' +
      '<span class="hBtns">' +
        '<a class="btn fill" href="' + HERO.cta1.to + '">' + HERO.cta1.label + '</a>' +
        '<a class="btn" href="' + HERO.cta2.to + '">' + HERO.cta2.label + '</a>' +
      '</span>';
  }

  /* התמונה שמאחורי הפתיח מתחלפת בין חמש הקטגוריות */
  var shots = document.getElementById('shots');
  if (!shots) return;
  var frames = CATS.map(function (c) {
    var sh = document.createElement('div');
    sh.className = 'shot';
    sh.innerHTML = '<img src="' + c.img + '" alt="">';
    shots.appendChild(sh);
    return { shot: sh, c: c };
  });
  var at = -1;
  function show(n) {
    if (at >= 0) frames[at].shot.classList.remove('on');
    at = (n + frames.length) % frames.length;
    var f = frames[at];
    f.shot.classList.add('on');
    var img = f.shot.querySelector('img');
    img.style.animation = 'none';
    void img.offsetWidth;
    img.style.animation = '';
    /* הזוהר הרך עוקב אחרי התמונה · צבע המותג עצמו לא מתחלף */
    document.documentElement.style.setProperty('--rgb', f.c.rgb);
  }
  show(0);
  setInterval(function () { show(at + 1); }, 6200);
}

/**
 * גלילה לעוגנים · **בשליטה שלנו ולא של הדפדפן**.
 * ⚠ העמוד ארוך מאוד (כ-16,000 פיקסל). גלילה חלקה נייטיבית למרחק
 *   כזה נמדדת פעם אחת בתחילת האנימציה, וכשגבהים משתנים תוך כדי
 *   (גופנים שנטענים, תמונות עצלות) היא נוחתת במקום הלא נכון —
 *   ולכן ״בואו לאכול איתי״ נראה כאילו הוא עוצר באמצע התפריט.
 *   כאן מחשבים את היעד, גוללים, ואז **מודדים שוב ומתקנים**.
 */
function scrollToId(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var nav = document.querySelector('.nav');
  var pad = (nav ? nav.getBoundingClientRect().height : 0) + 18;

  var go = function (smooth) {
    var top = el.getBoundingClientRect().top + window.scrollY - pad;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    /* ⚠ 'instant' ולא 'auto' · 'auto' אומר ״לך לפי ה-CSS״, וב-CSS
       מוגדר scroll-behavior:smooth — כלומר הקפיצה המיידית פשוט
       לא הייתה קורית. */
    window.scrollTo({ top: Math.max(0, Math.min(top, max)), behavior: smooth ? 'smooth' : 'instant' });
  };

  /* ⚠ קפיצה ארוכה נעשית מיידית · מקטע התפריט לבדו הוא כ-12,000
     פיקסל, וגלילה חלקה שחוצה אותו נמשכת שניות ונראית כאילו היא
     נעצרה באמצע התפריט. מתחת למרחק הזה — גלילה חלקה כרגיל. */
  var far = Math.abs(el.getBoundingClientRect().top - pad) > window.innerHeight * 2.5;
  go(!far);
  /* תיקון אחרי שהאנימציה נרגעה · רק אם באמת החטאנו */
  setTimeout(function () {
    if (Math.abs(el.getBoundingClientRect().top - pad) > 8) go(false);
  }, 700);
}

function buildAnchors() {
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    scrollToId(id);
  });
}

/**
 * צל למדף הלשוניות רק כשהוא נתקע מתחת לניווט.
 * ⚠ בלי זה היו שם שני קווים קבועים · בדיוק מה ששקד ביקשה להוריד.
 */
function buildStuck() {
  var bar = document.querySelector('.tabsBar');
  var nav = document.querySelector('.nav');
  if (!bar || !nav) return;
  var tick = function () {
    var navH = nav.getBoundingClientRect().height;
    bar.classList.toggle('stuck', bar.getBoundingClientRect().top <= navH + 1);
    /* ⚠ הצד הדביק של הקטגוריה חייב לעצור מתחת למדף הלשוניות */
    document.documentElement.style.setProperty(
      '--tabsH', Math.round(bar.getBoundingClientRect().height) + 'px');
  };
  addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);
  tick();
}

function buildAll() {
  buildTheme();
  buildStuck();
  buildAnchors();
  buildCopy();
  buildNav();
  buildMenu();
  buildTabs();
  buildApp();
  buildContact();
  buildAbout();
  buildGallery();
  buildForm();
  buildEventText();
  buildHero();
  buildReveal();
  buildSpy();
}
