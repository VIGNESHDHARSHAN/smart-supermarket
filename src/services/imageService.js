/**
 * Product Image Internet Fetcher & Fallback Service
 * Connects to Open Food Facts, Wikimedia Commons, and curated retail CDNs
 * to dynamically fetch accurate retail packaging and product photography.
 */

// Category Default High-Definition Visuals
export const CATEGORY_FALLBACK_IMAGES = {
  'Groceries': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'Groceries & Staples': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'Dairy & Eggs': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  'Beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
  'Beverages & Drinks': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
  'Personal Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  'Household': 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=600&auto=format&fit=crop&q=80',
  'Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'Fresh Fruits & Veg': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80',
  'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80',
  'Snacks & Instant': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=600&auto=format&fit=crop&q=80',
  'Oils & Ghee': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
  'Default': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
};

/**
 * Curated high-relevance image registry for common retail brands
 */
const BRAND_KEYWORD_IMAGES = [
  { match: ['basmati', 'rice', 'india gate'], url: 'https://images.openfoodfacts.org/images/products/069/022/510/1134/front_en.25.400.jpg' },
  { match: ['atta', 'aashirvaad', 'wheat flour'], url: 'https://images.openfoodfacts.org/images/products/890/172/501/6838/front_en.7.400.jpg' },
  { match: ['tata salt', 'iodized salt', 'salt'], url: 'https://images.openfoodfacts.org/images/products/890/404/390/1015/front_en.34.400.jpg' },
  { match: ['fortune', 'sunflower oil', 'cooking oil'], url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80' },
  { match: ['maggi', 'noodles', 'instant noodle'], url: 'https://images.openfoodfacts.org/images/products/890/105/801/7687/front_en.13.400.jpg' },
  { match: ['toor dal', 'dal', 'lentils', 'sampann'], url: 'https://images.unsplash.com/photo-1585994192704-58673a5a415a?w=600&auto=format&fit=crop&q=80' },
  { match: ['turmeric', 'haldi', 'everest', 'garam masala'], url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80' },
  { match: ['amul milk', 'taaza', 'toned milk', 'cow milk'], url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' },
  { match: ['amul butter', 'butter', 'salted butter'], url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80' },
  { match: ['paneer', 'cottage cheese', 'mother dairy'], url: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=600&auto=format&fit=crop&q=80' },
  { match: ['cheese slice', 'cheese', 'britannia cheese'], url: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?w=600&auto=format&fit=crop&q=80' },
  { match: ['everyday', 'dairy whitener', 'milk powder'], url: 'https://images.unsplash.com/photo-1584947921538-23f46f4be084?w=600&auto=format&fit=crop&q=80' },
  { match: ['ghee', 'desi ghee', 'amul ghee'], url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
  { match: ['coca-cola', 'coca cola', 'coke'], url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80' },
  { match: ['nescafe', 'coffee', 'instant coffee'], url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
  { match: ['tea', 'taj mahal', 'chai', 'tea leaves'], url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80' },
  { match: ['real', 'fruit juice', 'mixed fruit'], url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80' },
  { match: ['bisleri', 'mineral water', 'water bottle'], url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80' },
  { match: ['colgate', 'toothpaste', 'brush'], url: 'https://images.unsplash.com/photo-1559591937-e160e1d8847f?w=600&auto=format&fit=crop&q=80' },
  { match: ['lifebuoy', 'soap', 'bath soap'], url: 'https://images.unsplash.com/photo-1607006314177-e6f7724214f7?w=600&auto=format&fit=crop&q=80' },
  { match: ['shampoo', 'head & shoulders', 'hair wash'], url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80' },
  { match: ['body wash', 'dove', 'shower gel'], url: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=600&auto=format&fit=crop&q=80' },
  { match: ['nivea', 'skin cream', 'moisturizer'], url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80' },
  { match: ['surf excel', 'detergent', 'washing powder', 'liquid detergent'], url: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=600&auto=format&fit=crop&q=80' },
  { match: ['vim', 'dishwash', 'dish gel', 'lemon dishwash'], url: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=600&auto=format&fit=crop&q=80' },
  { match: ['harpic', 'toilet cleaner', 'disinfectant'], url: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=600&auto=format&fit=crop&q=80' },
  { match: ['lizol', 'floor cleaner', 'surface cleaner'], url: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80' },
  { match: ['hit', 'insect spray', 'mosquito'], url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80' },
  { match: ['onion', 'onions', 'red onion'], url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80' },
  { match: ['tomato', 'tomatoes'], url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80' },
  { match: ['potato', 'potatoes', 'aloo'], url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80' },
  { match: ['spinach', 'palak', 'baby spinach'], url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80' },
  { match: ['apple', 'apples', 'red apple'], url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80' },
  { match: ['banana', 'bananas'], url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80' },
  { match: ['orange', 'oranges', 'nagpur orange'], url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&auto=format&fit=crop&q=80' }
];

/**
 * Returns a fallback image based on product category
 */
export const getCategoryFallbackImage = (category = 'Default') => {
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES['Default'];
};

/**
 * Checks our high-relevance curated image registry by text query
 */
export const getCuratedProductImage = (queryText) => {
  if (!queryText) return null;
  const lower = queryText.toLowerCase();

  for (const entry of BRAND_KEYWORD_IMAGES) {
    if (entry.match.some(keyword => lower.includes(keyword))) {
      return entry.url;
    }
  }
  return null;
};

/**
 * Fetches an authentic product image directly from internet sources:
 * 1. Open Food Facts (Barcode lookup or Text Search)
 * 2. Wikipedia / Wikimedia Commons API
 * 3. High-relevance Curated Registry
 * 4. Category-specific Fallback
 *
 * @param {string} productName - Product name
 * @param {string} barcode - Barcode (optional)
 * @param {string} category - Category (optional)
 * @returns {Promise<{ imageUrl: string, source: string }>}
 */
export const fetchProductImageFromInternet = async (productName = '', barcode = '', category = '') => {
  const cleanName = productName.trim();
  const cleanBarcode = barcode.trim();

  // Tier 1: Open Food Facts by Barcode (Fastest & most accurate packaging photo)
  if (cleanBarcode && /^\d+$/.test(cleanBarcode)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const img = data.product.image_front_url || 
                      data.product.image_url || 
                      data.product.image_front_small_url ||
                      data.product.selected_images?.front?.display?.en;
          if (img) {
            return { imageUrl: img, source: 'Open Food Facts (Barcode)' };
          }
        }
      }
    } catch (e) {
      console.warn('Open Food Facts barcode lookup skipped:', e.message);
    }
  }

  // Tier 2: Open Food Facts by Product Name Search
  if (cleanName.length > 2) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Clean query to remove units like "5kg", "1L", "100g" for better search matching
      const simplifiedQuery = cleanName
        .replace(/\b\d+(\.\d+)?\s*(kg|g|gm|l|ml|pcs|pack|combo)\b/gi, '')
        .trim();

      const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(simplifiedQuery)}&search_simple=1&action=process&json=1&page_size=5`;
      
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          for (const item of data.products) {
            const img = item.image_front_url || 
                        item.image_url || 
                        item.image_front_small_url ||
                        item.selected_images?.front?.display?.en;
            if (img) {
              return { imageUrl: img, source: 'Open Food Facts (Search)' };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Open Food Facts name search skipped:', e.message);
    }
  }

  // Tier 3: Wikimedia Commons / Wikipedia PageImages Search
  if (cleanName.length > 2) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&pithumbsize=600&generator=search&gsrsearch=${encodeURIComponent(cleanName)}&gsrlimit=3`;
      const res = await fetch(wikiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.query && data.query.pages) {
          const pages = Object.values(data.query.pages);
          for (const page of pages) {
            if (page.thumbnail?.source) {
              return { imageUrl: page.thumbnail.source, source: 'Wikimedia' };
            }
          }
        }
      }
    } catch (e) {
      console.warn('Wikipedia pageimages skipped:', e.message);
    }
  }

  // Tier 4: Curated Retail Registry (Matching known brands and fresh produce)
  const curatedMatch = getCuratedProductImage(`${cleanName} ${cleanBarcode}`);
  if (curatedMatch) {
    return { imageUrl: curatedMatch, source: 'Curated Catalog' };
  }

  // Tier 5: Category Fallback
  return { 
    imageUrl: getCategoryFallbackImage(category), 
    source: 'Category Visual' 
  };
};
