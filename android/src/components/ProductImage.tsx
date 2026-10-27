import React, { useState, useEffect } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { productCatalogService, PRESET_PRODUCT_IMAGES } from '../services/productCatalogService';

export interface ProductImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  fallback?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

/**
 * Resilient, multi-stage Product Image component for Android.
 * Automatically resolves relative image paths (/products/...) to absolute URLs,
 * gracefully handles SVG data URL fallbacks, and catches load errors to display
 * guaranteed fallbacks.
 */
export function ProductImage({
  uri,
  style,
  fallback = PRESET_PRODUCT_IMAGES[0],
  resizeMode = 'cover',
}: ProductImageProps) {
  const [resolvedSource, setResolvedSource] = useState<string>(() => {
    return productCatalogService.resolveImageUrl(uri) || fallback;
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextUri = productCatalogService.resolveImageUrl(uri) || fallback;
    setResolvedSource(nextUri);
    setHasError(false);
  }, [uri, fallback]);

  return (
    <Image
      source={{ uri: hasError ? fallback : resolvedSource }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setResolvedSource(fallback);
        }
      }}
    />
  );
}

export default ProductImage;
