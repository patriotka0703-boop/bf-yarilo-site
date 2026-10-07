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
    const frame=document.createElement('iframe');frame.src=external.embed;frame.loading='lazy';frame.title=caption||'Видео фонда «Ярило» · '+external.provider;frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
    const expand=document.createElement('button');expand.type='button';expand.className='video-expand';expand.textContent='На весь экран';
    const close=()=>{box.classList.remove('video-expanded');expand.textContent='На весь экран';};
    expand.onclick=async()=>{
      if(document.fullscreenElement===box){await document.exitFullscreen();return;}
      if(box.classList.contains('video-expanded')){close();return;}
      if(box.requestFullscreen){try{await box.requestFullscreen();expand.textContent='Свернуть';return;}catch{}}
      box.classList.add('video-expanded');expand.textContent='Свернуть';
    };
    box.addEventListener('fullscreenchange',()=>{expand.textContent=document.fullscreenElement===box?'Свернуть':'На весь экран';});
    box.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    box.append(frame,expand);return box;
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

(function () {
  'use strict';
  const M = window.YariloModel;
  const WORKER = window.YARILO_ADMIN.workerUrl.replace(/\/$/, '');
  const canonical = new URL(window.YARILO_ADMIN.siteUrl);
  // Keep OAuth nonce and callback in the same origin, including www/http visits.
  if ([canonical.hostname, 'www.'+canonical.hostname].includes(location.hostname) && location.origin !== canonical.origin) {
    location.replace(new URL('/admin/', canonical).href);
    return;
  }
  const $ = id => document.getElementById(id);
  const storage = {get:k=>sessionStorage.getItem(k)||'', set:(k,v)=>sessionStorage.setItem(k,v), remove:k=>sessionStorage.removeItem(k)};
  let token = '', data, sha = '', dirty = false, busy = false, savedDocuments = '', savedReports = '', savedPublications = '';
  const uploads = new Map(), previews = new Map();
  const getPath = (obj, p) => p.split('.').reduce((v,k)=>v?.[k], obj);
  function putPath(obj, p, value) { const keys=p.split('.'); const last=keys.pop(); const parent=keys.reduce((v,k)=>(v[k] ||= {}),obj); parent[last]=value; }
  function status(message, type='info') { $('status').textContent=message; $('status').className='status '+type; }
  function lock(value) { busy=value; $('editorPanel').querySelectorAll('input,textarea,select,button').forEach(e=>e.disabled=value); $('loginButton').disabled=value; }
  function changed() { dirty=true; status('Есть несохранённые изменения. Нажмите «Сохранить изменения».'); }
  async function api(endpoint, options={}) {
    let response;
    try { response=await fetch(WORKER+endpoint, {...options, cache:'no-store', signal:AbortSignal.timeout(120000), headers:{Authorization:'Bearer '+token,...options.headers}}); }
    catch { throw new Error('Не удалось связаться с сервером. Проверьте интернет и повторите действие. Ваши изменения остаются в форме.'); }
    const result=await response.json().catch(()=>({message:'Сервер вернул неверный ответ.'}));
    if (!response.ok) {
      if (response.status===401) { token=''; storage.remove('yarilo_session'); $('loginPanel').classList.remove('hidden'); }
      throw new Error(result.message || 'Ошибка сервера ('+response.status+').');
    }
    return result;
  }
  function post(endpoint, value) { return api(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}); }
  function videoBatch(value,provider) {
    const entries=[];
    const rest=value.trim().replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi,code=>{entries.push(code);return '\n';});
    entries.push(...rest.split(/\r?\n/).map(x=>x.trim()).filter(Boolean));
    if(!entries.length)throw new Error('Вставьте ссылки '+provider+', каждую с новой строки.');
    return entries.map((entry,i)=>{const info=M.externalVideo(entry);if(!info||info.provider!==provider)throw new Error('Проверьте видео '+provider+' №'+(i+1)+'. Вставляйте по одной ссылке или коду плеера на строку.');return info;});
  }
  function mergeVideos(group,infos) {
    for(const info of infos){
      const index=group.videos.findIndex(v=>M.externalVideo(v)?.url===info.url);
      if(index<0)group.videos.push(info.embed);
      else {const old=group.videos[index];group.videos[index]=info.embed;if(old!==info.embed&&group.mediaDescriptions[old]){group.mediaDescriptions[info.embed]=group.mediaDescriptions[old];delete group.mediaDescriptions[old];}}
    }
  }
  function collect() {
    const d=structuredClone(data);
    document.querySelectorAll('[data-field]').forEach(el=>putPath(d,el.dataset.field,el.value.trim()));
    d.foundation.phoneLink=d.foundation.phone.replace(/[^\d+]/g,'');
    d.requisites.accounts=Array.from($('accounts').children).map(card=>{
      const account=structuredClone(data.requisites.accounts[Number(card.dataset.index)] || {});
      card.querySelectorAll('[data-account-field]').forEach(el=>account[el.dataset.accountField]=el.value.trim());
      return account;
    });
    document.querySelectorAll('[data-video-group]').forEach(input=>{
      if(!input.value.trim())return;
      mergeVideos(getPath(d,input.dataset.videoGroup),videoBatch(input.value,input.dataset.videoProvider));
    });
    // Keep legacy keys consistent for any external consumers.
    d.aboutPage.historyImage=d.aboutPage.photos.join(',');
    d.aboutPage.historyVideo=d.aboutPage.videos[0] || '';
    return d;
  }
  function fill() {
    document.querySelectorAll('[data-field]').forEach(el=>el.value=getPath(data,el.dataset.field) ?? '');
    document.querySelectorAll('[data-media-group]').forEach(container=>{if(!container.dataset.mediaGroup.startsWith('publications.'))renderMedia(container);});
    renderCover();
    renderAccounts();
    renderQR();
    document.querySelectorAll('[data-document-group]').forEach(renderDocuments);
    renderReports();
    Object.keys(M.publicationKinds).forEach(renderPublications);
  }
  function element(tag, text, className) { const el=document.createElement(tag); if(text!==undefined)el.textContent=text; if(className)el.className=className; return el; }
  function openImage(src, description) {
    const dialog=element('dialog',undefined,'media-dialog');
    const close=element('button','Закрыть','secondary'); close.type='button'; close.onclick=()=>dialog.close();
    const img=element('img'); img.src=src; img.alt='Увеличенное фото';
    dialog.append(close,img); if(description)dialog.append(element('p',description,'media-caption')); dialog.addEventListener('close',()=>dialog.remove());
    dialog.onclick=e=>{if(e.target===dialog)dialog.close();}; document.body.append(dialog); dialog.showModal();
  }
  function mediaURL(p) { return previews.get(p) || M.safeURL(p, new URL('../',location.href).href); }
  async function requireDocuments(reports=false) {
    const health=await api('/health');
    if(!health.features?.documents || (reports&&!health.features?.reports))throw new Error('Загрузка '+(reports?'отчётности':'документов')+' пока недоступна: сервер сайта ещё не обновлён. Ваши изменения остаются в форме.');
  }
  const reportFor=id=>data.reports.find(report=>report.id===id);
  const publicationFor=(kind,id)=>data.publications[kind].items.find(item=>item.id===id);
  async function requirePublications() {
    const health=await api('/health');
    if(!health.features?.publications)throw new Error('Редактирование новостей и проектов пока недоступно: сервер сайта ещё не обновлён. Ваши изменения остаются в форме.');
  }
  function renderPublications(kind) {
    const container=$(kind+'Editor');if(!container)return;container.replaceChildren();
    const items=data.publications[kind].items;
    if(!items.length)container.append(element('p','Записи пока не добавлены.','small'));
    items.forEach((item,index)=>{
      const card=element('section',undefined,'report-editor publication-editor');card.dataset.publicationId=item.id;
      card.append(element('h3',(kind==='news'?'Новость ':'Проект ')+(index+1)));
      for(const [key,label,type,max]of [['title','Название','input',200],['date','Дата (необязательно)','input',10],['label',kind==='news'?'Метка (необязательно)':'Статус проекта','input',100],['text','Текст','textarea',10000],['link','Ссылка «Подробнее» (необязательно)','input',2000]]) {
        const field=element(type),caption=element('label',label);field.id=kind+'-'+item.id+'-'+key;caption.htmlFor=field.id;field.maxLength=max;
        if(key==='date')field.type='date';if(key==='link')field.placeholder='help.html или https://…';field.value=item[key];
        field.oninput=()=>{publicationFor(kind,item.id)[key]=field.value;changed();};card.append(caption,field);
      }
      const media=element('div',undefined,'publication-editor-media');media.dataset.mediaGroup='publications.'+kind+'.items.'+index;renderMedia(media);card.append(media);
      const actions=element('div',undefined,'report-editor-actions');
      for(const [label,offset]of [['Выше',-1],['Ниже',1]]){const button=element('button',label,'secondary');button.type='button';button.hidden=index+offset<0||index+offset>=items.length;button.onclick=()=>{const current=data.publications[kind].items,i=current.findIndex(x=>x.id===item.id);[current[i],current[i+offset]]=[current[i+offset],current[i]];changed();renderPublications(kind);};actions.append(button);}
      const remove=element('button',kind==='news'?'Удалить новость':'Удалить проект','danger');remove.type='button';remove.onclick=()=>{data.publications[kind].items=data.publications[kind].items.filter(x=>x.id!==item.id);changed();renderPublications(kind);};actions.append(remove);card.append(actions);container.append(card);
    });
  }
  const documentFiles=container=>container.dataset.reportId ? reportFor(container.dataset.reportId).files : data.documents[container.dataset.documentGroup];
  function renderReports() {
    const container=$('reportsEditor');if(!container)return;container.replaceChildren();
    if(!data.reports.length)container.append(element('p','Отчёты пока не добавлены. Нажмите «Добавить отчёт».','small'));
    data.reports.forEach((report,index)=>{
      const card=element('section',undefined,'report-editor');card.dataset.reportId=report.id;
      card.append(element('h3','Отчёт '+(index+1)));
      for(const [key,label,type] of [['title','Название отчёта','input'],['year','Год отчёта','input'],['category','Вид отчётности','select'],['description','Описание отчёта','textarea']]) {
        const field=element(type),caption=element('label',label);field.id=report.id+'-'+key;caption.htmlFor=field.id;
        if(type==='select')for(const [value,name]of Object.entries(M.reportKinds)){const option=element('option',name);option.value=value;field.append(option);}
        else field.maxLength=key==='year'?4:key==='description'?5000:200;
        if(key==='year'){field.inputMode='numeric';field.placeholder='Например, 2025';}
        field.value=report[key];field.oninput=()=>{reportFor(report.id)[key]=field.value;changed();};card.append(caption,field);
      }
      const documents=element('div',undefined,'report-files');documents.dataset.reportId=report.id;renderDocuments(documents);card.append(documents);
      const actions=element('div',undefined,'report-editor-actions');
      for(const [label,offset] of [['Выше',-1],['Ниже',1]]){const button=element('button',label,'secondary');button.type='button';button.hidden=index+offset<0||index+offset>=data.reports.length;button.onclick=()=>{const i=data.reports.findIndex(r=>r.id===report.id);[data.reports[i],data.reports[i+offset]]=[data.reports[i+offset],data.reports[i]];changed();renderReports();};actions.append(button);}
      const remove=element('button','Удалить отчёт','danger');remove.type='button';remove.onclick=()=>{data.reports=data.reports.filter(r=>r.id!==report.id);changed();renderReports();};actions.append(remove);card.append(actions);container.append(card);
    });
  }
  function renderDocuments(container) {
    const kind=container.dataset.documentGroup||container.dataset.reportId, files=documentFiles(container);
    container.replaceChildren();
    const label=element('label',container.dataset.reportId?'Загрузить файлы отчёта':'Загрузить файлы: '+M.documentKinds[kind]);label.htmlFor='document-'+kind;
    const input=element('input');input.type='file';input.id=label.htmlFor;input.multiple=true;input.accept='.pdf,.jpg,.jpeg,.png,.webp';
    input.onchange=()=>stageDocuments(container,input);
    container.append(label,input,element('p','PDF, JPG, JPEG, PNG, WEBP. До 8 МБ на файл, до 20 файлов. Можно выбрать несколько страниц скана.','small'));
    const list=element('div',undefined,'document-editor-list');container.append(list);
    if(!files.length)list.append(element('p','Документы пока не загружены.','small'));
    files.forEach((file,index)=>{
      const card=element('div',undefined,'document-editor-card'), href=mediaURL(file.path);
      const titleLabel=element('label','Название на сайте');titleLabel.htmlFor='document-'+kind+'-title-'+index;
      const title=element('input');title.id=titleLabel.htmlFor;title.maxLength=200;title.value=file.title;
      title.oninput=()=>{documentFiles(container)[index].title=title.value;changed();};
      const info=element('p',file.name+' · '+M.fileSize(file.size),'small');
      const actions=element('div',undefined,'document-actions');
      const open=element('a','Открыть файл','document-open');open.href=href;open.target='_blank';open.rel='noopener noreferrer';
      const remove=element('button','Удалить файл','danger');remove.type='button';remove.onclick=()=>{documentFiles(container).splice(index,1);changed();renderDocuments(container);};
      actions.append(open,remove);card.append(titleLabel,title,info,actions);list.append(card);
    });
  }
  async function stageDocuments(container,input) {
    const files=Array.from(input.files||[]),kind=container.dataset.documentGroup;if(!files.length||busy)return;
    let completed=0;
    try {
      if(documentFiles(container).length+files.length>20)throw new Error('В каждом разделе допускается до 20 файлов.');
      for(const file of files)if(!/\.(pdf|jpe?g|png|webp)$/i.test(file.name)||!file.size||file.size>8*1024*1024)throw new Error('Выберите PDF или изображение размером до 8 МБ: '+file.name);
      lock(true);await requireDocuments(!!container.dataset.reportId);
      for(const file of files) {
        status('Загружаю документ '+(completed+1)+' из '+files.length+': '+file.name);
        const result=await post('/upload',{name:file.name,content:await asBase64(file)});
        uploads.set(result.path,result.receipt);previews.set(result.path,URL.createObjectURL(file));
        documentFiles(container).push({path:result.path,name:file.name.slice(0,180),title:file.name.replace(/\.[^.]+$/,'').slice(0,200)||M.documentKinds[kind]||'Файл отчёта',size:file.size});
        completed++;changed();
      }
      status('Добавлено документов: '+completed+'. Нажмите «Сохранить изменения», чтобы опубликовать их.');
    } catch(e){status(e.message+(completed?' Уже загружено: '+completed+'. Их можно сохранить.':''),'error');}
    finally{renderDocuments(container);lock(false);}
  }
  const videoDrafts=new Map();
  function renderMedia(container) {
    const groupPath=container.dataset.mediaGroup, group=getPath(data,groupPath);
    const draftKey=group.id||groupPath;
    container.replaceChildren();
    for(const [key,title,accept] of [['photos','Фотографии','.jpg,.jpeg,.png,.webp'],['videos','Видео','.mp4,.webm']]) {
      const id=groupPath.replaceAll('.','-')+'-'+key;
      const label=element('label',title); label.htmlFor=id;
      const input=element('input'); input.type='file'; input.id=id; input.accept=accept; input.multiple=true;
      input.onchange=()=>stageFiles(container,key,input);
      const hint=element('p',key==='photos'?'JPG, JPEG, PNG, WEBP. Выберите несколько фото до 40 МБ каждое: крупные снимки автоматически уменьшаются перед загрузкой.':'Видео любого размера храните в ВК или YouTube и добавляйте ссылку ниже. Прямая загрузка MP4/WEBM пока до 20 МБ на файл.','media-hint');
      const grid=element('div',undefined,'media-grid'); grid.dataset.mediaList=key;
      group[key].forEach((p,index)=>{
        const card=element('div',undefined,'media-item');
        const src=mediaURL(p);
        if(key==='photos') { const button=element('button',undefined,'media-open'); button.type='button'; button.setAttribute('aria-label','Увеличить фото '+(index+1)); const img=element('img'); img.src=src; img.alt='Фото '+(index+1); img.loading='lazy'; button.append(img); button.onclick=()=>openImage(src,M.description(getPath(data,groupPath),p)); card.append(button); }
        else { card.append(M.videoElement(src,M.description(group,p))); }
        const remove=element('button',key==='photos'?'Удалить фото':'Удалить видео','danger'); remove.type='button';
        remove.onclick=()=>{const current=getPath(data,groupPath);current[key].splice(index,1);if(![...current.photos,...current.videos].includes(p))delete current.mediaDescriptions[p];changed();renderMedia(container);status('Файл убран из раздела. Нажмите «Сохранить изменения».');};
        const captionLabel=element('label',key==='photos'?'Описание фото':'Описание видео','media-caption-label');
        const caption=element('textarea',undefined,'media-caption-input');caption.id=id+'-description-'+index;captionLabel.htmlFor=caption.id;
        caption.value=M.description(group,p);caption.maxLength=2000;caption.rows=3;caption.placeholder='Необязательно. Появится под файлом на сайте.';
        caption.oninput=()=>{const descriptions=getPath(data,groupPath).mediaDescriptions;if(caption.value.trim())descriptions[p]=caption.value;else delete descriptions[p];changed();};
        card.append(element('p',p.split('/').pop()),captionLabel,caption,remove); grid.append(card);
      });
      container.append(label);
      if(key==='photos')container.append(input,hint);
      if(key==='videos') {
        for(const provider of ['ВК','YouTube']) {
          const suffix=provider==='ВК'?'vk':'youtube';
          const urlLabel=element('label','Видео '+provider);urlLabel.htmlFor=id+'-'+suffix+'-link';
          const url=element('textarea');url.id=id+'-'+suffix+'-link';url.rows=4;url.dataset.videoGroup=groupPath;url.dataset.videoProvider=provider;url.value=videoDrafts.get(draftKey+'-'+provider)||'';url.oninput=()=>{videoDrafts.set(draftKey+'-'+provider,url.value);changed();};
          url.placeholder='Можно добавить много видео '+provider+'. Каждую ссылку или полный код iframe вставляйте с новой строки.';
          const add=element('button','Добавить видео '+provider);add.type='button';
          add.onclick=()=>{try{const infos=videoBatch(url.value,provider);const group=getPath(data,groupPath);mergeVideos(group,infos);
            videoDrafts.delete(draftKey+'-'+provider);changed();renderMedia(container);status('Обработано ссылок: '+infos.length+'. Всего видео в разделе: '+group.videos.length+'. Нажмите «Сохранить изменения».');
          }catch(e){status(e.message,'error');}};
          container.append(urlLabel,url,add,element('p',provider==='ВК'?'Если плеер пишет «Видеофайл не найден», откройте ролик в ВК, выберите «Поделиться → Экспортировать» и вставьте полный код плеера сюда. Повторное добавление обновит ссылку существующего ролика.':'Вставьте ссылку на конкретный ролик YouTube. Автор должен разрешить показ на других сайтах.','media-hint'));
        }
      }
      if(key==='videos'){const files=element('details');files.append(element('summary','Или загрузить небольшой видеофайл'),input,hint);container.append(files);}
      if(key==='videos')container.append(element('p','Всего видео в этом разделе: '+group.videos.length+'. Новые ролики добавляются к существующим.','media-hint'));
      container.append(grid);
    }
  }
  function renderCover() {
    const box=$('coverEditor');if(!box)return;box.replaceChildren();
    const label=element('label','Фото на главной странице');label.htmlFor='coverFile';
    const img=element('img');img.src=data.home.coverImage?mediaURL(data.home.coverImage):'../assets/yarilo-cover.png';img.alt='Обложка главной страницы';img.style.cssText='display:block;max-width:100%;width:320px;max-height:240px;object-fit:contain;margin:12px 0';
    const input=element('input');input.id='coverFile';input.type='file';input.accept='.jpg,.jpeg,.png,.webp';
    input.onchange=async()=>{const original=input.files?.[0];if(!original||busy)return;try{
      if(!/\.(jpe?g|png|webp)$/i.test(original.name)||original.size>40*1024*1024)throw new Error('Выберите JPG, PNG или WEBP до 40 МБ.');
      lock(true);status('Загружаю обложку…');const health=await api('/health');if(!health.features?.coverImage)throw new Error('Для смены обложки установите Worker версии 6 из обновления.');
      const file=await preparePhoto(original);const result=await post('/upload',{name:file.name,content:await asBase64(file)});
      uploads.set(result.path,result.receipt);previews.set(result.path,URL.createObjectURL(file));data.home.coverImage=result.path;changed();status('Фото выбрано. Нажмите «Сохранить изменения».');
    }catch(e){status(e.message,'error');}finally{renderCover();lock(false);}};
    const reset=element('button','Вернуть исходную обложку');reset.type='button';reset.onclick=()=>{data.home.coverImage='';changed();renderCover();status('Исходная обложка выбрана. Нажмите «Сохранить изменения».');};
    box.append(label,img,input,element('p','Выберите фото с компьютера или телефона, затем сохраните изменения.','small'),reset);
  }
  function renderQR() {
    if (!$('qrPreview')) return;
    const src=M.qrImage(data.donation.qrImage);
    $('qrPreview').replaceChildren();
    if(src){const img=element('img');img.src=src;img.alt='Загруженный QR-код для пожертвования';$('qrPreview').append(img);}
    $('removeQr').hidden=!src;
  }
  async function selectQR() {
    const file=$('donationQrFile').files?.[0];if(!file||busy)return;
    try {
      if(!/\.(png|jpe?g|webp)$/i.test(file.name)||file.size>200*1024||!file.size)throw new Error('Выберите QR-код в PNG, JPG или WEBP размером до 200 КБ.');
      lock(true);
      const base64=await asBase64(file),ext=file.name.split('.').pop().toLowerCase();
      const src='data:image/'+(['jpg','jpeg'].includes(ext)?'jpeg':ext)+';base64,'+base64;
      const img=new Image();img.src=src;await img.decode();
      if(!M.qrImage(src))throw new Error('Не удалось прочитать QR-код.');
      data.donation.qrImage=src;changed();renderQR();
      status('QR-код добавлен. Нажмите «Сохранить изменения».');
    }catch(e){status(e.message||'Не удалось прочитать изображение QR-кода.','error');}
    finally{lock(false);$('donationQrFile').value='';}
  }
  const accountFields=[['label','Название счёта'],['recipient','Получатель'],['bank','Банк'],['account','Расчётный счёт'],['bik','БИК'],['correspondent','Корреспондентский счёт'],['bankInn','ИНН банка'],['bankKpp','КПП банка'],['currency','Валюта'],['purpose','Назначение платежа (если отличается от общего)']];
  function renderAccounts() {
    $('accounts').replaceChildren();
    data.requisites.accounts.forEach((account,i)=>{
      const card=element('div',undefined,'account-editor'); card.dataset.index=i; card.append(element('h3','Счёт '+(i+1)));
      const grid=element('div',undefined,'grid');
      accountFields.forEach(([key,title])=>{const box=element('div',undefined,'field');const label=element('label',title); const input=element('input');input.id='account-'+i+'-'+key; label.htmlFor=input.id; input.dataset.accountField=key; input.value=account[key] || ''; box.append(label,input);grid.append(box);});
      const remove=element('button','Удалить этот счёт','danger'); remove.type='button'; remove.onclick=()=>{data=collect();data.requisites.accounts.splice(i,1);changed();renderAccounts();};
      card.append(grid,remove);$('accounts').append(card);
    });
  }
  async function asBase64(file) { return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(new Error('Не удалось прочитать файл '+file.name));r.readAsDataURL(file);}); }
  async function preparePhoto(file) {
    const bitmap=await createImageBitmap(file);
    try {
      if(file.size<=2*1024*1024 && Math.max(bitmap.width,bitmap.height)<=2560)return file;
      const scale=Math.min(1,2560/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.86));
      if(!blob||blob.size>8*1024*1024)throw new Error('Не удалось уменьшить фото '+file.name+'. Сохраните его в JPG и повторите.');
      const ext=blob.type==='image/webp'?'webp':'png';
      return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.'+ext,{type:blob.type});
    } finally {bitmap.close();}
  }
  function needsMediaV2(d) {
    const groups=[d.aboutPage,...Object.values(d.help||{}),...Object.values(d.publications||{}).flatMap(p=>p.items||[])];
    return groups.some(g=>['photos','videos'].some(k=>(g[k]||[]).length>200)||(g.videos||[]).some(M.externalVideo));
  }
  async function requireMediaV2(d) {
    if(!needsMediaV2(d))return;
    const health=await api('/health');
    if(!health.features?.mediaV2)throw new Error('Для сохранения видеоссылок и более 200 файлов нужно обновить сервер сайта. Изменения остаются в форме.');
  }
  async function stageFiles(container,key,input) {
    const files=Array.from(input.files || []); if(!files.length || busy)return;
    let completed=0;
    try {
      const group=getPath(data,container.dataset.mediaGroup);

      for(const file of files) {
        const allowed=key==='photos'?/\.(jpe?g|png|webp)$/i:/\.(mp4|webm)$/i;
        const limit=(key==='photos'?40:20)*1024*1024;
        if(!allowed.test(file.name))throw new Error('Недопустимый формат: '+file.name);
        if(!file.size || file.size>limit)throw new Error('Файл '+file.name+' пуст или превышает '+(limit/1024/1024)+' МБ.');
      }
      lock(true);
      if(group[key].length+files.length>200){const health=await api('/health');if(!health.features?.mediaV2)throw new Error('Для более 200 файлов сначала обновите сервер сайта.');}
      if(container.dataset.mediaGroup.startsWith('publications.'))await requirePublications();
      for(const original of files) {
        const file=key==='photos'?await preparePhoto(original):original;
        status('Загружаю '+(completed+1)+' из '+files.length+': '+file.name);
        const result=await post('/upload',{name:file.name,content:await asBase64(file)});
        uploads.set(result.path,result.receipt);previews.set(result.path,URL.createObjectURL(file)); group[key].push(result.path);completed++;changed();
      }
      status('Добавлено файлов: '+completed+'. Нажмите «Сохранить изменения», чтобы опубликовать их.','ok');
    } catch(e) {status(e.message+(completed?' Успешно добавлено: '+completed+'. Их можно сохранить.':''),'error');}
    finally {renderMedia(container);lock(false);}
  }
  async function loadData() {
    const result=await api('/data');
    data=M.normalize(result.data);sha=result.sha;dirty=false;uploads.clear();videoDrafts.clear();
    savedDocuments=JSON.stringify(data.documents);
    savedReports=JSON.stringify([data.reports,data.reporting]);
    savedPublications=JSON.stringify(data.publications);
    for(const url of previews.values())URL.revokeObjectURL(url);previews.clear();fill();
    status('Данные сайта загружены.','ok');
  }
  async function save() {
    if(busy || !data || !sha)return;
    try {
      const next=M.validate(collect());lock(true);status('Сохраняю данные и файлы…');
      await requireMediaV2(next);
      if(JSON.stringify(next.documents)!==savedDocuments)await requireDocuments();
      if(JSON.stringify([next.reports,next.reporting])!==savedReports)await requireDocuments(true);
      if(JSON.stringify(next.publications)!==savedPublications)await requirePublications();
      const paths=new Set(M.mediaPaths(next));
      const result=await post('/save',{data:next,sha,uploads:[...uploads].filter(([p])=>paths.has(p)).map(([,receipt])=>receipt)});
      data=next;sha=result.sha;dirty=false;uploads.clear();videoDrafts.clear();
      savedDocuments=JSON.stringify(data.documents);
      savedReports=JSON.stringify([data.reports,data.reporting]);
      savedPublications=JSON.stringify(data.publications);
      fill();
      status('Сохранено в GitHub. Сайт обновится после завершения публикации GitHub Pages.','ok');
    } catch(e) {status(e.message,'error');} finally{lock(false);}
  }
  async function login() {
    if(dirty && !confirm('Есть несохранённые изменения. Перейти ко входу и оставить их несохранёнными?'))return;
    try {const bytes=crypto.getRandomValues(new Uint8Array(24));const nonce=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');storage.set('yarilo_login_nonce',nonce);dirty=false;location.assign(WORKER+'/login?nonce='+nonce);}
    catch{status('Для входа разрешите хранение данных сайта в браузере.','error');}
  }
  $('loginButton').onclick=login;$('saveButton').onclick=save;
  if($('addReport'))$('addReport').onclick=()=>{if(data.reports.length>=100){status('Допускается до 100 отчётов.','error');return;}data.reports.push({id:'report-'+crypto.randomUUID(),title:'',year:String(new Date().getFullYear()),category:'annual',description:'',files:[]});changed();renderReports();$('reportsEditor').lastElementChild.querySelector('input').focus();};
  for(const kind of Object.keys(M.publicationKinds))if($('add-'+kind))$('add-'+kind).onclick=()=>{const items=data.publications[kind].items;if(items.length>=100){status('Допускается до 100 записей.','error');return;}items.push({id:'post-'+crypto.randomUUID(),title:'',date:kind==='news'?new Date().toISOString().slice(0,10):'',label:'',text:'',link:'',photos:[],videos:[],mediaDescriptions:{}});changed();renderPublications(kind);$(kind+'Editor').lastElementChild.querySelector('input').focus();};
  if($('donationQrFile'))$('donationQrFile').onchange=selectQR;
  if($('removeQr'))$('removeQr').onclick=()=>{data.donation.qrImage='';changed();renderQR();};
  if($('checkPublication'))$('checkPublication').onclick=async()=>{
    if(busy)return;if(dirty){status('Сначала сохраните изменения в форме.');return;}
    lock(true);status('Проверяю опубликованные данные…');
    try {
      const r=await fetch('../site-data.js?check='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!r.ok)throw new Error();
      const published=M.parse(await r.text());
      status(M.serialize(published)===M.serialize(data)?'Изменения уже опубликованы. Обновите открытую страницу сайта через Ctrl+F5.':'В GitHub данные сохранены, но сайт пока отдаёт предыдущую версию. Дождитесь завершения публикации и проверьте ещё раз.','info');
    }catch{status('Не удалось проверить публикацию. Сохранённые в GitHub данные не изменены.','error');}finally{lock(false);}
  };
  $('addAccount').onclick=()=>{data=collect();data.requisites.accounts.push({label:'',recipient:data.foundation.name,bank:'',account:'',bik:'',correspondent:'',currency:'RUB',purpose:''});changed();renderAccounts();};
  $('reloadButton').onclick=async()=>{if(dirty&&!confirm('Загрузить сохранённые данные и отменить изменения в форме?'))return;lock(true);try{await loadData();}catch(e){status(e.message,'error');}finally{lock(false);}};
  $('logoutButton').onclick=()=>{if(dirty&&!confirm('Выйти без сохранения изменений?'))return;storage.remove('yarilo_session');dirty=false;location.replace(location.pathname);};
  $('editorPanel').addEventListener('input',changed);
  window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
  (async()=>{
    try {
      storage.remove('yarilo_token');
      const hash=new URLSearchParams(location.hash.slice(1));
      const received=hash.get('session'), error=hash.get('error');
      if(location.hash || new URLSearchParams(location.search).has('token'))history.replaceState({},'',location.pathname);
      if(error) {storage.remove('yarilo_login_nonce');throw new Error(error);}
      if(received) {
        const expected=storage.get('yarilo_login_nonce');storage.remove('yarilo_login_nonce');
        if(!expected || hash.get('nonce')!==expected)throw new Error('Не удалось подтвердить вход. Нажмите «Войти через GitHub» ещё раз.');
        storage.set('yarilo_session',received);
      }
      token=storage.get('yarilo_session');if(!token)return;
      lock(true);const user=await api('/me');$('githubUser').textContent=user.name||user.login;
      await loadData();$('loginPanel').classList.add('hidden');$('editorPanel').classList.remove('hidden');
    }catch(e){status(e.message,'error');}finally{lock(false);}
  })();
})();


/* YARILO programs admin shortcut 20261007.1 */
(()=>{
  function addProgramsShortcut(){
    if(document.querySelector('[data-yarilo-programs-link]'))return;
    const candidates=[...document.querySelectorAll('button,a')];
    const project=candidates.find(el=>el.textContent.trim()==='Проекты');
    const host=project?.parentElement;
    if(!host)return;
    const a=document.createElement('a');
    a.href='programs.html';
    a.textContent='Программы';
    a.dataset.yariloProgramsLink='1';
    a.style.cssText='display:flex;align-items:center;padding:12px;border:1px solid #cbd5d1;border-radius:10px;background:#fff;color:#10251f;font-weight:700;text-decoration:none;min-height:48px';
    host.insertBefore(a,project.nextSibling);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addProgramsShortcut);
  else addProgramsShortcut();
  new MutationObserver(addProgramsShortcut).observe(document.documentElement,{childList:true,subtree:true});
})();
