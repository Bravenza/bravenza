import { memo } from "react";
import { Helmet } from "react-helmet-async";

interface LocalBusinessProps {
  name?: string;
  description?: string;
  url?: string;
  telephone?: string;
  priceRange?: string;
}

const LocalBusinessComponent = ({
  name = "BRAVENZA",
  description = "Plataforma premium de curadoria sob demanda e autenticação de sneakers. Encontramos, verificamos e garantimos a autenticidade do tênis que você procura.",
  url = "https://bravenza.lovable.app",
  telephone = "+55 51 98105-5425",
  priceRange = "$$"
}: LocalBusinessProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name,
    description,
    url,
    telephone,
    priceRange,
    image: `${url}/og-image.png`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "BR"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-30.0346",
      longitude: "-51.2177"
    },
    sameAs: [
      "https://wa.me/5551981055425"
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "150",
      bestRating: "5",
      worstRating: "1"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const LocalBusinessSchema = memo(LocalBusinessComponent);

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const BreadcrumbSchemaComponent = ({ items }: BreadcrumbProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const BreadcrumbSchema = memo(BreadcrumbSchemaComponent);

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

const FAQSchemaComponent = ({ faqs }: FAQSchemaProps) => {
  if (!faqs || faqs.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const FAQSchema = memo(FAQSchemaComponent);

interface ServiceProps {
  name: string;
  description: string;
  provider?: string;
  areaServed?: string;
}

const ServiceSchemaComponent = ({
  name,
  description,
  provider = "BRAVENZA",
  areaServed = "BR"
}: ServiceProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: provider
    },
    areaServed: {
      "@type": "Country",
      name: areaServed
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const ServiceSchema = memo(ServiceSchemaComponent);
