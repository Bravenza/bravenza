import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const gm=async(sb:any,cpf:string)=>{const{data}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();return data;};
const PUB=new Set(["product-comments","product-reviews","product-analytics","check-purchase"]);
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(!PUB.has(a||"")&&cpf==="visitor")return j({error:"Auth required"},401);
try{
if(mt==="GET"&&a==="product-comments"){const pid=url.searchParams.get("product_id");if(!pid)throw new Error("product_id obrigatório");const{data,error}=await sb.from("marketplace_product_comments_public").select("*").eq("product_id",pid).eq("is_visible",true).order("created_at",{ascending:true});if(error)throw error;return j({comments:data||[]});}
if(mt==="POST"&&a==="product-comment"){const b=await req.json();if(!b.product_id||!b.content)throw new Error("product_id e content obrigatórios");const{data:mem}=await sb.from("vault_members").select("client_name").eq("client_cpf",cpf).maybeSingle();const insertData:any={product_id:b.product_id,user_cpf:cpf,user_name:mem?.client_name||"Usuário",content:b.content,parent_id:b.parent_id||null,is_seller_reply:!!b.is_seller_reply};if(b.review_id)insertData.review_id=b.review_id;const{data:comment,error}=await sb.from("marketplace_product_comments").insert(insertData).select().single();if(error)throw error;return j({comment});}
if(mt==="GET"&&a==="product-reviews"){const pid=url.searchParams.get("product_id");if(!pid)throw new Error("product_id obrigatório");const{data:reviews}=await sb.from("marketplace_product_reviews_public").select("*").eq("product_id",pid).order("created_at",{ascending:false});const list=reviews||[];const avg=list.length>0?list.reduce((s:number,r:any)=>s+r.rating,0)/list.length:0;return j({reviews:list,average:Math.round(avg*10)/10,total:list.length});}
if(mt==="POST"&&a==="product-review"){const b=await req.json();if(!b.product_id||!b.rating)throw new Error("product_id e rating obrigatórios");const m=await gm(sb,cpf);let rn="Anônimo";if(m){const{data:mem}=await sb.from("vault_members").select("client_name").eq("id",m.id).single();if(mem)rn=mem.client_name;}const{data,error}=await sb.from("marketplace_product_reviews").insert({product_id:b.product_id,reviewer_cpf:cpf,reviewer_name:rn,rating:b.rating,comment:b.comment||null,product_quality:b.product_quality||null,authenticity_score:b.authenticity_score||null,shipping_speed:b.shipping_speed||null}).select().single();if(error)throw error;return j({review:data});}
if(mt==="GET"&&a==="check-purchase"){const pid=url.searchParams.get("product_id");if(!pid)throw new Error("product_id obrigatório");const{data:orders}=await sb.from("vault_marketplace_orders").select("id").eq("buyer_cpf",cpf).in("status",["delivered","completed"]).limit(100);let hp=false;if(orders&&orders.length>0){const{data:so}=await sb.from("marketplace_offers").select("id").eq("product_id",pid).eq("status","sold").limit(1);if(so&&so.length>0)hp=true;}return j({has_purchased:hp});}
if(mt==="GET"&&a==="product-analytics"){
  const pid=url.searchParams.get("product_id");if(!pid)throw new Error("product_id obrigatório");
  const{data:ao}=await sb.from("marketplace_offers").select("price,created_at,status,sold_at").eq("product_id",pid).order("created_at",{ascending:true});
  const now=new Date(),cut=new Date(now.getTime()-90*86400000);const dm:Record<string,{prices:number[]}>={};
  for(const o of(ao||[])){const d=new Date(o.created_at);if(d<cut)continue;const k=d.toISOString().slice(0,10);if(!dm[k])dm[k]={prices:[]};dm[k].prices.push(o.price);}
  const ph=Object.entries(dm).sort(([a],[b])=>a.localeCompare(b)).map(([date,{prices}])=>({date,min_price:Math.min(...prices),avg_price:Math.round(prices.reduce((s,p)=>s+p,0)/prices.length),max_price:Math.max(...prices),offers_count:prices.length}));
  const sold=(ao||[]).filter((o:any)=>o.status==="sold"||o.sold_at);const ts=sold.length;const asp=ts>0?Math.round(sold.reduce((s:number,o:any)=>s+o.price,0)/ts):null;
  let pt:"up"|"down"|"stable"="stable";let tp=0;const ro=(ao||[]).filter((o:any)=>new Date(o.created_at)>=cut);
  if(ro.length>=4){const mid=Math.floor(ro.length/2);const a1=ro.slice(0,mid).reduce((s:number,o:any)=>s+o.price,0)/mid;const a2=ro.slice(mid).reduce((s:number,o:any)=>s+o.price,0)/(ro.length-mid);if(a1>0){tp=Math.abs(((a2-a1)/a1)*100);if(tp>2)pt=a2>a1?"up":"down";}}
  return j({analytics:{price_history:ph,total_sold:ts,avg_sale_price:asp,price_trend:pt,trend_percent:tp}});
}
return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mkv2-engage error:",e);return j({error:e.message},500);}
});