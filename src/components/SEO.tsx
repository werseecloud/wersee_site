import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  openGraphDescription?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  noIndex?: boolean;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export const SEO = ({
  title,
  description,
  openGraphDescription,
  image,
  imageAlt,
  url,
  type = 'website',
  noIndex = false,
  keywords,
  jsonLd
}: SEOProps) => {
  const siteName = 'Wersee';
  const defaultDescription = 'Create your storefront, sell digital products, services and subscriptions, manage payments and customers, and grow your online business with Wersee.';
  const siteUrl = 'https://www.wersee.com';
  const defaultImage = `${siteUrl}/brand/wersee-social-card.jpg`;

  const fullTitle = title
    ? title.toLowerCase().includes(siteName.toLowerCase())
      ? title
      : `${title} | ${siteName}`
    : `${siteName} — Where the internet does business`;
  const metaDescription = description || defaultDescription;
  const metaOpenGraphDescription = openGraphDescription || metaDescription;
  const metaImage = image
    ? image.startsWith('http://') || image.startsWith('https://')
      ? image
      : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`
    : defaultImage;
  const metaImageAlt = imageAlt || (title ? `${title} — ${siteName}` : `${siteName} — Where the internet does business`);
  const metaImagePath = metaImage.split(/[?#]/, 1)[0].toLowerCase();
  const metaImageType = metaImagePath.endsWith('.png') ? 'image/png' : metaImagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const canonicalUrl = url
    ? /^https?:\/\//i.test(url)
      ? url
      : `${siteUrl}${url}`
    : siteUrl;

  const jsonLdItems = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  useEffect(() => {
    document.querySelectorAll('[data-static-seo]').forEach((element) => element.remove());
  }, []);

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
      <meta property="og:description" content={metaOpenGraphDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:secure_url" content={metaImage} />
      <meta property="og:image:type" content={metaImageType} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={metaImageAlt} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@wersee" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={metaImageAlt} />

      {/* Structured Data */}
      {jsonLdItems.map((item, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};
