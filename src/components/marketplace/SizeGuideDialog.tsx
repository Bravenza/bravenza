import { useState } from "react";
import { Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const sizeData = [
  { br: "33", us: "3.5", uk: "3", eu: "35.5", cm: "21.5" },
  { br: "34", us: "4", uk: "3.5", eu: "36", cm: "22" },
  { br: "35", us: "5", uk: "4.5", eu: "37.5", cm: "23" },
  { br: "36", us: "5.5", uk: "5", eu: "38", cm: "23.5" },
  { br: "37", us: "6", uk: "5.5", eu: "38.5", cm: "24" },
  { br: "38", us: "7", uk: "6", eu: "39", cm: "24.5" },
  { br: "39", us: "7.5", uk: "6.5", eu: "40", cm: "25" },
  { br: "40", us: "8", uk: "7", eu: "40.5", cm: "25.5" },
  { br: "41", us: "9", uk: "8", eu: "42", cm: "26.5" },
  { br: "42", us: "9.5", uk: "8.5", eu: "42.5", cm: "27" },
  { br: "43", us: "10", uk: "9", eu: "43", cm: "27.5" },
  { br: "44", us: "11", uk: "10", eu: "44.5", cm: "28.5" },
  { br: "45", us: "12", uk: "11", eu: "46", cm: "30" },
];

type SizeSystem = "br" | "us" | "uk" | "eu";

export function SizeGuideDialog() {
  const [activeSystem, setActiveSystem] = useState<SizeSystem>("br");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-semibold">
          <Ruler className="h-3.5 w-3.5" />
          Guia de tamanhos
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Ruler className="h-5 w-5 text-primary" />
            Guia de tamanhos
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

        {/* Size table */}
        <div className="overflow-x-auto -mx-2 px-2 mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">BR</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">US</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">UK</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">EU</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">CM</th>
              </tr>
            </thead>
            <tbody>
              {sizeData.map((row, i) => (
                <tr key={row.br} className={cn("border-b border-border/10", i % 2 === 0 && "bg-muted/5")}>
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

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Os tamanhos podem variar de acordo com a marca e modelo. Em caso de dúvida, entre em contato.
        </p>
      </DialogContent>
    </Dialog>
  );
}
