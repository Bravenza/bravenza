import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const gm=async(sb:any,cpf:string)=>{const{data}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();return data;};
const gs=async(sb:any,mid:string)=>{const{data}=await sb.from("vault_seller_profiles").select("*").eq("member_id",mid).maybeSingle();return data;};
const PUB=new Set(["seller-tier-info","seller-leaderboard"]);
Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(!PUB.has(a||"")&&cpf==="visitor")return j({error:"Auth required"},401);
try{
if(mt==="GET"&&a==="seller-onboarding-status"){const mb=await gm(sb,cpf);if(!mb)return j({onboarded:false,seller:null});const sl=await gs(sb,mb.id);if(!sl)return j({onboarded:false,seller:null});return j({onboarded:!!sl.onboarding_completed_at,seller:{id:sl.id,full_name:sl.full_name,cpf_cnpj:sl.cpf_cnpj?`***${sl.cpf_cnpj.slice(-4)}`:null,phone:sl.phone?`***${sl.phone.slice(-4)}`:null,pix_key_type:sl.pix_key_type,pix_key:sl.pix_key?`${sl.pix_key.slice(0,3)}***`:null,pix_beneficiary:sl.pix_beneficiary,bank_name:sl.bank_name,account_type:sl.account_type||"pf",kyc_status:sl.kyc_status,terms_accepted_at:sl.terms_accepted_at,onboarding_completed_at:sl.onboarding_completed_at}});}
if(mt==="POST"&&a==="seller-onboarding"){
  const b=await req.json();const mb=await gm(sb,cpf);if(!mb)throw new Error("Membro não encontrado");
  if(!b.full_name||!b.cpf_cnpj||!b.phone||!b.seller_cep||!b.pix_key_type||!b.pix_key||!b.pix_beneficiary||!b.bank_name||!b.terms_accepted)throw new Error("Todos os campos obrigatórios");
  const hd=b.id_front_url&&b.id_back_url&&b.id_selfie_url;const isCnpj=b.cpf_cnpj.length>11;
  const od:any={full_name:b.full_name,cpf_cnpj:b.cpf_cnpj,phone:b.phone,seller_cep:b.seller_cep,pix_key_type:b.pix_key_type,pix_key:b.pix_key,pix_beneficiary:b.pix_beneficiary,bank_name:b.bank_name,account_type:isCnpj?"pj":"pf",terms_accepted_at:new Date().toISOString(),kyc_status:hd?"pending_review":"pending_docs",onboarding_completed_at:new Date().toISOString()};
  if(hd){od.id_front_url=b.id_front_url;od.id_back_url=b.id_back_url;od.id_selfie_url=b.id_selfie_url;}
  let sl=await gs(sb,mb.id);if(sl)await sb.from("vault_seller_profiles").update(od).eq("id",sl.id);else{const{error}=await sb.from("vault_seller_profiles").insert({member_id:mb.id,...od});if(error)throw error;}
  if(hd)await sb.from("notifications").insert({title:"Novo vendedor aguardando aprovação",message:`${b.full_name} enviou documentos para verificação.`,target:"admin",type:"info",reference_type:"seller_kyc"});
  return j({success:true});
}
if(mt==="GET"&&a==="seller-tier-info"){const sid=url.searchParams.get("seller_id");if(!sid)throw new Error("seller_id obrigatório");const{data}=await sb.from("vault_seller_profiles").select("tier,on_time_shipping_rate,cancellation_rate,dispute_rate,pro_approval_rate,payout_speed_days,current_fee_percent,total_sales_count,average_rating").eq("id",sid).single();if(!data)throw new Error("Vendedor não encontrado");const tc:Record<string,any>={bronze:{label:"Bronze",color:"#CD7F32",nextTier:"prata",nextReqs:"5 vendas, 80% no prazo"},prata:{label:"Prata",color:"#C0C0C0",nextTier:"ouro",nextReqs:"20 vendas, 90% no prazo"},ouro:{label:"Ouro",color:"#D4AF37",nextTier:"elite",nextReqs:"50 vendas, 95% no prazo"},elite:{label:"Elite",color:"#B9F2FF",nextTier:null,nextReqs:"Nível máximo!"}};return j({...data,tierInfo:tc[data.tier]||tc.bronze});}
if(mt==="POST"&&a==="recalc-seller-tier"){
  const b=await req.json();const sid=b.seller_id;if(!sid)throw new Error("seller_id obrigatório");
  const{data:ao}=await sb.from("vault_marketplace_orders").select("status,shipped_at,paid_at,dispute_status,inspection_result,created_at").eq("seller_id",sid);const os=ao||[];const t=os.length;
  if(t===0){await sb.from("vault_seller_profiles").update({tier:"bronze",tier_updated_at:new Date().toISOString()}).eq("id",sid);return j({tier:"bronze",metrics:{}});}
  const comp=os.filter((o:any)=>["completed","delivered","payout_released","payout_pending"].includes(o.status));
  const canc=os.filter((o:any)=>o.status==="cancelled");const disp=os.filter((o:any)=>o.dispute_status==="open"||o.dispute_status==="resolved_buyer");
  const pro=os.filter((o:any)=>o.inspection_result);const pa=pro.filter((o:any)=>o.inspection_result==="approved");
  const sh=os.filter((o:any)=>o.shipped_at&&o.paid_at);const ot=sh.filter((o:any)=>{const d=(new Date(o.shipped_at).getTime()-new Date(o.paid_at).getTime())/86400000;return d<=3;});
  const otr=sh.length>0?Math.round(ot.length/sh.length*100):100;const cr=t>0?Math.round(canc.length/t*100):0;const dr=t>0?Math.round(disp.length/t*100):0;const par=pro.length>0?Math.round(pa.length/pro.length*100):100;
  let tier="bronze",pd=10,fp=14;
  if(comp.length>=50&&otr>=95&&dr<=2&&cr<=3&&par>=98){tier="elite";pd=3;fp=8;}
  else if(comp.length>=20&&otr>=90&&dr<=5&&cr<=5&&par>=95){tier="ouro";pd=5;fp=10;}
  else if(comp.length>=5&&otr>=80&&dr<=10&&cr<=10){tier="prata";pd=7;fp=12;}
  await sb.from("vault_seller_profiles").update({tier,tier_updated_at:new Date().toISOString(),on_time_shipping_rate:otr,cancellation_rate:cr,dispute_rate:dr,pro_approval_rate:par,payout_speed_days:pd,current_fee_percent:fp}).eq("id",sid);
  return j({tier,metrics:{total_orders:t,completed:comp.length,onTimeRate:otr,cancellationRate:cr,disputeRate:dr,proApprovalRate:par},benefits:{payout_days:pd,fee_percent:fp}});
}
if(mt==="GET"&&a==="seller-leaderboard"){const{data}=await sb.from("vault_seller_profiles").select(`id,total_sales_count,total_sales_value,average_rating,ratings_count,plan_id,verified_badge,followers_count,member:vault_members!inner(client_name,tier)`).gt("total_sales_count",0).order("total_sales_value",{ascending:false}).limit(20);const sellers=[];for(const s of(data||[])){const{data:badges}=await sb.from("marketplace_seller_badges").select("badge_name,badge_icon,badge_type").eq("seller_id",s.id);sellers.push({...s,badges:badges||[]});}return j({leaderboard:sellers});}
if(mt==="GET"&&a==="my-strikes"){const mb=await gm(sb,cpf);if(!mb)return j({strikes:[],active_count:0,suspended_until:null});const sl=await gs(sb,mb.id);if(!sl)return j({strikes:[],active_count:0,suspended_until:null});const{data:strikes}=await sb.from("seller_strikes").select("*").eq("seller_id",sl.id).order("created_at",{ascending:false});return j({strikes:strikes||[],active_count:sl.active_strikes_count||0,suspended_until:sl.suspended_until||null});}
if(mt==="POST"&&a==="appeal-strike"){const b=await req.json();if(!b.strike_id||!b.message)return j({error:"strike_id e message obrigatórios"},400);const mb=await gm(sb,cpf);if(!mb)return j({error:"Membro não encontrado"},404);const sl=await gs(sb,mb.id);if(!sl)return j({error:"Vendedor não encontrado"},404);const{data:st}=await sb.from("seller_strikes").select("id,seller_id,appeal_status").eq("id",b.strike_id).eq("seller_id",sl.id).single();if(!st)return j({error:"Aviso não encontrado"},404);if(st.appeal_status)return j({error:"Já existe recurso"},400);await sb.from("seller_strikes").update({appeal_status:"pending",appeal_message:b.message}).eq("id",b.strike_id);return j({success:true});}
return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mk-seller error:",e);return j({error:e.message},500);}
});
