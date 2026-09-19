/* YARILO browser bundle 20260919.1 — built by work/build-browser.cjs */
/* Shared data model: used by the website, editor and the standalone Worker. */
(function (root) {
  'use strict';
  const kinds = ['disabled', 'rehab', 'hospitals', 'crisis'];
  const documentKinds = {charter: 'Устав фонда', privacy: 'Политика конфиденциальности', offer: 'Публичная оферта'};
  const imageExt = /\.(jpe?g|png|webp)$/i;
  const videoExt = /\.(mp4|webm)$/i;
  function list(value) {
    if (Array.isArray(value)) return value.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim());
    return typeof value === 'string' ? value.split(',').map(x => x.trim()).filter(Boolean) : [];
  }
  function normalize(input) {
    const d = JSON.parse(JSON.stringify(input));
    d.aboutPage ||= {};
    d.aboutPage.photos = list(d.aboutPage.photos ?? d.aboutPage.historyImage);
    d.aboutPage.videos = list(d.aboutPage.videos ?? d.aboutPage.historyVideo);
    d.help ||= {};
    for (const k of kinds) {
      d.help[k] ||= {};
      d.help[k].photos = list(d.help[k].photos);
      d.help[k].videos = list(d.help[k].videos);
    }
    d.requisites ||= {inn: '', kpp: '', ogrn: '', address: '', accounts: []};
    d.requisites.accounts ||= [];
    d.donation ||= {text: 'Пожертвовать', url: 'donate.html', purpose: 'Благотворительное пожертвование на уставную деятельность фонда.'};
    d.socials ||= {vk: '', instagram: '', youtube: ''};
    if (!Object.hasOwn(d.socials, 'telegram')) d.socials.telegram = 'https://t.me/rus_rus_pom';
    d.donation.paymentUrl ??= '';
    d.donation.qrImage ??= '';
    d.donation.qrNote ??= 'Откройте приложение банка и отсканируйте QR-код. Перед переводом проверьте получателя и сумму.';
    d.documents ??= {};
    if (d.documents && typeof d.documents === 'object' && !Array.isArray(d.documents)) {
      for (const k of Object.keys(documentKinds)) d.documents[k] ??= [];
    }
    // One-time defaults explicitly supplied by the foundation. Persist the flag
    // with the next save so later edits or deletion are respected.
    d.editorSetup ||= {};
    if (!d.editorSetup.donations20260917) {
      for (const [key, value] of Object.entries({legalName:'БЛАГОТВОРИТЕЛЬНЫЙ ФОНД "ЯРИЛО"',inn:'5045071931',kpp:'504501001',ogrn:'1245000038062'})) {
        if (!d.requisites[key]) d.requisites[key] = value;
      }
      const bank = {label:'Основной счёт фонда',recipient:'БЛАГОТВОРИТЕЛЬНЫЙ ФОНД "ЯРИЛО"',account:'40703810940000401257',bank:'ПАО Сбербанк',bik:'044525225',correspondent:'30101810400000000225',bankInn:'7707083893',bankKpp:'773643002',currency:'RUB',purpose:''};
      const existing = d.requisites.accounts.find(a => a.account === bank.account);
      if (existing) { for (const [key,value] of Object.entries(bank)) if (!existing[key]) existing[key] = value; }
      else d.requisites.accounts.push(bank);
      d.editorSetup.donations20260917 = true;
    }
    for (const group of groups(d)) {
      if (!group.mediaDescriptions || typeof group.mediaDescriptions !== 'object' || Array.isArray(group.mediaDescriptions)) group.mediaDescriptions = {};
    }
    return d;
  }
  function parse(source) {
    const m = source.replace(/^\uFEFF/, '').match(/^\s*window\.YARILO\s*=\s*([\s\S]*?)\s*;?\s*$/);
    if (!m) throw new Error('Не удалось прочитать site-data.js.');
    return normalize(JSON.parse(m[1]));
  }
  function serialize(d) { return 'window.YARILO = ' + JSON.stringify(d, null, 2) + ';\n'; }
  function safeURL(value, base = 'https://bf-yarilo.ru/') {
    if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\\]/.test(value)) return '';
    try { const u = new URL(value, base); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function groups(d) { return [d.aboutPage, ...kinds.map(k => d.help[k])]; }
  function socialURL(value) {
    return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? safeURL(value.trim()) : '';
  }
  function description(group, path) {
    const value = group.mediaDescriptions?.[path];
    return typeof value === 'string' ? value.trim() : '';
  }
  function qrImage(value) {
    return typeof value === 'string' && value.length <= 275000 && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : '';
  }
  function amount(value) {
    const raw = String(value).trim();
    if (!/^\d{1,9}(?:[.,]\d{1,2})?$/.test(raw)) return null;
    const result = Number(raw.replace(',', '.'));
    return Number.isFinite(result) && result >= 1 ? Math.round(result * 100) / 100 : null;
  }
  function paymentLink(value, sum) {
    if (typeof value !== 'string' || !/^https:\/\//i.test(value.trim())) return '';
    if (/\{amount\}|%7Bamount%7D/i.test(value)) {
      const parsed = amount(sum); if (parsed === null) return '';
      value = value.replace(/\{amount\}|%7Bamount%7D/gi, parsed.toFixed(2));
    }
    return socialURL(value);
  }
  function documentURL(value, base = 'https://bf-yarilo.ru/') {
    return typeof value === 'string' && /^uploads\/admin-[a-f0-9-]+\.(pdf|jpe?g|png|webp)$/i.test(value) ? safeURL(value, base) : '';
  }
  function documentPaths(d) { return Object.keys(documentKinds).flatMap(k => Array.isArray(d.documents?.[k]) ? d.documents[k].map(file => file.path) : []); }
  function mediaPaths(d) { const normalized=normalize(d); return [...new Set([...groups(normalized).flatMap(g => [...g.photos, ...g.videos]), ...documentPaths(normalized)])]; }
  function validate(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Некорректные данные сайта.');
    for (const key of ['foundation', 'home', 'aboutPage', 'help', 'results', 'support', 'requisites', 'donation']) {
      if (!d[key] || typeof d[key] !== 'object' || Array.isArray(d[key])) throw new Error('Отсутствует раздел: ' + key);
    }
    if (JSON.stringify(d).length > 500000) throw new Error('Слишком большой объём текстовых данных.');
    if (d.documents !== undefined) {
      if (!d.documents || typeof d.documents !== 'object' || Array.isArray(d.documents)) throw new Error('Некорректный раздел документов.');
      for (const [key,title] of Object.entries(documentKinds)) {
        const files=d.documents[key];
        if (!Array.isArray(files) || files.length>20) throw new Error('В разделе «'+title+'» допускается до 20 файлов.');
        const unique=new Set();
        for (const file of files) {
          if (!file || typeof file!=='object' || Array.isArray(file) || !documentURL(file.path) || unique.has(file.path)) throw new Error('Некорректный или повторяющийся файл в разделе «'+title+'».');
          unique.add(file.path);
          if (typeof file.name!=='string' || !file.name.trim() || file.name.length>180 || typeof file.title!=='string' || !file.title.trim() || file.title.length>200) throw new Error('Укажите название документа (до 200 символов).');
          if (!Number.isInteger(file.size) || file.size<1 || file.size>8*1024*1024) throw new Error('Размер документа должен быть не больше 8 МБ.');
        }
      }
    }
    for (const group of groups(d)) {
      if (!group) throw new Error('Отсутствует направление помощи.');
      if (group.mediaDescriptions) {
        if (typeof group.mediaDescriptions !== 'object' || Array.isArray(group.mediaDescriptions)) throw new Error('Некорректные описания файлов.');
        for (const value of Object.values(group.mediaDescriptions)) {
          if (typeof value !== 'string' || value.length > 2000) throw new Error('Описание фото или видео должно содержать не больше 2000 символов.');
        }
      }
      for (const [key, ext] of [['photos', imageExt], ['videos', videoExt]]) {
        if (!Array.isArray(group[key]) || group[key].length > 200) throw new Error('Допускается до 200 файлов каждого типа в разделе.');
        for (const p of group[key]) {
          const url = safeURL(p);
          if (!url || !ext.test(new URL(url).pathname)) throw new Error('Недопустимый адрес фото или видео.');
        }
      }
    }
    if (!Array.isArray(d.requisites.accounts) || d.requisites.accounts.length > 30) throw new Error('Допускается до 30 банковских счетов.');
    for (const account of d.requisites.accounts) {
      if (!account || typeof account !== 'object' || Array.isArray(account)) throw new Error('Некорректный банковский счёт.');
      for (const [key, length] of [['account', 20], ['correspondent', 20], ['bik', 9], ['bankInn', 10], ['bankKpp', 9]]) {
        if (account[key] && !new RegExp('^\\d{' + length + '}$').test(account[key])) throw new Error('Поле «' + ({account:'Расчётный счёт',correspondent:'Корреспондентский счёт',bik:'БИК',bankInn:'ИНН банка',bankKpp:'КПП банка'}[key]) + '» должно содержать ' + length + ' цифр.');
      }
    }
    if (typeof d.donation.text !== 'string' || !d.donation.text.trim() || !safeURL(d.donation.url)) throw new Error('Укажите текст и корректную ссылку кнопки пожертвования.');
    if (d.socials) {
      if (typeof d.socials !== 'object' || Array.isArray(d.socials)) throw new Error('Некорректные ссылки на соцсети.');
      for (const [key, title] of [['vk', 'ВК'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['telegram', 'Telegram']]) {
        const value = d.socials[key];
        if (value && !socialURL(value)) throw new Error('Укажите полную ссылку для ' + title + ', начиная с https://, или оставьте поле пустым.');
      }
    }
    if (d.donation.paymentUrl && !paymentLink(d.donation.paymentUrl, 100)) throw new Error('Платёжная ссылка должна начинаться с https://.');
    if (d.donation.qrImage && !qrImage(d.donation.qrImage)) throw new Error('Загрузите QR-код в PNG, JPG или WEBP размером до 200 КБ.');
    return d;
  }
  root.YariloModel = {kinds, documentKinds, documentURL, documentPaths, normalize, parse, serialize, safeURL, socialURL, description, qrImage, amount, paymentLink, mediaPaths, validate};
})(globalThis);

// Refresh published content on every visit. The existing script is a fallback
// when the network fails, so the original static pages remain usable.
window.yariloDataReady = (async function () {
  try {
    const response=await fetch(new URL('site-data.js?content='+Date.now(),location.href),{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Content unavailable');
    window.YARILO=window.YariloModel.parse(await response.text());
  } catch {
    const note=document.createElement('p');note.className='content-refresh-note';note.setAttribute('role','status');
    note.textContent='Не удалось обновить данные сайта. Показана ранее загруженная версия; попробуйте обновить страницу.';
    document.body.prepend(note);
  }
})();
