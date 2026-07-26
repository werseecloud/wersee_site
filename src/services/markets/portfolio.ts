export type PortfolioTransaction = {
  type: 'buy' | 'sell' | 'dividend' | 'fee' | 'cash_deposit' | 'cash_withdrawal';
  quantity?: string | number | null;
  pricePerUnit?: string | number | null;
  fee?: string | number | null;
};

const SCALE = 1_000_000_000_000n;

function toScaled(value: string | number | null | undefined): bigint {
  if (value === null || value === undefined || value === '') return 0n;
  const text = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) throw new Error(`Invalid decimal: ${text}`);
  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction = ''] = unsigned.split('.');
  const scaled = BigInt(whole || '0') * SCALE + BigInt(fraction.padEnd(12, '0').slice(0, 12));
  return negative ? -scaled : scaled;
}

function multiply(a: bigint, b: bigint) {
  return (a * b) / SCALE;
}

function divide(a: bigint, b: bigint) {
  if (b === 0n) return 0n;
  return (a * SCALE) / b;
}

function fromScaled(value: bigint) {
  const negative = value < 0n;
  const unsigned = negative ? -value : value;
  const whole = unsigned / SCALE;
  const fraction = String(unsigned % SCALE).padStart(12, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function calculateWeightedAveragePosition(transactions: PortfolioTransaction[], latestPrice?: string | number | null) {
  let quantity = 0n;
  let costBasis = 0n;
  let realized = 0n;
  let dividends = 0n;
  let fees = 0n;

  for (const tx of transactions) {
    const txQuantity = toScaled(tx.quantity);
    const txPrice = toScaled(tx.pricePerUnit);
    const txFee = toScaled(tx.fee);

    if (tx.type === 'buy') {
      quantity += txQuantity;
      costBasis += multiply(txQuantity, txPrice) + txFee;
      fees += txFee;
    } else if (tx.type === 'sell') {
      const averageCost = quantity > 0n ? divide(costBasis, quantity) : 0n;
      const allocatedCost = multiply(txQuantity, averageCost);
      const proceeds = multiply(txQuantity, txPrice);
      realized += proceeds - allocatedCost - txFee;
      quantity -= txQuantity;
      costBasis -= allocatedCost;
      fees += txFee;
      if (quantity <= 0n) {
        quantity = 0n;
        costBasis = 0n;
      }
    } else if (tx.type === 'dividend') {
      dividends += multiply(txQuantity || SCALE, txPrice);
    } else if (tx.type === 'fee') {
      realized -= txFee || txPrice;
      fees += txFee || txPrice;
    }
  }

  realized += dividends;
  const currentValue = latestPrice === null || latestPrice === undefined ? null : multiply(quantity, toScaled(latestPrice));
  const unrealized = currentValue === null ? null : currentValue - costBasis;
  const returnPercentage = costBasis > 0n && unrealized !== null ? multiply(divide(unrealized, costBasis), 100n * SCALE) : null;

  return {
    positionQuantity: fromScaled(quantity),
    remainingCostBasis: fromScaled(costBasis),
    weightedAverageCost: quantity > 0n ? fromScaled(divide(costBasis, quantity)) : null,
    currentValue: currentValue === null ? null : fromScaled(currentValue),
    realizedProfitLoss: fromScaled(realized),
    unrealizedProfitLoss: unrealized === null ? null : fromScaled(unrealized),
    totalProfitLoss: unrealized === null ? fromScaled(realized) : fromScaled(realized + unrealized),
    totalFees: fromScaled(fees),
    returnPercentage: returnPercentage === null ? null : fromScaled(returnPercentage),
  };
}
