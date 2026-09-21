import { cn } from '../../lib/utils';
import { useSupermarket } from '../../context/SupermarketContext';
import { useLanguage } from '../../context/LanguageContext';

export function AvailabilityBadge({ stock, reorderLevel = 15, className }) {
  const { getProductAvailability } = useSupermarket();
  const { t } = useLanguage();
  
  // Robust stock status computation
  let statusKey = 'IN_STOCK';
  const numericStock = Number(stock);
  const numericReorder = Number(reorderLevel) || 15;

  if (isNaN(numericStock) || numericStock <= 0) {
    statusKey = 'OUT_OF_STOCK';
  } else if (numericStock <= numericReorder) {
    statusKey = 'LOW_STOCK';
  } else {
    statusKey = 'IN_STOCK';
  }

  // Also check helper if provided
  if (getProductAvailability) {
    const res = getProductAvailability(stock, reorderLevel);
    if (typeof res === 'string') {
      statusKey = res;
    } else if (res && res.status) {
      statusKey = res.status;
    }
  }
  
  if (statusKey === 'IN_STOCK') {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/60 shadow-2xs", className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        ✓ {t('in_stock', 'In Stock')}
      </span>
    );
  }
  
  if (statusKey === 'LOW_STOCK') {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/60 shadow-2xs", className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        ⚠ {t('low_stock', 'Low Stock')} ({numericStock} {t('units_left', 'left')})
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 dark:border dark:border-rose-800/60 shadow-2xs", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      ✕ {t('out_of_stock', 'Out of Stock')}
    </span>
  );
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300",
    primary: "bg-primary-100 text-primary-800 dark:bg-primary-950/70 dark:text-primary-300",
  };
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
