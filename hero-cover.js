(async function () {
  'use strict';
  if(window.yariloDataReady)await window.yariloDataReady;
  const box=document.querySelector('.hero-cover');
  if(!box)return;
  const image=box.querySelector('.hero-art');
  const data=window.YARILO;
  const initial=image.getAttribute('src');
  const home=data?.home;
  const path=home && Object.prototype.hasOwnProperty.call(home,'coverImage') ? home.coverImage : initial;
  if(!path){image.hidden=true;box.classList.add('no-art');}
  else {
    image.src=path;
    box.classList.toggle('custom-art',path!==initial);
    image.onerror=()=>{image.hidden=true;box.classList.add('no-art');};
  }
  const qr=box.querySelector('.hero-qr');
  const link=box.querySelector('.hero-qr-link');
  const raw=data?.donation?.qrImage;
  const source=window.YariloModel?.qrImage(raw);
  if(source){qr.src=source;link.href=source;}
})();
