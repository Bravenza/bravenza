import{createClient}from"https://esm.sh/@supabase/supabase-js@2";
const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version","Access-Control-Allow-Methods":"GET, POST, PUT, DELETE, OPTIONS"};
const j=(d:unknown,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{...H,"Content-Type":"application/json"}});
const sc=()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function getSellerId(sb:any, cpf:string) {
  const{data:mb}=await sb.from("vault_members").select("id").eq("client_cpf",cpf).single();
  if(!mb) return null;
  const{data:sp}=await sb.from("vault_seller_profiles").select("id").eq("member_id",mb.id).maybeSingle();
  return sp?.id || null;
}

Deno.serve(async(req)=>{
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const sb=sc(),url=new URL(req.url),a=url.searchParams.get("action"),mt=req.method;
let cpf="visitor";const ah=req.headers.get("authorization");
if(ah?.startsWith("Bearer ")){const{data:u}=await sb.auth.getUser(ah.replace("Bearer ",""));if(u?.user){const{data:p}=await sb.from("client_profiles").select("cpf").eq("user_id",u.user.id).single();if(p?.cpf)cpf=p.cpf;}}
if(cpf==="visitor")return j({error:"Auth required"},401);
try{
const sellerId = await getSellerId(sb, cpf);

// ── seller-balance: Calculate released vs pending ──
if(mt==="GET"&&a==="seller-balance"){
  if(!sellerId) return j({released:0,pending:0,total_earned:0,payouts_total:0,payouts:[]});

  // Pending: delivered orders without confirmed_at (escrow)
  const{data:pendingOrders}=await sb.from("vault_marketplace_orders")
    .select("seller_payout")
    .eq("seller_id",sellerId)
    .eq("status","delivered")
    .is("confirmed_at",null)
    .is("dispute_status",null);
  const pending = (pendingOrders||[]).reduce((s:number,o:any)=>s+Number(o.seller_payout),0);

  // Released: completed/confirmed orders (confirmed_at not null) + payout_pending
  const{data:releasedOrders}=await sb.from("vault_marketplace_orders")
    .select("seller_payout")
    .eq("seller_id",sellerId)
    .in("status",["completed","payout_pending"])
    .not("confirmed_at","is",null)
    .is("dispute_status",null);
  const totalEarned = (releasedOrders||[]).reduce((s:number,o:any)=>s+Number(o.seller_payout),0);

  // Subtract payouts already requested/completed
  const{data:payoutsData}=await sb.from("marketplace_seller_payouts")
    .select("amount,status")
    .eq("seller_id",sellerId)
    .in("status",["requested","processing","completed"]);
  const payoutsTotal = (payoutsData||[]).reduce((s:number,p:any)=>s+Number(p.amount),0);

  const released = Math.max(0, totalEarned - payoutsTotal);

  // Payout history
  const{data:payouts}=await sb.from("marketplace_seller_payouts")
    .select("*")
    .eq("seller_id",sellerId)
    .order("created_at",{ascending:false})
    .limit(50);

  return j({released:Math.round(released*100)/100, pending:Math.round(pending*100)/100, total_earned:Math.round(totalEarned*100)/100, payouts_total:Math.round(payoutsTotal*100)/100, payouts:payouts||[]});
}

// ── request-payout: Create payout request ──
if(mt==="POST"&&a==="request-payout"){
  if(!sellerId) throw new Error("Vendedor não encontrado");
  const b=await req.json();
  const amount=Number(b.amount);
  if(!amount||amount<=0) throw new Error("Valor inválido");

  // Recalculate released balance
  const{data:relOrders}=await sb.from("vault_marketplace_orders")
    .select("seller_payout")
    .eq("seller_id",sellerId)
    .in("status",["completed","payout_pending"])
    .not("confirmed_at","is",null)
    .is("dispute_status",null);
  const totalEarned=(relOrders||[]).reduce((s:number,o:any)=>s+Number(o.seller_payout),0);

  const{data:existingPayouts}=await sb.from("marketplace_seller_payouts")
    .select("amount")
    .eq("seller_id",sellerId)
    .in("status",["requested","processing","completed"]);
  const payoutsTotal=(existingPayouts||[]).reduce((s:number,p:any)=>s+Number(p.amount),0);
  const released=Math.max(0,totalEarned-payoutsTotal);

  if(amount>released) throw new Error(`Saldo insuficiente. Disponível: R$ ${released.toFixed(2)}`);

  // Get default PIX account
  const{data:pix}=await sb.from("marketplace_seller_pix_accounts")
    .select("*")
    .eq("seller_id",sellerId)
    .eq("is_default",true)
    .maybeSingle();
  if(!pix) throw new Error("Cadastre uma conta PIX antes de solicitar saque");

  const{data:payout,error}=await sb.from("marketplace_seller_payouts").insert({
    seller_id:sellerId,
    amount,
    status:"requested",
    pix_account_id:pix.id,
    pix_key:pix.pix_key,
    pix_key_type:pix.pix_key_type,
    beneficiary_name:pix.beneficiary_name,
    bank_name:pix.bank_name,
  }).select().single();
  if(error) throw error;

  return j({success:true,payout});
}

// ── pix-accounts: List seller PIX accounts ──
if(mt==="GET"&&a==="pix-accounts"){
  if(!sellerId) return j({accounts:[]});
  const{data}=await sb.from("marketplace_seller_pix_accounts")
    .select("*")
    .eq("seller_id",sellerId)
    .order("created_at",{ascending:false});
  return j({accounts:data||[]});
}

// ── save-pix: Create/update PIX account ──
if(mt==="POST"&&a==="save-pix"){
  if(!sellerId) throw new Error("Vendedor não encontrado");
  const b=await req.json();
  if(!b.pix_key_type||!b.pix_key||!b.beneficiary_name||!b.bank_name) throw new Error("Todos os campos são obrigatórios");

  // If updating existing
  if(b.id){
    const{error}=await sb.from("marketplace_seller_pix_accounts")
      .update({pix_key_type:b.pix_key_type,pix_key:b.pix_key,beneficiary_name:b.beneficiary_name,bank_name:b.bank_name,updated_at:new Date().toISOString()})
      .eq("id",b.id)
      .eq("seller_id",sellerId);
    if(error) throw error;
    return j({success:true});
  }

  // Set all others to non-default
  await sb.from("marketplace_seller_pix_accounts").update({is_default:false}).eq("seller_id",sellerId);

  const{error}=await sb.from("marketplace_seller_pix_accounts").insert({
    seller_id:sellerId,
    pix_key_type:b.pix_key_type,
    pix_key:b.pix_key,
    beneficiary_name:b.beneficiary_name,
    bank_name:b.bank_name,
    is_default:true,
  });
  if(error) throw error;
  return j({success:true});
}

// ── delete-pix: Remove PIX account ──
if(mt==="DELETE"&&a==="delete-pix"){
  if(!sellerId) throw new Error("Vendedor não encontrado");
  const pixId=url.searchParams.get("pix_id");
  if(!pixId) throw new Error("pix_id obrigatório");
  // Check no pending payouts using this account
  const{data:pendingP}=await sb.from("marketplace_seller_payouts")
    .select("id")
    .eq("pix_account_id",pixId)
    .in("status",["requested","processing"])
    .limit(1);
  if(pendingP&&pendingP.length>0) throw new Error("Conta PIX em uso por saque pendente");
  await sb.from("marketplace_seller_pix_accounts").delete().eq("id",pixId).eq("seller_id",sellerId);
  return j({success:true});
}

return j({error:"Ação não encontrada"},404);
}catch(e:any){console.error("mkv2-wallet error:",e);return j({error:e.message},500);}
});
