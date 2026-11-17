export const formatNumber = (value: number | string, prefix: string = ''): string => {
  if (value === "---") return "---";
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "---";
  
  if (num >= 1000000) {
    return `${prefix}${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${prefix}${(num / 1000).toFixed(1)}K`;
  } else if (prefix === '$') {
    return `${prefix}${num.toFixed(0)}`;
  } else {
    return `${prefix}${num.toFixed(0)}`;
  }
};

export const formatGoalTarget = (value: number | string, prefix: string = ''): string => {
  if (value === "---") return "---";
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "---";
  
  // For millions, show one decimal place
  if (num >= 1000000) {
    return `${prefix}${(num / 1000000).toFixed(1)}M`;
  } 
  // For thousands, show as integer K
  else if (num >= 1000) {
    return `${prefix}${Math.round(num / 1000)}K`;
  } 
  // For small numbers with prefix (like $), show as integer
  else if (prefix === '$') {
    return `${prefix}${Math.round(num)}`;
  }
  // For decimals less than 1 (like ratings), show 2 decimal places
  else if (num < 1 && num > 0) {
    return `${prefix}${num.toFixed(2)}`;
  }
  // Default: show as integer
  else {
    return `${prefix}${Math.round(num)}`;
  }
};

export const formatCurrency = (value: number | string): string => {
  if (value === "---") return "---";
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "---";
  
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  } else {
    return `$${num.toFixed(0)}`;
  }
};

// Enhanced currency formatting for executive dashboards with appropriate precision
export const formatCurrencyPrecise = (value: number | string): string => {
  if (value === "---") return "---";
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "---";
  
  // Executive-appropriate precision based on magnitude
  if (num >= 10000000) {
    // $10M+: Show as $XX.XM (1 decimal) - e.g., $41.7M, $27.1M
    return `$${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000000) {
    // $1M-$10M: Show as $X.XXM (2 decimals) - e.g., $5.42M, $1.23M
    return `$${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 100000) {
    // $100K-$1M: Show as $XXXK (no decimal) for readability
    return `$${Math.round(num / 1000)}K`;
  } else if (num >= 10000) {
    // $10K-$100K: Show as $XX.XK (1 decimal) for precision
    return `$${(num / 1000).toFixed(1)}K`;
  } else if (num >= 1000) {
    // $1K-$10K: Show as $X.XK (1 decimal)
    return `$${(num / 1000).toFixed(1)}K`;
  } else {
    // Under $1K: Show as whole dollars
    return `$${Math.round(num)}`;
  }
};