
(async function () {
  'use strict';

  if (window.yariloDataReady) {
    await window.yariloDataReady;
  }

  const box = document.querySelector('.hero-cover');
  if (!box) return;

  const image = box.querySelector('.hero-art');
  if (!image) return;

  const data = window.YARILO;
  const home = data && data.home;
  const initial = image.getAttribute('src') || '';

  const path = home &&
    Object.prototype.hasOwnProperty.call(home, 'coverImage')
      ? home.coverImage
      : initial;

  if (!path) {
    image.hidden = true;
    box.classList.add('no-art');
    box.classList.remove('custom-art');
  } else {
   image.onerror = function () {
  image.hidden = true;
  box.classList.add('no-art');
  box.classList.remove('custom-art');
};

    image.hidden = false;
    box.classList.remove('no-art');

    const custom = path !== initial;
    box.classList.toggle('custom-art', custom);

    const imageUrl = !custom
      ? path + (path.includes('?') ? '&' : '?') + 'v=20261108.2'
      : path;

    image.src = imageUrl;
  }

  /* Независимая загрузка QR-кода */

  const qr = box.querySelector('.hero-qr');
  const link = box.querySelector('.hero-qr-link');

  const raw = data && data.donation
    ? data.donation.qrImage
    : null;

  const source = window.YariloModel &&
    typeof window.YariloModel.qrImage === 'function'
      ? window.YariloModel.qrImage(raw)
      : null;

  if (source && qr && link) {
    qr.src = source;
    link.href = source;
  }

})();
