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
  function openImage(src) {
    const dialog=element('dialog',undefined,'media-dialog');
    const close=element('button','Закрыть','secondary'); close.type='button'; close.onclick=()=>dialog.close();
    const img=element('img'); img.src=src; img.alt='Увеличенное фото';
    dialog.append(close,img); dialog.addEventListener('close',()=>dialog.remove());
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
        if(key==='photos') { const button=element('button',undefined,'media-open'); button.type='button'; button.setAttribute('aria-label','Увеличить фото '+(index+1)); const img=element('img'); img.src=src; img.alt='Фото '+(index+1); img.loading='lazy'; button.append(img); button.onclick=()=>openImage(src); card.append(button); }
        else { const video=element('video'); video.controls=true; video.preload='metadata'; video.src=src; card.append(video); }
        const remove=element('button',key==='photos'?'Удалить фото':'Удалить видео','danger'); remove.type='button';
        remove.onclick=()=>{group[key].splice(index,1);changed();renderMedia(container);status('Файл убран из раздела. Нажмите «Сохранить изменения».');};
        card.append(element('p',p.split('/').pop()),remove); grid.append(card);
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
