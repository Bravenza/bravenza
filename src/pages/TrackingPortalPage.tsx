import { Package } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { TrackingForm } from "@/components/tracking/TrackingForm";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { useTranslation } from "react-i18next";

const TrackingPortalPage = () => {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      <Helmet>
        <title>{t("tracking.pageTitle")}</title>
        <meta name="description" content={t("tracking.metaDescription")} />
      </Helmet>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-20 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("tracking.badge")}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t("tracking.title")} <span className="text-gradient-gold">{t("tracking.titleHighlight")}</span>
            </h1>

            <p className="text-muted-foreground max-w-md mx-auto">{t("tracking.subtitle")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="card-premium-gold p-8">
              <TrackingForm />
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default TrackingPortalPage;
