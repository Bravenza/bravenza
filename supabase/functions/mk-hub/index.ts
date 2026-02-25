import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const gm=async(sb:any,cpf:string)=>{const{data}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();return data;};
const gs=async(sb:any,mid:string)=>{const{data}=await sb.from("vault_seller_profiles").select("*").eq("member_id",mid).maybeSingle();return data;};
const PUB=new Set(["listings","listing-detail","seller-public-profile"]);
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(!PUB.has(a||"")&&cpf==="visitor")return j({error:"Auth required"},401);
try{
if(mt==="GET"&&a==="listings"){
  const pg=+(url.searchParams.get("page")||"1"),lm=20,of2=(pg-1)*lm;
  let q=sb.from("vault_marketplace_listings").select(`*,seller:vault_seller_profiles!inner(id,seller_cep,plan_id,verified_badge,member:vault_members!inner(client_name,tier),average_rating,total_sales_count,current_fee_percent)`,{count:"exact"}).eq("status","active");
  const sr=url.searchParams.get("search"),br=url.searchParams.get("brand"),sz=url.searchParams.get("size"),cn=url.searchParams.get("condition"),pm=url.searchParams.get("price_min"),px=url.searchParams.get("price_max"),so=url.searchParams.get("sort")||"recent",fo=url.searchParams.get("favorites_only"),md=url.searchParams.get("modality"),to=url.searchParams.get("trusted_only");
  if(fo==="true"){const{data:fv}=await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf",cpf);const fids=(fv||[]).map((f:any)=>f.listing_id);if(!fids.length)return j({listings:[],total:0});q=q.in("id",fids);}
  if(sr)q=q.or(`title.ilike.%${sr}%,brand.ilike.%${sr}%,model.ilike.%${sr}%`);if(br)q=q.ilike("brand",`%${br}%`);if(sz)q=q.eq("size",sz);if(cn)q=q.eq("condition",cn);
  if(pm)q=q.gte("price",+pm);if(px)q=q.lte("price",+px);if(md==="pro")q=q.eq("shipping_mode","pro");else if(md==="direct")q=q.eq("shipping_mode","direct");
  if(to==="true")q=q.in("seller.member.tier",["ouro","elite"]);
  if(so==="price_asc")q=q.order("price",{ascending:true});else if(so==="price_desc")q=q.order("price",{ascending:false});else if(so==="popular")q=q.order("views_count",{ascending:false});else q=q.order("published_at",{ascending:false});
  q=q.range(of2,of2+lm-1);const{data,count,error}=await q;if(error)throw error;
  const po:Record<string,number>={elite:3,pro:2,free:1};let sorted:any[];
  if(so==="best_seller")sorted=(data||[]).sort((a:any,b:any)=>(b.seller?.total_sales_count||0)-(a.seller?.total_sales_count||0));
  else if(so==="recent"||!so)sorted=(data||[]).sort((a:any,b:any)=>{const aB=a.seller?.plan_id!=="free"&&a.pro_recommendation==="boosted"?1:0;const bB=b.seller?.plan_id!=="free"&&b.pro_recommendation==="boosted"?1:0;if(bB!==aB)return bB-aB;return(po[b.seller?.plan_id||"free"]||0)-(po[a.seller?.plan_id||"free"]||0);});
  else sorted=data||[];
  const ids=sorted.map((l:any)=>l.id);let fs=new Set<string>();
  if(ids.length>0){const{data:fv}=await sb.from("vault_marketplace_favorites").select("listing_id").eq("user_cpf",cpf).in("listing_id",ids);fs=new Set((fv||[]).map((f:any)=>f.listing_id));}
  return j({listings:sorted.map((l:any)=>({...l,is_favorited:fs.has(l.id)})),total:count});
}
if(mt==="GET"&&a==="listing-detail"){
  const id=url.searchParams.get("id");if(!id)throw new Error("ID obrigatório");
  const{data,error}=await sb.from("vault_marketplace_listings").select(`*,seller:vault_seller_profiles!inner(id,seller_cep,member:vault_members!inner(client_name,tier),average_rating,total_sales_count,current_fee_percent,bio)`).eq("id",id).single();if(error)throw error;
  await sb.from("vault_marketplace_listings").update({views_count:(data.views_count||0)+1}).eq("id",id);
  const{data:fv}=await sb.from("vault_marketplace_favorites").select("id").eq("listing_id",id).eq("user_cpf",cpf).maybeSingle();
  return j({...data,is_favorited:!!fv});
}
if(mt==="GET"&&a==="my-listings"){const mb=await gm(sb,cpf);if(!mb)return j({listings:[],seller:null});const sl=await gs(sb,mb.id);if(!sl)return j({listings:[],seller:null});const{data}=await sb.from("vault_marketplace_listings").select("*").eq("seller_id",sl.id).order("created_at",{ascending:false});return j({listings:data||[],seller:sl});}
if(mt==="POST"&&a==="create-listing"){
  const b=await req.json();const mb=await gm(sb,cpf);if(!mb)throw new Error("Membro não encontrado");
  let sl=await gs(sb,mb.id);if(!sl){const{data:ns,error:se}=await sb.from("vault_seller_profiles").insert({member_id:mb.id}).select().single();if(se)throw se;sl=ns;}
  const{data:li,error}=await sb.from("vault_marketplace_listings").insert({seller_id:sl.id,vault_item_id:b.vault_item_id||null,title:b.title,description:b.description||null,brand:b.brand||null,model:b.model||null,colorway:b.colorway||null,size:b.size||null,condition:b.condition||"usado_bom",photos:b.photos||[],price:b.price,original_purchase_price:b.original_purchase_price||null,shipping_mode:b.price>=2000?"bravenza":(b.shipping_mode||"direct"),shipping_cost_estimate:b.shipping_cost_estimate||0,is_vault_certified:!!b.vault_item_id,status:"active",published_at:new Date().toISOString()}).select().single();if(error)throw error;
  await sb.from("marketplace_activity_feed").insert({event_type:"new_listing",title:`Novo anúncio: ${b.title}`,description:`${b.brand||""} ${b.model||""} — R$ ${b.price}`,listing_id:li.id,seller_id:sl.id}).then(()=>{});
  return j({success:true,listing:li});
}
if(mt==="PUT"&&a==="update-listing"){const b=await req.json();const mb=await gm(sb,cpf);if(!mb)throw new Error("Membro não encontrado");const sl=await gs(sb,mb.id);if(!sl)throw new Error("Vendedor não encontrado");const{error}=await sb.from("vault_marketplace_listings").update({title:b.title,description:b.description,price:b.price,condition:b.condition,shipping_mode:b.price>=2000?"bravenza":b.shipping_mode,shipping_cost_estimate:b.shipping_cost_estimate,photos:b.photos,status:b.status}).eq("id",b.id).eq("seller_id",sl.id);if(error)throw error;return j({success:true});}
if(mt==="DELETE"&&a==="delete-listing"){const id=url.searchParams.get("id");if(!id)throw new Error("ID obrigatório");const mb=await gm(sb,cpf);if(!mb)throw new Error("Membro não encontrado");const sl=await gs(sb,mb.id);if(!sl)throw new Error("Vendedor não encontrado");await sb.from("vault_marketplace_listings").delete().eq("id",id).eq("seller_id",sl.id);return j({success:true});}
if(mt==="POST"&&a==="toggle-favorite"){const{listing_id}=await req.json();const{data:ex}=await sb.from("vault_marketplace_favorites").select("id").eq("listing_id",listing_id).eq("user_cpf",cpf).maybeSingle();if(ex){await sb.from("vault_marketplace_favorites").delete().eq("id",ex.id);return j({favorited:false});}await sb.from("vault_marketplace_favorites").insert({listing_id,user_cpf:cpf});return j({favorited:true});}
if(mt==="GET"&&a==="seller-profile"){const mb=await gm(sb,cpf);if(!mb)return j({seller:null});return j({seller:await gs(sb,mb.id)});}
if(mt==="GET"&&a==="seller-public-profile"){
  const sid=url.searchParams.get("seller_id");if(!sid)throw new Error("seller_id obrigatório");
  const{data:sl}=await sb.from("vault_seller_profiles").select(`id,bio,avatar_url,storefront_banner,storefront_tagline,total_sales_count,total_sales_value,average_rating,ratings_count,current_fee_percent,plan_id,verified_badge,followers_count,member:vault_members!inner(client_name,tier,created_at)`).eq("id",sid).single();if(!sl)throw new Error("Vendedor não encontrado");
  const{data:ls}=await sb.from("vault_marketplace_listings").select("*").eq("seller_id",sid).eq("status","active").order("published_at",{ascending:false});
  const{data:rv}=await sb.from("vault_marketplace_orders").select("buyer_name,buyer_rating,buyer_review,created_at").eq("seller_id",sid).not("buyer_rating","is",null).order("created_at",{ascending:false}).limit(10);
  const{data:cols}=await sb.from("seller_collections").select("*").eq("seller_id",sid).eq("is_active",true).order("sort_order",{ascending:true});
  return j({...sl,listings:ls||[],recent_reviews:rv||[],collections:cols||[]});
}
return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mk-hub error:",e);return j({error:e.message},500);}
});
