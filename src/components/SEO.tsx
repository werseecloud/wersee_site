import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  noIndex?: boolean;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const SEO = ({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
  keywords,
  jsonLd
}: SEOProps) => {
  const siteName = 'Wersee';
  const defaultDescription = 'Wersee is the all-in-one platform for creators and businesses to sell digital products, services, and subscriptions.';
  const defaultImage = 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/Ontwerp_zonder_titel__1_-removebg-preview%20(1).png';
  const siteUrl = 'https://wersee.com';

  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Sell Digital Products & Services`;
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;

  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@wersee" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={title ? `${title} - ${siteName}` : siteName} />

      {/* Structured Data */}
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};
