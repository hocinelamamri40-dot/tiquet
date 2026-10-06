document.getElementById('loginForm').onsubmit=event=>{
 event.preventDefault();
 const values=new FormData(event.target);
 const error=document.getElementById('loginError');
 if(values.get('username')==='admin'&&values.get('password')==='admin'){
  try {sessionStorage.setItem('hi-rungis-session','admin');window.location.replace('/');}
  catch(e){error.textContent='Autorisez le stockage du navigateur pour vous connecter';}
 }else error.textContent='Identifiants incorrects';
};
