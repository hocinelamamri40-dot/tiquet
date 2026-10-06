document.getElementById('loginForm').onsubmit=async event=>{
 event.preventDefault();
 const button=document.getElementById('loginSubmit'), error=document.getElementById('loginError');
 button.disabled=true;error.textContent='';
 try {
  const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(event.target)))});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Connexion impossible');
  window.location.replace('/');
 } catch(e) {error.textContent=e.message;} finally {button.disabled=false;}
};
