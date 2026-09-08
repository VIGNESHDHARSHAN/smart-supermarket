import React, { useState, useEffect, useRef } from 'react';
import { getCategoryFallbackImage, fetchProductImageFromInternet } from '../../services/imageService';
import { Package } from 'lucide-react';

/**
 * Robust ProductImage component with:
 * - Progressive loading skeleton
 * - Automatic internet image fetching fallback
 * - Error recovery with category visuals
 */
export const ProductImage = ({
  src,
  alt = 'Product image',
  category = 'Default',
  productName = '',
  barcode = '',
  className = 'w-full h-full object-contain',
  containerClassName = '',
  autoFetch = true,
  onClick,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src || getCategoryFallbackImage(category));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const fetchedRef = useRef(false);

  // Reset when src changes
  useEffect(() => {
    setImgSrc(src || getCategoryFallbackImage(category));
    setHasError(false);
    setIsLoading(true);
    fetchedRef.current = false;
  }, [src, category]);

  // Auto-fetch from internet if no src provided and we have product info
  useEffect(() => {
    if (autoFetch && !src && productName && !fetchedRef.current) {
      fetchedRef.current = true;
      setIsFetching(true);
      fetchProductImageFromInternet(productName, barcode, category)
        .then(({ imageUrl }) => {
          if (imageUrl) setImgSrc(imageUrl);
        })
        .catch(() => {})
        .finally(() => setIsFetching(false));
    }
  }, [autoFetch, src, productName, barcode, category]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setIsLoading(false);
      // If we have product info and haven't tried internet fetch, try it now
      if (autoFetch && (productName || barcode) && !fetchedRef.current) {
        fetchedRef.current = true;
        setIsFetching(true);
        fetchProductImageFromInternet(productName, barcode, category)
          .then(({ imageUrl }) => {
            if (imageUrl) {
              setImgSrc(imageUrl);
              setHasError(false);
              setIsLoading(true);
            } else {
              setImgSrc(getCategoryFallbackImage(category));
            }
          })
          .catch(() => setImgSrc(getCategoryFallbackImage(category)))
          .finally(() => setIsFetching(false));
      } else {
        setImgSrc(getCategoryFallbackImage(category));
      }
    }
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${containerClassName}`}>
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-slate-800 animate-pulse flex items-center justify-center z-10">
          <Package className="w-5 h-5 text-gray-300 dark:text-slate-600 animate-bounce" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        onLoad={() => { setIsLoading(false); setIsFetching(false); }}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
        className={`${className} transition-opacity duration-300 ${(isLoading || isFetching) ? 'opacity-0' : 'opacity-100'}`}
        {...props}
      />
    </div>
  );
};

export default ProductImage;
