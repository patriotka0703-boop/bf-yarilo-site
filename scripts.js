/* Shared rendering for content managed by the editor. Menu/year stay in script.js. */
(function () {
  'use strict';
  if (!window.YARILO || !window.YariloModel) return;
  const M=window.YariloModel, d=M.normalize(window.YARILO);
  const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value ?? '';if(cls)e.className=cls;return e;};
  function enlarge(src, description) {
    const dialog=document.createElement('dialog');dialog.className='photo-dialog';
    const close=text('button','Закрыть','btn btn-small');close.onclick=()=>dialog.close();
    const img=document.createElement('img');img.src=src;img.alt='Увеличенное фото';
    dialog.append(close,img);if(description)dialog.append(text('p',description,'media-caption'));dialog.addEventListener('close',()=>dialog.remove());dialog.onclick=e=>{if(e.target===dialog)dialog.close();};document.body.append(dialog);dialog.showModal();
  }
  function media(container,group) {
    if(!container)return;container.replaceChildren();
    for(const [key,type] of [['photos','photo'],['videos','video']]) {
      for(const p of group[key]) {
        const src=M.safeURL(p,location.href);if(!src)continue;
        const caption=M.description(group,p), figure=text('figure','','media-figure');
        if(type==='photo') {
          const button=document.createElement('button');button.type='button';button.className='gallery-photo';button.setAttribute('aria-label','Увеличить фото');
          const img=document.createElement('img');img.src=src;img.alt=caption?caption.slice(0,200):'Фото работы фонда';img.loading='lazy';
          button.append(img);button.onclick=()=>enlarge(src,caption);figure.append(button);
        } else {
          const video=document.createElement('video');video.src=src;video.controls=true;video.preload='metadata';video.playsInline=true;figure.append(video);
        }
        if(caption)figure.append(text('figcaption',caption,'media-caption'));
        container.append(figure);
      }
    }
    container.hidden=!container.children.length;
  }
  media(document.getElementById('history-media'),d.aboutPage);
  document.querySelectorAll('[data-direction]').forEach(el=>{media(el,d.help[el.dataset.direction]);document.getElementById('direction-media-section').hidden=el.hidden;});
  const donationURL=M.safeURL(d.donation.url,location.href), donationText=d.donation.text || 'Пожертвовать';
  document.querySelectorAll('a.btn[href="donate.html"],a[data-donation]').forEach(a=>{if(donationURL)a.href=donationURL;a.textContent=donationText;});
  const purpose=document.getElementById('donation-purpose');if(purpose)purpose.textContent=d.donation.purpose || '';
  const payment=document.getElementById('donation-payment');
  if(payment) {
    const target=new URL(donationURL || 'donate.html',location.href);
    const isLanding=target.origin===location.origin && target.pathname===new URL('donate.html',location.href).pathname;
    if(!isLanding && donationURL) {payment.href=donationURL;payment.textContent=donationText;document.getElementById('donation-offline-note').hidden=true;document.getElementById('donation-contact-note').hidden=true;}
  }
  function row(parent,label,value) {const r=text('div','','req-row');r.append(text('span',label),text('b',value || 'нужно подтвердить',value?'':'req-placeholder'));parent.append(r);}
  const legal=document.getElementById('legal-requisites');
  if(legal) {legal.replaceChildren(text('h3','Банковские реквизиты'));for(const [k,label] of [['inn','ИНН'],['kpp','КПП'],['ogrn','ОГРН']])row(legal,label,d.requisites[k]);if(d.requisites.address)row(legal,'Юридический адрес',d.requisites.address);if(!d.requisites.accounts.length)for(const [k,label] of [['account','Расчётный счёт'],['bank','Банк'],['bik','БИК'],['correspondent','Корр. счёт']])row(legal,label,'');}
  const accounts=document.getElementById('bank-accounts');
  if(accounts) {for(const account of d.requisites.accounts){const card=text('div','','req-card');card.append(text('h3',account.label||'Банковский счёт'));for(const [k,label] of [['recipient','Получатель'],['bank','Банк'],['account','Расчётный счёт'],['bik','БИК'],['correspondent','Корр. счёт'],['currency','Валюта']])row(card,label,account[k]);row(card,'Назначение платежа',account.purpose||d.donation.purpose);accounts.append(card);}document.getElementById('bank-accounts-section').hidden=!accounts.children.length;}
  document.querySelectorAll('#footer-phone').forEach(a=>{a.textContent=d.foundation.phone;a.href='tel:'+d.foundation.phoneLink;});
  const footer=document.querySelector('.footer-main > div:last-child');
  if(footer) {
    const links=text('nav','','social-links');links.setAttribute('aria-label','Социальные сети фонда');
    for(const [key,label] of [['vk','ВК'],['instagram','Instagram'],['youtube','YouTube']]) {
      const href=M.socialURL(d.socials[key]);if(!href)continue;
      const a=text('a',label,'social-link');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',label+' — откроется в новой вкладке');
      links.append(a);
    }
    if(links.children.length)footer.append(links);
  }
})();
