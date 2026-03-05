import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const nt=async(sb:any,t:string,m:string,cpf:string,rid?:string,rt?:string)=>{try{await sb.from("notifications").insert({title:t,message:m,target:"client",target_client_cpf:cpf,type:"info",reference_id:rid||null,reference_type:rt||"marketplace"});}catch(_){}};
const ge=async(sb:any,cpf:string)=>{const{data}=await sb.from("vault_members").select("client_name,client_email,client_phone").eq("client_cpf",cpf).maybeSingle();if(!data?.client_email)return null;return{name:data.client_name,email:data.client_email,phone:data.client_phone||undefined};};
const em=(type:string,data:Record<string,any>)=>{try{const u=Deno.env.get("SUPABASE_URL"),k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(u&&k)fetch(`${u}/functions/v1/send-marketplace-email`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${k}`},body:JSON.stringify({type,...data})}).catch(()=>{});}catch(_){}};
const wa=(type:string,data:Record<string,any>)=>{try{const u=Deno.env.get("SUPABASE_URL"),k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(u&&k)fetch(`${u}/functions/v1/send-whatsapp`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${k}`},body:JSON.stringify({message_type:type,...data})}).catch(()=>{});}catch(_){}};
const gc=()=>{const c="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let r="MKT-";for(let i=0;i<6;i++)r+=c.charAt(Math.floor(Math.random()*c.length));return r;};
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(cpf==="visitor")return j({error:"Auth required"},401);
try{
if(mt==="POST"&&a==="create-order"){
  const b=await req.json();let li:any=null;
  // Atomic reserve for vault_marketplace_listings
  const{data:dl}=await sb.from("vault_marketplace_listings").update({status:"reserved"}).eq("id",b.listing_id).eq("status","active").select(`*,seller:vault_seller_profiles!inner(id,current_fee_percent,member:vault_members!inner(client_cpf,client_name))`).maybeSingle();
  if(dl)li=dl;else{
    // Atomic reserve for marketplace_offers
    const{data:of2}=await sb.from("marketplace_offers").update({status:"reserved"}).eq("id",b.listing_id).eq("status","active").select(`*,seller:vault_seller_profiles!inner(id,current_fee_percent,member:vault_members!inner(client_cpf,client_name))`).maybeSingle();
    if(of2){if(of2.listing_id){const{data:lk}=await sb.from("vault_marketplace_listings").select(`*,seller:vault_seller_profiles!inner(id,current_fee_percent,member:vault_members!inner(client_cpf,client_name))`).eq("id",of2.listing_id).maybeSingle();if(lk)li=lk;}if(!li){const nm=of2.shipping_mode==="seller_ships"?"direct":of2.shipping_mode==="hub"?"bravenza":of2.shipping_mode||"direct";li={id:of2.id,title:of2.description||"Sneaker",price:of2.price,shipping_mode:nm,shipping_cost_estimate:of2.shipping_cost_estimate||0,seller:of2.seller,_is_offer:true};}}}
  if(!li)throw new Error("Anúncio não encontrado ou já vendido");if(li.seller?.member?.client_cpf===cpf)throw new Error("Não pode comprar próprio anúncio");
  const fp=li.seller?.current_fee_percent||14,fa=Math.round(li.price*fp/100*100)/100,sp=Math.round((li.price-fa)*100)/100;
  const oc=gc(),sc2=b.shipping_cost||li.shipping_cost_estimate||0,ra=li.price>=2000||b.requires_authentication===true,af=ra&&li.price<2000?(b.authentication_fee||49.90):0;
  const{data:od,error}=await sb.from("vault_marketplace_orders").insert({order_code:oc,listing_id:li._is_offer?null:li.id,buyer_cpf:cpf,buyer_name:b.buyer_name,seller_id:li.seller.id,sale_price:li.price,fee_percent:fp,fee_amount:fa,seller_payout:sp,shipping_mode:ra?"bravenza":(li.shipping_mode||"direct"),shipping_cost:sc2,status:"pending_payment",requires_authentication:ra,authentication_requested:b.requires_authentication||false,authentication_fee:af}).select().single();if(error){
    // Rollback reservation on insert failure
    if(!li._is_offer)await sb.from("vault_marketplace_listings").update({status:"active"}).eq("id",li.id);
    else await sb.from("marketplace_offers").update({status:"active"}).eq("id",b.listing_id);
    throw error;}
  const tn=li.title||"Sneaker";await nt(sb,"🛒 Nova venda!",`${b.buyer_name} comprou "${tn}".`,li.seller.member.client_cpf,od.id,"marketplace_order");
  await sb.from("marketplace_activity_feed").insert({event_type:"sale",title:`Venda: ${tn}`,description:`R$ ${li.price}`,listing_id:li._is_offer?null:li.id,seller_id:li.seller.id}).then(()=>{});
  const bi=await ge(sb,cpf);if(bi){em("mk_purchase_confirmed",{recipient_name:bi.name,recipient_email:bi.email,order_code:oc,product_name:tn,price:li.price,size:li.size||b.size,condition:li.condition,shipping_mode:li.shipping_mode||"direct"});if(bi.phone)wa("mk_purchase_confirmed",{recipient_phone:bi.phone,recipient_name:bi.name,order_code:oc,product_name:tn,price:li.price});}
  const si=await ge(sb,li.seller.member.client_cpf);if(si){em("mk_new_sale",{recipient_name:si.name,recipient_email:si.email,order_code:oc,product_name:tn,price:li.price,size:li.size||b.size,buyer_name:b.buyer_name,shipping_mode:li.shipping_mode||"direct"});if(si.phone)wa("mk_new_sale",{recipient_phone:si.phone,recipient_name:si.name,order_code:oc,product_name:tn,price:li.price,buyer_name:b.buyer_name,shipping_mode:li.shipping_mode||"direct"});}
  const{buyer_cpf:_bc,buyer_email:_be,buyer_phone:_bp,buyer_address:_ba,admin_notes:_an,...safeOrder}=od;return j({success:true,order:safeOrder});
}
if(mt==="PUT"&&a==="confirm-payment"){const b=await req.json();const pe=new Date();let bd=0;while(bd<8){pe.setDate(pe.getDate()+1);const dow=pe.getDay();if(dow!==0&&dow!==6)bd++;}const cw=new Date();cw.setMinutes(cw.getMinutes()+30);const{error}=await sb.from("vault_marketplace_orders").update({status:"paid",payment_method:b.payment_method,paid_at:new Date().toISOString(),protection_ends_at:pe.toISOString(),cancellation_window_ends_at:cw.toISOString()}).eq("id",b.order_id).eq("buyer_cpf",cpf);if(error)throw error;
  const{data:od2}=await sb.from("vault_marketplace_orders").select(`order_code,shipping_mode,seller_id,listing:vault_marketplace_listings(title)`).eq("id",b.order_id).single();
  if(od2?.shipping_mode==="bravenza"){const{data:sl2}=await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf,client_name)").eq("id",od2.seller_id).single();if(sl2?.member?.client_cpf){await nt(sb,"📦 Envie ao Hub Bravenza",`Pedido ${od2.order_code}: envie "${od2.listing?.title||"item"}" para o Hub PRO em Porto Alegre/RS. Acesse "Minha Loja" → "Vendas" para informar o rastreio.`,sl2.member.client_cpf,b.order_id,"marketplace_order");const se2=await ge(sb,sl2.member.client_cpf);if(se2){em("mk_hub_ship_instructions",{recipient_name:se2.name,recipient_email:se2.email,order_code:od2.order_code,product_name:od2.listing?.title||"Sneaker"});if(se2.phone)wa("mk_hub_ship_instructions",{recipient_phone:se2.phone,recipient_name:se2.name,order_code:od2.order_code,product_name:od2.listing?.title||"Sneaker"});}}}
  return j({success:true});}
if(mt==="GET"&&a==="my-orders"){const{data,error}=await sb.from("vault_marketplace_orders").select(`id,order_code,listing_id,sale_price,fee_percent,fee_amount,seller_payout,shipping_mode,shipping_cost,tracking_code,status,payment_method,payment_id,paid_at,shipped_at,delivered_at,cancelled_at,cancellation_reason,buyer_rating,buyer_review,buyer_rated_at,created_at,updated_at,protection_ends_at,payout_released_at,dispute_status,dispute_reason,dispute_opened_at,dispute_resolved_at,dispute_resolution,dispute_refund_amount,contest_window_ends_at,inspection_id,hub_tracking_code,hub_received_at,hub_shipped_at,hub_tracking_to_buyer,inspection_result,refund_amount,refund_at,requires_authentication,authentication_requested,authentication_fee,cancellation_window_ends_at,buyer_name,seller_id,listing:vault_marketplace_listings(title,brand,model,size,photos,condition,is_vault_certified)`).eq("buyer_cpf",cpf).order("created_at",{ascending:false});if(error)throw error;return j({orders:data||[]});}
if(mt==="GET"&&a==="my-sales"){const{data:mb}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();if(!mb)return j({orders:[]});const{data:sl}=await sb.from("vault_seller_profiles").select("id").eq("member_id",mb.id).maybeSingle();if(!sl)return j({orders:[]});const{data,error}=await sb.from("vault_marketplace_orders").select(`id,order_code,listing_id,buyer_name,sale_price,fee_percent,fee_amount,seller_payout,shipping_mode,shipping_cost,tracking_code,status,payment_method,paid_at,shipped_at,delivered_at,cancelled_at,cancellation_reason,buyer_rating,buyer_review,buyer_rated_at,created_at,updated_at,protection_ends_at,payout_released_at,payout_status,payout_amount,payout_method,dispute_status,dispute_reason,dispute_opened_at,dispute_resolved_at,dispute_resolution,contest_window_ends_at,inspection_id,hub_tracking_code,hub_received_at,hub_shipped_at,hub_tracking_to_buyer,inspection_result,requires_authentication,authentication_requested,authentication_fee,seller_id,listing:vault_marketplace_listings(title,brand,model,size,photos,condition)`).eq("seller_id",sl.id).order("created_at",{ascending:false});if(error)throw error;return j({orders:data||[]});}
if(mt==="POST"&&a==="rate-seller"){const b=await req.json();await sb.from("vault_marketplace_orders").update({buyer_rating:b.rating,buyer_review:b.review||null}).eq("id",b.order_id).eq("buyer_cpf",cpf);const{data:od}=await sb.from("vault_marketplace_orders").select("seller_id").eq("id",b.order_id).single();if(od){const{data:ar}=await sb.from("vault_marketplace_orders").select("buyer_rating").eq("seller_id",od.seller_id).not("buyer_rating","is",null);if(ar&&ar.length>0){const avg=ar.reduce((s:number,r:any)=>s+r.buyer_rating,0)/ar.length;await sb.from("vault_seller_profiles").update({average_rating:Math.round(avg*10)/10,ratings_count:ar.length}).eq("id",od.seller_id);}}return j({success:true});}
if(mt==="GET"&&a==="wallet-balance"){const{data:wb}=await sb.from("wallet_balances").select("*").eq("user_cpf",cpf).maybeSingle();const{data:txs}=await sb.from("wallet_transactions").select("*").eq("user_cpf",cpf).order("created_at",{ascending:false}).limit(50);return j({balance:wb?.balance||0,last_transaction_at:wb?.last_transaction_at||null,transactions:txs||[]});}
if(mt==="GET"&&a==="wallet-transactions"){const{data}=await sb.from("wallet_transactions").select("*").eq("user_cpf",cpf).order("created_at",{ascending:false}).limit(50);return j({transactions:data||[]});}
if(mt==="GET"&&a==="order-detail"){
  const oid=url.searchParams.get("order_id");if(!oid)throw new Error("order_id obrigatório");
  // Fetch order — buyer OR seller can view
  const{data:od,error:oe}=await sb.from("vault_marketplace_orders").select(`*,listing:vault_marketplace_listings(title,brand,model,size,photos,condition,colorway,is_vault_certified)`).eq("id",oid).single();
  if(oe||!od)return j({ok:false,error:"Pedido não encontrado"},404);
  // RBAC: verify caller is buyer or seller
  let isBuyer=od.buyer_cpf===cpf;let isSeller=false;
  if(!isBuyer){const{data:mb2}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();if(mb2){const{data:sp2}=await sb.from("vault_seller_profiles").select("id").eq("member_id",mb2.id).maybeSingle();if(sp2&&sp2.id===od.seller_id)isSeller=true;}}
  if(!isBuyer&&!isSeller)return j({ok:false,error:"Acesso negado"},403);
  // Timeline
  const{data:timeline}=await sb.from("vault_marketplace_order_events").select("id,event_type,description,metadata,created_at").eq("order_id",oid).order("created_at",{ascending:true});
  // Documents
  const{data:docs}=await sb.from("client_documents").select("id,document_name,document_type,file_url,generated_at").eq("order_id",od.order_code);
  // Allowed actions
  const actions:string[]=[];const st=od.status;
  if(isBuyer){if(st==="pending_payment")actions.push("pay");if(st==="delivered"&&!od.buyer_rating)actions.push("rate");if(st==="paid"&&od.cancellation_window_ends_at&&new Date(od.cancellation_window_ends_at)>new Date())actions.push("cancel");if(!od.dispute_status&&["paid","shipped","delivered"].includes(st))actions.push("open_dispute");}
  if(isSeller){if(st==="paid")actions.push("ship");if(st==="shipped"&&od.shipping_mode==="bravenza")actions.push("track_hub");}
  // Mask sensitive data
  const{buyer_cpf:_bc,buyer_email:_be,buyer_phone:_bp,buyer_address:_ba,admin_notes:_an,...safeOrder}=od;
  return j({ok:true,data:{order:safeOrder,timeline:timeline||[],documents:docs||[],allowed_actions:actions,role:isBuyer?"buyer":"seller"}});
}
if(mt==="PUT"&&a==="confirm-delivery"){
  const b=await req.json();const oid=b.order_id;if(!oid)throw new Error("order_id obrigatório");
  const{data:od,error:oe}=await sb.from("vault_marketplace_orders").select("id,status,buyer_cpf").eq("id",oid).eq("buyer_cpf",cpf).single();
  if(oe||!od)return j({ok:false,error:"Pedido não encontrado"},404);
  if(od.status!=="delivered")return j({ok:false,error:"Pedido não está no status 'entregue'"},400);
  await sb.from("vault_marketplace_orders").update({status:"completed",completed_at:new Date().toISOString(),confirmed_at:new Date().toISOString()}).eq("id",oid);
  await sb.from("vault_marketplace_order_events").insert({order_id:oid,event_type:"delivery_confirmed",description:"Comprador confirmou o recebimento do produto"});
  return j({ok:true,success:true});
}
return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mkv2-orders error:",e);return j({error:e.message},500);}
});