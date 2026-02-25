import { motion } from "framer-motion";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BravenzaFullHero } from "@/components/marketplace/full/BravenzaFullHero";
import { BravenzaFullSteps } from "@/components/marketplace/full/BravenzaFullSteps";
import { BravenzaFullBenefits } from "@/components/marketplace/full/BravenzaFullBenefits";
import { BravenzaFullPricing } from "@/components/marketplace/full/BravenzaFullPricing";
import { BravenzaFullFAQ } from "@/components/marketplace/full/BravenzaFullFAQ";
import { BravenzaFullContact } from "@/components/marketplace/full/BravenzaFullContact";

export default function BravenzaFullPage() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Bravenza Full | Venda sem esforço | BRAVENZA</title>
        <meta
          name="description"
          content="Envie seu sneaker e a BRAVENZA cuida de tudo: autenticação, fotografia profissional, precificação e envio ao comprador. Comissão de apenas 22%."
        />
        <link rel="canonical" href="https://bravenza.com.br/full" />
      </Helmet>

      <BravenzaFullHero />
      <BravenzaFullSteps />
      <BravenzaFullBenefits />
      <BravenzaFullPricing />
      <BravenzaFullFAQ />
      <BravenzaFullContact />
    </PublicLayout>
  );
}
