/* YARILO browser bundle 20260917.2 — built by work/build-browser.cjs */
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
  let token = '', data, sha = '', dirty = false, busy = false;
  const uploads = new Map(), previews = new Map();
  const getPath = (obj, p) => p.split('.').reduce((v,k)=>v?.[k], obj);
  function putPath(obj, p, value) { const keys=p.split('.'); const last=keys.pop(); const parent=keys.reduce((v,k)=>(v[k] ||= {}),obj); parent[last]=value; }
  function status(message, type='info') { $('status').textContent=message; $('status').className='status '+type; }
  function lock(value) { busy=value; $('editorPanel').querySelectorAll('input,textarea,button').forEach(e=>e.disabled=value); $('loginButton').disabled=value; }
  function changed() { dirty=true; }
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
  function collect() {
    const d=structuredClone(data);
    document.querySelectorAll('[data-field]').forEach(el=>putPath(d,el.dataset.field,el.value.trim()));
    d.foundation.phoneLink=d.foundation.phone.replace(/[^\d+]/g,'');
    d.requisites.accounts=Array.from($('accounts').children).map(card=>{
      const account=structuredClone(data.requisites.accounts[Number(card.dataset.index)] || {});
      card.querySelectorAll('[data-account-field]').forEach(el=>account[el.dataset.accountField]=el.value.trim());
      return account;
    });
    // Keep legacy keys consistent for any external consumers.
    d.aboutPage.historyImage=d.aboutPage.photos.join(',');
    d.aboutPage.historyVideo=d.aboutPage.videos[0] || '';
    return d;
  }
  function fill() {
    document.querySelectorAll('[data-field]').forEach(el=>el.value=getPath(data,el.dataset.field) ?? '');
    document.querySelectorAll('[data-media-group]').forEach(renderMedia);
    renderAccounts();
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
  function renderMedia(container) {
    const groupPath=container.dataset.mediaGroup, group=getPath(data,groupPath);
    container.replaceChildren();
    for(const [key,title,accept] of [['photos','Фотографии','.jpg,.jpeg,.png,.webp'],['videos','Видео','.mp4,.webm']]) {
      const id=groupPath.replaceAll('.','-')+'-'+key;
      const label=element('label',title); label.htmlFor=id;
      const input=element('input'); input.type='file'; input.id=id; input.accept=accept; input.multiple=true;
      input.onchange=()=>stageFiles(container,key,input);
      const hint=element('p',key==='photos'?'JPG, JPEG, PNG, WEBP. До 8 МБ на фото. Можно выбрать несколько файлов.':'MP4, WEBM. До 20 МБ на видео. Можно выбрать несколько файлов.','media-hint');
      const grid=element('div',undefined,'media-grid'); grid.dataset.mediaList=key;
      group[key].forEach((p,index)=>{
        const card=element('div',undefined,'media-item');
        const src=mediaURL(p);
        if(key==='photos') { const button=element('button',undefined,'media-open'); button.type='button'; button.setAttribute('aria-label','Увеличить фото '+(index+1)); const img=element('img'); img.src=src; img.alt='Фото '+(index+1); img.loading='lazy'; button.append(img); button.onclick=()=>openImage(src,M.description(getPath(data,groupPath),p)); card.append(button); }
        else { const video=element('video'); video.controls=true; video.preload='metadata'; video.src=src; card.append(video); }
        const remove=element('button',key==='photos'?'Удалить фото':'Удалить видео','danger'); remove.type='button';
        remove.onclick=()=>{const current=getPath(data,groupPath);current[key].splice(index,1);if(![...current.photos,...current.videos].includes(p))delete current.mediaDescriptions[p];changed();renderMedia(container);status('Файл убран из раздела. Нажмите «Сохранить изменения».');};
        const captionLabel=element('label',key==='photos'?'Описание фото':'Описание видео','media-caption-label');
        const caption=element('textarea',undefined,'media-caption-input');caption.id=id+'-description-'+index;captionLabel.htmlFor=caption.id;
        caption.value=M.description(group,p);caption.maxLength=2000;caption.rows=3;caption.placeholder='Необязательно. Появится под файлом на сайте.';
        caption.oninput=()=>{const descriptions=getPath(data,groupPath).mediaDescriptions;if(caption.value.trim())descriptions[p]=caption.value;else delete descriptions[p];changed();};
        card.append(element('p',p.split('/').pop()),captionLabel,caption,remove); grid.append(card);
      });
      container.append(label,input,hint,grid);
    }
  }
  const accountFields=[['label','Название счёта'],['recipient','Получатель'],['bank','Банк'],['account','Расчётный счёт'],['bik','БИК'],['correspondent','Корреспондентский счёт'],['currency','Валюта'],['purpose','Назначение платежа (если отличается от общего)']];
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
  async function stageFiles(container,key,input) {
    const files=Array.from(input.files || []); if(!files.length || busy)return;
    let completed=0;
    try {
      const group=getPath(data,container.dataset.mediaGroup);
      if(group[key].length+files.length>200)throw new Error('В разделе допускается до 200 файлов каждого типа.');
      for(const file of files) {
        const allowed=key==='photos'?/\.(jpe?g|png|webp)$/i:/\.(mp4|webm)$/i;
        const limit=(key==='photos'?8:20)*1024*1024;
        if(!allowed.test(file.name))throw new Error('Недопустимый формат: '+file.name);
        if(!file.size || file.size>limit)throw new Error('Файл '+file.name+' пуст или превышает '+(limit/1024/1024)+' МБ.');
      }
      lock(true);
      for(const file of files) {
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
    data=M.normalize(result.data);sha=result.sha;dirty=false;uploads.clear();
    for(const url of previews.values())URL.revokeObjectURL(url);previews.clear();fill();
    status('Данные сайта загружены.','ok');
  }
  async function save() {
    if(busy || !data || !sha)return;
    try {
      const next=M.validate(collect());lock(true);status('Сохраняю данные и файлы…');
      const paths=new Set(M.mediaPaths(next));
      const result=await post('/save',{data:next,sha,uploads:[...uploads].filter(([p])=>paths.has(p)).map(([,receipt])=>receipt)});
      data=next;sha=result.sha;dirty=false;uploads.clear();
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
