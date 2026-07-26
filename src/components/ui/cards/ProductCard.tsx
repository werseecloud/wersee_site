import React from 'react';
import { MarketplaceProductCard } from './MarketplaceProductCard';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  brand?: string;
  rating?: number;
  description?: string;
  originalPrice?: number | null;
  salePrice?: number | null;
  offers?: any[];
  thumbnailB?: string | null;
  winningThumbnail?: 'a' | 'b' | null;
  badge?: string | null;
}

export const ProductCard = ({
  id,
  title,
  price,
  image,
  category,
  brand,
  rating = 0,
  description,
  originalPrice,
  salePrice,
  offers,
  thumbnailB,
  winningThumbnail,
  badge,
}: ProductCardProps) => (
  <MarketplaceProductCard
    surface="storefront"
    listing={{
      id,
      title,
      price,
      images: [image],
      category,
      creator_name: brand,
      rating_avg: rating,
      short_description: description,
      original_price: originalPrice,
      sale_price: salePrice,
      product_offers: offers,
      thumbnail_b_url: thumbnailB,
      winning_thumbnail: winningThumbnail,
      card_badge: badge,
    }}
  />
);
