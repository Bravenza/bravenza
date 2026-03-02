import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const gm=async(sb:any,cpf:string)=>{const{data}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();return data;};
const gs=async(sb:any,mid:string)=>{const{data}=await sb.from("vault_seller_profiles").select("*").eq("member_id",mid).maybeSingle();return data;};
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(cpf==="visitor")return j({error:"Auth required"},401);
try{
if(mt==="GET"&&a==="seller-analytics"){
  const mb=await gm(sb,cpf);if(!mb)return j({analytics:null});const sl=await gs(sb,mb.id);if(!sl)return j({analytics:null});
  const pp=url.searchParams.get("period")||"30d";const now=new Date();
  let ps:Date;if(pp==="7d")ps=new Date(now.getTime()-7*86400000);else if(pp==="30d")ps=new Date(now.getTime()-30*86400000);else if(pp==="90d")ps=new Date(now.getTime()-90*86400000);else ps=new Date("2020-01-01");
  const pi=ps.toISOString(),pm=now.getTime()-ps.getTime(),pv=new Date(ps.getTime()-pm).toISOString();
  const{data:ls}=await sb.from("vault_marketplace_listings").select("id,views_count,price,status,created_at,published_at,condition,brand,size,model").eq("seller_id",sl.id);
  const tv=(ls||[]).reduce((s:number,l:any)=>s+(l.views_count||0),0);const al=(ls||[]).filter((l:any)=>l.status==="active").length;
  const{data:os}=await sb.from("vault_marketplace_orders").select("id,status,sale_price,fee_amount,seller_payout,created_at,paid_at,payout_released_at,brand,model,size").eq("seller_id",sl.id);
  const cs=["delivered","payout_released","payout_pending","completed"];const ac=(os||[]).filter((o:any)=>cs.includes(o.status));
  const po=ac.filter((o:any)=>o.created_at>=pi);const prev=ac.filter((o:any)=>o.created_at>=pv&&o.created_at<pi);
  const tr=po.reduce((s:number,o:any)=>s+(o.seller_payout||0),0);const tf=po.reduce((s:number,o:any)=>s+(o.fee_amount||0),0);
  const pr=prev.reduce((s:number,o:any)=>s+(o.seller_payout||0),0);
  const rg=pr>0?Math.round(((tr-pr)/pr)*1000)/10:(tr>0?100:0);const sg=prev.length>0?Math.round(((po.length-prev.length)/prev.length)*1000)/10:(po.length>0?100:0);
  const cr=tv>0?Math.round(po.length/tv*10000)/100:0;
  const apo=(os||[]).filter((o:any)=>o.created_at>=pi);const cks=apo.length;const pd=apo.filter((o:any)=>o.paid_at).length;
  const md:Record<string,{revenue:number;sales:number;views:number}>={};for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;md[k]={revenue:0,sales:0,views:0};}
  for(const o of ac){const k=o.created_at.slice(0,7);if(md[k]){md[k].revenue+=o.seller_payout||0;md[k].sales+=1;}}
  const ai=(ls||[]).filter((l:any)=>l.status==="active");const iv=ai.reduce((s:number,l:any)=>s+(l.price||0),0);const ap2=ai.length>0?Math.round(iv/ai.length):0;
  const cm:Record<string,number>={};ai.forEach((l:any)=>{const c=l.condition||"unknown";cm[c]=(cm[c]||0)+1;});
  const bm:Record<string,number>={};ai.forEach((l:any)=>{const b=l.brand||"Outro";bm[b]=(bm[b]||0)+1;});
  const sm:Record<string,number>={};ai.forEach((l:any)=>{const s=l.size||"?";sm[s]=(sm[s]||0)+1;});
  const bsm:Record<string,{count:number;revenue:number}>={};po.forEach((o:any)=>{const b=o.brand||"Outro";if(!bsm[b])bsm[b]={count:0,revenue:0};bsm[b].count+=1;bsm[b].revenue+=o.seller_payout||0;});
  const msm:Record<string,{count:number;revenue:number;brand:string}>={};po.forEach((o:any)=>{const m=o.model||"?";if(!msm[m])msm[m]={count:0,revenue:0,brand:o.brand||""};msm[m].count+=1;msm[m].revenue+=o.seller_payout||0;});
  const ssm:Record<string,number>={};po.forEach((o:any)=>{const s=o.size||"?";ssm[s]=(ssm[s]||0)+1;});
  const ti=ai.length+po.length;const str2=ti>0?Math.round(po.length/ti*10000)/100:0;
  const sl2=(ls||[]).filter((l:any)=>l.status==="sold"&&l.published_at);let ads=0;if(sl2.length>0){const td=sl2.reduce((s:number,l:any)=>{return s+Math.max(1,Math.round((new Date(l.created_at).getTime()-new Date(l.published_at).getTime())/86400000));},0);ads=Math.round(td/sl2.length);}
  const{data:sub}=await sb.from("marketplace_subscriptions").select("plan_id,status").eq("seller_id",sl.id).eq("status","active").maybeSingle();
  return j({analytics:{total_views:tv,active_listings:al,total_sales:po.length,total_revenue:Math.round(tr*100)/100,total_fees:Math.round(tf*100)/100,conversion_rate:cr,average_order_value:po.length>0?Math.round(tr/po.length):0,monthly:Object.entries(md).map(([month,data])=>({month,...data})),tier:sl.tier||"bronze",fee_percent:sl.current_fee_percent||14,rating:sl.average_rating,ratings_count:sl.ratings_count||0,revenue_growth:rg,sales_growth:sg,funnel:{views:tv,checkout_starts:cks,paid:pd,completed:po.length},plan_id:sub?.plan_id||"free",inventory:{total_items:ai.length,total_value:Math.round(iv*100)/100,avg_price:ap2,by_condition:Object.entries(cm).map(([c,n])=>({condition:c,count:n})).sort((a,b)=>b.count-a.count),by_brand:Object.entries(bm).map(([b,n])=>({brand:b,count:n})).sort((a,b)=>b.count-a.count).slice(0,8),by_size:Object.entries(sm).map(([s,n])=>({size:s,count:n})).sort((a,b)=>b.count-a.count).slice(0,10)},insights:{top_selling_brands:Object.entries(bsm).map(([b,d])=>({brand:b,sales:d.count,revenue:Math.round(d.revenue*100)/100})).sort((a,b)=>b.sales-a.sales).slice(0,5),top_selling_models:Object.entries(msm).map(([m,d])=>({model:m,brand:d.brand,sales:d.count,revenue:Math.round(d.revenue*100)/100})).sort((a,b)=>b.sales-a.sales).slice(0,5),top_sizes:Object.entries(ssm).map(([s,n])=>({size:s,count:n})).sort((a,b)=>b.count-a.count).slice(0,5),sell_through_rate:str2,avg_days_to_sell:ads}}});
}
if(mt==="GET"&&a==="price-drop-suggestions"){
  const mb=await gm(sb,cpf);if(!mb)return j({suggestions:[]});const sl=await gs(sb,mb.id);if(!sl)return j({suggestions:[]});
  const sda=new Date(Date.now()-7*86400000).toISOString();
  const{data:stale}=await sb.from("vault_marketplace_listings").select("id,title,price,views_count,created_at,published_at").eq("seller_id",sl.id).eq("status","active").lt("published_at",sda).order("published_at",{ascending:true});
  if(!stale||stale.length===0)return j({suggestions:[]});
  const suggestions=stale.map((l:any)=>{const dl=Math.floor((Date.now()-new Date(l.published_at||l.created_at).getTime())/86400000);let dp=5,reason="Sem vendas há 7+ dias";if(dl>30){dp=15;reason="Parado há 30+ dias";}else if(dl>14){dp=10;reason="Sem interesse há 2+ semanas";}if(l.views_count<5){dp+=3;reason+=". Poucas visualizações";}return{listing_id:l.id,title:l.title,current_price:l.price,suggested_price:Math.round(l.price*(1-dp/100)),days_listed:dl,views:l.views_count||0,reason};});
  return j({suggestions});
}
if(mt==="GET"&&a==="seller-dashboard"){
  const mb=await gm(sb,cpf);if(!mb)return j({ok:false,error:"Membro não encontrado"},404);
  const sl=await gs(sb,mb.id);if(!sl)return j({ok:false,error:"Vendedor não encontrado"},404);
  const now=new Date(),d7=new Date(now.getTime()-7*86400000).toISOString(),d30=new Date(now.getTime()-30*86400000).toISOString(),d90=new Date(now.getTime()-90*86400000).toISOString();

  // Today's tasks
  const{data:pendingShip}=await sb.from("vault_marketplace_orders").select("id,order_code,sale_price,created_at").eq("seller_id",sl.id).eq("status","paid").order("created_at");
  const{data:pendingHub}=await sb.from("vault_marketplace_orders").select("id,order_code,sale_price").eq("seller_id",sl.id).eq("status","hub_received");
  const{data:disputes}=await sb.from("vault_marketplace_orders").select("id,order_code").eq("seller_id",sl.id).eq("dispute_status","open");

  // Pending offers (received, not responded)
  const{data:pendingOffers}=await sb.from("marketplace_offers").select("id").eq("seller_id",sl.id).eq("status","pending").limit(50);

  // Metrics
  const{data:allOrders}=await sb.from("vault_marketplace_orders").select("id,status,sale_price,fee_amount,seller_payout,created_at").eq("seller_id",sl.id);
  const cs=["delivered","payout_released","payout_pending","completed"];
  const calc=(since:string)=>{const os=(allOrders||[]).filter((o:any)=>cs.includes(o.status)&&o.created_at>=since);return{sales:os.length,revenue:Math.round(os.reduce((s:number,o:any)=>s+(o.seller_payout||0),0)*100)/100,fees:Math.round(os.reduce((s:number,o:any)=>s+(o.fee_amount||0),0)*100)/100};};

  // Listings
  const{data:ls}=await sb.from("vault_marketplace_listings").select("id,status,price,views_count").eq("seller_id",sl.id);
  const active=(ls||[]).filter((l:any)=>l.status==="active");
  const paused=(ls||[]).filter((l:any)=>l.status==="paused");
  const sold=(ls||[]).filter((l:any)=>l.status==="sold");
  const totalViews=(ls||[]).reduce((s:number,l:any)=>s+(l.views_count||0),0);

  // Stale listings for price-drop suggestions count
  const d7ago=new Date(now.getTime()-7*86400000).toISOString();
  const staleCount=active.filter((l:any)=>(l.views_count||0)<5).length;

  // Wallet (real escrow calc like mkv2-wallet)
  const{data:pendingOrders}=await sb.from("vault_marketplace_orders").select("seller_payout").eq("seller_id",sl.id).eq("status","delivered").is("confirmed_at",null).is("dispute_status",null);
  const walletPending=(pendingOrders||[]).reduce((s:number,o:any)=>s+Number(o.seller_payout),0);

  const{data:releasedOrders}=await sb.from("vault_marketplace_orders").select("seller_payout").eq("seller_id",sl.id).in("status",["completed","payout_pending"]).not("confirmed_at","is",null).is("dispute_status",null);
  const totalEarned=(releasedOrders||[]).reduce((s:number,o:any)=>s+Number(o.seller_payout),0);

  const{data:payoutsData}=await sb.from("marketplace_seller_payouts").select("amount,status,created_at").eq("seller_id",sl.id).in("status",["requested","processing","completed"]).order("created_at",{ascending:false}).limit(5);
  const payoutsTotal=(payoutsData||[]).reduce((s:number,p:any)=>s+Number(p.amount),0);
  const walletReleased=Math.max(0,totalEarned-payoutsTotal);

  // Reputation
  const{data:inspections}=await sb.from("marketplace_inspections").select("result").eq("status","completed");
  const totalInsp=(inspections||[]).length;
  const approvedInsp=(inspections||[]).filter((i:any)=>i.result==="approved").length;
  const authRate=totalInsp>0?Math.round(approvedInsp/totalInsp*100):0;

  const rep={tier:sl.tier||"bronze",rating:sl.average_rating||0,ratings_count:sl.ratings_count||0,fee_percent:sl.current_fee_percent||14,on_time_rate:sl.on_time_shipping_rate||0,auth_approval_rate:authRate};

  // Conversion
  const d30sales=calc(d30).sales;
  const conversionRate=totalViews>0?Math.round(d30sales/totalViews*10000)/100:0;

  return j({ok:true,data:{
    today_tasks:{pending_shipments:pendingShip||[],pending_hub_actions:pendingHub||[],open_disputes:disputes||[],pending_offers_count:(pendingOffers||[]).length},
    metrics:{d7:calc(d7),d30:calc(d30),d90:calc(d90),total_views:totalViews,conversion_rate:conversionRate},
    listings_summary:{active:active.length,paused:paused.length,sold:sold.length,total_value:Math.round(active.reduce((s:number,l:any)=>s+(l.price||0),0)*100)/100,stale_count:staleCount},
    wallet_summary:{released:Math.round(walletReleased*100)/100,pending:Math.round(walletPending*100)/100,recent_payouts:payoutsData||[]},
    reputation_summary:rep
  }});
}
return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mkv2-seller-data error:",e);return j({error:e.message},500);}
});