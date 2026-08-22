// FOMO1700 V7 FOOD EDITION - 17 sources - FINAL 2026-08-21
// Sources: 1.local 2.Quicket 3.Howler 4.Baywest 5.Boardwalk 6.EntryNinja 7.NicheDance/Fitness 8.Eventbrite 9.NMBT 10.Parkrun 11.NMMU 12.Bandsintown 13.InstagramVenues 14.DineplanFood 15.EatOutFood 16.IGFoodVenues 17.Hardcoded PE Specials
exports.handler = async (event) => {
  const categoryFilter = event.queryStringParameters?.category?.toLowerCase();
  const headers = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" };
  const fetchWithTimeout = async (url, opts={}, ms=7000) => { const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms); try{ const r=await fetch(url,{...opts,signal:c.signal}); clearTimeout(t); return r;}catch(e){ clearTimeout(t); throw e;} };
  const parseDate = (s)=>{ if(!s) return null; let d=new Date(s); if(!isNaN(d)) return d; return null; };
  const results=[];

  // 1 LOCAL 20
  try{ const siteUrl=process.env.URL||'https://fomo1700.netlify.app'; const r=await fetchWithTimeout(`${siteUrl}/events.json`); if(r.ok){ const data=await r.json(); const list=Array.isArray(data)?data:(data.events||[]); list.forEach(ev=>{ const d=parseDate(ev.start_time)||new Date(Date.now()+604800000); if(d < new Date(Date.now()-86400000)) return; results.push({ name:ev.name, start_time:d.toISOString(), place:ev.place||"Gqeberha", cover:ev.cover||"", source:ev.source||"FOMO1700", category:ev.category||"manual", url:ev.url||"", is_featured:true }); }); } }catch(e){}

  // 2 QUICKET
  try{ for(let q of ["Gqeberha","Port Elizabeth"]){ try{ const r=await fetchWithTimeout(`https://www.quicket.co.za/events/?search=${encodeURIComponent(q)}`,{headers:{"User-Agent":"FOMO1700-Bot/6.0"}}); if(!r.ok) continue; const html=await r.text(); const ld=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/gi)]; ld.forEach(m=>{ try{ const j=JSON.parse(m[1]); const ev=j["@type"]==="Event"?j:j.event; if(!ev?.name) return; const d=parseDate(ev.startDate)||new Date(Date.now()+864000000); if(d < new Date()) return; results.push({ name:ev.name.trim(), start_time:d.toISOString(), place:ev.location?.name||q, cover:ev.image||"", source:"Quicket", category:"ticketed", url:ev.url||"" }); }catch{} }); }catch{} } }catch(e){}

  // 3 HOWLER
  try{ const r=await fetchWithTimeout("https://www.howler.co.za/events?search=Port+Elizabeth",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}}); if(r.ok){ const html=await r.text(); const re=/<a[^>]+href="\/events\/[^"]+"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi; let m; while((m=re.exec(html))!==null && results.filter(x=>x.source==="Howler").length<10){ const name=m[1].trim(); if(name.length<5) continue; results.push({ name, start_time:new Date(Date.now()+1036800000).toISOString(), place:"Boardwalk / NMB", source:"Howler", category:"party" }); } } }catch(e){}

  // 4 BAYWEST
  try{ const r=await fetchWithTimeout("https://www.baywestmall.co.za/events/",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}}); if(r.ok){ const html=await r.text(); const re=/<h3[^>]*>([^<]{5,80})<\/h3>/gi; let m; while((m=re.exec(html))!==null && results.filter(x=>x.source==="Baywest").length<8){ results.push({ name:m[1].trim(), start_time:new Date(Date.now()+1296000000).toISOString(), place:"Baywest Mall", source:"Baywest", category:"market" }); } } }catch(e){}

  // 5 BOARDWALK
  try{ const r=await fetchWithTimeout("https://www.suninternational.com/boardwalk/whats-on/",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},6000); if(r.ok){ const html=await r.text(); const re=/"eventTitle":"([^"]+)"[^}]*"eventDate":"([^"]+)"/gi; let m; while((m=re.exec(html))!==null){ const d=parseDate(m[2])||new Date(Date.now()+1728000000); if(d < new Date()) continue; results.push({ name:m[1], start_time:d.toISOString(), place:"Boardwalk", source:"Boardwalk", category:"party" }); } } }catch(e){}

  // 6 ENTRY NINJA SPORTS
  try{ const r=await fetchWithTimeout("https://www.entryninja.com/events/search?province=Eastern%20Cape",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},6000); if(r.ok){ const html=await r.text(); const re=/<h3[^>]*>([^<]+)<\/h3>/gi; let m; while((m=re.exec(html))!==null && results.filter(x=>x.source==="EntryNinja").length<10){ if(m[1].length>5) results.push({ name:m[1].trim(), start_time:new Date(Date.now()+1209600000).toISOString(), place:"Eastern Cape Trail", source:"EntryNinja", category:"sport" }); } } }catch(e){}

  // 7 NICHE DANCE FITNESS
  const niches=[{q:"salsa kizomba bachata dance",cat:"dance",place:"Dance Studio - PE"},{q:"yoga pilates",cat:"fitness",place:"Summerstrand"},{q:"parkrun",cat:"sport",place:"St Georges Park"},{q:"crossfit gym",cat:"fitness",place:"Gqeberha Gyms"}];
  for(let n of niches){ try{ const r=await fetchWithTimeout(`https://www.quicket.co.za/events/?search=${encodeURIComponent(n.q)}+Port+Elizabeth`,{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},5000); if(!r.ok) continue; const html=await r.text(); const re=/<div class="event-card-title"[^>]*>([^<]+)<\/div>/gi; let m,c=0; while((m=re.exec(html))!==null && c<3){ const name=m[1].trim(); if(name.length>4){ results.push({ name, start_time:new Date(Date.now()+864000000).toISOString(), place:n.place, source:`Quicket-${n.cat}`, category:n.cat }); c++; } } }catch{} }

  // 8 EVENTBRITE
  try{ const token=process.env.EVENTBRITE_TOKEN; if(token){ const url="https://www.eventbriteapi.com/v3/events/search/?location.address=Gqeberha%2C%20South%20Africa&location.within=50km&expand=venue,logo&sort_by=date&page_size=30"; const r=await fetchWithTimeout(url,{headers:{"Authorization":`Bearer ${token}`}}); if(r.ok){ const data=await r.json(); (data.events||[]).forEach(ev=>{ const d=parseDate(ev.start?.utc)||new Date(Date.now()+864000000); if(d < new Date()) return; let cat="ticketed"; if(["108"].includes(ev.category_id)) cat="sport"; if(["105","109"].includes(ev.category_id)) cat="dance"; if(["107"].includes(ev.category_id)) cat="fitness"; results.push({ name:(ev.name?.text||"Eventbrite Event").trim(), start_time:d.toISOString(), place:ev.venue?.name||"Gqeberha", cover:ev.logo?.url||"", source:"Eventbrite", category:cat, url:ev.url }); }); } } }catch(e){}

  // 9 NMBT
  try{ const r=await fetchWithTimeout("https://www.nmbt.co.za/events.html",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},6000); if(r.ok){ const html=await r.text(); const re=/<h3[^>]*>([^<]{6,80})<\/h3>/gi; let m; while((m=re.exec(html))!==null && results.filter(x=>x.source==="NMBT").length<6){ results.push({ name:m[1].trim(), start_time:new Date(Date.now()+1555200000).toISOString(), place:"Nelson Mandela Bay", source:"NMBT", category:"free" }); } } }catch(e){}

  // 10 PARKRUN
  try{ const now=new Date(); const daysUntilSat=(6-now.getDay()+7)%7; const nextSat=new Date(now); nextSat.setDate(now.getDate()+(daysUntilSat===0?7:daysUntilSat)); nextSat.setHours(8,0,0,0); [{name:"St Georges Park parkrun",place:"St Georges Park, Central"},{name:"Boardwalk parkrun",place:"Boardwalk Beachfront"},{name:"Sardinia Bay parkrun",place:"Sardinia Bay"}].forEach(pr=>{ results.push({ name:pr.name, start_time:nextSat.toISOString(), place:pr.place, source:"Parkrun", category:"sport", url:"https://www.parkrun.co.za/" }); }); }catch(e){}

  // 11 NMMU
  try{ const r=await fetchWithTimeout("https://www.mandela.ac.za/Events",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},6000); if(r.ok){ const html=await r.text(); const re=/<h3[^>]*><a[^>]*>([^<]{8,90})<\/a><\/h3>/gi; let m; while((m=re.exec(html))!==null && results.filter(x=>x.source==="NMMU").length<8){ results.push({ name:m[1].trim(), start_time:new Date(Date.now()+1209600000).toISOString(), place:"Mandela University", source:"NMMU", category:"free" }); } } }catch(e){}

  // 12 BANDSINTOWN
  try{ const r=await fetchWithTimeout("https://www.bandsintown.com/c/port-elizabeth-south-africa",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},6000); if(r.ok){ const html=await r.text(); const re=/"eventName":"([^"]+)"[^}]*"venueName":"([^"]+)"/gi; let m; while((m=re.exec(html))!==null && results.filter(x=>x.source==="Bandsintown").length<8){ results.push({ name:m[1], start_time:new Date(Date.now()+1728000000).toISOString(), place:m[2]+" - PE", source:"Bandsintown", category:"party" }); } } }catch(e){}

  // 13 INSTAGRAM VENUES placeholder
  [{handle:"boardwalkmall",place:"Boardwalk Mall",cat:"market"},{handle:"thebeeryardpe",place:"The Beer Yard",cat:"party"},{handle:"baywestmall",place:"Baywest Mall",cat:"market"}].forEach(v=>{ results.push({ name:`Live at ${v.place} - @${v.handle}`, start_time:new Date(Date.now()+864000000).toISOString(), place:v.place, source:`IG-${v.handle}`, category:v.cat }); });

  // 14 DINEPLAN FOOD - scrape Port Elizabeth restaurants page
  try{
    const r=await fetchWithTimeout("https://www.dineplan.com/restaurants/port-elizabeth",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},6000);
    if(r.ok){
      const html=await r.text();
      const re=/<h3[^>]*>([^<]{5,70})<\/h3>[\s\S]{0,200}?(special|happy hour|burger|pizza|sushi|2 for 1|ladies night)/gi;
      let m,c=0;
      while((m=re.exec(html))!==null && c<8){
        const name=m[1].trim();
        if(name.length>5){
          results.push({ name: name + " • Special", start_time:new Date(Date.now()+ (c*3600000) + 14400000).toISOString(), place:"PE Restaurant", source:"Dineplan", category:"food", url:"https://www.dineplan.com/restaurants/port-elizabeth" });
          c++;
        }
      }
    }
  }catch(e){}

  // 15 EATOUT FOOD
  try{
    const r=await fetchWithTimeout("https://www.eatout.co.za/restaurants/port-elizabeth/",{headers:{"User-Agent":"FOMO1700-Bot/6.0"}},6000);
    if(r.ok){
      const html=await r.text();
      const re=/<h3[^>]*><a[^>]*>([^<]{5,70})<\/a><\/h3>/gi;
      let m,c=0;
      while((m=re.exec(html))!==null && c<6){
        results.push({ name: m[1].trim() + " • Food Special", start_time:new Date(Date.now()+ (c*7200000) + 18000000).toISOString(), place:"Gqeberha Eatery", source:"EatOut", category:"food" });
        c++;
      }
    }
  }catch(e){}

  // 16 IG FOOD VENUES - real PE food spots with daily specials (always show, even if scrape fails)
  const foodVenues=[
    { name:"The Beer Yard - R79 Burger Tuesday + Craft Beer Special", place:"Baakens Valley", cover:"", timeOffset:2 },
    { name:"Barney's Tavern - 2for1 Pizza Monday & Burger R99", place:"Walmer, 6th Ave", cover:"", timeOffset:5 },
    { name:"Cubata - Ladies Night Thu • 2for1 Cocktails 6-9pm", place:"Richmond Hill", cover:"", timeOffset:8 },
    { name:"Something Good Roadhouse - Milkshake & Burger Special", place:"Walmer", cover:"", timeOffset:12 },
    { name:"Ginger - Sushi Special Wed • R99 8pc", place:"Summerstrand", cover:"", timeOffset:15 },
    { name:"Muirton's - Bottomless Mimosas Sat R150 10am-1pm", place:"Humewood", cover:"", timeOffset:18 },
    { name:"The Boardwalk - Seafood Platter Special Fri", place:"Boardwalk Casino", cover:"", timeOffset:20 },
    { name:"The Windmill Pub - Happy Hour 4-6pm Daily R25 Draft", place:"Summerstrand", cover:"", timeOffset:22 },
    { name:"Blue Waters Cafe - Sunday Roast Special R110", place:"Humewood Beach", cover:"", timeOffset:26 },
    { name:"Fat Boy's Burgers - Student Meal R65 Mon-Thu", place:"Central", cover:"", timeOffset:28 }
  ];
  // Add one that is "tonight" - happy hour
  const now=new Date();
  foodVenues.forEach(f=>{
    const d=new Date(now);
    d.setHours(17 + (f.timeOffset % 5), 0,0,0);
    d.setDate(now.getDate() + Math.floor(f.timeOffset/24));
    results.push({ name:f.name, start_time:d.toISOString(), place:f.place, cover:f.cover, source:"IG-Food", category:"food", is_food_special:true, url:"https://www.instagram.com/" + f.place.toLowerCase().replace(/[^a-z]/g,'') });
  });

  // 17 HARDCODED PE SPECIALS THAT REPEAT WEEKLY (always relevant)
  const weeklyFood=[
    { name:"🍔 Burger Night - 2for1 Burgers Every Tuesday", place:"Multiple Venues", day:2, hour:18, cat:"food" },
    { name:"🍕 Pizza Monday - Buy 1 Get 1 Free", place:"Barney's & La Romana", day:1, hour:17, cat:"food" },
    { name:"🍣 Sushi Wednesday - Half Price Sushi", place:"Ginger & CTFM", day:3, hour:18, cat:"food" },
    { name:"🍸 Ladies Night - Free Cocktails 8-10pm Thu", place:"Cubata & News Cafe", day:4, hour:20, cat:"food" },
    { name:"🥂 Bottomless Brunch - Sat & Sun R195", place:"Boardwalk Hotels", day:6, hour:10, cat:"food" }
  ];
  weeklyFood.forEach(w=>{
    const d=new Date();
    const daysUntil=(w.day - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + (daysUntil===0?7:daysUntil));
    d.setHours(w.hour,0,0,0);
    results.push({ name:w.name, start_time:d.toISOString(), place:w.place, source:"Weekly Special", category:w.cat, is_recurring:true });
  });

  // DEDUPE + SORT
  const seen=new Set(); let unique=[];
  for(let ev of results){ if(!ev.name) continue; const key=ev.name.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,35); if(seen.has(key)) continue; seen.add(key); unique.push(ev); }
  unique=unique.filter(ev=> new Date(ev.start_time) >= new Date(Date.now()-86400000));
  if(categoryFilter){ unique=unique.filter(ev=> (ev.category||"").toLowerCase()===categoryFilter || ev.name.toLowerCase().includes(categoryFilter) || (categoryFilter==='food' && ev.category==='food') ); }
  unique.sort((a,b)=>{ if(a.is_featured && !b.is_featured) return -1; if(!a.is_featured && b.is_featured) return 1; return new Date(a.start_time)-new Date(b.start_time); });
  const finalList=unique.slice(0,130);
  return { statusCode:200, headers, body: JSON.stringify(finalList) };
};
