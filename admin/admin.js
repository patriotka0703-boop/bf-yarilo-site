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
    
    if (host === 'rutube.ru') {
     
const match = u.pathname.match(/^\/(?:video|shorts|play\/embed)\/([a-f0-9]{32}|[a-f0-9-]{36})\/?$/i);

      if (!match) return null;
      const id = match[1].toLowerCase();
      return {
        provider: 'RUTUBE',
        embed: 'https://rutube.ru/play/embed/' + id,
        url: 'https://rutube.ru/video/' + id + '/'
      };
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
