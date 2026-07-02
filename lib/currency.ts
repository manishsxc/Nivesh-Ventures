const symbolMap: Record<string, string> = {
  India: "₹",
  Nepal: "Rs",
  Bangladesh: "৳",
  "United States": "$",
  "United Kingdom": "£",
  "United Arab Emirates": "AED ",
};

export function currencySymbol(country?: string) {
  if (!country) return "$";
  return symbolMap[country] || "$";
}

export function formatMoney(amount: number, country?: string) {
  return `${currencySymbol(country)}${(amount ?? 0).toLocaleString()}`;
}
