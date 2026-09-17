/* Shared data model: used by the website, editor and the standalone Worker. */
(function (root) {
  'use strict';
  const kinds = ['disabled', 'rehab', 'hospitals', 'crisis'];
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
  function mediaPaths(d) { return [...new Set(groups(normalize(d)).flatMap(g => [...g.photos, ...g.videos]))]; }
  function validate(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Некорректные данные сайта.');
    for (const key of ['foundation', 'home', 'aboutPage', 'help', 'results', 'support', 'requisites', 'donation']) {
      if (!d[key] || typeof d[key] !== 'object' || Array.isArray(d[key])) throw new Error('Отсутствует раздел: ' + key);
    }
    if (JSON.stringify(d).length > 500000) throw new Error('Слишком большой объём текстовых данных.');
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
      for (const [key, length] of [['account', 20], ['correspondent', 20], ['bik', 9]]) {
        if (account[key] && !new RegExp('^\\d{' + length + '}$').test(account[key])) throw new Error('Поле «' + ({account:'Расчётный счёт',correspondent:'Корреспондентский счёт',bik:'БИК'}[key]) + '» должно содержать ' + length + ' цифр.');
      }
    }
    if (typeof d.donation.text !== 'string' || !d.donation.text.trim() || !safeURL(d.donation.url)) throw new Error('Укажите текст и корректную ссылку кнопки пожертвования.');
    if (d.socials) {
      if (typeof d.socials !== 'object' || Array.isArray(d.socials)) throw new Error('Некорректные ссылки на соцсети.');
      for (const [key, title] of [['vk', 'ВК'], ['instagram', 'Instagram'], ['youtube', 'YouTube']]) {
        const value = d.socials[key];
        if (value && !socialURL(value)) throw new Error('Укажите полную ссылку для ' + title + ', начиная с https://, или оставьте поле пустым.');
      }
    }
    return d;
  }
  root.YariloModel = {kinds, normalize, parse, serialize, safeURL, socialURL, description, mediaPaths, validate};
})(globalThis);
