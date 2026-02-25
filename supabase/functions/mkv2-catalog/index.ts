import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const gm=async(sb:any,cpf:string)=>{const{data}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();return data;};
const gs=async(sb:any,mid:string)=>{const{data}=await sb.from("vault_seller_profiles").select("*").eq("member_id",mid).maybeSingle();return data;};
const PUB=new Set(["catalog-products","catalog-product","catalog-offers","catalog-search"]);
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(!PUB.has(a||"")&&cpf==="visitor")return j({error:"Auth required"},401);
try{
if(mt==="GET"&&a==="catalog-products"){
  const lm=+(url.searchParams.get("limit")||"20");const cursor=url.searchParams.get("cursor");const sr=url.searchParams.get("search"),br=url.searchParams.get("brand"),cat=url.searchParams.get("category");
  let q=sb.from("marketplace_products").select("*",{count:"exact"}).eq("is_active",true);
  if(sr)q=q.or(`brand.ilike.%${sr}%,model.ilike.%${sr}%,colorway.ilike.%${sr}%,sku.ilike.%${sr}%`);if(br)q=q.ilike("brand",`%${br}%`);if(cat)q=q.eq("category",cat);
  if(cursor)q=q.lt("created_at",cursor);
  q=q.order("created_at",{ascending:false}).limit(lm+1);
  const{data,count,error}=await q;if(error)throw error;
  const items=data||[];const hasMore=items.length>lm;const page=hasMore?items.slice(0,lm):items;
  const nextCursor=hasMore?page[page.length-1].created_at:null;
  return j({products:page,total:count||0,next_cursor:nextCursor,has_more:hasMore});
}
if(mt==="GET"&&a==="catalog-product"){
  const id=url.searchParams.get("id"),slug=url.searchParams.get("slug");let q=sb.from("marketplace_products").select("*");
  if(slug)q=q.eq("slug",slug);else if(id)q=q.eq("id",id);else throw new Error("id ou slug obrigatório");
  const{data,error}=await q.single();if(error)throw error;
  const{data:od}=await sb.from("marketplace_offers").select(`*,seller:vault_seller_profiles!inner(id,plan_id,verified_badge,average_rating,total_sales_count,current_fee_percent,member:vault_members!inner(client_name,tier))`).eq("product_id",data.id).eq("status","active").order("price",{ascending:true});
  const offers=od||[];const sizes=[...new Set(offers.map((o:any)=>o.size))].sort();return j({product:data,offers,sizes});
}
if(mt==="GET"&&a==="catalog-offers"){
  const pid=url.searchParams.get("product_id");if(!pid)throw new Error("product_id obrigatório");const sz=url.searchParams.get("size"),cn=url.searchParams.get("condition");
  let q=sb.from("marketplace_offers").select(`*,seller:vault_seller_profiles!inner(id,plan_id,verified_badge,average_rating,total_sales_count,current_fee_percent,member:vault_members!inner(client_name,tier))`).eq("product_id",pid).eq("status","active");
  if(sz)q=q.eq("size",sz);if(cn)q=q.eq("condition",cn);q=q.order("price",{ascending:true});const{data,error}=await q;if(error)throw error;
  const sizes=[...new Set((data||[]).map((o:any)=>o.size))].sort();return j({offers:data||[],available_sizes:sizes});
}
if(mt==="GET"&&a==="catalog-search"){const sr=url.searchParams.get("q")||"";if(!sr||sr.length<2)return j({products:[]});const{data,error}=await sb.from("marketplace_products").select("id,brand,model,colorway,images,lowest_price,total_offers,slug").eq("is_active",true).or(`brand.ilike.%${sr}%,model.ilike.%${sr}%,colorway.ilike.%${sr}%,sku.ilike.%${sr}%`).order("total_offers",{ascending:false}).limit(10);if(error)throw error;return j({products:data||[]});}
if(mt==="POST"&&a==="catalog-create-product"){
  const b=await req.json();if(!b.brand||!b.model)throw new Error("brand e model obrigatórios");
  const{data:ex}=await sb.from("marketplace_products").select("id,brand,model,slug").ilike("brand",b.brand).ilike("model",b.model).maybeSingle();if(ex)return j({product:ex,already_exists:true});
  const desc=b.description||`${b.brand} ${b.model}${b.colorway?` - ${b.colorway}`:""}`;const mb=await gm(sb,cpf);
  const{data:prod,error}=await sb.from("marketplace_products").insert({brand:b.brand,model:b.model,colorway:b.colorway||null,sku:b.sku||null,category:b.category||"sneakers",images:b.images||[],description:desc,created_by_seller_id:mb?.id||null}).select().single();if(error)throw error;return j({product:prod,already_exists:false});
}
if(mt==="POST"&&a==="catalog-create-offer"){
  const b=await req.json();if(!b.product_id||!b.size||!b.price)throw new Error("product_id, size e price obrigatórios");
  const mb=await gm(sb,cpf);if(!mb)throw new Error("Membro não encontrado");let sl=await gs(sb,mb.id);if(!sl){const{data:ns,error:se}=await sb.from("vault_seller_profiles").insert({member_id:mb.id}).select().single();if(se)throw se;sl=ns;}
  const{data:li}=await sb.from("vault_marketplace_listings").insert({seller_id:sl.id,vault_item_id:b.vault_item_id||null,title:`${b.brand||""} ${b.model||""} ${b.size||""}`.trim(),description:b.description||null,brand:b.brand||null,model:b.model||null,size:b.size,condition:b.condition||"novo",photos:b.photos||[],price:b.price,original_purchase_price:b.original_purchase_price||null,shipping_mode:b.price>=2000?"bravenza":(b.shipping_mode||"direct"),shipping_cost_estimate:0,is_vault_certified:!!b.vault_item_id,status:"active",published_at:new Date().toISOString(),product_id:b.product_id}).select().single();
  const sm=b.shipping_mode==="hub"?"bravenza":b.shipping_mode==="seller_ships"?"direct":b.shipping_mode||"direct";
  const{data:offer,error}=await sb.from("marketplace_offers").insert({product_id:b.product_id,seller_id:sl.id,listing_id:li?.id||null,size:b.size,condition:b.condition||"novo",price:b.price,original_purchase_price:b.original_purchase_price||null,description:b.description||null,defects:b.defects||null,photos:b.photos||[],proof_photos:b.proof_photos||[],has_receipt:b.has_receipt||false,shipping_mode:b.price>=2000?"bravenza":sm,status:"active",published_at:new Date().toISOString()}).select().single();if(error)throw error;return j({offer,listing:li});
}
if(mt==="GET"&&a==="watchlist-check"){const pid=url.searchParams.get("product_id"),sz=url.searchParams.get("size")||"";if(!pid)throw new Error("product_id obrigatório");const{data}=await sb.from("marketplace_watchlist").select("id,max_price,is_active").eq("product_id",pid).eq("size",sz).eq("user_cpf",cpf).eq("is_active",true).maybeSingle();return j({active:!!data,max_price:data?.max_price||null});}
if(mt==="POST"&&a==="watchlist-toggle"){const b=await req.json();const{product_id,size,max_price}=b;if(!product_id)throw new Error("product_id obrigatório");const sz=size||"";const{data:ex}=await sb.from("marketplace_watchlist").select("id,is_active").eq("product_id",product_id).eq("size",sz).eq("user_cpf",cpf).maybeSingle();if(ex){if(ex.is_active){await sb.from("marketplace_watchlist").update({is_active:false}).eq("id",ex.id);return j({active:false,max_price:null});}else{await sb.from("marketplace_watchlist").update({is_active:true,max_price:max_price||null}).eq("id",ex.id);return j({active:true,max_price:max_price||null});}}await sb.from("marketplace_watchlist").insert({product_id,size:sz,user_cpf:cpf,max_price:max_price||null,is_active:true,notify_email:true,notify_push:true});return j({active:true,max_price:max_price||null});}
return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mkv2-catalog error:",e);return j({error:e.message},500);}
});