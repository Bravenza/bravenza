import { useState, useMemo } from "react";
import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Brand-specific size charts (Men's) ──────────────────────────────────
// Sources: official brand charts (Nike, adidas, New Balance, Puma, Asics, Converse, Vans, Reebok, Jordan = Nike)
type SizeRow = { us: string; uk: string; eu: string; cm: string; br: string };

const nikeSizes: SizeRow[] = [
  { us: "6", uk: "5.5", eu: "38.5", cm: "24", br: "36" },
  { us: "6.5", uk: "6", eu: "39", cm: "24.5", br: "37" },
  { us: "7", uk: "6", eu: "40", cm: "25", br: "38" },
  { us: "7.5", uk: "6.5", eu: "40.5", cm: "25.5", br: "38" },
  { us: "8", uk: "7", eu: "41", cm: "26", br: "39" },
  { us: "8.5", uk: "7.5", eu: "42", cm: "26.5", br: "40" },
  { us: "9", uk: "8", eu: "42.5", cm: "27", br: "40" },
  { us: "9.5", uk: "8.5", eu: "43", cm: "27.5", br: "41" },
  { us: "10", uk: "9", eu: "44", cm: "28", br: "42" },
  { us: "10.5", uk: "9.5", eu: "44.5", cm: "28.5", br: "42" },
  { us: "11", uk: "10", eu: "45", cm: "29", br: "43" },
  { us: "11.5", uk: "10.5", eu: "45.5", cm: "29.5", br: "43" },
  { us: "12", uk: "11", eu: "46", cm: "30", br: "44" },
  { us: "13", uk: "12", eu: "47.5", cm: "31", br: "45" },
  { us: "14", uk: "13", eu: "48.5", cm: "32", br: "46" },
];

const adidasSizes: SizeRow[] = [
  { us: "6", uk: "5.5", eu: "38 2/3", cm: "24", br: "36" },
  { us: "6.5", uk: "6", eu: "39 1/3", cm: "24.5", br: "37" },
  { us: "7", uk: "6.5", eu: "40", cm: "25", br: "38" },
  { us: "7.5", uk: "7", eu: "40 2/3", cm: "25.5", br: "38" },
  { us: "8", uk: "7.5", eu: "41 1/3", cm: "26", br: "39" },
  { us: "8.5", uk: "8", eu: "42", cm: "26.5", br: "40" },
  { us: "9", uk: "8.5", eu: "42 2/3", cm: "27", br: "40" },
  { us: "9.5", uk: "9", eu: "43 1/3", cm: "27.5", br: "41" },
  { us: "10", uk: "9.5", eu: "44", cm: "28", br: "42" },
  { us: "10.5", uk: "10", eu: "44 2/3", cm: "28.5", br: "42" },
  { us: "11", uk: "10.5", eu: "45 1/3", cm: "29", br: "43" },
  { us: "11.5", uk: "11", eu: "46", cm: "29.5", br: "43" },
  { us: "12", uk: "11.5", eu: "46 2/3", cm: "30", br: "44" },
  { us: "13", uk: "12.5", eu: "48", cm: "31", br: "45" },
  { us: "14", uk: "13.5", eu: "49 1/3", cm: "32", br: "46" },
];

const newBalanceSizes: SizeRow[] = [
  { us: "6", uk: "5.5", eu: "38.5", cm: "24", br: "36" },
  { us: "6.5", uk: "6", eu: "39.5", cm: "24.5", br: "37" },
  { us: "7", uk: "6.5", eu: "40", cm: "25", br: "38" },
  { us: "7.5", uk: "7", eu: "40.5", cm: "25.5", br: "38" },
  { us: "8", uk: "7.5", eu: "41.5", cm: "26", br: "39" },
  { us: "8.5", uk: "8", eu: "42", cm: "26.5", br: "40" },
  { us: "9", uk: "8.5", eu: "42.5", cm: "27", br: "40" },
  { us: "9.5", uk: "9", eu: "43", cm: "27.5", br: "41" },
  { us: "10", uk: "9.5", eu: "44", cm: "28", br: "42" },
  { us: "10.5", uk: "10", eu: "44.5", cm: "28.5", br: "42" },
  { us: "11", uk: "10.5", eu: "45", cm: "29", br: "43" },
  { us: "11.5", uk: "11", eu: "45.5", cm: "29.5", br: "43" },
  { us: "12", uk: "11.5", eu: "46.5", cm: "30", br: "44" },
  { us: "13", uk: "12.5", eu: "47.5", cm: "31", br: "45" },
];

const pumaSizes: SizeRow[] = [
  { us: "6", uk: "5", eu: "38", cm: "24", br: "36" },
  { us: "6.5", uk: "5.5", eu: "38.5", cm: "24.5", br: "37" },
  { us: "7", uk: "6", eu: "39", cm: "25", br: "38" },
  { us: "7.5", uk: "6.5", eu: "40", cm: "25.5", br: "38" },
  { us: "8", uk: "7", eu: "40.5", cm: "26", br: "39" },
  { us: "8.5", uk: "7.5", eu: "41", cm: "26.5", br: "40" },
  { us: "9", uk: "8", eu: "42", cm: "27", br: "40" },
  { us: "9.5", uk: "8.5", eu: "42.5", cm: "27.5", br: "41" },
  { us: "10", uk: "9", eu: "43", cm: "28", br: "42" },
  { us: "10.5", uk: "9.5", eu: "44", cm: "28.5", br: "42" },
  { us: "11", uk: "10", eu: "44.5", cm: "29", br: "43" },
  { us: "12", uk: "11", eu: "46", cm: "30", br: "44" },
  { us: "13", uk: "12", eu: "47", cm: "31", br: "45" },
];

const asicsSizes: SizeRow[] = [
  { us: "6", uk: "5", eu: "38", cm: "24", br: "36" },
  { us: "6.5", uk: "5.5", eu: "39", cm: "24.5", br: "37" },
  { us: "7", uk: "6", eu: "39.5", cm: "25", br: "38" },
  { us: "7.5", uk: "6.5", eu: "40.5", cm: "25.5", br: "38" },
  { us: "8", uk: "7", eu: "41.5", cm: "26", br: "39" },
  { us: "8.5", uk: "7.5", eu: "42", cm: "26.5", br: "40" },
  { us: "9", uk: "8", eu: "42.5", cm: "27", br: "40" },
  { us: "9.5", uk: "8.5", eu: "43.5", cm: "27.5", br: "41" },
  { us: "10", uk: "9", eu: "44", cm: "28", br: "42" },
  { us: "10.5", uk: "9.5", eu: "44.5", cm: "28.5", br: "42" },
  { us: "11", uk: "10", eu: "45", cm: "29", br: "43" },
  { us: "12", uk: "11", eu: "46.5", cm: "30", br: "44" },
  { us: "13", uk: "12", eu: "48", cm: "31", br: "45" },
];

const converseSizes: SizeRow[] = [
  { us: "6", uk: "6", eu: "39", cm: "24.5", br: "37" },
  { us: "6.5", uk: "6.5", eu: "39.5", cm: "24.8", br: "37" },
  { us: "7", uk: "7", eu: "40", cm: "25.5", br: "38" },
  { us: "7.5", uk: "7.5", eu: "41", cm: "25.8", br: "39" },
  { us: "8", uk: "8", eu: "41.5", cm: "26.2", br: "39" },
  { us: "8.5", uk: "8.5", eu: "42", cm: "26.7", br: "40" },
  { us: "9", uk: "9", eu: "42.5", cm: "27", br: "40" },
  { us: "9.5", uk: "9.5", eu: "43", cm: "27.3", br: "41" },
  { us: "10", uk: "10", eu: "44", cm: "27.9", br: "42" },
  { us: "10.5", uk: "10.5", eu: "44.5", cm: "28.3", br: "42" },
  { us: "11", uk: "11", eu: "45", cm: "28.6", br: "43" },
  { us: "12", uk: "12", eu: "46.5", cm: "29.4", br: "44" },
  { us: "13", uk: "13", eu: "48", cm: "30.5", br: "45" },
];

const vansSizes: SizeRow[] = [
  { us: "6", uk: "5", eu: "38", cm: "24", br: "36" },
  { us: "6.5", uk: "5.5", eu: "38.5", cm: "24.5", br: "37" },
  { us: "7", uk: "6", eu: "39", cm: "25", br: "38" },
  { us: "7.5", uk: "6.5", eu: "40", cm: "25.5", br: "38" },
  { us: "8", uk: "7", eu: "40.5", cm: "26", br: "39" },
  { us: "8.5", uk: "7.5", eu: "41", cm: "26.5", br: "40" },
  { us: "9", uk: "8", eu: "42", cm: "27", br: "40" },
  { us: "9.5", uk: "8.5", eu: "42.5", cm: "27.5", br: "41" },
  { us: "10", uk: "9", eu: "43", cm: "28", br: "42" },
  { us: "10.5", uk: "9.5", eu: "44", cm: "28.5", br: "42" },
  { us: "11", uk: "10", eu: "44.5", cm: "29", br: "43" },
  { us: "12", uk: "11", eu: "46", cm: "30", br: "44" },
  { us: "13", uk: "12", eu: "47", cm: "31", br: "45" },
];

// Brand → sizes mapping (normalized to lowercase)
const brandSizeCharts: Record<string, { label: string; sizes: SizeRow[]; note?: string }> = {
  nike: { label: "Nike", sizes: nikeSizes, note: "Nike costuma ter um ajuste ligeiramente mais estreito. Se estiver entre dois tamanhos, opte pelo maior." },
  jordan: { label: "Jordan (Nike)", sizes: nikeSizes, note: "Jordan segue a tabela Nike. Modelos retro podem calçar levemente maior." },
  "air jordan": { label: "Air Jordan (Nike)", sizes: nikeSizes, note: "Jordan segue a tabela Nike. Modelos retro podem calçar levemente maior." },
  adidas: { label: "adidas", sizes: adidasSizes, note: "adidas Yeezy costuma calçar um pouco menor. Recomendamos meio número acima." },
  yeezy: { label: "Yeezy (adidas)", sizes: adidasSizes, note: "Yeezy costuma calçar 0.5 menor que o tamanho padrão. Recomendamos meio número acima." },
  "new balance": { label: "New Balance", sizes: newBalanceSizes, note: "New Balance geralmente oferece um ajuste fiel ao tamanho (true to size)." },
  puma: { label: "Puma", sizes: pumaSizes, note: "Puma costuma ter um ajuste fiel ao tamanho." },
  asics: { label: "Asics", sizes: asicsSizes, note: "Asics costuma ter um ajuste fiel ao tamanho com bom suporte." },
  converse: { label: "Converse", sizes: converseSizes, note: "Converse Chuck Taylor costuma calçar grande. Recomendamos meio número abaixo." },
  vans: { label: "Vans", sizes: vansSizes, note: "Vans costuma ter um ajuste fiel ao tamanho na maioria dos modelos." },
  reebok: { label: "Reebok", sizes: nikeSizes, note: "Reebok segue uma tabela similar à Nike." },
};

// Fallback generic chart
const genericSizes: SizeRow[] = nikeSizes;

function getSizeChart(brand: string | undefined) {
  if (!brand) return { label: "Geral", sizes: genericSizes };
  const key = brand.toLowerCase().trim();
  // Try exact match first, then partial
  if (brandSizeCharts[key]) return brandSizeCharts[key];
  const found = Object.entries(brandSizeCharts).find(([k]) => key.includes(k) || k.includes(key));
  if (found) return found[1];
  return { label: brand, sizes: genericSizes, note: "Tabela de referência genérica. Os tamanhos podem variar conforme a marca e modelo." };
}

type SizeSystem = "br" | "us" | "uk" | "eu";

interface SizeGuideDialogProps {
  brand?: string;
}

export function SizeGuideDialog({ brand }: SizeGuideDialogProps) {
  const [activeSystem, setActiveSystem] = useState<SizeSystem>("br");
  const chart = useMemo(() => getSizeChart(brand), [brand]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold">
          <Ruler className="h-3.5 w-3.5" />
          Guia de tamanhos
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Ruler className="h-5 w-5 text-primary" />
            Guia de tamanhos — {chart.label}
          </DialogTitle>
        </DialogHeader>

        {/* System tabs */}
        <div className="flex gap-1.5 p-1 bg-muted/30 rounded-xl">
          {([
            { key: "br" as const, label: "BR" },
            { key: "us" as const, label: "US" },
            { key: "uk" as const, label: "UK" },
            { key: "eu" as const, label: "EU" },
          ]).map((sys) => (
            <button
              key={sys.key}
              onClick={() => setActiveSystem(sys.key)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                activeSystem === sys.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {sys.label}
            </button>
          ))}
        </div>

        {/* Brand tip */}
        {chart.note && (
          <div className="px-3 py-2.5 bg-primary/5 border border-primary/10 rounded-xl text-xs text-primary/90 leading-relaxed">
            💡 {chart.note}
          </div>
        )}

        {/* Size table */}
        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border/20">
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">BR</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">US</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">UK</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">EU</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">CM</th>
              </tr>
            </thead>
            <tbody>
              {chart.sizes.map((row, i) => (
                <tr key={`${row.us}-${i}`} className={cn("border-b border-border/10", i % 2 === 0 && "bg-muted/5")}>
                  <td className={cn("py-2 px-3 font-semibold", activeSystem === "br" ? "text-primary" : "text-foreground")}>{row.br}</td>
                  <td className={cn("py-2 px-3 text-center", activeSystem === "us" ? "text-primary font-semibold" : "text-muted-foreground")}>{row.us}</td>
                  <td className={cn("py-2 px-3 text-center", activeSystem === "uk" ? "text-primary font-semibold" : "text-muted-foreground")}>{row.uk}</td>
                  <td className={cn("py-2 px-3 text-center", activeSystem === "eu" ? "text-primary font-semibold" : "text-muted-foreground")}>{row.eu}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{row.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/10">
          Os tamanhos podem variar de acordo com o modelo. Em caso de dúvida, entre em contato.
        </p>
      </DialogContent>
    </Dialog>
  );
}
