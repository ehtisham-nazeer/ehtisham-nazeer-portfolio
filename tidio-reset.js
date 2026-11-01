/* Visitor "New chat" reset for Tidio (2026-11-01): wipes saved Tidio state, reloads into a fresh thread.
   Two-click confirm: 1st click arms ("Sure?"), 2nd click within 4s resets. No blocking dialog. */
(function(){var b=document.getElementById('t-newchat');if(!b)return;
var armed=false,timer=null;
function disarm(){armed=false;b.classList.remove('armed');b.innerHTML='\u21bb New chat';if(timer){clearTimeout(timer);timer=null;}}
function wipe(){try{[window.localStorage,window.sessionStorage].forEach(function(st){var ks=[];for(var i=0;i<st.length;i++){ks.push(st.key(i));}ks.forEach(function(k){if(k&&k.toLowerCase().indexOf('tidio')!==-1){st.removeItem(k);}});});document.cookie.split(';').forEach(function(c){var n=c.split('=')[0].trim();if(n.toLowerCase().indexOf('tidio')!==-1){document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';document.cookie=n+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain='+location.hostname;}});}catch(e){}}
b.addEventListener('click',function(){
if(!armed){armed=true;b.classList.add('armed');b.innerHTML='\u21bb Sure?';timer=setTimeout(disarm,4000);return;}
if(timer){clearTimeout(timer);timer=null;}
wipe();try{sessionStorage.setItem('t-reopen','1');}catch(e){}location.reload();});
function ready(cb){if(window.tidioChatApi&&window.tidioChatApi.open){cb();}else{document.addEventListener('tidioChat-ready',cb,{once:true});}}
try{if(sessionStorage.getItem('t-reopen')==='1'){sessionStorage.removeItem('t-reopen');ready(function(){try{window.tidioChatApi.open();}catch(e){}});}}catch(e){}})();
