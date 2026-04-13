<script>
/* ══════════════════════════════════════════════
   HOMEPAGE LINK → RESET SLIDERS
══════════════════════════════════════════════ */
(function(){
  function resetAllSliders(){
    Object.keys(_sliderAPI).forEach(function(key){ _sliderAPI[key].reset(); });
  }
  function bindHomeLink(){
    var homeLink=document.querySelector('#home-link');
    if(homeLink){ homeLink.addEventListener('click',function(){ resetAllSliders(); }); }
  }
  bindHomeLink();
  setTimeout(bindHomeLink,500);
})();
</script>

<script>
/* ══════════════════════════════════════════════
   PAGE VISIBILITY TOGGLE
══════════════════════════════════════════════ */
(function(){
  function isHome(){
    var p=window.location.pathname.replace(/\/+$/,'');
    return p===''||p==='/'||p==='/all';
  }
  function toggle(){
    var show=isHome();
    document.querySelectorAll('.sl-wrap').forEach(function(el){ el.style.display=show?'block':'none'; });
  }
  setTimeout(toggle,100);
  ['pushState','replaceState'].forEach(function(fn){
    var orig=history[fn];
    history[fn]=function(){ orig.apply(history,arguments); setTimeout(toggle,100); };
  });
  window.addEventListener('popstate',function(){ setTimeout(toggle,100); });
})();

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
var AUTO_THRESHOLD = 8;
var GENERIC_TAGS = ['software','ai','erp','telecom','cyber','cybersecurity','global','mena','gcc','cloud','mobile','low-code','digital','finance','management','marketing','technology','outsource'];
var _sliderAPI = {};

/* ══════════════════════════════════════════════
   REGION DEFINITIONS FOR SLIDER 2
   Each region has:
     flags[] — array of {emoji, name, tag, north}
       north:true = row 0 (northern/top), false = row 1 (southern/bottom)
     regionTags[] — tags that belong to this region
══════════════════════════════════════════════ */
var REGIONS = [
  {
    id:'MENA',
    label:'MENA',
    regionTags:['MENA','GCC','KSA','Dubai','UAE','Jordan','Iraq','Egypt','Oman'],
    flags:[
      {emoji:'🇸🇦', name:'Saudi Arabia', tag:'KSA',   north:false},
      {emoji:'🇦🇪', name:'UAE / Dubai',  tag:'Dubai', north:false},
      {emoji:'🇯🇴', name:'Jordan',       tag:'Jordan',north:false},
      {emoji:'🇮🇶', name:'Iraq',         tag:'Iraq',  north:true},
      {emoji:'🇪🇬', name:'Egypt',        tag:'Egypt', north:false},
      {emoji:'🇴🇲', name:'Oman',         tag:'Oman',  north:false}
    ]
  },
  {
    id:'Asia',
    label:'Asia',
    regionTags:['China','Azerbaijan','Uzbekistan','Asia','Turkic'],
    flags:[
      {emoji:'🇨🇳', name:'China',      tag:'China',      north:true},
      {emoji:'🇦🇿', name:'Azerbaijan', tag:'Azerbaijan', north:true},
      {emoji:'🇺🇿', name:'Uzbekistan', tag:'Uzbekistan', north:true}
    ]
  },
  {
    id:'Africa',
    label:'Africa',
    regionTags:['Africa','Egypt'],
    flags:[
      {emoji:'🇪🇬', name:'Egypt',        tag:'Egypt',        north:true},
      {emoji:'🇿🇦', name:'South Africa', tag:'South Africa', north:false},
      {emoji:'🇳🇬', name:'Nigeria',      tag:'Nigeria',      north:false}
    ]
  },
  {
    id:'Turkic',
    label:'Turkic',
    regionTags:['Turkic','Azerbaijan','Uzbekistan','Turkey'],
    flags:[
      {emoji:'🇹🇷', name:'Turkey',     tag:'Turkey',     north:true},
      {emoji:'🇦🇿', name:'Azerbaijan', tag:'Azerbaijan', north:true},
      {emoji:'🇺🇿', name:'Uzbekistan', tag:'Uzbekistan', north:true}
    ]
  },
  {
    id:'Americas',
    label:'Americas',
    regionTags:['Americas','USA','Canada','Brazil'],
    flags:[
      {emoji:'🇺🇸', name:'USA',    tag:'USA',    north:true},
      {emoji:'🇨🇦', name:'Canada', tag:'Canada', north:true},
      {emoji:'🇧🇷', name:'Brazil', tag:'Brazil', north:false}
    ]
  },
  {
    id:'Europe',
    label:'Europe',
    regionTags:['Europe','England','UK','European Union'],
    flags:[
      {emoji:'🇬🇧', name:'UK / England',  tag:'England',         north:true},
      {emoji:'🇪🇺', name:'European Union',tag:'European Union',  north:true},
      {emoji:'🇩🇪', name:'Germany',       tag:'Germany',         north:true}
    ]
  }
];

/* ══════════════════════════════════════════════
   UTILITY
══════════════════════════════════════════════ */
function normalizeForSearch(str){
  return str
    .replace(/İ/g,'i').replace(/I/g,'i').replace(/ı/g,'i')
    .replace(/Ş/g,'s').replace(/ş/g,'s')
    .replace(/Ğ/g,'g').replace(/ğ/g,'g')
    .replace(/Ü/g,'u').replace(/ü/g,'u')
    .replace(/Ö/g,'o').replace(/ö/g,'o')
    .replace(/Ç/g,'c').replace(/ç/g,'c')
    .toLowerCase();
}

/* ══════════════════════════════════════════════
   SLIDER CORE  (standard — used for Slider 1)
══════════════════════════════════════════════ */
function initSlider(P, DATA, CATS1, CATS2, defaultLabel1, defaultLabel2, autoDelay, reverse, enableCountryReveal){

  function $$(s){ return document.getElementById(P+'-'+s); }
  var ddBtn1=$$('dd-btn'),  ddMenu1=$$('dd-menu');
  var ddBtn2=$$('dd-btn2'), ddMenu2=$$('dd-menu2');
  var label1=ddBtn1.querySelector('.sl-dd-label');
  var label2=ddBtn2.querySelector('.sl-dd-label2');
  var searchEl=$$('search');
  var viewportOuter=$$('viewport-outer');
  var viewport=$$('viewport');
  var track=$$('cards');
  var prevBtn=$$('prev'), nextBtn=$$('next');
  var dotsEl=$$('dots'), emptyEl=$$('empty');
  var pausedPill=$$('paused-pill');

  var activeTag1=null, activeTag2=null, searchQ='';
  var filtered=[], filteredExtra=[];
  var perPage=4, cardW=108, gap=10, step=cardW+gap;
  var cloneOffset=0, realIdx=0, infinite=false, cloneSets=0;
  var TRANS_MS=380, AUTO_MS=2400, WARP_MS=TRANS_MS+40, BUSY_MAX=TRANS_MS*3;
  var busy=false, paused=false, cardSelected=false;
  var autoT=null, warpT=null, busyT=null, resumeT=null, resizeT=null;
  var selectedCard=null;

  function lockBusy(){ busy=true; clearTimeout(busyT); busyT=setTimeout(function(){ busy=false; },BUSY_MAX); }
  function unlockBusy(){ busy=false; clearTimeout(busyT); }

  function selectCard(cardEl){
    if(selectedCard&&selectedCard!==cardEl) selectedCard.classList.remove('selected');
    if(selectedCard===cardEl){
      cardEl.classList.remove('selected'); selectedCard=null; cardSelected=false;
      pausedPill.classList.remove('show'); viewportOuter.classList.remove('has-selected'); startAuto();
    } else {
      cardEl.classList.add('selected'); selectedCard=cardEl; cardSelected=true;
      pausedPill.classList.add('show'); viewportOuter.classList.add('has-selected'); stopAuto(); clearTimeout(resumeT);
    }
  }
  function clearSelection(){
    if(selectedCard) selectedCard.classList.remove('selected');
    selectedCard=null; cardSelected=false;
    pausedPill.classList.remove('show'); viewportOuter.classList.remove('has-selected');
  }

  function cardMatchesTag(e,tag){
    if(!tag) return true;
    if(e.tags.indexOf(tag)>-1) return true;
    if(e.hiddenTags&&e.hiddenTags.indexOf(tag)>-1) return true;
    return false;
  }

  function computeCountryReveal(primaryFiltered){
    if(!enableCountryReveal) return [];
    if(!activeTag1&&!activeTag2&&!searchQ) return [];
    if(searchQ) return [];
    if(primaryFiltered.length===0) return [];
    if(activeTag2) return [];
    if(activeTag1){
      if(GENERIC_TAGS.indexOf(activeTag1.toLowerCase())>-1) return [];
      var existsInRealTags=DATA.some(function(e){ return e.tags.some(function(t){ return t.toLowerCase()===activeTag1.toLowerCase(); }); });
      if(!existsInRealTags) return [];
      var tagLower=activeTag1.toLowerCase();
      var clickedACountryCard=DATA.some(function(e){
        if(e.type!=='country') return false;
        if(e.name.toLowerCase()===tagLower) return true;
        return e.tags.some(function(t){ return t.toLowerCase()===tagLower; });
      });
      if(clickedACountryCard) return [];
      var tagOnAnyCountry=DATA.some(function(e){ return e.type==='country'&&e.tags.some(function(t){ return t.toLowerCase()===tagLower; }); });
      var tagOnAnyCompany=DATA.some(function(e){ return e.type!=='country'&&e.tags.some(function(t){ return t.toLowerCase()===tagLower; }); });
      if(tagOnAnyCountry&&!tagOnAnyCompany) return [];
    }
    var tagSet={};
    primaryFiltered.forEach(function(e){ if(e.type!=='country'){ e.tags.forEach(function(t){ tagSet[t.toLowerCase()]=t; }); } });
    var alreadyIn={};
    primaryFiltered.forEach(function(e){ alreadyIn[e.name.toLowerCase()]=true; });
    return DATA.filter(function(e){
      if(e.type!=='country') return false;
      if(alreadyIn[e.name.toLowerCase()]) return false;
      if(tagSet.hasOwnProperty(e.name.toLowerCase())) return true;
      if(e.tags.length>0&&tagSet.hasOwnProperty(e.tags[0].toLowerCase())) return true;
      return false;
    });
  }

  function applyFilter(){
    var q=normalizeForSearch(searchQ);
    filtered=DATA.filter(function(e){
      var t1ok=cardMatchesTag(e,activeTag1);
      var t2ok=cardMatchesTag(e,activeTag2);
      var qok=!q||normalizeForSearch(e.name).indexOf(q)>-1
                  ||normalizeForSearch(e.role).indexOf(q)>-1
                  ||e.tags.some(function(t){ return normalizeForSearch(t).indexOf(q)>-1; })
                  ||(e.hiddenTags&&e.hiddenTags.some(function(t){ return normalizeForSearch(t).indexOf(q)>-1; }));
      return t1ok&&t2ok&&qok;
    });
    var countryTagActive=!!(activeTag1&&(function(){
      var tag=activeTag1.toLowerCase();
      return DATA.some(function(e){ return e.type==='country'&&(e.name.toLowerCase()===tag||( e.tags.length>0&&e.tags[0].toLowerCase()===tag)); });
    })());
    var searchMatchesCountry=!!(q&&DATA.some(function(e){ return e.type==='country'&&(e.name.toLowerCase().indexOf(q)>-1||e.tags.some(function(t){ return t.toLowerCase().indexOf(q)>-1; })); }));
    var searchMatchesCompany=!!(q&&DATA.some(function(e){ return e.type!=='country'&&(e.name.toLowerCase().indexOf(q)>-1||e.role.toLowerCase().indexOf(q)>-1||e.tags.some(function(t){ return t.toLowerCase().indexOf(q)>-1; })); }));
    var countriesFirst=countryTagActive||(searchMatchesCountry&&!searchMatchesCompany);
    filtered.sort(function(a,b){
      var aC=(a.type==='country')?1:0, bC=(b.type==='country')?1:0;
      return countriesFirst?(bC-aC):(aC-bC);
    });
    filteredExtra=computeCountryReveal(filtered);
  }

  function tagsWithResults(otherTag){
    var set={};
    DATA.forEach(function(e){
      if(!cardMatchesTag(e,otherTag)) return;
      e.tags.forEach(function(t){ set[t]=true; });
      if(e.hiddenTags) e.hiddenTags.forEach(function(t){ set[t]=true; });
    });
    return set;
  }

  function refreshButtonStates(){
    var f1=activeTag1!==null, f2=activeTag2!==null;
    ddBtn1.classList.toggle('filtered',f1); ddBtn2.classList.toggle('filtered2',f2);
    label1.textContent=f1?activeTag1:defaultLabel1;
    label2.textContent=f2?activeTag2:defaultLabel2;
  }

  function setTag1(tag,fromClick,fromCross){
    if(fromClick&&activeTag1===tag){ activeTag1=null; } else { activeTag1=tag||null; }
    refreshButtonStates(); stopAuto(); rebuild(true); startAuto();
    if(menu1Open()) buildMenu1();
    if(menu2Open()) buildMenu2();
    if(!fromCross){
      var peerKey=(P==='s1')?'s2':'s1';
      var peer=_sliderAPI[peerKey];
      if(peer) peer.setTag1(activeTag1,false,true);
    }
  }
  function setTag2(tag,fromClick){
    if(fromClick&&activeTag2===tag){ activeTag2=null; } else { activeTag2=tag||null; }
    refreshButtonStates(); stopAuto(); rebuild(true); startAuto();
    if(menu1Open()) buildMenu1();
    if(menu2Open()) buildMenu2();
  }

  function menu1Open(){ return ddMenu1.classList.contains('open'); }
  function menu2Open(){ return ddMenu2.classList.contains('open'); }

  function buildCatMenu(menuEl,cats,allLabel,activeTag,otherTag,onSelectFn){
    menuEl.innerHTML=''; menuEl.classList.add('cat-menu');
    var allBtn=document.createElement('button');
    allBtn.className='sl-cat-all-btn'+(activeTag===null?' sel':'');
    allBtn.textContent=allLabel;
    allBtn.addEventListener('click',function(){ onSelectFn(null,true); closeMenus(); });
    menuEl.appendChild(allBtn);
    var available=tagsWithResults(otherTag);
    var grid=document.createElement('div'); grid.className='sl-continent-grid';
    cats.forEach(function(cat){
      var col=document.createElement('div'); col.className='sl-continent-col';
      var catAvail=available[cat.tag];
      var hdr=document.createElement('button');
      hdr.className='sl-continent-header'+(cat.tag===activeTag?' cont-active':'')+((!catAvail)?' cont-dim':'');
      hdr.textContent=cat.label;
      hdr.addEventListener('click',function(e){ e.stopPropagation(); onSelectFn(cat.tag,true); closeMenus(); });
      col.appendChild(hdr);
      cat.tags.forEach(function(t){
        var avail=available[t];
        var b=document.createElement('button');
        b.className='sl-dd-opt'+(t===activeTag?' sel':'')+((!avail&&t!==activeTag)?' opt-dim':'');
        b.textContent=t;
        b.addEventListener('click',function(){ onSelectFn(t,true); closeMenus(); });
        col.appendChild(b);
      });
      grid.appendChild(col);
    });
    menuEl.appendChild(grid);
  }

  function buildMenu1(){ buildCatMenu(ddMenu1,CATS1,defaultLabel1,activeTag1,activeTag2,function(tag,fromClick){ setTag1(tag,fromClick); }); }
  function buildMenu2(){ buildCatMenu(ddMenu2,CATS2,defaultLabel2,activeTag2,activeTag1,function(tag,fromClick){ setTag2(tag,fromClick); }); }

  function closeMenus(){
    ddMenu1.classList.remove('open'); ddBtn1.classList.remove('open');
    ddMenu2.classList.remove('open'); ddBtn2.classList.remove('open');
  }
  function openMenu1(){ closeMenus(); buildMenu1(); ddMenu1.classList.add('open'); ddBtn1.classList.add('open'); }
  function openMenu2(){ closeMenus(); buildMenu2(); ddMenu2.classList.add('open'); ddBtn2.classList.add('open'); }

  ddBtn1.addEventListener('click',function(e){ e.stopPropagation(); menu1Open()?closeMenus():openMenu1(); });
  ddBtn2.addEventListener('click',function(e){ e.stopPropagation(); menu2Open()?closeMenus():openMenu2(); });

  if(!window._sliderDDRegistry) window._sliderDDRegistry=[];
  window._sliderDDRegistry.push({ close:closeMenus, els:function(){ return [ddBtn1,ddBtn2,ddMenu1,ddMenu2]; } });

  function makeCard(e,isLinkedCountry){
    var el=document.createElement('div');
    el.className='sl-card'+(isLinkedCountry?' country-reveal':'');
    var tagsHtml=e.tags.map(function(t){
      var active=(t===activeTag1||t===activeTag2)?' tag-active':'';
      return '<span class="sl-card-tag'+active+'" data-tag="'+t+'">'+t+'</span>';
    }).join('');
    var linkedBadgeHtml=isLinkedCountry?'<span class="sl-linked-badge">🔗 '+activeTag1+'</span>':'';
    el.innerHTML=
      '<div class="sl-card-photo">'+
        '<img src="'+e.img+'" alt="'+e.name+'">'+
        '<div class="sl-ini" style="display:none">'+e.ini+'</div>'+
        (e.tags[0]&&!isLinkedCountry?'<span class="sl-tag-badge">'+e.tags[0]+'</span>':'')+
        linkedBadgeHtml+
        '<span class="sl-selected-badge"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>'+
      '</div>'+
      '<div class="sl-card-body">'+
        '<div class="sl-card-name">'+e.name+'</div>'+
        '<div class="sl-card-role">'+e.role+'</div>'+
        '<a class="sl-card-link" href="'+(e.url||'#')+'" target="_blank">LINK Here›</a>'+
        '<div class="sl-card-tags">'+tagsHtml+'</div>'+
      '</div>';
    var img=el.querySelector('img'),ini=el.querySelector('.sl-ini');
    img.addEventListener('error',function(){ img.style.display='none'; ini.style.display='flex'; });
    var photoEl=el.querySelector('.sl-card-photo');
    photoEl.addEventListener('click',function(ev){
      ev.stopPropagation();
      if(wasDrag||isDragGuarded()) return;
      if(e.tags&&e.tags[0]) setTag1(e.tags[0],true);
    });
    el.addEventListener('click',function(ev){
      if(ev.target.tagName==='A'||ev.target.closest('a')) return;
      if(ev.target.closest('.sl-card-photo')) return;
      if(ev.target.classList.contains('sl-card-tag')){ ev.stopPropagation(); setTag1(ev.target.getAttribute('data-tag'),true); return; }
      if(wasDrag||isDragGuarded()) return;
      selectCard(el);
    });
    return el;
  }

  function buildCards(){
    clearSelection(); track.innerHTML='';
    var combined=filtered.concat(filteredExtra);
    infinite=combined.length>AUTO_THRESHOLD;
    if(!infinite){
      cloneSets=0; cloneOffset=0;
      filtered.forEach(function(e){ track.appendChild(makeCard(e,false)); });
      filteredExtra.forEach(function(e){ track.appendChild(makeCard(e,true)); });
      realIdx=0; return;
    }
    cloneSets=Math.ceil(perPage/combined.length)+1;
    var N=combined.length; cloneOffset=cloneSets*N*step;
    for(var s=0;s<cloneSets;s++){
      filtered.forEach(function(e){ var c=makeCard(e,false); c.setAttribute('data-clone','pre'); track.appendChild(c); });
      filteredExtra.forEach(function(e){ var c=makeCard(e,true); c.setAttribute('data-clone','pre'); track.appendChild(c); });
    }
    filtered.forEach(function(e){ track.appendChild(makeCard(e,false)); });
    filteredExtra.forEach(function(e){ track.appendChild(makeCard(e,true)); });
    for(var s2=0;s2<cloneSets;s2++){
      filtered.forEach(function(e){ var c=makeCard(e,false); c.setAttribute('data-clone','post'); track.appendChild(c); });
      filteredExtra.forEach(function(e){ var c=makeCard(e,true); c.setAttribute('data-clone','post'); track.appendChild(c); });
    }
    realIdx=reverse?combined.length:0;
  }

  function pxFor(idx){ return cloneOffset+idx*step; }
  function moveTo(px,anim){ track.style.transition=anim?'transform '+TRANS_MS+'ms cubic-bezier(.4,0,.2,1)':'none'; track.style.transform='translateX(-'+px+'px)'; }
  function renderDots(){
    var combined=filtered.concat(filteredExtra);
    if(!combined.length){ dotsEl.innerHTML=''; return; }
    var n=Math.max(1,combined.length-perPage+1);
    var di=realIdx%combined.length; if(di<0) di+=combined.length;
    var a=Math.min(di,n-1); dotsEl.innerHTML='';
    for(var i=0;i<n;i++){ var d=document.createElement('div'); d.className='sl-dot'+(i===a?' on':''); dotsEl.appendChild(d); }
  }
  function render(anim){
    var combined=filtered.concat(filteredExtra);
    var empty=combined.length===0;
    emptyEl.style.display=empty?'block':'none';
    viewportOuter.style.display=empty?'none':'block';
    if(empty){ dotsEl.innerHTML=''; return; }
    if(!infinite){ var mx=Math.max(0,combined.length-perPage); if(realIdx<0) realIdx=0; if(realIdx>mx) realIdx=mx; }
    moveTo(pxFor(realIdx),anim); prevBtn.disabled=nextBtn.disabled=false; renderDots();
  }
  function rebuild(reset){ applyFilter(); if(reset) realIdx=0; buildCards(); render(false); }

  function warpCheck(){
    var combined=filtered.concat(filteredExtra); if(!infinite) return;
    var N=combined.length;
    if(realIdx>=N){ lockBusy(); clearTimeout(warpT); warpT=setTimeout(function(){ realIdx-=N; moveTo(pxFor(realIdx),false); renderDots(); unlockBusy(); },WARP_MS); }
    else if(realIdx<0){ lockBusy(); clearTimeout(warpT); warpT=setTimeout(function(){ realIdx+=N; moveTo(pxFor(realIdx),false); renderDots(); unlockBusy(); },WARP_MS); }
  }
  function goNext(){ var combined=filtered.concat(filteredExtra); if(!combined.length||busy) return; if(!infinite){ var mx=Math.max(0,combined.length-perPage); realIdx=(realIdx>=mx)?0:realIdx+1; render(true); return; } realIdx++; moveTo(pxFor(realIdx),true); renderDots(); warpCheck(); }
  function goPrev(){ var combined=filtered.concat(filteredExtra); if(!combined.length||busy) return; if(!infinite){ var mx=Math.max(0,combined.length-perPage); realIdx=(realIdx<=0)?mx:realIdx-1; render(true); return; } realIdx--; moveTo(pxFor(realIdx),true); renderDots(); warpCheck(); }
  function scheduleNext(){ clearTimeout(autoT); autoT=setTimeout(function(){ if(!paused){ reverse?goPrev():goNext(); } scheduleNext(); },AUTO_MS); }
  function startAuto(){ var combined=filtered.concat(filteredExtra); if(cardSelected) return; if(combined.length<=AUTO_THRESHOLD){ clearTimeout(autoT); autoT=null; return; } paused=false; if(!autoT) scheduleNext(); }
  function stopAuto(){ paused=true; }
  function pauseResume(){ stopAuto(); if(cardSelected) return; clearTimeout(resumeT); resumeT=setTimeout(startAuto,3000); }

  nextBtn.addEventListener('click',function(){ goNext(); pauseResume(); });
  prevBtn.addEventListener('click',function(){ goPrev(); pauseResume(); });
  viewportOuter.addEventListener('mouseenter',stopAuto);
  viewportOuter.addEventListener('mouseleave',function(){ if(!cardSelected) startAuto(); });

  var SWIPE_THRESHOLD=40, CLICK_DRAG_MAX=6;
  var dragStartX=0, dragStartPx=0, dragging=false, dragDelta=0;
  var wasDrag=false, lastDragEndAt=0, DRAG_CLICK_GUARD_MS=350;
  function isDragGuarded(){ return (Date.now()-lastDragEndAt)<DRAG_CLICK_GUARD_MS; }
  function dragStart(clientX){
    var combined=filtered.concat(filteredExtra); if(!combined.length) return;
    clearTimeout(warpT); unlockBusy();
    if(infinite){ realIdx=((realIdx%combined.length)+combined.length)%combined.length; }
    dragging=true; wasDrag=false; dragDelta=0;
    dragStartX=clientX; dragStartPx=pxFor(realIdx);
    track.style.transition='none'; stopAuto(); clearTimeout(resumeT);
  }
  function dragMove(clientX){ if(!dragging) return; dragDelta=clientX-dragStartX; if(Math.abs(dragDelta)>CLICK_DRAG_MAX) wasDrag=true; track.style.transform='translateX(-'+(dragStartPx-dragDelta)+'px)'; }
  function dragEnd(){
    var combined=filtered.concat(filteredExtra); if(!dragging) return; dragging=false;
    if(wasDrag) lastDragEndAt=Date.now();
    var sr=Math.round(dragDelta/step);
    if(Math.abs(dragDelta)>=SWIPE_THRESHOLD&&sr===0) sr=dragDelta<0?-1:1;
    if(sr!==0){ realIdx-=sr; if(!infinite){ var mx=Math.max(0,combined.length-perPage); if(realIdx<0) realIdx=0; if(realIdx>mx) realIdx=mx; moveTo(pxFor(realIdx),true); renderDots(); } else { moveTo(pxFor(realIdx),true); renderDots(); warpCheck(); } } else { moveTo(pxFor(realIdx),true); }
    if(!cardSelected) resumeT=setTimeout(startAuto,3000);
  }
  viewport.addEventListener('touchstart',function(e){ dragStart(e.touches[0].clientX); },{passive:true});
  viewport.addEventListener('touchmove',function(e){ if(!dragging) return; dragMove(e.touches[0].clientX); },{passive:true});
  viewport.addEventListener('touchend',function(e){ e.stopPropagation(); dragEnd(); },{passive:true});
  viewport.addEventListener('touchcancel',function(){ dragging=false; moveTo(pxFor(realIdx),true); if(!cardSelected) resumeT=setTimeout(startAuto,3000); },{passive:true});
  viewport.addEventListener('mousedown',function(e){ dragStart(e.clientX); e.preventDefault(); });
  window.addEventListener('mousemove',function(e){ if(dragging) dragMove(e.clientX); });
  window.addEventListener('mouseup',function(){ if(dragging) dragEnd(); });

  function calcPP(){ var w=viewportOuter.offsetWidth; return w<380?2:w<560?3:w<750?4:5; }
  window.addEventListener('resize',function(){ clearTimeout(resizeT); resizeT=setTimeout(function(){ var pp=calcPP(); if(pp===perPage) return; perPage=pp; realIdx=0; rebuild(false); },80); });

  searchEl.addEventListener('input',function(){ searchQ=searchEl.value; stopAuto(); rebuild(true); startAuto(); });

  refreshButtonStates(); perPage=calcPP(); rebuild(true); setTimeout(startAuto,autoDelay||0);

  _sliderAPI[P]={
    setTag1:function(tag,fromClick,fromCross){ setTag1(tag,fromClick,fromCross); },
    reset:function(){ activeTag1=null; activeTag2=null; searchQ=''; searchEl.value=''; refreshButtonStates(); stopAuto(); rebuild(true); startAuto(); }
  };
}

/* ══════════════════════════════════════════════
   SLIDER 2 — REGION SLIDER  (special init)
══════════════════════════════════════════════ */
function initRegionSlider(P, DATA, CATS1, CATS2, defaultLabel1, defaultLabel2, autoDelay, reverse){

  function $$(s){ return document.getElementById(P+'-'+s); }
  var ddBtn1=$$('dd-btn'),  ddMenu1=$$('dd-menu');
  var ddBtn2=$$('dd-btn2'), ddMenu2=$$('dd-menu2');
  var label1=ddBtn1.querySelector('.sl-dd-label');
  var label2=ddBtn2.querySelector('.sl-dd-label2');
  var searchEl=$$('search');
  var viewportOuter=$$('viewport-outer');
  var viewport=$$('viewport');
  var track=$$('cards');
  var prevBtn=$$('prev'), nextBtn=$$('next');
  var dotsEl=$$('dots'), emptyEl=$$('empty');
  var pausedPill=$$('paused-pill');

  /* Region slider state */
  var activeRegion=null;    /* id string e.g. 'MENA' */
  var activeFlag=null;      /* {regionId, flagTag} */
  var activeTag2=null;      /* product/company category filter */
  var searchQ='';

  /* card width for region cards is larger */
  var perPage=4, cardW=128, gap=10, step=cardW+gap;
  var cloneOffset=0, realIdx=0, infinite=false, cloneSets=0;
  var TRANS_MS=380, AUTO_MS=2600, WARP_MS=TRANS_MS+40, BUSY_MAX=TRANS_MS*3;
  var busy=false, paused=false;
  var autoT=null, warpT=null, busyT=null, resumeT=null, resizeT=null;

  function lockBusy(){ busy=true; clearTimeout(busyT); busyT=setTimeout(function(){ busy=false; },BUSY_MAX); }
  function unlockBusy(){ busy=false; clearTimeout(busyT); }

  /* ── Compute which DATA items match current filters ── */
  function getActiveFilterTags(){
    /* If flag active, filter by that specific tag */
    if(activeFlag) return [activeFlag.flagTag];
    /* If region active, filter by region's tags */
    if(activeRegion){
      var reg=REGIONS.filter(function(r){ return r.id===activeRegion; })[0];
      return reg?reg.regionTags:[];
    }
    return null; /* null = no filter */
  }

  function dataCardMatchesFilter(e){
    if(e.type==='region') return true; /* region cards handled separately */
    var tags=getActiveFilterTags();
    if(!tags) return true; /* no region selected, show all */
    return tags.some(function(ft){
      if(e.tags.indexOf(ft)>-1) return true;
      if(e.hiddenTags&&e.hiddenTags.indexOf(ft)>-1) return true;
      return false;
    });
  }

  function dataCardMatchesCat2(e){
    if(!activeTag2) return true;
    if(e.tags.indexOf(activeTag2)>-1) return true;
    if(e.hiddenTags&&e.hiddenTags.indexOf(activeTag2)>-1) return true;
    return false;
  }

  function dataCardMatchesSearch(e){
    var q=normalizeForSearch(searchQ);
    if(!q) return true;
    return normalizeForSearch(e.name).indexOf(q)>-1
        || normalizeForSearch(e.role).indexOf(q)>-1
        || e.tags.some(function(t){ return normalizeForSearch(t).indexOf(q)>-1; })
        || (e.hiddenTags&&e.hiddenTags.some(function(t){ return normalizeForSearch(t).indexOf(q)>-1; }));
  }

  /* ── Build region card ── */
  function makeRegionCard(regionDef){
    var el=document.createElement('div');
    el.className='sl-card region-card';
    if(activeRegion===regionDef.id) el.classList.add('selected');
    if(activeRegion&&activeRegion!==regionDef.id) el.classList.add('dimmed');

    /* count matching company/product cards */
    var matchCount=DATA.filter(function(e){
      if(e.type==='region') return false;
      return regionDef.regionTags.some(function(ft){ return e.tags.indexOf(ft)>-1||(e.hiddenTags&&e.hiddenTags.indexOf(ft)>-1); });
    }).length;

    /* sort flags: north first (row0), then south (row1) */
    var northFlags=regionDef.flags.filter(function(f){ return f.north; });
    var southFlags=regionDef.flags.filter(function(f){ return !f.north; });
    var sortedFlags=northFlags.concat(southFlags);

    var flagsHtml='';
    sortedFlags.forEach(function(f){
      var isSel=activeFlag&&activeFlag.regionId===regionDef.id&&activeFlag.flagTag===f.tag;
      flagsHtml+=
        '<div class="sl-flag-cell'+(isSel?' flag-selected':'')+'" data-region="'+regionDef.id+'" data-flag-tag="'+f.tag+'" data-flag-name="'+f.name+'">'+
          '<span class="sl-flag-tooltip">'+f.name+'</span>'+
          '<span class="sl-flag-emoji">'+f.emoji+'</span>'+
          '<span class="sl-flag-label">'+f.name.split('/')[0].trim()+'</span>'+
        '</div>';
    });

    el.innerHTML=
      '<div class="sl-region-header">'+
        '<span class="sl-region-name">'+regionDef.label+'</span>'+
        '<span class="sl-region-count">'+matchCount+'</span>'+
      '</div>'+
      '<div class="sl-region-flags">'+flagsHtml+'</div>'+
      '<div class="sl-region-card-foot"></div>'+
      '<div class="sl-region-sel-badge"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>';

    /* Flag click */
    el.querySelectorAll('.sl-flag-cell').forEach(function(fc){
      fc.addEventListener('click',function(ev){
        ev.stopPropagation();
        if(wasDrag||isDragGuarded()) return;
        var rId=fc.getAttribute('data-region');
        var fTag=fc.getAttribute('data-flag-tag');
        /* Toggle: if same flag already selected, go back to region view */
        if(activeFlag&&activeFlag.regionId===rId&&activeFlag.flagTag===fTag){
          activeFlag=null;
          /* keep region active */
          activeRegion=rId;
          stopAuto(); rebuild(true); startAuto();
        } else {
          /* Activate region + flag */
          activeRegion=rId;
          activeFlag={regionId:rId, flagTag:fTag};
          stopAuto(); rebuild(true); startAuto();
        }
        refreshButtonStates();
      });
    });

    /* Region card body click (not flag) → toggle region */
    el.addEventListener('click',function(ev){
      if(ev.target.closest('.sl-flag-cell')) return;
      if(wasDrag||isDragGuarded()) return;
      if(activeRegion===regionDef.id){
        /* deselect */
        activeRegion=null; activeFlag=null;
      } else {
        activeRegion=regionDef.id; activeFlag=null;
      }
      refreshButtonStates(); stopAuto(); rebuild(true); startAuto();
    });

    return el;
  }

  /* ── Build company/product card ── */
  function makeDataCard(e){
    var el=document.createElement('div');
    el.className='sl-card';
    var tagsHtml=e.tags.map(function(t){
      var active=(activeTag2===t)?' tag-active':'';
      return '<span class="sl-card-tag'+active+'" data-tag="'+t+'">'+t+'</span>';
    }).join('');
    el.innerHTML=
      '<div class="sl-card-photo">'+
        '<img src="'+e.img+'" alt="'+e.name+'">'+
        '<div class="sl-ini" style="display:none">'+e.ini+'</div>'+
        (e.tags[0]?'<span class="sl-tag-badge">'+e.tags[0]+'</span>':'')+
        '<span class="sl-selected-badge"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>'+
      '</div>'+
      '<div class="sl-card-body">'+
        '<div class="sl-card-name">'+e.name+'</div>'+
        '<div class="sl-card-role">'+e.role+'</div>'+
        '<a class="sl-card-link" href="'+(e.url||'#')+'" target="_blank">LINK Here›</a>'+
        '<div class="sl-card-tags">'+tagsHtml+'</div>'+
      '</div>';
    var img=el.querySelector('img'),ini=el.querySelector('.sl-ini');
    img.addEventListener('error',function(){ img.style.display='none'; ini.style.display='flex'; });
    el.addEventListener('click',function(ev){
      if(ev.target.tagName==='A'||ev.target.closest('a')) return;
      if(ev.target.classList.contains('sl-card-tag')){ ev.stopPropagation(); return; }
      if(wasDrag||isDragGuarded()) return;
      el.classList.toggle('selected');
    });
    return el;
  }

  /* ── Build full cards set ── */
  function buildCards(){
    track.innerHTML='';

    /* Always show all region cards first */
    var allCards=[];

    /* Determine which region cards to show (dimmed if another region selected) */
    REGIONS.forEach(function(r){
      allCards.push({isRegion:true, def:r});
    });

    /* Add matching data cards after region cards */
    var dataCards=DATA.filter(function(e){
      return dataCardMatchesFilter(e)&&dataCardMatchesCat2(e)&&dataCardMatchesSearch(e);
    });

    /* sort: company/product cards (non-country) first when filtering */
    dataCards.sort(function(a,b){
      var aIsCountry=(a.type==='country')?1:0, bIsCountry=(b.type==='country')?1:0;
      return aIsCountry-bIsCountry;
    });

    dataCards.forEach(function(e){ allCards.push({isRegion:false, entry:e}); });

    var totalCards=allCards.length;
    infinite=totalCards>AUTO_THRESHOLD;

    if(!infinite){
      cloneSets=0; cloneOffset=0;
      allCards.forEach(function(c){
        track.appendChild(c.isRegion?makeRegionCard(c.def):makeDataCard(c.entry));
      });
      realIdx=0; return;
    }

    cloneSets=Math.ceil(perPage/totalCards)+1;
    cloneOffset=cloneSets*totalCards*step;

    function appendSet(){
      allCards.forEach(function(c){
        var el=c.isRegion?makeRegionCard(c.def):makeDataCard(c.entry);
        track.appendChild(el);
      });
    }
    for(var s=0;s<cloneSets;s++) appendSet();
    appendSet(); /* real set */
    for(var s2=0;s2<cloneSets;s2++) appendSet();
    realIdx=reverse?totalCards:0;
  }

  function pxFor(idx){ return cloneOffset+idx*step; }
  function moveTo(px,anim){ track.style.transition=anim?'transform '+TRANS_MS+'ms cubic-bezier(.4,0,.2,1)':'none'; track.style.transform='translateX(-'+px+'px)'; }

  function getTotalCards(){
    var dc=DATA.filter(function(e){ return dataCardMatchesFilter(e)&&dataCardMatchesCat2(e)&&dataCardMatchesSearch(e); }).length;
    return REGIONS.length+dc;
  }

  function renderDots(){
    var n=getTotalCards(); if(!n){ dotsEl.innerHTML=''; return; }
    var pages=Math.max(1,n-perPage+1);
    var di=realIdx%(n||1); if(di<0) di+=n;
    var a=Math.min(di,pages-1); dotsEl.innerHTML='';
    for(var i=0;i<pages;i++){ var d=document.createElement('div'); d.className='sl-dot'+(i===a?' on':''); dotsEl.appendChild(d); }
  }

  function render(anim){
    var total=getTotalCards();
    var empty=total===0;
    emptyEl.style.display=empty?'block':'none';
    viewportOuter.style.display=empty?'none':'block';
    if(empty){ dotsEl.innerHTML=''; return; }
    if(!infinite){ var mx=Math.max(0,total-perPage); if(realIdx<0) realIdx=0; if(realIdx>mx) realIdx=mx; }
    moveTo(pxFor(realIdx),anim); prevBtn.disabled=nextBtn.disabled=false; renderDots();
  }

  function rebuild(reset){ if(reset) realIdx=0; buildCards(); render(false); }

  function warpCheck(){
    if(!infinite) return;
    var N=getTotalCards();
    if(realIdx>=N){ lockBusy(); clearTimeout(warpT); warpT=setTimeout(function(){ realIdx-=N; moveTo(pxFor(realIdx),false); renderDots(); unlockBusy(); },WARP_MS); }
    else if(realIdx<0){ lockBusy(); clearTimeout(warpT); warpT=setTimeout(function(){ realIdx+=N; moveTo(pxFor(realIdx),false); renderDots(); unlockBusy(); },WARP_MS); }
  }
  function goNext(){ var N=getTotalCards(); if(!N||busy) return; if(!infinite){ var mx=Math.max(0,N-perPage); realIdx=(realIdx>=mx)?0:realIdx+1; render(true); return; } realIdx++; moveTo(pxFor(realIdx),true); renderDots(); warpCheck(); }
  function goPrev(){ var N=getTotalCards(); if(!N||busy) return; if(!infinite){ var mx=Math.max(0,N-perPage); realIdx=(realIdx<=0)?mx:realIdx-1; render(true); return; } realIdx--; moveTo(pxFor(realIdx),true); renderDots(); warpCheck(); }
  function scheduleNext(){ clearTimeout(autoT); autoT=setTimeout(function(){ if(!paused){ reverse?goPrev():goNext(); } scheduleNext(); },AUTO_MS); }
  function startAuto(){ var N=getTotalCards(); if(N<=AUTO_THRESHOLD){ clearTimeout(autoT); autoT=null; return; } paused=false; if(!autoT) scheduleNext(); }
  function stopAuto(){ paused=true; }

  function refreshButtonStates(){
    var f2=activeTag2!==null;
    var hasRegionFilter=activeRegion!==null||activeFlag!==null;
    ddBtn1.classList.toggle('filtered',hasRegionFilter);
    ddBtn2.classList.toggle('filtered2',f2);
    if(activeFlag){
      label1.textContent=activeFlag.flagTag;
    } else if(activeRegion){
      label1.textContent=activeRegion;
    } else {
      label1.textContent=defaultLabel1;
    }
    label2.textContent=f2?activeTag2:defaultLabel2;
  }

  /* ── Dropdown menus for s2 ── */
  function tagsWithResults(otherTag){
    var set={};
    DATA.forEach(function(e){
      if(!otherTag||e.tags.indexOf(otherTag)>-1||(e.hiddenTags&&e.hiddenTags.indexOf(otherTag)>-1)){
        e.tags.forEach(function(t){ set[t]=true; });
        if(e.hiddenTags) e.hiddenTags.forEach(function(t){ set[t]=true; });
      }
    });
    return set;
  }

  function buildCatMenu(menuEl,cats,allLabel,activeTag,otherTag,onSelectFn){
    menuEl.innerHTML=''; menuEl.classList.add('cat-menu');
    var allBtn=document.createElement('button');
    allBtn.className='sl-cat-all-btn'+(activeTag===null?' sel':'');
    allBtn.textContent=allLabel;
    allBtn.addEventListener('click',function(){ onSelectFn(null,true); closeMenus(); });
    menuEl.appendChild(allBtn);
    var available=tagsWithResults(otherTag);
    var grid=document.createElement('div'); grid.className='sl-continent-grid';
    cats.forEach(function(cat){
      var col=document.createElement('div'); col.className='sl-continent-col';
      var catAvail=available[cat.tag];
      var hdr=document.createElement('button');
      hdr.className='sl-continent-header'+(cat.tag===activeTag?' cont-active':'')+((!catAvail)?' cont-dim':'');
      hdr.textContent=cat.label;
      hdr.addEventListener('click',function(e){ e.stopPropagation(); onSelectFn(cat.tag,true); closeMenus(); });
      col.appendChild(hdr);
      cat.tags.forEach(function(t){
        var avail=available[t];
        var b=document.createElement('button');
        b.className='sl-dd-opt'+(t===activeTag?' sel':'')+((!avail&&t!==activeTag)?' opt-dim':'');
        b.textContent=t;
        b.addEventListener('click',function(){ onSelectFn(t,true); closeMenus(); });
        col.appendChild(b);
      });
      grid.appendChild(col);
    });
    menuEl.appendChild(grid);
  }

  function setTag2(tag,fromClick){
    if(fromClick&&activeTag2===tag){ activeTag2=null; } else { activeTag2=tag||null; }
    refreshButtonStates(); stopAuto(); rebuild(true); startAuto();
    if(menu2Open()) buildMenu2();
  }

  function menu1Open(){ return ddMenu1.classList.contains('open'); }
  function menu2Open(){ return ddMenu2.classList.contains('open'); }

  function closeMenus(){
    ddMenu1.classList.remove('open'); ddBtn1.classList.remove('open');
    ddMenu2.classList.remove('open'); ddBtn2.classList.remove('open');
  }

  /* dd1 for s2 = region quick selector */
  function buildMenu1(){
    ddMenu1.innerHTML=''; ddMenu1.classList.remove('cat-menu');
    var allBtn=document.createElement('button');
    allBtn.className='sl-cat-all-btn'+(activeRegion===null?' sel':'');
    allBtn.textContent='All Regions';
    allBtn.addEventListener('click',function(){ activeRegion=null; activeFlag=null; refreshButtonStates(); stopAuto(); rebuild(true); startAuto(); closeMenus(); });
    ddMenu1.appendChild(allBtn);
    REGIONS.forEach(function(r){
      var b=document.createElement('button');
      b.className='sl-dd-opt'+(activeRegion===r.id?' sel':'');
      b.textContent=r.label+' ('+r.flags.length+' countries)';
      b.addEventListener('click',function(){
        activeRegion=r.id; activeFlag=null;
        refreshButtonStates(); stopAuto(); rebuild(true); startAuto(); closeMenus();
      });
      ddMenu1.appendChild(b);
    });
  }
  function buildMenu2(){ buildCatMenu(ddMenu2,CATS2,defaultLabel2,activeTag2,null,function(tag,fromClick){ setTag2(tag,fromClick); }); }

  function openMenu1(){ closeMenus(); buildMenu1(); ddMenu1.classList.add('open'); ddBtn1.classList.add('open'); }
  function openMenu2(){ closeMenus(); buildMenu2(); ddMenu2.classList.add('open'); ddBtn2.classList.add('open'); }

  ddBtn1.addEventListener('click',function(e){ e.stopPropagation(); menu1Open()?closeMenus():openMenu1(); });
  ddBtn2.addEventListener('click',function(e){ e.stopPropagation(); menu2Open()?closeMenus():openMenu2(); });

  if(!window._sliderDDRegistry) window._sliderDDRegistry=[];
  window._sliderDDRegistry.push({ close:closeMenus, els:function(){ return [ddBtn1,ddBtn2,ddMenu1,ddMenu2]; } });

  /* ── touch/drag ── */
  var SWIPE_THRESHOLD=40, CLICK_DRAG_MAX=6;
  var dragStartX=0, dragStartPx=0, dragging=false, dragDelta=0;
  var wasDrag=false, lastDragEndAt=0, DRAG_CLICK_GUARD_MS=350;
  function isDragGuarded(){ return (Date.now()-lastDragEndAt)<DRAG_CLICK_GUARD_MS; }
  function dragStart(clientX){
    var N=getTotalCards(); if(!N) return;
    clearTimeout(warpT); unlockBusy();
    if(infinite){ realIdx=((realIdx%N)+N)%N; }
    dragging=true; wasDrag=false; dragDelta=0;
    dragStartX=clientX; dragStartPx=pxFor(realIdx);
    track.style.transition='none'; stopAuto(); clearTimeout(resumeT);
  }
  function dragMove(clientX){ if(!dragging) return; dragDelta=clientX-dragStartX; if(Math.abs(dragDelta)>CLICK_DRAG_MAX) wasDrag=true; track.style.transform='translateX(-'+(dragStartPx-dragDelta)+'px)'; }
  function dragEnd(){
    var N=getTotalCards(); if(!dragging) return; dragging=false;
    if(wasDrag) lastDragEndAt=Date.now();
    var sr=Math.round(dragDelta/step);
    if(Math.abs(dragDelta)>=SWIPE_THRESHOLD&&sr===0) sr=dragDelta<0?-1:1;
    if(sr!==0){ realIdx-=sr; if(!infinite){ var mx=Math.max(0,N-perPage); if(realIdx<0) realIdx=0; if(realIdx>mx) realIdx=mx; moveTo(pxFor(realIdx),true); renderDots(); } else { moveTo(pxFor(realIdx),true); renderDots(); warpCheck(); } } else { moveTo(pxFor(realIdx),true); }
    resumeT=setTimeout(startAuto,3000);
  }
  viewport.addEventListener('touchstart',function(e){ dragStart(e.touches[0].clientX); },{passive:true});
  viewport.addEventListener('touchmove',function(e){ if(!dragging) return; dragMove(e.touches[0].clientX); },{passive:true});
  viewport.addEventListener('touchend',function(e){ e.stopPropagation(); dragEnd(); },{passive:true});
  viewport.addEventListener('mousedown',function(e){ dragStart(e.clientX); e.preventDefault(); });
  window.addEventListener('mousemove',function(e){ if(dragging) dragMove(e.clientX); });
  window.addEventListener('mouseup',function(){ if(dragging) dragEnd(); });

  function calcPP(){ var w=viewportOuter.offsetWidth; return w<400?2:w<580?3:w<780?4:5; }
  window.addEventListener('resize',function(){ clearTimeout(resizeT); resizeT=setTimeout(function(){ var pp=calcPP(); if(pp===perPage) return; perPage=pp; realIdx=0; rebuild(false); },80); });

  searchEl.addEventListener('input',function(){ searchQ=searchEl.value; stopAuto(); rebuild(true); startAuto(); });

  /* Public API */
  _sliderAPI[P]={
    setTag1:function(tag,fromClick,fromCross){
      /* For s2, setTag1 from cross-slider sets activeRegion by trying to match a region */
      if(!tag){ activeRegion=null; activeFlag=null; } else {
        var matched=null;
        REGIONS.forEach(function(r){ if(r.regionTags.indexOf(tag)>-1) matched=r.id; });
        if(matched){ activeRegion=matched; activeFlag=null; }
      }
      refreshButtonStates(); stopAuto(); rebuild(true); startAuto();
    },
    reset:function(){
      activeRegion=null; activeFlag=null; activeTag2=null; searchQ=''; searchEl.value='';
      refreshButtonStates(); stopAuto(); rebuild(true); startAuto();
    }
  };

  refreshButtonStates(); perPage=calcPP(); rebuild(true); setTimeout(startAuto,autoDelay||0);
}

/* ══════════════════════════════════════════════
   DATA — SLIDER 1  (people)
══════════════════════════════════════════════ */
var DATA_S1=[
  {name:"Dilek Duman",role:"Consultant and Board Member",tags:["Consultant","AI","BankTech","CTO"],hiddenTags:["Turkish"],ini:"DD",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEiiTIniM4A-Vz4vKr-fW8rNsMyXGb7FgKjzyJ9fWD8Wi-l6FJhfC8Cx3775FPr_bbtCggHf2Y6VRs5LM71aV608kkj4V79Pz-XPT-wncpqSH_TAJeODlBdpulQ4y9oFcUM9im6TyhSwCjLrCIKwQI_2PrkRnAx9WWPVga8IxFM7GyKiUbO0mVBdalbzAFs"},
  {name:"Ahmet Başaran",role:"CEO and Founder of NETMERA",tags:["Netmera","AI","MarTech","CTO","Software","Egypt","MENA","Mobile","Dubai"],hiddenTags:["Turkish"],ini:"DD",url:"#",img:"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgdO0O99iSmDHCKT2ItpRcNoo9a_KZZjCtm63pwdrG8KeC_84pFf5xAx4FoSm3r01EXznCH3ahQOImNxv-IPzRIvGuB3nfUQyLGpnuX1Jj9cQeM-qpVmR-SslakuwcceZJocZsrLRPR0xop6HVqF8mOkzNmIS_WpZ1ALNBthVVgttElcWEOP1wJFEnA/s320/Ahmet-Basaran-2.jpg"},
  {name:"Salah Fateen",role:"NTG Head of Engineering Board Member",tags:["NTG","AI","Low-Code","CTO","Software","Egypt","MENA","KSA","Iraq"],ini:"DD",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEiBxZOVRIshVyb1YduDrbVLrB6Zo_41nz6NywpqZwRzFzlyZSY0JjlnROAUQce9sDQcMGVklRe44b44lFqq6hkSYvgA8c3L9wo_B9DDZbhaiNQ80spydPYfV2XuHMht22Xcezo7G0dvH9QkqWoCGE9FV7q5DmgXEGpTBVev9BtGz3njsIAAHq4eFK6I=s16000"},
  {name:"Tuna Vehaplar Kartal",role:"Dubai VP Technology Sales",tags:["Dubai","UAE","Software","MENA","Africa"],hiddenTags:["Turkish"],ini:"MÖ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhRrgofoxu-wEm-z8D6mTRsE5JlGWi13TEcFO7hKjrYZHPxBk5Ccs2txRO7R6eP0sBJTl5AAF0WqYz9e9rlYorK5m0amE5JUlT2s9yg9CzMP-EcJ-SpVOIu3Ii0ZpYNSCUL2nC2zjUg8DObjXJ7MQYF2rIfQ2BFgUkpUT1RVR5zbrs5MX6iC2RitXnvoao"},
  {name:"Raid Bader",role:"DataLiva Founder CEO",tags:["Dataliva","ERP","Odoo","Software","SAP","Azerbaijan","Global","Jordan","MENA"],hiddenTags:["Palestine"],ini:"DL",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhJ2JHl8q2mr_fJELUIuX4zvoP0XK8gHadwbHkaF66JuesN2yemEieWb2uxep9bPrIrL6uvfj4v4p5oi_4ipZdIEOxPvlpMfty1H94Npl9BfcfRWZYHG9diod_CB0nP7b6mgv0u4vMu5jVj3_GHiav_5YETTQCGlTdMfbkDyLR6h2dId3j7xyprVD3IK8I"},
  {name:"Binnur Demirci",role:"DataLiva GM",tags:["Dataliva","ERP","Odoo","Software","SAP","Azerbaijan","Global","MENA"],hiddenTags:["Turkish"],ini:"DL",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEizzbU0J6PH03hwCmPuqoPH75AQx0KqZIB2DK9k-_ez0znnFJ_9d-P3oV2kZBN7ChIsyjUO10vhtZx3wu-iHqL2XzM-918Y_S1gdPWZfPGZ9cABqedYVlusj_6dnCpZHvJXOICTPpXP8SDwSVbfKyQXpuP1JoNjHpSDrENyAXq1rqZyqEzzDq3qwfhvRLk"},
  {name:"Ahmed Freij",role:"DataLiva MENA GM",tags:["Dataliva","ERP","Odoo","Software","SAP","Azerbaijan","Global","Jordan","MENA"],ini:"DL",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhvW70JMaMsJoLd4BCn40pBuWWCWnV_--nknKIDB-d7pSaxhBzsrauDi5YB_wwSBtAtBTpn2a2wzHl2ozynrUaN7FdfKXZ6aqQM22xk48w00vUitpBTCIuy_A1NtCnX5REiSiCEYsyjVoBTh-t1TL_8vH-Ds6lpDYqxriznYOwiJxpnMT9hnd9RPxqHcAk"},
  {name:"Alaa Ali",role:"Digital Product Manager",tags:["Product-PM","AI","MENA","KSA","Jordan"],hiddenTags:["Palestine"],ini:"DD",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjF6Al9WkAypkPdG2wxGGd_rb6NKg8NaOX-wM30gxSWXkrkzqJ17vLoxgVQIbiT568p52Rd9EUKKaXQSrnh_zouh_JegKAd8kVhn5UlUjULMRSHp5uCJBOW-3GB_9a_PzDdQgU4hxP3BaR5VYaKMRe8670-eQLgxk3CjUAoL-Z5EPJdgyyITIOGn5HJhp0"},
  {name:"Abdulkadir Kayıklı",role:"Tech Entrepreneur",tags:["Software","MENA","İstanbul","HealtTech"],hiddenTags:["Turkish"],ini:"MB",url:"https://www.linkedin.com/in/akayikli",img:"https://blogger.googleusercontent.com/img/a/AVvXsEgv5h_ClO4PN3YAEg38YtDqLw8LJszXHwCFUqDgg3VHqtG9_sNWsZBDj60fGUmoDO_DcZeV4IX2s3iN8OcLkFAAaCB0FD12eKiHbx0ek-O0vZKqRdvKTPY1NARbbMBiii5z6I1IbbuJXGJFnxsTru9amPE-KwQTn-c4PwDN6IOWc6vn91XaiYg3QR7Jp0c"},
  {name:"Hakam Qalalwi",role:"Software Engineer",tags:["Software","MENA","İstanbul","MENAPARK"],hiddenTags:["filistin"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEiTutZYxqHYTIdVULH_ngSo7m5gUrqVL6EWfGAl-kbHF3Uq20ouM9TdJLXZYzUmyZHtN_p_9qpvriNoet3_U4GixR-kW2QmxzRZkzBUZmMqXXeNb_0GapSRK0rQokxj2WOCMBfxqStXBqvc3R618_YAz719WeQHqqRopKbbDUqdoObbhaWedDURdsuyD_E"},
  {name:"Amir Herbawi",role:"ZAİN Logistic",tags:["Logistic","MENA","İstanbul","MENAPARK"],hiddenTags:["filistin"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjpcjpu4Y63vjB51Om887qCGjHNkqKktCyBYwqqZyh2qGhEI8hori8SETkPj7-kCo1aj1cfHUKTTjPLMNg09K52PZzbllvNdyTTxvbOV8VVue0M2R0q_A5vTZp8nlajMkuiWXxyCPwkC3NUObdlu7foUr7aBZ0ORauCoiS7C_CjX5-1T73ATZ0ceGbIq3c"},
  {name:"Ahmad Sultan",role:"Moknah.io Voice AI Co-Founder",tags:["AI","MENA","Jordan","MENAPARK","Voice"],hiddenTags:["filistin"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjTIGUctrcTtWj5cn72D_9U01qbKoWHcC_gsm4mFwF8ugwUvRTwr87UR9QF-RXLeA0oMsNBEdbUO6oJ0GhfDrPd7rnqEVgrF4Kh-_QoJF_RYNVfJ4u-nkjvISP51CQud6wHR_GyBUvsqB3K7ioht6Q1HY_onfixr1EM40YzTI87qctEqF4uoKnGRY6q9pM"},
  {name:"Dr.Omar Bey",role:"Medical Trade to Africa",tags:["Doctor","Africa","Health","Medical"],ini:"LŞ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhudR20ad4rqMkf0tL8ymWSNmfcI2JFzi8ILI7-I_PvDN48gK5JHWXZ_8eiZX1oO6Z-K-EjNlni1DmVWrT-Uj6Wf-Xz4VNQ-c9MF1SURkfnKP6CrfDesdtPPtaRoxUfFuDydKGFsE0wBxsLSXkFXGn-kF9ea9s2IqveSIkqC3HPn-xjj0uKtOLzXTmnaIU"},
  {name:"İlhan Bağören",role:"CEO Telenity, HİB, HTK",tags:["Telenity","Product-PM","Telecom","5G","Americas","USA"],hiddenTags:["Turkish"],ini:"İB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjb0nOgIA8L39-pBMhfIr8bmruR_x0Gldr41m7X9uz_7pwbm-YG0aNNsTJqssqUkmgnhQosI4n2h7Xbg4UgW8OF6rLgboJeoHFIQWRIdOB9XDKg7rBQ6I9L8BiFB1HcyUEHd-AKeJtBrRVIOUbN0O13kePI1WvItPh9kJcjd3Qk2pPMFejU23oXwET_AcU"},
  {name:"Mustafa Kuğu",role:"MENAPARK Founder",tags:["Dataliva","Netmera","Software","Egypt","Oman","NTG","MENA"],hiddenTags:["Palestine","Turkish"],ini:"DL",url:"#",img:"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh6PAHa_57NRbayGM5gYKb9QB0zTqTW6WzcPqMwf5VBY6nic5yZD-gKkhqyVpEeK4THF8KOwzxUfc91pTk0ob9mHZ13gG6ttI02WKEOhnFiFD2_jqH6sRmBWg98Hmb1qzMQplkNSVEa9R2c/s0/Mustafa-Kugu.png"},
  {name:"Mamoun Besaiso",role:"UN & WB NGO Mentor",tags:["Oman","Global","Management","European Union","MENAPARK"],hiddenTags:["Palestine"],ini:"MB",url:"https://danismanturkiye.com/d/9-mamoun-besaiso-global-stk-projeler-ve-yonetim-danismani",img:"https://blogger.googleusercontent.com/img/a/AVvXsEipzqGNmoqD9NFpYBSmuzuceiLg9lBZzuJ7s2hcylxyDWNinobqC26rOMO-O565hqqB1CvVsvWEkNVJUsQxIQai34fP72uiY-t8FgLRic00BezyA5uOsCMQmAvoo7bMH4KbBHnDZWQRpzp8l2gXRUpNCm_bObw_svFX2fA_pdeVWUncAhx1UtMXMx4rYS4"},
  {name:"DR.SAFA NASSERELDIN",role:"AL-QUDS UNIVERSITY",tags:["Global","Management","Academic","MENAPARK"],hiddenTags:["Palestine"],ini:"SN",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEiFkB4fO3ucYiOi8r8uYYJ4LrCyf4awq_z8RzUCCNqnefL18W9-sb2mCm4KA7Ca0I2Jk4YFSCchoZ5fyywtRRNtSxLehd4bHgr6EYD4IRu8Mqgnn_hIF2I9z9QBKBOMfvTX4QtgggErEc26Haup2oW8Qy7XL_FGteAS_HOA0piILC0ufJEyvAfFoCIWHBeM"},
  {name:"Hani İdris",role:"Board Member IDB Group",tags:["Dubai","CEO","Jordan","MENAPARK","Iraq"],hiddenTags:["Palestine"],ini:"SN",url:"#",img:"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiPdZBWTn9m-bATAf8C0QvrPdPiUg6VRnseUH-mh3i1Ifehv39VK5hptGukXcgF5u9iPGqd4ZnvlrvJxv5SN5HtQplKqJFoyxEdDJm1_gVI4ER-kQGNsJL3Nxbl1uCsbPQ4FGaRfhDyRFE/"},
  {name:"Dr. Lütfi Şimşek",role:"Global NGO Projects & Management Consultant",tags:["Global","Management","Health"],hiddenTags:["Turkish"],ini:"LŞ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEgXMgqG5G9CuU9opbQBBaHgkTlBnpo9popMfC2Kuekh0zqg1srgZNluoo32TzJz_AQl8wBegliOz1QXivecpKlJzNRe6zgfqoSZvi5mVmR9fXKX4tEoLvX4koBQnyswSH-5e09yjgjgfjKy90W-5k6_4raf3UX__C9Im-zju-NMuOQXUJpsSPqSkzPgbeOl"},
  {name:"Çetin Özer",role:"Code5 PriscmCRM CEO",tags:["Software","AI","Uzbekistan","Construction"],hiddenTags:["Turkish"],ini:"LŞ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjWf35rOQizwqwC9ibBb5ko6UxOG0mj44IJw7IW1bPJNtQF6WttGYy6RxFpab6qTCtoC6Lid-CDlCLhMX0fIVbtExr0z8DG9r4Swhp0YFLq8vuAFy_-4PYhyP9C8g1LzDfozDRwooz4BDDjWeaapGqLPZMFR-ThbVe5p5DFLerMEpDDdOSrDPZBfjN1ruFS"},
  {name:"Tamim Maaz",role:"Lujain Fashion",tags:["E-Commerce","Istanbul","Syria"],hiddenTags:["ecommerce","Syria"],ini:"MÖZ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEg_7KJadp5a49SP6kKT_O-_nHuq9fasZkD9ReCGJG3dBi7GuybaLAAQGHunkgGsau8sjVmsUh_au3aYvgK0IxXbOd5kMhSTdYfx0buLEfGT9iNRQ_KM7V9ktxHfywi3YnvWuz3hIGM_l4MAeADXPKImKDBVq0A1HymnKTiRERGMIopUxGUnUxOnCwuW8at_"},
  {name:"Muhammed Awwad",role:"Industrial Engineer & E-Commerce",tags:["Global","China","Egypt"],hiddenTags:["Global","China","ecommerce"],ini:"MÖZ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjeBEIISx1vYUcr9naZub6ef4MolbRL2TtattGOrn6kJsLaSFwgkS88bjHLvT09rxzGhh7ZY5f_iUnIXF1xMY6ZKP7MBn8kXGLEsI_RyYjWCEpqs8EOx28taldG_krJ7INmfxlnKhrCq_melYcatgtHHbfqaaDz9PGJlqm1EaqPlGCIM9cISJ05XQhIqOI"},
  {name:"Basheer Hamawi",role:"HA CONSULTANCY",tags:["Dubai","GCC","Software","AI","MENAPARK"],ini:"BH",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhDI5CSkpsD-r_WFMEUgXeS-GG7lOEPNgtUtStsNI7Cw6FATCk1SylnvnMvsxslyiswO15720ER2mBqI02GlKMWd41rUA2GbZxr7QK4l5RSQ3smXNtD8G5qqgLA-eBOUffmsMWjwWgOg5sFdS5mSYxdXgkV6vQOd1k2Cw1FLKyOuBtqfEsKEpdi0TQMtUFM"},
  {name:"Özge Tekalp",role:"Consultant CDO",tags:["Global","Management","Technology"],hiddenTags:["Turkish"],ini:"ÖT",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhIyfUbDuMR0RpQe5gR6rQdrb6vq9oTxgkngMrq0NR3IeUBAFiR2plxZn-8ygwTZ9o5oI9JlY1H1428PhXdR2iDwDN5U4MQE7Z7QHYw11KVGwjFwhaD08rQFbNN9OvxkAF_EXpX0GgcbnXCLF5S9bN5eWVxSj6gRY2nbNTneTgNa6BaZesvD6kDcs5yfi1S"},
  {name:"Ahmet Küçük",role:"IT Director CIO",tags:["CIO","IT","ERP","Cloud","Software","Cyber"],hiddenTags:["Turkish"],ini:"MÖ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhxXQLW0BrwtDRzL5REk04qxADIy1tSPUYVvJ2BFnJ5M3duEnPFFNxKhvODRikv6-X92WGAGgb4MXTDZ5eujwZdpb69xI8BISPNv9_W3KQppa6angbMtmNnOmmoX1MTIKjfGli_wH_6wf-6vChPFBtGN2bczGXUxnGeLcZJaeohnFgfF12IRwtcxhGNRy8"},
  {name:"Mustafa Kayırıcı",role:"London UK Turkish Business Forum",tags:["UK","England","Technology","Europe","Software"],hiddenTags:["Turkish"],ini:"MÖ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEiNknZ7CYtCU4PpjIgsC_dqBYirVyny-BWVAJ1Z-5iqjWY1iVv68w6lJy5yuIGk-90PvxKtk1-LSjBh7dSineIZwAyqimJi0w8oJMGNY_EUmFcW0KzK5vuXKc524zp6HywCtxlfOgt5nBfG2V3sZheGbgfSU2bW6-E_MTLtOiUsBp1OW7MWQLIIzU8qud0"},
  {name:"Mehmet Özalp",role:"London Global Branding",tags:["UK","England","Technology","Europe"],hiddenTags:["Turkish"],ini:"MÖ",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjBzM1OVeJeRnZMgix1v2cDWuMIiPhRNgta5haoccHObkcCx9Qq1YbhA8W8mYb_ZVNRFNwrTGlQ0S8acm7GTEQOTtGSNfXo2kb2l_qIJGXkhueRH8XN_atLtSD-F4q0y8uAORGetO-BaXRnCJRvQyl_YgJY87fmlOCX8ciRr4knKdRHSgwWLFztEZuENTzw"},
  {name:"Duaa El Hassan",role:"Cloud Architect | Digital Transformation",tags:["AI","Cloud","Architect","MENAPARK"],hiddenTags:["Palestine"],ini:"DE",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhn1r3hQCWjIZ-ddMpHuwFSHZP8EkZKJ2a5syplVp2wUpCJdh0lIAA5xD9oN5I4KNGUAwI9Mi8T08s1IGaGiVElsE2V8TshN-0Bm-_4FcmhqbPz1rUXYPFn9NDDysnewRbSqhwQvorsu29QX-0uq36OXceI8lBQYHwqN_wYQVTs2B8CaCOVgcQz4wjxkPg"},
  {name:"Medhat Oraby",role:"AI-Driven Digital Transformation",tags:["Project-PM","Agile","Consultant","MENAPARK","AI","Product-PM"],ini:"MO",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEiMce14ZIsLc6E755NFIISR2qERXh7IJE62sYfbJDEpciUXeiG7BFt5JJqBnnuyM7XIeHI-HrUfs1b0P0OT4TBtPMoEJDszb5k-e8NQKqfFqPidqRYcMUjw71A4PIqUuib233IflaWKR7EZ0qFa1zQAmyQSZy9-tJEhV-Iep_JCWzwuu4AYYlxLWbx35Rc"},
  {name:"Dr. Ömer Haksever",role:"Strategic Corporate Finance Consultant",tags:["Finance","Management"],hiddenTags:["Turkish"],ini:"ÖH",url:"/u/DrOmerHakseverCPA",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhgUR9DEsNY9R00fn7KXNutYEbVq3h40pJZ8MSPPUGS3vaiARTHS-iJQg8FGVAX52NkuRKIUj00slI7eJlQNg6U4g0xNF47WPJvisIUKMymzES9BogFhF5ix41hbavu2Tfz52pDjc9Rl6Ho6-hjJczxGf8sR-zWppMkoYf4XOAlivHbC26S7JBel3OEL1E"},
  {name:"Rayan Meseik",role:"Marketing Strategy Consultant",tags:["Marketing","Digital","IT","MENAPARK"],ini:"RN",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEj6g8kAHt77vONz9Eu1ejyZMNaLPirdn_CmYqpK3ioqpO3y1SK2NIp4GAmacRbkqXmku1Sj388AU013KnWwHPIEb67C6czYM6SQ5mI0KwqTjwv9LkBPw29O5Ciyf3-v8NOCajCGYL4lkfn-yZIs3XqFXujVvvHuO0txC114cweqcvd7JjuK4PK7FhWyStfm"},
  {name:"Nadir Ansari",role:"Saudi Arabia & MENA Regional Consultant",tags:["KSA","Marketing","MENAPARK","Influencer"],ini:"NA",url:"https://danismanturkiye.com/d/10-nadir-ansari-suudi-arabistan-ve-mena-bolge-danismani",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhZ-HYgiu8-rL5bBrYSfzU4AqUU52GBDwrbYghEgCPiFOLNbAxt6nhVoFH90SDyl3Yk3bZNizALeFGqcoOhGGrMwqp4tllwFbkDkozfrxhHv3B17DJDJVbywiFuQS9-6FS_JrJWJgpsdqTNJ-HoRf-dMQM0_DX46gTk4nu21-5s480wE48LFQKqeLVMugU"},
  {name:"Ghadir Abedelnabi",role:"Business Analyst (Co-Founder MW-MENAWOMEN)",tags:["Product-PM","AI","Software","MENAPARK","KSA"],hiddenTags:["Product-PM","Palestine","Software","MENAPARK"],ini:"GA",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjWi7mjEc9NcUjLD1jJx9YUzEuyDIms-np3Inve5971wnjBbvULpWxgnSa6BParAvORNCgtbc39irwTTMGyi2Z_OpHMg7XhSFFM-IcsnwXnQOGktsyvaIdSCMLOs4cA9AN6oNjoU4fggZPRsEHgrKQ-EDt_4wPg9ph5GvCV5aIIfYYO-dxO-dxF4pLU7e0z"},
  {name:"Muzaffer Yüner",role:"Royalmond.com",tags:["Food","Canakkale"],hiddenTags:["Istanbul","Turkish"],ini:"HD",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEh_iNTrBiT88y4LSyEl65mkZeenhjUERyfLlFRQFeKlT2Wj6NcYBxzOrWVYgXgy2NSbWFfoahzm4zlm5Ma-IuZ2xvWT48dEj5pgpcNP_l29ezBYKI3SUPW-nCfsbFCAPF4Vt29O1hTau2lt9ebFe0gSEKhZMAfnOsvhyHG-JNnk_yZTr4WOyDKnlnc7QZw"},
  {name:"Yasser Rashid",role:"Startups Mentor | Entrepreneur",tags:["Business","Food","Cafe","Restaurant"],hiddenTags:["istanbul"],ini:"RN",url:"https://www.linkedin.com/in/yasser-rashed-baa934bb/",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhMPLo7DAkkS9Q_59haoyPkzGaPi-h1eKjkbILJyIPBXCXfwTEmgveZ3r4Tu5qUB05db1h52_1TaYGfXmovWQBOpSRdTVJEEbYeRreBhKIhpW7I3hPXp5YV7jwHx7gX96U0jVjtxhr-HsN6c-pjAD82gYgjdnWBLyj37KX0Xryr1FABkRD-YFjqKqQglFs"},
  {name:"Hakan Duman",role:"EU Project Consultant",tags:["Grants","European Union","Global"],hiddenTags:["Turkish"],ini:"HD",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjBSFjWL_iSI-hV3BzDy3eJP4nPYlM0d6gukh4TR__4Hda_kDU7RAouB6BcwUq4CCN1scnB8Va-gMgA6e3uaDaNgVNg7SDQRxkN9UQfsiJbbjAhqdIvRKqKVp1dG3lK6tQ1gAQIo5xW3K1dxO4yg0_Zx6b2kbutOGUmElzQZOC_w8pkumg_a50"},
  {name:"Serkan Seyhan",role:"Corporate Management Consultant",tags:["Management"],hiddenTags:["Turkish"],ini:"SS",url:"https://danismanturkiye.com/d/6-serkan-seyhan-kurumsal-yonetim-danismani",img:"https://blogger.googleusercontent.com/img/a/AVvXsEj5s54THkpYBSy4kZirZNgH8ZOWIr1jguaZqp5qwSG4Kkrodx_kdDlxgfHJ5zf6YW3Hkc3IidwK4XSBPig4lJvvBRVjkqATyKEcdwsJTwesxEUSnNtmJZdQE1mBItso82fxUogcS80jqn9o103EloVP2w2v5tgfAEKvWbREFOwr8gyZt_ycDwkSQsN2pys"},
  {name:"Rasheed Hamawi",role:"Digital Syria Board Member",tags:["AI","Global","MENAPARK"],hiddenTags:["AI","Syria","Damascus"],ini:"RH",url:"https://danismanturkiye.com/d/4-rasheed-hamawi-dijital-suriye-yk-uyesi",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhcDGzdfXmH_dpMgiwL7Q_eCovLB_AVk68_lYINV6X3H1tHt9YsYL11wHHLHB809bdnSbnIfMa-dth5VLxAxq83_69ANJqKCpAZYXqS4i4dIXXITbjPDSXuTpr1MZrwYfpYyWBUJYYk31TRR-Pm2Vih_cXrZ5BR_wTvcHoA6-BX8NAT7Q2flUbTG7fAu28"},
  {name:"Adel Hassan",role:"CTO The National Bank",tags:["CTO","MENA","BankTech","MENAPARK"],hiddenTags:["Palestine"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgXlzt_Lh4ZqXWwYguf4mBFwtLXyTptjHED_42O6kgfq2Jev-Jlkkpz-ID2u1XR5BNy9EGG2ScFWyv7shKEeXbaDrFlPV0FCsXpVodHgeRk9UfuphU9IY-7bD4soUakqFJ_O7gk6MrFJIzyk4GirzgiMfUjKVSdbMjcp_dD6epWEPau93FvXGZPxoB-rUo/s320/Screenshot_45.png"},
  {name:"Ertuğrul Erbay",role:"R&D Director",tags:["Beylikduzu","R&D","Istanbul","Official"],hiddenTags:["Turkish"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhKrRVXeV8MND6EeQp2cc4LfLAojNdMPsRtnUo_HXa7gBuc8DMkyJqvapgwbCYFymoWpcbf2ICYq3JQipROD2_QqttgeCBiEBfpmf4epC108yA8NgGhhuzDKqK2R0xiCwqBazugw-mI0CODlQFrS5vyfpxArka9CwdrzHbbU5VOre7452fGJ3zOIhqJMeo"},
  {name:"Mohammed Qudaih",role:"Founder at Haweya",tags:["Oman","MENA","CEO","MENAPARK","Haweya"],hiddenTags:["Palestine"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEgau0aIXzzITKL-UIE2qx_ZAipLothWR8ZFjBsPOV3PUu5oGN3FnoTjZyX_E_YOnbIe7pwCJoQp1Sxq_I2y2IPWtM6XsSC2s73nfTuld6_nNYYeTxX5cwH6WJdsX3rd8qSKeiMGt1eyStjIJNZZPHNRd1s7hDP9Horzh5iTculDMOAJDUfPXboxhQeLYBQ"},
  {name:"Waleed Hamdan",role:"Chairman, CEO of SAI",tags:["CFO","MENA","Jordan","MENAPARK"],hiddenTags:["Palestine"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhKC8zpCIxcURgR6qdbVWdHCazeqZHOwreG8yN8kcg32rWlNDPPTfkQyAHnz7jEK3M-TsAzbSVNw6S_lp1ukI3GX7VjK-18U1Fr1noyUH0sFuq4w52yXjMp2v6WSsBJjr2WqPpp40yVsD9ZLsRDNHZ2SNRpheZNvflz5djn_dR7WP7FfR1GS9_XS1h4GIQ"},
  {name:"MESBAH ATTYA",role:"NTG TURKEY TEAM LEAD",tags:["NTG","CTO","MENA","Egypt","BankTech","MENAPARK","Iraq","KSA"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEg-YBA7it4oHNrSR8X-kk48hR19-wcm0XMJPpOdxf_4rw6UjClCowc5cECcBkEDHNonUQ_uWAGp__15bShKXqbcJLtiPnwkxqT5DpLIQYXqMVBeW07EB50G2zw747jFD0cYEpnFEfn82YexL1j9ZeGElbHZ9jS4-66R0ptECYN4cX5p_DJTJ6-6t9TLpeLz"},
  {name:"NOUREDDIN ALY",role:"NTG TURKEY Business Analyst",tags:["NTG","MENA","Egypt","MENAPARK","KSA"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhBc5C3YQzm0K9BqMjyQ608LYkkWPnOcJ6JvHJh9KHsZujkAkbpb3t5jNMRReXgJ_LhflwQVltefp8oYF7C0750EOyVI0iRnKEbw_cYnrtqYX76y8_6qJ6cySp5_ltHwrrHN5dy3eOOFX928uDz5y3LgFzKUssk3KXh-ywYQgGSkf2FutwICusfeR2MyXkW"},
  {name:"Ibrahim Housheya",role:"CEO at Endeavor & BaseerX",tags:["CEO","HealthTech","DX","MENA","AI","CTO","KSA","Dubai","UAE","USA"],hiddenTags:["Palestine"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhT1SS6S4uidRLZm3rwDFnfyE7AW6geTM08u7WunrgudBnTonv9oTL1IxBUnYXQ48EdpvnN8PqRV5o6cjF7BQRth3zT3o6YYALaAehwDc7usu9a0iIM10AbfO8oBJB8ufdZIz2tf-fLDmDzJOeqQhp4tnylZ-hkI9IaZ6JhwUgz1t1wkfJH0J47_qMYsJdf"},
  {name:"Marawan Hassan",role:"Chief Commercial Officer @ NBS Venture",tags:["CMO","Marketing","MarTech","Egypt","MENAPARK","KSA"],ini:"MB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhvQarDBUe8ZrUeF8-aTbUU2ostsPzo4HaUOrQq26WgVyNTAzXwNbxwGlk7z6s7hU0O_ykylW8FpADIJ_QA58bOqRFOCeN0hc8I1vGkSkKaXtbrboP7ofV20EAmCI9dEdf9oUAD3A6SO5e6iVFLMBaHeanB7_O33XWmmo2rq9bp7LrKa0IZ4ciXpUUsruk"},
  {name:"İbrahim Kayha",role:"Management Consultant",tags:["Management"],hiddenTags:["Turkish"],ini:"İK",url:"https://danismanturkiye.com/d/3-ibrahim-kayha-yonetim-danismani",img:"https://blogger.googleusercontent.com/img/a/AVvXsEgpvE9Su4hiRWEtM31gd8uV4Wb1MJPuqLKz1KaTWJNfTDxpDIflvJ3FXDpux1EABXP-7kU46Xyo9viCdvNUk-mTMNiQkYyuJyFLl5ml5lnEXgeGnHk8t_E7eMZLTgd3crjrxmCUP5Ayije4PpVrLpS4y6FizRBcMn1j4XCY1IGDDfHec1ix0-Z8lqInJkY"}
];

/* ══════════════════════════════════════════════
   DATA — SLIDER 2  (companies/products only — region cards are auto-generated)
   NOTE: country cards are REMOVED; region cards replace them via REGIONS[]
══════════════════════════════════════════════ */
var DATA_S2=[
  {name:"NETMERA",role:"Mobile & Web Engagement Platform",tags:["Netmera","Mobile","Egypt","Software","England","UK","Azerbaijan","Dubai","AI","KSA"],hiddenTags:["Turkish"],ini:"NM",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEgUGm7Hbv1Rskkd1tzl0QzMjIWdo_Z1VJK2ksoj82kJu9qzzMX-ALjan7lt-plYVPesuBDg8JreibPEUYdOTa2_yu91rhdikebanc5rPRWZBS7wDGs7juRa4cyY7Mr6JQbCTKLR7LwOaJM0HZIGmtI-ycNhusAfACQEtnvDB9ZKkvoND2kjHNpHw8FF6Wg=w200-h177"},
  {name:"DATALIVA",role:"ERP/SAP/ODOO PARTNER",tags:["Dataliva","ERP","Odoo","Software","SAP","Azerbaijan","Jordan","KSA"],hiddenTags:["Turkish"],ini:"DL",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjiaaFZm6rYZcTVQqTDLsdL_oUdeXnq3xig_9CPyrH9tpTfrqFPE9EIJ-Zf7mvYjvH7lft33FNwdKDpQ_e34e3aoNoJ-wJBgdoNn7V6_gstYrLkU-ZO3z48whwHN4xtLGHAutB09JtM24KZRIzYba0mORQTRSwzcHnm0q-lRaqNvFyaQS-GabM2I0engBk=w200-h172"},
  {name:"LivaGRC",role:"Governance, Risk & Compliance Platform",tags:["Dataliva","CPM","GRC","Software"],ini:"LB",url:"https://livagrc.com/",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjZ7L2RkvuvmtFFw85_DCJnUCl7353fGBE2mxYO4qqYPOOhXTL4ERtzfZhhW-elTk0u0YeJZaOYYcWCjLus4T6NclSMXKiHkwtK4kwJuANHttt83bC-5W4cLxvPsHtAqVEtVdWu7HA7_3cfvjEvrkDCYsxDpfnzV-VXBtjaTFCdS1YmL7XStWJr-NjSsUc"},
  {name:"LivaBudget",role:"Budgeting CPM Software Product",tags:["Dataliva","CPM","Budget","Software","Azerbaijan"],ini:"LB",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEiIYl-SM0qb-XfG9Xrzqj9vLWpraVHiVTU2UYpCfuCd7eUh6ApSPwgzp5kLsLAmCWqpah8ZAjvKI_iIP4e0WdHpthukeeTJIbINqFtWKNd5edqXDsZTAbFLLjPuI5DEl2MNPkGm3PusEhV0ivdkxLdFzz4WFFgWFbgTM-NzmCFH2i5E3BCM2iK-a6yRIxw=w200-h176"},
  {name:"HAWEYA",role:"Corporate Design & Branding",tags:["Oman","MENA","Qatar","Branding","Digital","Haweya"],ini:"LB",url:"https://haweya.net/",img:"https://blogger.googleusercontent.com/img/a/AVvXsEh0SQTsT55rl7PU6EhEjUOtqL1m5z530qHKfjq30ZCNnKF7ydz47dLE9w5EQLOWRNzEdYIbeWpnNEtE7ub5qtBy4i1UIHSYldBiLgZvXOTBlxgtp6YuFIwcjlYI_pZKpNRYUd8ecDoQRI7dWtFjGHUQyZZDfoEOQNvnY69ow-COHVsrH2PCp1vu31oOMuk"},
  {name:"NTG CLARITY",role:"Software Apps Low Code Vendor",tags:["NTG","Low-Code","Software","Egypt","Telecom","Outsource","Global","Iraq","KSA","Oman"],ini:"NC",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhcle-W--Qee44eR-zvjPiO6kwWtjRWTfcw5nM9kwFP3svG9Y5eGrHQOlz32xJJAxHFDrtegMrr21_KCIACW12xXICghYcqQdLGrb_xvtMYMMOQvzecSSgYMQgZ9WmIkGaqGHPalZZZVtKXLTuWV7QS8by_m4-3IMyfvxhdsDqYJIBL1O6r44zHIXC2RaC0"},
  {name:"TELENITY",role:"Global Telecom Software Solutions",tags:["Telenity","Telecom","5G","Dubai","Azerbaijan","KSA","USA","Africa","Uzbekistan"],hiddenTags:["Turkish"],ini:"TL",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEgZgoDDdY-972_psPzhC4PKReukZGICDVz2xzDKN0ewuNZEI7qJ92ZHKttJM7Q-MuFOzXvHQWc6g9pv2ZL5CqaSOefrvILfUAGAFQ_Ov2dD6DkQ75qvwJRDt5lDoRg5fw8EsaQHMaR_k2McotRaIoLSRKLfb3g6Rt1ZxLqYwMbpfgK41aUwHm1hwdCw1Xw=w200-h178"},
  {name:"CRYPTTECH",role:"AI Cyber Security ISV",tags:["CRYPTTECH","AI","Cybersecurity","Cyber","Azerbaijan","Global","Software"],hiddenTags:["Turkish"],ini:"CT",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjTRnNnlWDJ6i-H3JCMKxwj7uqOkLjXGDY3Eu7dxe5PAinzFfGXLRbumWneKrGTmIeYHSuMiPRBFpFB1w-6ZyQkacLFnUVLaDhfmwZSxlbGTlMSCP-KYvgyeMrv5FcGVeAls8yEKED-HqN7i-SOiNWl8ZyabQwKjMjTrnLCdq7SZgmIBT1jtalppFrBg-w"},
  {name:"CRYPTOSPOT",role:"Hot Spot Product",tags:["CRYPTTECH","HotSpot","Cybersecurity","WiFi","Cyber"],ini:"CS",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEhyN-6WF1KkshrJeJFTW5brAAVGl_paL4qG8tCHnKrBGKl3URLUpPB9ujK8gw5qvxTtWoKBtFlHqMFcNPh5BN24zFRFOf8lUXkEEmO0qPZYSKUkvEt-Sx0gi5UgJ1w-skNLOawLhESgS3O0f_uIAYBIXPYFtpT6-RqwV6g2Nct31LLpyo68r2b6uISfeSw"},
  {name:"CRYPTOLOG",role:"Logging & 5651 Compliance",tags:["CRYPTTECH","Data Security","Cybersecurity","Logging","Cyber","5651"],ini:"CL",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEi1jz2ebWIwrux3qMxoWEH8fMzTVSiJfe8JrnRpU_3jLDAdwxf3pKIT04Lf97raW864G9WFiJcREIvIt7LN0gtmJaWmEoS8tBlcxV6DYzSdetoIuLMyn8krGmb-uslnYy34P3w1P6-w9OqS8aMV3N-P3ebymOBpJcokyvaYZoG-xgoF3hf3FwHBaUtP4NU"},
  {name:"VATOS DLP",role:"Data Loss Prevention Product",tags:["CRYPTTECH","Data Security","Cybersecurity","DLP","Cyber"],ini:"VD",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEirohN3r864igNcrk7R5E0ovtfvJ6Md2dalxeNzEbTCvPPHxGR33B9WQ5YzIfyn2cC92xpsjWLQ0t3qE10s3E7YnYevGWBiJ9gFwTPXutQhL5vlN1WL075ir2VBMkbMGzpfjVU8VJxl0DkMq2Cu2J22_4ioYC0MvP9LcFo6K3kpIyDmPXbEyIKiHVmDOA"},
  {name:"CRYPTOSIM",role:"SIEM Security Platform",tags:["CRYPTTECH","Data Security","Cybersecurity","Logging","Cyber","SIEM"],ini:"CM",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEjREaWvAK4HtUzarxB4hOocFWQa8vF10cgr-8YGKVQBGRX4_BItVHwk7haBXZM_sqE62GQDqJ9Oj94VkYf6AOBjiBh0TtZft_u5GnJ7qk1hBFQZqel4p4D6B45B-wfNCVKBZ8_8PfXdBpIshHK6UKXiz7FgPQmTRl901QUiQujeR0fl47E86UFnKK9hlAM"},
  {name:"LDAP",role:"Cybersecurity Project Company",tags:["LDAP","Fortinet","Cybersecurity","SOC","Cyber","MDR","NOC","Backup","Virtualization"],hiddenTags:["Turkish"],ini:"LP",url:"#",img:"https://blogger.googleusercontent.com/img/a/AVvXsEguDaindK3RD--VzyMO33agkMnQKFGTlE7B6qvAmNSRTPyYijOcMvygDv3IZAtjTtth1SRV-SaoHr6XAhRI7Txo04xSUyk41mgcx_m_ZQe3iH6aqOLioP-1MFWJyWoWNIosrAMJzG_5Djb2__isKq24ucSscGTO7O06xalSeuDuYlrU2ckx8bUunTDd7OA"}
];

/* ── S1 category definitions ── */
var S1_CATS1=[
  {label:'Technology', tag:'AI',          tags:['AI','Cloud','5G','Telecom','BankTech','CTO','Architect']},
  {label:'Management', tag:'Management',  tags:['Management','Finance','Consultant','Academic']},
  {label:'Global',     tag:'Global',      tags:['Global','MENAPARK','GCC','European Union']},
  {label:'Security',   tag:'Cybersecurity',tags:['Cybersecurity','Data Security','Logging','SIEM']},
  {label:'Sector',     tag:'Health',      tags:['Health','Grants','Marketing','Technology','Digital']}
];
var S1_CATS2=[
  {label:'MENA',     tag:'MENA',     tags:['MENA','Iraq','GCC','Egypt','Jordan','KSA']},
  {label:'Europe',   tag:'Europe',   tags:['Europe','UK','England','European Union']},
  {label:'Asia',     tag:'Asia',     tags:['China','Azerbaijan','Turkic']},
  {label:'Americas', tag:'Americas', tags:['Americas','USA','Canada']},
  {label:'Worldwide',tag:'Global',   tags:['Global','Agile','Consultant']}
];

/* ── S2 category definitions (dd2 = product/company filter) ── */
var S2_CATS1=[
  {label:'Americas', tag:'Americas', tags:['USA','Canada','Brazil']},
  {label:'Africa',   tag:'Africa',   tags:['South Africa','Nigeria','Egypt']},
  {label:'Asia',     tag:'Asia',     tags:['China','Japan','India','Azerbaijan','Turkic']},
  {label:'MENA',     tag:'MENA',     tags:['Dubai','KSA','Qatar','Jordan','Iraq']},
  {label:'Europe',   tag:'Europe',   tags:['Germany','France','England','UK','Global']}
];
var S2_CATS2=[
  {label:'Cyber',    tag:'Cyber',    tags:['CRYPTTECH','Cybersecurity','DLP','SIEM','Logging','SOC','NOC','MDR']},
  {label:'ERP',      tag:'ERP',      tags:['SAP','ERP','Odoo','CPM','GRC','Budget','Dataliva']},
  {label:'Software', tag:'Software', tags:['Software','Low-Code','NTG','Mobile','Marketing']},
  {label:'Telecom',  tag:'Telecom',  tags:['Telecom','5G','Global']},
  {label:'AI/Network',tag:'AI',      tags:['AI','Robotics','Manufacturing','Automotive']}
];

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
initSlider(      's1', DATA_S1, S1_CATS1, S1_CATS2, 'ALL Business People',     'Categories',           0,    false, false);
initRegionSlider('s2', DATA_S2, S2_CATS1, S2_CATS2, 'ALL Regions & Countries', 'Products / Companies', 1200, true);

/* ══════════════════════════════════════════════
   URL HASH FILTER SYSTEM
══════════════════════════════════════════════ */
(function(){
  function resolveTag(raw,datasets){
    if(!raw||raw==='_') return null;
    var lower=raw.toLowerCase();
    for(var d=0;d<datasets.length;d++){
      var DATA=datasets[d];
      for(var i=0;i<DATA.length;i++){
        for(var t=0;t<DATA[i].tags.length;t++){
          if(DATA[i].tags[t].toLowerCase()===lower) return DATA[i].tags[t];
        }
      }
    }
    return raw.charAt(0).toUpperCase()+raw.slice(1);
  }
  function applyHashFilters(){
    var hash=decodeURIComponent(window.location.hash);
    if(!hash||hash==='#') return;
    var parts=hash.replace(/^#/,'').split('#');
    var raw1=parts[0]||'', raw2=parts[1]||'';
    var tag1,tag2;
    if(raw2===''){
      tag1=resolveTag(raw1,[DATA_S1]);
      tag2=resolveTag(raw1,[DATA_S2]);
    } else {
      tag1=resolveTag(raw1,[DATA_S1]);
      tag2=resolveTag(raw2,[DATA_S2]);
    }
    var api1=_sliderAPI['s1'];
    if(api1&&tag1) api1.setTag1(tag1,false,true);
    var api2=_sliderAPI['s2'];
    if(api2&&tag2) setTimeout(function(){ api2.setTag1(tag2,false,true); },50);
  }
  setTimeout(applyHashFilters,200);
  window.addEventListener('hashchange',function(){ applyHashFilters(); });
})();
</script>
