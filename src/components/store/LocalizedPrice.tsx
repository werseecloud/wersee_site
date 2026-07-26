import React, { useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

type LocalizedPriceProps = {
  amount: number | string | null | undefined;
  baseCurrency?: string | null;
  className?: string;
  subtextClassName?: string;
  showOriginal?: boolean;
};

export const LocalizedPrice = ({
  amount,
  baseCurrency = 'EUR',
  className,
  subtextClassName = 'mt-1 text-xs font-medium text-gray-500',
  showOriginal = true,
}: LocalizedPriceProps) => {
  const { currency, formatBasePrice, refreshRate, rateStatus, rateError } = useLocale();
  const numericAmount = Number(amount) || 0;
  const base = (baseCurrency || 'EUR').toUpperCase();
  const price = formatBasePrice(numericAmount, base);

  useEffect(() => {
    if (numericAmount > 0 && base !== currency) {
      refreshRate(base, currency);
    }
  }, [base, currency, numericAmount, refreshRate]);

  if (numericAmount === 0) {
    return <span className={className}>Free</span>;
  }

  return (
    <span className="inline-flex flex-col">
      <span className={className}>{price.text}</span>
      {rateStatus === 'loading' && base !== currency && (
        <span className={subtextClassName}>
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
          Lokale prijs laden
        </span>
      )}
      {rateStatus === 'error' && base !== currency && (
        <span className={subtextClassName}>
          <AlertCircle className="mr-1 inline h-3 w-3" />
          {rateError || 'Originele valuta getoond'}
        </span>
      )}
      {price.isConverted && showOriginal && (
        <span className={subtextClassName}>
          {price.isIndicative ? 'Indicatief' : 'Afrekenen mogelijk'} · origineel {price.originalText}
        </span>
      )}
    </span>
  );
};
