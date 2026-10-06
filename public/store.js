const ticketStore = (() => {
 const key='hi-rungis-tickets-v1';
 let initial;
 function validate(data) {
  if(!Array.isArray(data)||data.some(t=>!t||typeof t.id!=='string'||['equipment','title','type','date','comment','status'].some(k=>typeof t[k]!=='string')))throw Error('Données de tickets invalides');
  return data;
 }
 async function read() {
  const saved=localStorage.getItem(key);
  if(saved!==null)return validate(JSON.parse(saved));
  if(!initial){
   const response=await fetch('/tickets.json',{cache:'no-cache'});
   if(!response.ok)throw Error('Impossible de charger les tickets');
   initial=validate(await response.json());
  }
  return structuredClone(initial);
 }
 async function request(path='',method='GET',body) {
  const list=await read();
  if(method==='GET')return list;
  const id=path.replace(/^\//,'');
  const index=list.findIndex(t=>t.id===id);
  if(method!=='POST'&&index<0)throw Error('Ticket introuvable');
  let result;
  if(method==='DELETE')list.splice(index,1);
  else {
   const fields=Object.fromEntries(['equipment','type','title','date','comment','status'].map(k=>[k,String(body[k]??'').trim()]));
   if(!fields.equipment||!fields.title||!fields.status)throw Error('Équipement, motif et statut obligatoires');
   if(method==='POST') {
    const next=Math.max(Number(localStorage.getItem(key+'-sequence'))||0,...list.map(t=>Number(t.id.split('-')[1])||0))+1;
    localStorage.setItem(key+'-sequence',String(next));
    result={id:'TKT-'+String(next).padStart(4,'0'),...fields};list.push(result);
   } else if(method==='PUT') {result={...list[index],...fields};list[index]=result;}
   else throw Error('Action inconnue');
   result.updatedAt=new Date().toISOString();
  }
  localStorage.setItem(key,JSON.stringify(list));
  return result||{ok:true};
 }
 return {request};
})();
