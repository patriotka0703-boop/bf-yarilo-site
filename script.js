
const menuButton=document.querySelector('.menu-btn');
const menu=document.querySelector('.menu');
menuButton?.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',open?'true':'false')});
document.querySelectorAll('.menu a').forEach(a=>a.addEventListener('click',()=>menu?.classList.remove('open')));
const year=document.getElementById('year'); if(year) year.textContent=new Date().getFullYear();

/* ВСТАВЬТЕ СЮДА ОФИЦИАЛЬНУЮ ПЛАТЁЖНУЮ ССЫЛКУ ФОНДА.
   Пример: const DONATION_URL = "https://..."; */
const DONATION_URL = "";

let chosenAmount="";
const amountButtons=document.querySelectorAll('[data-amount]');
const customAmount=document.getElementById('customAmount');
amountButtons.forEach(btn=>btn.addEventListener('click',()=>{
  amountButtons.forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  chosenAmount=btn.dataset.amount;
  if(customAmount) customAmount.value="";
}));
customAmount?.addEventListener('input',()=>{
  amountButtons.forEach(b=>b.classList.remove('selected'));
  chosenAmount=customAmount.value;
});
document.getElementById('donateButton')?.addEventListener('click',()=>{
  if(!DONATION_URL){
    const note=document.getElementById('paymentNote');
    if(note) note.innerHTML='Онлайн-платёж пока не подключён. Позвоните в фонд: <a href="tel:+79660577755"><b>+7 966 057-77-55</b></a>. После добавления официальной платёжной ссылки эта кнопка начнёт вести прямо к оплате.';
    return;
  }
  const sep=DONATION_URL.includes('?')?'&':'?';
  const url=chosenAmount ? `${DONATION_URL}${sep}amount=${encodeURIComponent(chosenAmount)}` : DONATION_URL;
  window.location.href=url;
});
