import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Box, Shield, QrCode, Download, ExternalLink, Image, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";

interface VaultItem {
  id: string;
  vault_id: string;
  title: string;
  brand: string;
  model: string;
  colorway: string;
  size: string;
  verified_status: "VERIFIED" | "PENDING" | "REVOKED";
  inspection_photos: string[];
  certificate_pdf_url: string | null;
  qr_private_url: string | null;
  purchase_value: number;
  purchase_date: string;
}

const statusConfig = {
  VERIFIED: { label: "Verificado", icon: CheckCircle2, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  PENDING: { label: "Pendente", icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  REVOKED: { label: "Revogado", icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
};

export default function VaultMyItems() {
  const { session } = useClientAuth();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (session?.cpf) {
      fetchItems();
    }
  }, [session?.cpf]);

  const fetchItems = async () => {
    if (!session?.cpf) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_vault_member_items", { p_cpf: session.cpf });
      
      if (!error && data) {
        setItems(data as unknown as VaultItem[]);
      }
    } catch (error) {
      console.error("Error fetching vault items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6">
          <Box className="h-10 w-10 text-zinc-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Seu vault está vazio</h2>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          Quando você concluir compras pelo Vault Club, seus tênis aparecerão aqui com Vault ID e certificado.
        </p>
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
          <Link to="/vault/app/wishlist">
            Criar wishlist
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Meu vault</h1>
        <p className="text-zinc-400">
          {items.length} {items.length === 1 ? "item" : "itens"} na sua coleção
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const status = statusConfig[item.verified_status];
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-700 transition">
                {/* Image */}
                <div className="relative aspect-square bg-zinc-950">
                  {item.inspection_photos && item.inspection_photos.length > 0 ? (
                    <img
                      src={item.inspection_photos[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-12 w-12 text-zinc-700" />
                    </div>
                  )}
                  <Badge 
                    className={`absolute top-3 right-3 ${status.bgColor} ${status.color} border-0`}
                  >
                    <status.icon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>

                <CardContent className="pt-4">
                  {/* Vault ID */}
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-mono text-amber-500">{item.vault_id}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-zinc-400 mb-3">
                    {item.brand} • Tam. {item.size}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-zinc-700"
                          onClick={() => {
                            setSelectedItem(item);
                            setPhotoIndex(0);
                          }}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-amber-500" />
                            {item.vault_id}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Photo carousel */}
                          {item.inspection_photos && item.inspection_photos.length > 0 && (
                            <div className="relative aspect-square bg-zinc-950 rounded-lg overflow-hidden">
                              <img
                                src={item.inspection_photos[photoIndex]}
                                alt={`Foto ${photoIndex + 1}`}
                                className="w-full h-full object-contain"
                              />
                              {item.inspection_photos.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                  {item.inspection_photos.map((_, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setPhotoIndex(i)}
                                      className={`w-2 h-2 rounded-full transition ${
                                        i === photoIndex ? "bg-amber-500" : "bg-zinc-600"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-zinc-500">Produto</p>
                              <p className="font-medium">{item.title}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500">Tamanho</p>
                              <p className="font-medium">{item.size}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500">Valor</p>
                              <p className="font-medium">{formatCurrency(item.purchase_value)}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500">Data</p>
                              <p className="font-medium">{formatDate(item.purchase_date)}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            {item.certificate_pdf_url && (
                              <Button asChild variant="outline" className="flex-1 border-zinc-700">
                                <a href={item.certificate_pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Certificado
                                </a>
                              </Button>
                            )}
                            {item.qr_private_url && (
                              <Button asChild variant="outline" className="flex-1 border-zinc-700">
                                <a href={item.qr_private_url} target="_blank" rel="noopener noreferrer">
                                  <QrCode className="h-4 w-4 mr-2" />
                                  Verificar
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {item.qr_private_url && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="border-zinc-700"
                        asChild
                      >
                        <a href={item.qr_private_url} target="_blank" rel="noopener noreferrer">
                          <QrCode className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}