import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
const API_BASE = "https://sneaker-database-stockx.p.rapidapi.com";
const API_HOST = "sneaker-database-stockx.p.rapidapi.com";

const headers = {
  "X-RapidAPI-Key": RAPIDAPI_KEY!,
  "X-RapidAPI-Host": API_HOST,
};

async function testEndpoint(name: string, url: string) {
  console.log(`\n=== Testing: ${name} ===`);
  console.log(`URL: ${url}`);
  try {
    const res = await fetch(url, { headers });
    const status = res.status;
    const body = await res.text();
    console.log(`Status: ${status}`);
    if (status === 200) {
      try {
        const json = JSON.parse(body);
        const isArray = Array.isArray(json);
        const keys = isArray ? `Array[${json.length}]` : Object.keys(json).join(", ");
        console.log(`Structure: ${keys}`);
        if (isArray && json.length > 0) {
          console.log(`First item keys: ${Object.keys(json[0]).join(", ")}`);
          // Check for SKU-like fields
          const first = json[0];
          const skuFields = ["styleID", "styleId", "style_id", "sku", "slug", "id", "spu", "handle"];
          const foundSku = skuFields.find(f => first[f]);
          console.log(`SKU field found: ${foundSku} = ${first[foundSku]}`);
          // Check image fields
          const imgFields = ["image", "thumbnail", "imageUrl", "main_picture_url", "grid_picture_url"];
          const foundImg = imgFields.find(f => first[f]);
          console.log(`Image field found: ${foundImg} = ${typeof first[foundImg] === "string" ? first[foundImg]?.substring(0, 80) : JSON.stringify(first[foundImg])?.substring(0, 80)}`);
        } else if (!isArray) {
          // Check nested structures
          for (const k of ["results", "data", "products", "items", "hits", "edges"]) {
            if (json[k] && Array.isArray(json[k]) && json[k].length > 0) {
              console.log(`Nested array: ${k}[${json[k].length}]`);
              console.log(`First item keys: ${Object.keys(json[k][0]).join(", ")}`);
              break;
            }
          }
          // Show first 500 chars
          console.log(`Preview: ${body.substring(0, 500)}`);
        }
      } catch {
        console.log(`Raw (first 300): ${body.substring(0, 300)}`);
      }
    } else {
      console.log(`Error body: ${body.substring(0, 300)}`);
    }
    return { name, status, ok: status === 200 };
  } catch (e: any) {
    console.log(`Fetch error: ${e.message}`);
    return { name, status: 0, ok: false, error: e.message };
  }
}

Deno.test("Test all multi-source endpoints", async () => {
  if (!RAPIDAPI_KEY) {
    console.log("RAPIDAPI_KEY not set, skipping");
    return;
  }

  const results = [];

  // GOAT
  results.push(await testEndpoint("GOAT Search", `${API_BASE}/goat-search?query=Jordan+1`));
  results.push(await testEndpoint("GOAT Description", `${API_BASE}/goat-description?sku=DD9336%20103`));

  // FlightClub
  results.push(await testEndpoint("FlightClub Search", `${API_BASE}/fightclubonly?query=yeezy`));
  results.push(await testEndpoint("FlightClub Description", `${API_BASE}/fightclub-description?sku=ct8532031`));

  // StadiumGoods
  results.push(await testEndpoint("StadiumGoods Search", `${API_BASE}/sg/search?query=adidas&page=1`));

  // KicksCrew
  results.push(await testEndpoint("KicksCrew Search", `${API_BASE}/kc-search?query=yeezy`));
  results.push(await testEndpoint("KicksCrew Description", `${API_BASE}/kc-description?spu=DD1391-100`));

  console.log("\n\n=== SUMMARY ===");
  for (const r of results) {
    console.log(`${r.ok ? "✅" : "❌"} ${r.name} - Status: ${r.status}`);
  }
});
