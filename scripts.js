/* YARILO browser bundle 20260919.3 — built by work/build-browser.cjs */
/* Shared data model: used by the website, editor and the standalone Worker. */
(function (root) {
  'use strict';
  const kinds = ['disabled', 'rehab', 'hospitals', 'crisis'];
  const documentKinds = {charter: 'Устав фонда', privacy: 'Политика конфиденциальности', offer: 'Публичная оферта'};
  const reportKinds = {annual:'Годовой отчёт', financial:'Финансовая отчётность', aid:'Отчёт о переданной помощи', other:'Другой отчёт'};
  const publicationKinds = {news:'Новости',projects:'Проекты'};
  function publicationDefaults(kind) {
    const content=kind==='news' ? [
      ['post-00000001','Обновляем сайт фонда','2026-09-13','','Создаём удобный раздел с отчётностью, направлениями помощи и новостями фонда.',''],
      ['post-00000002','Средства ухода для детей и взрослых с инвалидностью','','Постоянная помощь','Подгузники, пелёнки, средства ухода и моющие средства нужны на постоянной основе.','help-disabled.html'],
      ['post-00000003','Поддержка реабилитационных центров','','Московская область','Фонд передаёт подарки и необходимые товары учреждениям в городах Московской области.','help-rehab.html']
    ] : [
      ['post-00000004','Помощь реабилитационным центрам','','Постоянно','Передача подарков и необходимых товаров центрам Московской области.',''],
      ['post-00000005','Средства ухода','','Постоянно','Поддержка детей и взрослых с инвалидностью расходными материалами.',''],
      ['post-00000006','Доставка помощи','','Логистика','Формирование, погрузка и адресная доставка гуманитарных грузов.','']
    ];
    return {title:kind==='news'?'Что делает «Ярило»':'Помощь, которую можно увидеть',intro:kind==='news'?'Здесь будут появляться новости, истории помощи, фотоотчёты и объявления об актуальных потребностях.':'На этой странице публикуются текущие и завершённые проекты фонда.',ctaTitle:kind==='projects'?'Поддержите текущие проекты':'',ctaText:kind==='projects'?'Средства направляются на уставную деятельность фонда и помощь подопечным.':'',items:content.map(([id,title,date,label,text,link])=>({id,title,date,label,text,link,photos:[],videos:[],mediaDescriptions:{}}))};
  }
  const imageExt = /\.(jpe?g|png|webp)$/i;
  const videoExt = /\.(mp4|webm)$/i;

  // URL-only allowlist. Never insert pasted HTML into the document.
  function externalVideo(value) {
    if(typeof value!=='string'||value.length>4096)return null;
    let raw=value.trim();
    if(raw.startsWith('<iframe')) {const m=raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i);if(!m)return null;raw=m[1].replace(/&amp;/g,'&');}
    let u;try {u=new URL(raw);}catch{return null;}
    if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
    const host=u.hostname.toLowerCase().replace(/^www\./,'');
    let id;
    if(['youtube.com','m.youtube.com','youtube-nocookie.com','youtu.be'].includes(host)) {
      id=host==='youtu.be'?u.pathname.slice(1):u.pathname==='/watch'?u.searchParams.get('v'):(u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)||[])[1];
      if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return null;
      return {provider:'YouTube',embed:'https://www.youtube-nocookie.com/embed/'+id,url:'https://www.youtube.com/watch?v='+id};
    }
    if(['vk.com','vk.ru','m.vk.com','m.vk.ru','vkvideo.ru','vkvideo.com'].includes(host)) {
      let oid,vid;
      if(u.pathname==='/video_ext.php'){oid=u.searchParams.get('oid');vid=u.searchParams.get('id');}
      else {const m=(u.pathname.match(/^\/video(-?\d+)_(\d+)\/?$/)|| (u.searchParams.get('z')||'').match(/^video(-?\d+)_(\d+)(?:\/|$)/));if(m){oid=m[1];vid=m[2];}}
      if(!/^-?\d{1,20}$/.test(oid||'')||!/^\d{1,20}$/.test(vid||''))return null;
      const params=new URLSearchParams({oid,id:vid,hd:'2'});
      const hash=u.searchParams.get('hash');if(hash&&/^[a-zA-Z0-9_-]{1,128}$/.test(hash))params.set('hash',hash);
      return {provider:'ВК',embed:'https://vk.ru/video_ext.php?'+params,url:'https://vk.ru/video'+oid+'_'+vid};
    }
    return null;
  }
  function videoElement(value, caption='') {
    const external=externalVideo(value);
    if(!external){const v=document.createElement('video');v.src=value;v.controls=true;v.preload='none';v.playsInline=true;return v;}
    const box=document.createElement('div');box.className='external-video';
    const play=document.createElement('button');play.type='button';play.className='external-video-play';play.textContent='Смотреть видео · '+external.provider;
    play.onclick=()=>{const frame=document.createElement('iframe');frame.src=external.embed;frame.title=caption||'Видео фонда «Ярило» · '+external.provider;frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';play.replaceWith(frame);};
    const link=document.createElement('a');link.href=external.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Открыть на '+external.provider;box.append(play,link);return box;
  }

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
    d.publications ??= {};
    if(d.publications && typeof d.publications==='object'&&!Array.isArray(d.publications))for(const kind of Object.keys(publicationKinds)) {
      d.publications[kind] ??= {};
      const page=d.publications[kind];if(!page||typeof page!=='object'||Array.isArray(page))continue;
      for(const [key,value]of Object.entries(publicationDefaults(kind)))page[key] ??= value;
      if(Array.isArray(page.items))for(const item of page.items)if(item&&typeof item==='object'&&!Array.isArray(item)){item.photos=list(item.photos);item.videos=list(item.videos);}
    }
    d.reports ??= [
      {id:'report-20240000',title:'Годовой отчёт за 2024 год',year:'2024',category:'annual',description:'Отчётность о деятельности фонда',files:[]},
      {id:'report-20250000',title:'Годовой отчёт за 2025 год',year:'2025',category:'annual',description:'Отчётность о деятельности фонда',files:[]},
      {id:'report-a1d00000',title:'Отчёты о переданной помощи',year:'',category:'aid',description:'Фото и документы по отдельным проектам фонда',files:[]}
    ];
    d.reporting ??= {};
    if(d.reporting && typeof d.reporting==='object'&&!Array.isArray(d.reporting)) {
      for(const [key,value]of Object.entries({title:'Документы и отчётность фонда',intro:'Здесь публикуются официальные документы, годовая отчётность и материалы, подтверждающие деятельность фонда.',noticeTitle:'Прозрачность работы фонда',noticeText:'Мы постепенно размещаем в этом разделе документы и отчёты о деятельности благотворительного фонда «Ярило». Информация будет дополняться по мере подготовки материалов.'})) d.reporting[key] ??= value;
    }
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
  function groups(d) { return [d.aboutPage, ...kinds.map(k => d.help[k]), ...Object.keys(publicationKinds).flatMap(k=>Array.isArray(d.publications?.[k]?.items)?d.publications[k].items:[])]; }
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
  function documentPaths(d) { return [...Object.keys(documentKinds).flatMap(k => Array.isArray(d.documents?.[k]) ? d.documents[k].map(file => file.path) : []), ...(Array.isArray(d.reports) ? d.reports.flatMap(report=>Array.isArray(report?.files)?report.files.map(file=>file.path):[]) : [])]; }
  function fileSize(size) { return size<1024*1024 ? Math.max(1,Math.ceil(size/1024)).toLocaleString('ru-RU')+' КБ' : (size/1024/1024).toLocaleString('ru-RU',{maximumFractionDigits:2})+' МБ'; }
  function validateDocuments(files,title) {
    if (!Array.isArray(files) || files.length>20) throw new Error('В разделе «'+title+'» допускается до 20 файлов.');
    const unique=new Set();
    for (const file of files) {
      if (!file || typeof file!=='object' || Array.isArray(file) || !documentURL(file.path) || unique.has(file.path)) throw new Error('Некорректный или повторяющийся файл в разделе «'+title+'».');
      unique.add(file.path);
      if (typeof file.name!=='string' || !file.name.trim() || file.name.length>180 || typeof file.title!=='string' || !file.title.trim() || file.title.length>200) throw new Error('Укажите название документа (до 200 символов).');
      if (!Number.isInteger(file.size) || file.size<1 || file.size>8*1024*1024) throw new Error('Размер документа должен быть не больше 8 МБ.');
    }
  }
  function mediaPaths(d) { const normalized=normalize(d); return [...new Set([...groups(normalized).flatMap(g => [...g.photos, ...g.videos.filter(v=>!externalVideo(v))]), ...documentPaths(normalized), ...(normalized.home.coverImage?[normalized.home.coverImage]:[])])]; }
  function validate(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Некорректные данные сайта.');
    for (const key of ['foundation', 'home', 'aboutPage', 'help', 'results', 'support', 'requisites', 'donation']) {
      if (!d[key] || typeof d[key] !== 'object' || Array.isArray(d[key])) throw new Error('Отсутствует раздел: ' + key);
    }
    if(d.home.coverImage && !/^uploads\/admin-[a-f0-9-]+\.(jpe?g|png|webp)$/i.test(d.home.coverImage))throw new Error('Некорректное фото главной страницы.');
    if (JSON.stringify(d).length > 500000) throw new Error('Слишком большой объём текстовых данных.');
    if (d.documents !== undefined) {
      if (!d.documents || typeof d.documents !== 'object' || Array.isArray(d.documents)) throw new Error('Некорректный раздел документов.');
      for (const [key,title] of Object.entries(documentKinds)) {
        validateDocuments(d.documents[key],title);
      }
    }
    if(d.reports!==undefined) {
      if(!Array.isArray(d.reports)||d.reports.length>100)throw new Error('Допускается до 100 отчётов.');
      const ids=new Set();
      for(const report of d.reports) {
        if(!report||typeof report!=='object'||Array.isArray(report)||typeof report.id!=='string'||!/^report-[a-f0-9-]{8,64}$/.test(report.id)||ids.has(report.id))throw new Error('Некорректный или повторяющийся отчёт.');
        ids.add(report.id);
        if(typeof report.title!=='string'||!report.title.trim()||report.title.length>200)throw new Error('Укажите название отчёта (до 200 символов).');
        if(!Object.hasOwn(reportKinds,report.category))throw new Error('Выберите вид отчётности.');
        if(typeof report.year!=='string'||(report.year!==''&&!/^(19|20|21)\d{2}$/.test(report.year)))throw new Error('Год отчёта должен состоять из четырёх цифр: 1900–2199.');
        if(typeof report.description!=='string'||report.description.length>5000)throw new Error('Описание отчёта должно содержать не больше 5000 символов.');
        validateDocuments(report.files,report.title);
      }
    }
    if(d.reporting!==undefined) {
      if(!d.reporting||typeof d.reporting!=='object'||Array.isArray(d.reporting))throw new Error('Некорректные настройки страницы отчётности.');
      for(const [key,limit]of [['title',200],['intro',5000],['noticeTitle',200],['noticeText',5000]])if(typeof d.reporting[key]!=='string'||d.reporting[key].length>limit)throw new Error('Проверьте текст страницы отчётности.');
      if(!d.reporting.title.trim())throw new Error('Укажите заголовок страницы отчётности.');
    }
    if(d.publications!==undefined) {
      if(!d.publications||typeof d.publications!=='object'||Array.isArray(d.publications))throw new Error('Некорректный раздел новостей и проектов.');
      for(const [kind,title]of Object.entries(publicationKinds)) {
        const page=d.publications[kind];if(!page||typeof page!=='object'||Array.isArray(page))throw new Error('Отсутствует раздел «'+title+'».');
        for(const [key,limit]of [['title',200],['intro',5000],['ctaTitle',200],['ctaText',5000]])if(typeof page[key]!=='string'||page[key].length>limit)throw new Error('Проверьте тексты раздела «'+title+'».');
        if(!page.title.trim()||!Array.isArray(page.items)||page.items.length>100)throw new Error('Укажите заголовок раздела; допускается до 100 записей.');
        const ids=new Set();
        for(const item of page.items) {
          if(!item||typeof item!=='object'||Array.isArray(item)||typeof item.id!=='string'||!/^post-[a-f0-9-]{8,64}$/.test(item.id)||ids.has(item.id))throw new Error('Некорректная или повторяющаяся запись в разделе «'+title+'».');ids.add(item.id);
          for(const [key,limit]of [['title',200],['label',100],['text',10000],['link',2000],['date',10]])if(typeof item[key]!=='string'||item[key].length>limit)throw new Error('Проверьте поля новости или проекта.');
          if(!item.title.trim())throw new Error('Укажите название новости или проекта.');
          if(item.link&&!safeURL(item.link))throw new Error('Укажите безопасную ссылку новости или проекта.');
          if(item.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(item.date)||!Number.isFinite(Date.parse(item.date+'T12:00:00Z'))||new Date(item.date+'T12:00:00Z').toISOString().slice(0,10)!==item.date))throw new Error('Укажите корректную дату новости или проекта.');
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
        if (!Array.isArray(group[key])) throw new Error('Некорректный список медиафайлов.');
        for (const p of group[key]) {
          const url = safeURL(p);
          if (!(key==='videos' && externalVideo(p)) && (!url || !ext.test(new URL(url).pathname))) throw new Error('Недопустимый адрес фото или видео.');
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
  root.YariloModel = {externalVideo, videoElement, kinds, documentKinds, reportKinds, publicationKinds, fileSize, documentURL, documentPaths, normalize, parse, serialize, safeURL, socialURL, description, qrImage, amount, paymentLink, mediaPaths, validate};
})(globalThis);

/* Shared rendering for content managed by the editor. Menu/year stay in script.js. */
(async function () {
  'use strict';
  await window.yariloDataReady;
  if (!window.YARILO || !window.YariloModel) return;
  const M=window.YariloModel, d=M.normalize(window.YARILO);
  const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value ?? '';if(cls)e.className=cls;return e;};
  document.querySelectorAll('[data-public-documents]').forEach(container=>{
    const key=container.dataset.publicDocuments,files=d.documents[key]||[];container.replaceChildren();
    if(!files.length){container.append(text('p','Документ пока не опубликован.','document-empty'));return;}
    for(const file of files){
      const href=M.documentURL(file.path,location.href);if(!href)continue;
      const card=text('article','','foundation-document');
      const format=file.path.split('.').pop().toUpperCase(),size=(file.size/1024/1024).toLocaleString('ru-RU',{maximumFractionDigits:2});
      const details=text('div','','document-details');details.append(text('h3',file.title),text('p',format+' · '+size+' МБ'));
      const actions=text('div','','document-actions');
      const open=text('a','Открыть','btn btn-small');open.href=href;open.target='_blank';open.rel='noopener noreferrer';open.setAttribute('aria-label','Открыть: '+file.title+' — в новой вкладке');
      const download=text('a','Скачать','document-download');download.href=href;download.download=file.name;download.setAttribute('aria-label','Скачать: '+file.title);
      actions.append(open,download);card.append(details,actions);container.append(card);
    }
  });
  const privacyFallback=document.getElementById('privacy-text-fallback');
  if(privacyFallback)privacyFallback.hidden=!!d.documents.privacy.length;
  function enlarge(src, description) {
    const dialog=document.createElement('dialog');dialog.className='photo-dialog';
    const close=text('button','Закрыть','btn btn-small');close.onclick=()=>dialog.close();
    const img=document.createElement('img');img.src=src;img.alt='Увеличенное фото';
    dialog.append(close,img);if(description)dialog.append(text('p',description,'media-caption'));dialog.addEventListener('close',()=>dialog.remove());dialog.onclick=e=>{if(e.target===dialog)dialog.close();};document.body.append(dialog);dialog.showModal();
  }
  function media(container,group,pageSize=24) {
    if(!container)return;container.replaceChildren();
    const entries=[...group.photos.map(p=>[p,'photo']),...group.videos.map(p=>[p,'video'])];
    let shown=0;const more=text('button','Показать ещё','btn btn-ghost');more.type='button';
    function appendPage(){more.remove();
      for(const [p,type] of entries.slice(shown,shown+pageSize)) {
        const src=M.safeURL(p,location.href);if(!src)continue;
        const caption=M.description(group,p), figure=text('figure','','media-figure');
        if(type==='photo') {
          const button=document.createElement('button');button.type='button';button.className='gallery-photo';button.setAttribute('aria-label','Увеличить фото');
          const img=document.createElement('img');img.src=src;img.alt=caption?caption.slice(0,200):'Фото работы фонда';img.loading='lazy';
          button.append(img);button.onclick=()=>enlarge(src,caption);figure.append(button);
        } else {
          figure.append(M.videoElement(src,caption));
        }
        if(caption)figure.append(text('figcaption',caption,'media-caption'));
        container.append(figure);
      }
      shown+=pageSize;if(shown<entries.length)container.append(more);
    }
    more.onclick=appendPage;appendPage();
    container.hidden=!container.children.length;
  }
  media(document.getElementById('history-media'),d.aboutPage);
  document.querySelectorAll('[data-direction]').forEach(el=>{media(el,d.help[el.dataset.direction]);document.getElementById('direction-media-section').hidden=el.hidden;});
  document.querySelectorAll('[data-card-videos]').forEach(container=>{
    const group=d.help[container.dataset.cardVideos];
    if(group)media(container,{photos:[],videos:group.videos,mediaDescriptions:group.mediaDescriptions},1);
  });
  const publicationKind=location.pathname.endsWith('/news.html')?'news':location.pathname.endsWith('/projects.html')?'projects':null;
  if(publicationKind) {
    const page=d.publications[publicationKind];
    const heading=document.querySelector('.page-hero h1'), intro=document.querySelector('.page-hero .lead');
    if(heading)heading.textContent=page.title;if(intro)intro.textContent=page.intro;
    const grid=document.querySelector(publicationKind==='news'?'.news-grid':'.cards');
    if(grid){grid.replaceChildren();for(const item of page.items){
      const card=text('article','','news-card');
      if(item.date){const time=text('time',new Date(item.date+'T12:00:00Z').toLocaleDateString('ru-RU'));time.dateTime=item.date;card.append(time);}
      else if(item.label)card.append(text('p',item.label,'eyebrow'));
      card.append(text('h2',item.title),text('p',item.text));
      const gallery=text('div','','publication-media');media(gallery,item);card.append(gallery);
      if(item.link){const href=M.safeURL(item.link);if(href){const link=text('a','Подробнее →','text-link');link.href=href;card.append(link);}}
      grid.append(card);
    }}
  }
  const cover=document.querySelector('.hero-cover img');if(cover&&d.home.coverImage){const fallback=cover.src;cover.onerror=()=>{cover.onerror=null;cover.src=fallback;};cover.src=d.home.coverImage;}
  const donationURL=M.safeURL(d.donation.url,location.href), donationText=d.donation.text || 'Пожертвовать';
  document.querySelectorAll('a.btn[href="donate.html"],a[data-donation]').forEach(a=>{if(donationURL)a.href=donationURL;a.textContent=donationText;});
  const purpose=document.getElementById('donation-purpose');if(purpose)purpose.textContent=d.donation.purpose || '';
  const payment=document.getElementById('donation-payment');
  if(payment && !document.getElementById('donationAmount')) {
    const target=new URL(donationURL || 'donate.html',location.href);
    const isLanding=target.origin===location.origin && target.pathname===new URL('donate.html',location.href).pathname;
    if(!isLanding && donationURL) {payment.href=donationURL;payment.textContent=donationText;document.getElementById('donation-offline-note').hidden=true;document.getElementById('donation-contact-note').hidden=true;}
  }
  function row(parent,label,value) {const r=text('div','','req-row');r.append(text('span',label),text('b',value || 'нужно подтвердить',value?'':'req-placeholder'));parent.append(r);}
  const legal=document.getElementById('legal-requisites');
  if(legal) {legal.replaceChildren(text('h3','Банковские реквизиты'));row(legal,'Наименование',d.requisites.legalName||d.foundation.name);for(const [k,label] of [['inn','ИНН'],['kpp','КПП'],['ogrn','ОГРН']])row(legal,label,d.requisites[k]);if(d.requisites.address)row(legal,'Юридический адрес',d.requisites.address);if(!d.requisites.accounts.length)for(const [k,label] of [['account','Расчётный счёт'],['bank','Банк'],['bik','БИК'],['correspondent','Корр. счёт']])row(legal,label,'');}
  const accounts=document.getElementById('bank-accounts');
  const bankFields=[['recipient','Получатель'],['bank','Банк'],['account','Расчётный счёт'],['bik','БИК'],['correspondent','Корр. счёт'],['bankInn','ИНН банка'],['bankKpp','КПП банка'],['currency','Валюта']];
  if(accounts) {for(const account of d.requisites.accounts){const card=text('div','','req-card');card.append(text('h3',account.label||'Банковский счёт'));for(const [k,label] of bankFields)if(account[k])row(card,label,account[k]);row(card,'Назначение платежа',account.purpose||d.donation.purpose);accounts.append(card);}document.getElementById('bank-accounts-section').hidden=!accounts.children.length;}
  const amountInput=document.getElementById('donationAmount');
  if(amountInput) {
    const money=value=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(value);
    const amountError=document.getElementById('amount-error'),note=document.getElementById('selected-amount-note');
    function updateAmount() {
      const sum=M.amount(amountInput.value),valid=sum!==null;
      amountError.hidden=valid;amountError.textContent=valid?'':'Введите сумму от 1 ₽, не больше двух знаков после запятой.';
      amountInput.setAttribute('aria-invalid',String(!valid));payment.setAttribute('aria-disabled',String(!valid));
      document.querySelectorAll('[data-amount]').forEach(b=>{const selected=Number(b.dataset.amount)===sum;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
      const link=M.paymentLink(d.donation.paymentUrl,sum);
      payment.href=link||'#donation-bank';payment.textContent=link?'Перейти к оплате':'Перевести по реквизитам';
      document.getElementById('payment-state').textContent=d.donation.paymentUrl?'Оплата проходит на защищённой странице банка или платёжного сервиса.':'Онлайн-оплата пока не подключена. Вы можете перевести средства на расчётный счёт фонда.';
      note.textContent=!valid?'':link&&!/\{amount\}|%7Bamount%7D/i.test(d.donation.paymentUrl)?'Вы выбрали '+money(sum)+'. Укажите или подтвердите эту сумму на странице оплаты.':'Выбранная сумма: '+money(sum)+'.';
      return valid;
    }
    document.querySelectorAll('[data-amount]').forEach(b=>b.onclick=()=>{amountInput.value=b.dataset.amount;updateAmount();});
    amountInput.addEventListener('input',updateAmount);payment.addEventListener('click',e=>{if(!updateAmount()){e.preventDefault();amountInput.focus();}});updateAmount();
    const qr=M.qrImage(d.donation.qrImage),qrBox=document.getElementById('donation-qr-image');
    if(qr){const img=document.createElement('img');img.src=qr;img.alt='Банковский QR-код для пожертвования фонду ЯРИЛО';qrBox.append(img);qrBox.hidden=false;document.getElementById('donation-qr-placeholder').hidden=true;document.getElementById('donation-qr-note').textContent=d.donation.qrNote;}
    const bankBox=document.getElementById('donation-bank-accounts');
    for(const account of d.requisites.accounts) {
      const card=text('div','','donation-bank-card');card.append(text('h3',account.label||'Счёт фонда'));
      const pairs=[['Получатель',account.recipient||d.requisites.legalName||d.foundation.name],['ИНН',d.requisites.inn],['КПП',d.requisites.kpp],['ОГРН',d.requisites.ogrn],...bankFields.filter(([k])=>k!=='recipient').map(([k,label])=>[label,account[k]]),['Назначение платежа',account.purpose||d.donation.purpose]].filter(([,value])=>value);
      for(const [label,value] of pairs)row(card,label,value);
      const copy=text('button','Скопировать реквизиты и сумму','btn btn-ghost');copy.type='button';
      copy.onclick=async()=>{
        if(!updateAmount()){amountInput.focus();return;}
        const content=[...pairs.map(([label,value])=>label+': '+value),'Сумма: '+money(M.amount(amountInput.value))].join('\n');
        try{await navigator.clipboard.writeText(content);document.getElementById('copy-status').textContent='Реквизиты и выбранная сумма скопированы.';}
        catch{let field=card.querySelector('.copy-fallback');if(!field){field=text('textarea','','copy-fallback');field.readOnly=true;field.setAttribute('aria-label','Реквизиты для копирования');card.append(field);}field.value=content;field.focus();field.select();document.getElementById('copy-status').textContent='Текст выделен. Нажмите Ctrl+C или выберите «Копировать» на телефоне.';}
      };card.append(copy);bankBox.append(card);
    }
    if(!d.requisites.accounts.length)bankBox.append(text('p','Реквизиты уточняйте у фонда.'));
  }
  document.querySelectorAll('#footer-phone').forEach(a=>{a.textContent=d.foundation.phone;a.href='tel:'+d.foundation.phoneLink;});
  const footer=document.querySelector('.footer-main > div:last-child');
  if(footer) {
    const links=text('nav','','social-links');links.setAttribute('aria-label','Социальные сети фонда');
    for(const [key,label] of [['telegram','Telegram'],['vk','ВК'],['instagram','Instagram'],['youtube','YouTube']]) {
      const href=M.socialURL(d.socials[key]);if(!href)continue;
      const a=text('a','','social-link social-'+key);a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',label+' — откроется в новой вкладке');
      const icon=text('span','','social-icon');icon.setAttribute('aria-hidden','true');
      const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('focusable','false');
      const paths={telegram:'M21.5 3.2 18.2 21l-6-4.5-3 3 .5-5.7L18 6.4 7.9 12.7 2.5 11z',instagram:'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-2v1',youtube:'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm6 4v6l5-3z'};
      if(key==='vk'){const letters=document.createElementNS(ns,'text');letters.setAttribute('x','2');letters.setAttribute('y','17');letters.setAttribute('fill','currentColor');letters.setAttribute('font-size','16');letters.setAttribute('font-weight','800');letters.textContent='vk';svg.append(letters);}
      else {const path=document.createElementNS(ns,'path');path.setAttribute('d',paths[key]);path.setAttribute('fill',key==='telegram'?'currentColor':'none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);}
      icon.append(svg);a.append(icon,text('span',label));
      links.append(a);
    }
    if(links.children.length)footer.append(links);
  }
  document.documentElement.dataset.siteReady='true';
})();
