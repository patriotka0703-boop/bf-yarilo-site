(function(){
const ids={'/doroga-dobra.html':'doroga-dobra','/transport-dlya-dobryh-del.html':'transport','/ekstrennaya-pomoshch.html':'emergency'};
const rub=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(n);
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
function show(container,key,data){
 const d=data&&data[key];
 const el=document.createElement('div');el.className='public-counter';
 const heading=document.createElement('h3');heading.textContent='Поступления и расходы';el.append(heading);
 if(!d||!valid(d.received)||!valid(d.spent)||d.spent>d.received||!/^\d{4}-\d{2}-\d{2}$/.test(d.updated_at||'')){
  const note=document.createElement('p');note.textContent='Подтверждённые финансовые показатели пока не опубликованы.';el.append(note);container.append(el);return;
 }
 const lines=[['Поступило',d.received],['Израсходовано',d.spent],['Остаток',d.received-d.spent]];
 const grid=document.createElement('div');grid.className='counter-figures';
 for(const [label,amount] of lines){const item=document.createElement('div');const tag=document.createElement('small');tag.textContent=label;const strong=document.createElement('strong');strong.textContent=rub(amount);item.append(tag,strong);grid.append(item)}el.append(grid);
 if(valid(d.goal)&&d.goal>0){const note=document.createElement('p');note.textContent='Цель: '+rub(d.goal)+' · собрано '+(d.received/d.goal*100).toLocaleString('ru-RU',{maximumFractionDigits:1})+'%';el.append(note);const track=document.createElement('div');track.className='counter-track';const fill=document.createElement('div');fill.style.width=Math.min(100,d.received/d.goal*100)+'%';track.append(fill);el.append(track)}
 const date=document.createElement('p');date.className='counter-date';date.textContent='Данные сверены: '+d.updated_at.split('-').reverse().join('.');el.append(date);
 if(Array.isArray(d.expenses)&&d.expenses.length&&d.expenses.every(x=>typeof x.name==='string'&&valid(x.amount))&&Math.abs(d.expenses.reduce((sum,x)=>sum+x.amount,0)-d.spent)<0.01){const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='На что потрачено';details.append(summary);const list=document.createElement('ul');for(const row of d.expenses){const li=document.createElement('li');li.textContent=row.name+': '+rub(row.amount);list.append(li)}details.append(list);el.append(details)}
 container.append(el)
}
window.YariloCounter={ids,show};
})();
