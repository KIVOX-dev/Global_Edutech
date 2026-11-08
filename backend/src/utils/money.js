export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const inr = (n) => `Rs. ${round2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
