import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const nt=async(sb:any,t:string,m:string,cpf:string,rid?:string,rt?:string)=>{try{await sb.from("notifications").insert({title:t,message:m,target:"client",target_client_cpf:cpf,type:"info",reference_id:rid||null,reference_type:rt||"marketplace"});}catch(_){}};
const ge=async(sb:any,cpf:string)=>{const{data}=await sb.from("vault_members").select("client_name,client_email,client_phone").eq("client_cpf",cpf).maybeSingle();if(!data?.client_email)return null;return{name:data.client_name,email:data.client_email,phone:data.client_phone||undefined};};
const em=(type:string,data:Record<string,any>)=>{try{const u=Deno.env.get("SUPABASE_URL"),k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(u&&k)fetch(`${u}/functions/v1/send-marketplace-email`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${k}`},body:JSON.stringify({type,...data})}).catch(()=>{});}catch(_){}};
const wa=(type:string,data:Record<string,any>)=>{try{const u=Deno.env.get("SUPABASE_URL"),k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(u&&k)fetch(`${u}/functions/v1/send-whatsapp`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${k}`},body:JSON.stringify({message_type:type,...data})}).catch(()=>{});}catch(_){}};
const refundMP=async(mpPaymentId:string,orderId:string)=>{const tk=Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");if(!tk){console.error(`[mkv2-order-ops] MERCADO_PAGO_ACCESS_TOKEN not set. Cannot refund order ${orderId}.`);return;}try{const r=await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`,{method:"POST",headers:{"Authorization":`Bearer ${tk}`,"X-Idempotency-Key":`refund-${orderId}`,"Content-Type":"application/json"},body:JSON.stringify({})});if(!r.ok){const t=await r.text();console.error(`[mkv2-order-ops] MP refund failed order=${orderId} payment=${mpPaymentId}: ${r.status} ${t}`);}else{console.log(`[mkv2-order-ops] MP refund initiated order=${orderId} payment=${mpPaymentId}`);}}catch(e){console.error(`[mkv2-order-ops] MP refund exception order=${orderId}:`,e);}};
const requireAdmin=async(sb:any,authHeader:string):Promise<void>=>{const{data:u}=await sb.auth.getUser(authHeader.replace("Bearer ",""));if(!u?.user)throw new Error("Acesso restrito a administradores");const{data:ap}=await sb.from("admin_profiles").select("id").eq("user_id",u.user.id).maybeSingle();if(!ap)throw new Error("Acesso restrito a administradores");};
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(cpf==="visitor")return j({error:"Auth required"},401);
try{
if(mt==="PUT"&&a==="update-order-status"){
  const b=await req.json();
  // ── RBAC: check if caller is admin or the order's seller ──
  const{data:adminCheck}=await sb.from("admin_profiles").select("id").eq("user_id",(await sb.auth.getUser(ah!.replace("Bearer ",""))).data.user?.id||"").maybeSingle();
  const isAdmin=!!adminCheck;
  const sellerAllowedStatuses=["shipped","in_transit_to_hub"];
  if(!isAdmin){
    // Verify caller is the seller of this order
    const{data:od2}=await sb.from("vault_marketplace_orders").select("seller_id").eq("id",b.order_id).single();
    if(!od2)return j({error:"Pedido não encontrado"},404);
    const{data:sp2}=await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id",od2.seller_id).single();
    if(!sp2||sp2.member?.client_cpf!==cpf)return j({error:"Acesso negado"},403);
    if(!sellerAllowedStatuses.includes(b.status))return j({error:`Vendedor não pode definir status "${b.status}"`},403);
  }
  const u:any={status:b.status};
  if(b.status==="shipped"){u.shipped_at=new Date().toISOString();u.tracking_code=b.tracking_code||null;}
  else if(b.status==="delivered")u.delivered_at=new Date().toISOString();
  else if(b.status==="cancelled"){u.cancelled_at=new Date().toISOString();if(b.listing_id)await sb.from("vault_marketplace_listings").update({status:"active"}).eq("id",b.listing_id);const{data:rfd}=await sb.from("vault_marketplace_orders").select("mp_payment_id,status").eq("id",b.order_id).single();if(rfd?.mp_payment_id&&["paid","in_transit_to_hub","shipped"].includes(rfd.status))await refundMP(rfd.mp_payment_id,b.order_id);}
   else if(b.status==="payout_released"){
    await requireAdmin(sb,ah!);
    u.payout_released_at=new Date().toISOString();u.payout_method=b.payout_method||"pix";u.payout_proof_url=b.payout_proof_url||null;
    const{data:od}=await sb.from("vault_marketplace_orders").select("listing_id,sale_price,seller_id").eq("id",b.order_id).single();
    if(od?.listing_id){const{data:li}=await sb.from("vault_marketplace_listings").select("product_id").eq("id",od.listing_id).maybeSingle();if(li?.product_id){await sb.from("marketplace_offers").update({status:"sold",sold_at:new Date().toISOString()}).eq("listing_id",od.listing_id).eq("status","active");const{data:ao}=await sb.from("marketplace_offers").select("price").eq("product_id",li.product_id).eq("status","active");const prices=(ao||[]).map((o:any)=>o.price);await sb.from("marketplace_products").update({lowest_price:prices.length>0?Math.min(...prices):null,total_offers:prices.length}).eq("id",li.product_id);}}
    if(od?.seller_id){const{data:sl}=await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id",od.seller_id).single();if(sl?.member?.client_cpf){const{data:oi}=await sb.from("vault_marketplace_orders").select("order_code,seller_payout").eq("id",b.order_id).single();await nt(sb,"💸 Repasse realizado!",`Pedido ${oi?.order_code} — R$ ${oi?.seller_payout?.toFixed(2)} transferido.`,sl.member.client_cpf,b.order_id,"marketplace_payout");const se=await ge(sb,sl.member.client_cpf);if(se){em("mk_payout_released",{recipient_name:se.name,recipient_email:se.email,order_code:oi?.order_code,payout_amount:oi?.seller_payout,payout_method:b.payout_method||"pix"});if(se.phone)wa("mk_payout_released",{recipient_phone:se.phone,recipient_name:se.name,order_code:oi?.order_code,payout_amount:oi?.seller_payout});}}}
  }else if(b.status==="in_transit_to_hub")u.hub_tracking_code=b.hub_tracking_code||null;
  if(b.admin_notes)u.admin_notes=b.admin_notes;
  const{error}=await sb.from("vault_marketplace_orders").update(u).eq("id",b.order_id);if(error)throw error;
  if(["shipped","delivered","cancelled"].includes(b.status)){
    const{data:od}=await sb.from("vault_marketplace_orders").select(`order_code,buyer_cpf,buyer_name,seller_id,shipping_mode,tracking_code,sale_price,listing:vault_marketplace_listings(title,size,condition)`).eq("id",b.order_id).single();
    if(od){const pn=od.listing?.title||"Sneaker";const{data:si}=await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf)").eq("id",od.seller_id).single();const sc2=si?.member?.client_cpf;
      if(b.status==="cancelled"){const be=await ge(sb,od.buyer_cpf);if(be){em("mk_order_cancelled",{recipient_name:be.name,recipient_email:be.email,order_code:od.order_code,product_name:pn,cancel_reason:b.admin_notes||"Cancelado"});if(be.phone)wa("mk_order_cancelled",{recipient_phone:be.phone,recipient_name:be.name,order_code:od.order_code,product_name:pn,cancel_reason:b.admin_notes||"Cancelado"});}if(sc2){const se=await ge(sb,sc2);if(se)em("mk_order_cancelled",{recipient_name:se.name,recipient_email:se.email,order_code:od.order_code,product_name:pn,cancel_reason:b.admin_notes||"Cancelado"});}}
      else if(b.status==="shipped"){const be=await ge(sb,od.buyer_cpf);if(be){em("mk_seller_shipped",{recipient_name:be.name,recipient_email:be.email,order_code:od.order_code,product_name:pn,tracking_code:od.tracking_code||b.tracking_code,shipping_mode:od.shipping_mode});if(be.phone)wa("mk_seller_shipped",{recipient_phone:be.phone,recipient_name:be.name,order_code:od.order_code,product_name:pn,tracking_code:od.tracking_code||b.tracking_code,shipping_mode:od.shipping_mode});}}
      else if(b.status==="delivered"){const be=await ge(sb,od.buyer_cpf);if(be){em("mk_delivery_confirmed",{recipient_name:be.name,recipient_email:be.email,order_code:od.order_code,product_name:pn});if(be.phone)wa("mk_delivery_confirmed",{recipient_phone:be.phone,recipient_name:be.name,order_code:od.order_code,product_name:pn});}}
    }}
  return j({success:true});
}
if(mt==="GET"&&a==="admin-orders"){await requireAdmin(sb,ah!);const st=url.searchParams.get("status");const search=url.searchParams.get("search");const dateFrom=url.searchParams.get("date_from");const dateTo=url.searchParams.get("date_to");const pg=Math.max(1,parseInt(url.searchParams.get("page")||"1"));const ps=Math.min(100,Math.max(1,parseInt(url.searchParams.get("pageSize")||"20")));const fr=(pg-1)*ps;const to=fr+ps-1;let q=sb.from("vault_marketplace_orders").select(`*,listing:vault_marketplace_listings(title,brand,model,size,photos,condition)`,{count:"exact"}).order("created_at",{ascending:false});if(st&&st!=="all")q=q.eq("status",st);if(search){q=q.or(`order_code.ilike.%${search}%,buyer_name.ilike.%${search}%`);}if(dateFrom)q=q.gte("created_at",dateFrom);if(dateTo)q=q.lte("created_at",dateTo);q=q.range(fr,to);const{data,error,count}=await q;if(error)throw error;return j({orders:data||[],total:count||0,page:pg,pageSize:ps});}
if(mt==="GET"&&a==="admin-disputes"){await requireAdmin(sb,ah!);const pg=Math.max(1,parseInt(url.searchParams.get("page")||"1"));const ps=Math.min(100,Math.max(1,parseInt(url.searchParams.get("pageSize")||"50")));const fr=(pg-1)*ps;const to=fr+ps-1;const{data,error,count}=await sb.from("vault_marketplace_orders").select(`*,listing:vault_marketplace_listings(title,brand,model,size,photos,condition)`,{count:"exact"}).not("dispute_status","is",null).order("dispute_opened_at",{ascending:false}).range(fr,to);if(error)throw error;return j({disputes:data||[],total:count||0,page:pg,pageSize:ps});}
if(mt==="PUT"&&a==="cancel-buyer-order"){
  const b=await req.json();const{data:od,error:fe}=await sb.from("vault_marketplace_orders").select("id,status,cancellation_window_ends_at,listing_id,order_code,seller_id,sale_price,mp_payment_id").eq("id",b.order_id).eq("buyer_cpf",cpf).single();
  if(fe||!od)throw new Error("Pedido não encontrado");if(od.status!=="paid")throw new Error("Cancelamento só para pedidos pagos");
  if(!od.cancellation_window_ends_at||new Date(od.cancellation_window_ends_at)<new Date())throw new Error("Janela de cancelamento expirada");
  await sb.from("vault_marketplace_orders").update({status:"cancelled",cancelled_at:new Date().toISOString(),cancellation_reason:b.reason||"Cancelado pelo comprador"}).eq("id",od.id);
  if(od.mp_payment_id)await refundMP(od.mp_payment_id,od.id);
  if(od.listing_id)await sb.from("vault_marketplace_listings").update({status:"active"}).eq("id",od.listing_id);
  const{data:si}=await sb.from("vault_seller_profiles").select("member:vault_members!inner(client_cpf,client_name)").eq("id",od.seller_id).single();
  if(si?.member?.client_cpf){await nt(sb,"❌ Compra cancelada",`Pedido ${od.order_code} cancelado pelo comprador.`,si.member.client_cpf,od.id,"marketplace_order");const se=await ge(sb,si.member.client_cpf);if(se)em("mk_order_cancelled",{recipient_name:se.name,recipient_email:se.email,order_code:od.order_code,product_name:`Pedido ${od.order_code}`,cancel_reason:b.reason||"Cancelado pelo comprador"});}
  return j({success:true});
}
return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mkv2-order-ops error:",e);return j({error:e.message},500);}
});