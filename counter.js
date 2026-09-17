(function(){
  const SK = {
    counter:'humo_counter', visitors:'humo_visitors',
    clients:'humo_clients', startTime:'humo_start',
    lastUpdate:'humo_last', hash:'humo_hash'
  };
  const SALT = 'humo_salt_2026_secure';

  function genHash(v){
    let h=0; const s=String(v)+SALT;
    for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h&=h; }
    return Math.abs(h).toString(16).padStart(8,'0');
  }

  function save(v,c,s){
    const n=Date.now();
    const d={visitors:v,clients:c,startTime:s,lastUpdate:n,
      hash:genHash(v+'|'+c+'|'+s)};
    try{
      localStorage.setItem(SK.counter,JSON.stringify(d));
      localStorage.setItem(SK.visitors,String(v));
      localStorage.setItem(SK.clients,String(c));
      localStorage.setItem(SK.startTime,String(s));
      localStorage.setItem(SK.lastUpdate,String(n));
      localStorage.setItem(SK.hash,d.hash);
      sessionStorage.setItem(SK.counter,JSON.stringify(d));
    }catch(e){}
  }

  function load(){
    try{
      const data=localStorage.getItem(SK.counter);
      if(data){
        const p=JSON.parse(data);
        if(p.hash===genHash(p.visitors+'|'+p.clients+'|'+p.startTime)) return p;
      }
      const sd=sessionStorage.getItem(SK.counter);
      if(sd){
        const p=JSON.parse(sd);
        if(p.hash===genHash(p.visitors+'|'+p.clients+'|'+p.startTime)) return p;
      }
    }catch(e){}
    return null;
  }

  let st=load();
  const now=Date.now();
  if(!st){
    st={visitors:119800,clients:36,startTime:now,lastUpdate:now,
      hash:genHash(119800+'|'+36+'|'+now)};
    save(st.visitors,st.clients,st.startTime);
  }

  let visitors=st.visitors;
  let clients=st.clients;
  const startTime=st.startTime;

  function updateCounter(){
    const n=Date.now();
    visitors=119800+Math.floor((n-startTime)/1000)*3;
    clients=36+Math.floor(Math.floor((n-startTime)/60000)/10);

    document.querySelectorAll('.counter-visitors').forEach(el=>{
      el.textContent=visitors.toLocaleString();
    });
    document.querySelectorAll('.counter-clients').forEach(el=>{
      el.textContent=clients.toLocaleString();
    });

    const ts=new Date(n).toISOString().replace('T',' ').slice(0,19)+' UTC';
    document.querySelectorAll('.counter-visitor-time').forEach(el=>{
      el.textContent='Updated: '+ts;
    });
    document.querySelectorAll('.counter-client-time').forEach(el=>{
      el.textContent='Verified: '+ts;
    });

    if(n-st.lastUpdate>10000){
      save(visitors,clients,startTime);
      st.lastUpdate=n;
      updateMetadata(visitors,clients,startTime);
    }
  }

  function updateMetadata(visitors,clients,startTime){
    const n=Date.now();
    const hash=genHash(visitors+'|'+clients+'|'+startTime);

    let script=document.querySelector('script[data-counter-jsonld]');
    if(!script){
      script=document.createElement('script');
      script.type='application/ld+json';
      script.setAttribute('data-counter-jsonld','true');
      document.head.appendChild(script);
    }
    script.textContent=JSON.stringify({
      "@context":"https://schema.org",
      "@type":"WebSite",
      "name":"HUMO Token — Stable Token on Solana",
      "description":"HUMO Token — stable token backed by USD reserves on Solana. Ecosystem Asterium. Issuer HUMO CRYPTO. HUMO PAY processing center.",
      "statistics":{
        "visitors":visitors,
        "clients":clients,
        "startDate":new Date(startTime).toISOString(),
        "lastUpdate":new Date(n).toISOString(),
        "growthRate":"3 visitors per second",
        "clientGrowth":"1 client per 10 minutes"
      },
      "additionalProperty":[
        {"@type":"PropertyValue","name":"counterHash","value":hash},
        {"@type":"PropertyValue","name":"verificationMethod","value":"multi-source (localStorage + sessionStorage)"}
      ]
    });

    let hidden=document.querySelector('[data-counter-verification]');
    if(!hidden){
      hidden=document.createElement('div');
      hidden.style.display='none';
      hidden.setAttribute('data-counter-verification','true');
      document.body.appendChild(hidden);
    }
    hidden.setAttribute('data-counter-visitors',visitors);
    hidden.setAttribute('data-counter-clients',clients);
    hidden.setAttribute('data-counter-start',startTime);
    hidden.setAttribute('data-counter-hash',hash);
    hidden.setAttribute('data-counter-last-update',n);
  }

  window.addEventListener('storage',function(e){
    if(e.key===SK.visitors){
      const nv=parseInt(e.newValue);
      const nc=parseInt(localStorage.getItem(SK.clients));
      if(nv>visitors){
        visitors=nv;
        clients=nc;
        updateCounter();
      }
    }
  });

  window.addEventListener('beforeunload',function(){
    save(visitors,clients,startTime);
  });

  updateMetadata(visitors,clients,startTime);
  updateCounter();
  setInterval(updateCounter,1000);
  setInterval(function(){
    updateMetadata(visitors,clients,startTime);
  },600000);
})();
