import type { ComputeFn, ResultItem, ResultTable } from "@/types/tools";
import { formatINR, formatPercent, toNonNegative, toNonNegativeOr } from "../format";

export type MarketplaceId = "custom" | "amazon" | "flipkart";
export type FeeType = "percent" | "fixed";

export const MARKETPLACE_LABELS: Record<MarketplaceId, string> = {
  custom: "No marketplace (custom fee)",
  amazon: "Amazon India",
  flipkart: "Flipkart India",
};

export interface ProfitMarginInput {
  /** Customer-facing selling price (S). */
  sellingPrice: number;
  /** Product / cost price (C). */
  cost: number;
  shippingCost: number;
  packagingCost: number;
  additionalCost: number;
  marketplace: MarketplaceId;
  feeType: FeeType;
  /** Fee value: percentage (in %) when feeType is "percent", amount in ₹ when "fixed". */
  fee: number;
}

export interface ProfitMarginCalculation {
  marketplace: MarketplaceId;
  marketplaceLabel: string;
  feeType: FeeType;
  sellingPrice: number;
  cost: number;
  shippingCost: number;
  packagingCost: number;
  additionalCost: number;
  fee: number;
  grossProfit: number;
  marketplaceFee: number;
  totalOtherCosts: number;
  totalCost: number;
  amountAfterMarketplaceFee: number;
  netProfit: number;
  /** Profit margin (net profit ÷ selling price) in %, or null when selling price is 0. */
  profitMargin: number | null;
  /** Markup (net profit ÷ cost price) in %, or null when cost is 0. */
  markup: number | null;
  /** Markup on total cost (net profit ÷ total cost) in %, or null when total cost is 0. */
  markupOnTotalCost: number | null;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const percent = (net: number, denominator: number): number | null =>
  denominator > 0 ? (net / denominator) * 100 : null;

/**
 * Pure profit-margin & markup calculation for a marketplace seller.
 *
 * - Gross profit = selling price − product cost.
 * - Marketplace fee = percentage of the selling price, or a fixed amount.
 * - Total cost = product cost + shipping + packaging + other costs + fee
 *   (the fully loaded cost of the order, fee included).
 * - Net profit = selling price − total cost (equivalently gross profit − fee −
 *   shipping − packaging − other).
 * - Margin is always net profit ÷ selling price; markup is net profit ÷ cost
 *   price (with a separate markup on total cost when other costs are present).
 * - Negative net profit is reported as a loss; the percentages are never
 *   clamped and show "—" when the denominator is zero (never NaN/Infinity).
 *
 * Money values are rounded to a paisa; percentages are kept unrounded for the
 * caller to format (or null when the relevant denominator is zero).
 * Marketplace fees are never assumed — the caller supplies the actual rate.
 */
export function calculateProfitAndMarkup(input: ProfitMarginInput): ProfitMarginCalculation {
  const marketplaceLabel = MARKETPLACE_LABELS[input.marketplace];

  const grossProfit = round2(input.sellingPrice - input.cost);
  const marketplaceFee =
    input.feeType === "percent"
      ? round2((input.sellingPrice * input.fee) / 100)
      : round2(input.fee);
  const totalOtherCosts = round2(input.shippingCost + input.packagingCost + input.additionalCost);
  const totalCost = round2(input.cost + totalOtherCosts + marketplaceFee);
  const amountAfterMarketplaceFee = round2(input.sellingPrice - marketplaceFee);
  const netProfit = round2(input.sellingPrice - totalCost);

  return {
    marketplace: input.marketplace,
    marketplaceLabel,
    feeType: input.feeType,
    sellingPrice: round2(input.sellingPrice),
    cost: round2(input.cost),
    shippingCost: round2(input.shippingCost),
    packagingCost: round2(input.packagingCost),
    additionalCost: round2(input.additionalCost),
    fee: round2(input.fee),
    grossProfit,
    marketplaceFee,
    totalOtherCosts,
    totalCost,
    amountAfterMarketplaceFee,
    netProfit,
    profitMargin: percent(netProfit, input.sellingPrice),
    markup: percent(netProfit, input.cost),
    markupOnTotalCost: percent(netProfit, totalCost),
  };
}

function rupee(value: number): string {
  return formatINR(value);
}

const pctOrDash = (value: number | null): string => (value === null ? "—" : formatPercent(value));

function isBlank(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

export const computeProfitMarginMarkup: ComputeFn = (values) => {
  const sellingPrice = toNonNegative(values.sellingPrice);
  if (sellingPrice === null) {
    return { error: "Enter a valid selling price (zero or more)." };
  }

  const cost = toNonNegative(values.cost);
  if (cost === null) return { error: "Enter a valid cost price (zero or more)." };

  const shippingCost = toNonNegativeOr(values.shippingCost, 0);
  if (shippingCost === null) return { error: "Enter a valid shipping cost (zero or more)." };

  const packagingCost = toNonNegativeOr(values.packagingCost, 0);
  if (packagingCost === null) return { error: "Enter a valid packaging cost (zero or more)." };

  const additionalCost = toNonNegativeOr(values.additionalCost, 0);
  if (additionalCost === null) return { error: "Enter a valid additional cost (zero or more)." };

  const marketplaceValue = String(values.marketplace ?? "custom");
  if (!(marketplaceValue in MARKETPLACE_LABELS)) return { error: "Select a marketplace." };
  const marketplace = marketplaceValue as MarketplaceId;

  const feeTypeValue = String(values.feeType ?? "percent");
  if (feeTypeValue !== "percent" && feeTypeValue !== "fixed") return { error: "Select a fee type." };
  const feeType = feeTypeValue as FeeType;

  const feeInput = feeType === "percent" ? values.feePercent : values.feeFixed;
  let fee: number | null;
  if (marketplace === "custom") {
    fee = toNonNegativeOr(feeInput, 0);
  } else {
    fee = toNonNegative(feeInput);
    if (fee === null) {
      const marketLabel = MARKETPLACE_LABELS[marketplace];
      return {
        error: isBlank(feeInput)
          ? `Enter the ${marketLabel} fee you actually pay (${feeType === "percent" ? "percentage" : "fixed amount"}) — marketplace fees vary by category, seller plan, fulfilment and taxes.`
          : "Enter a valid fee (zero or more).",
      };
    }
  }
  if (fee === null) return { error: "Enter a valid fee (zero or more)." };

  const calc = calculateProfitAndMarkup({
    sellingPrice,
    cost,
    shippingCost,
    packagingCost,
    additionalCost,
    marketplace,
    feeType,
    fee,
  });

  const feeTypeLabel = feeType === "percent" ? formatPercent(fee) : rupee(fee);
  const netLabel = calc.netProfit < 0 ? "Net loss" : "Net profit";

  const results: ResultItem[] = [
    { label: "Gross profit", value: rupee(calc.grossProfit) },
    { label: "Marketplace fee", value: rupee(calc.marketplaceFee) },
    { label: "Total cost (incl. marketplace fee & others)", value: rupee(calc.totalCost) },
    { label: netLabel, value: rupee(calc.netProfit), emphasis: true },
    { label: "Amount after marketplace fee", value: rupee(calc.amountAfterMarketplaceFee) },
    { label: "Profit margin (on selling price)", value: pctOrDash(calc.profitMargin), emphasis: true },
    { label: "Markup (on cost price)", value: pctOrDash(calc.markup), emphasis: true },
  ];
  if (calc.totalOtherCosts > 0 && calc.markupOnTotalCost !== null) {
    results.push({ label: "Markup (on total cost)", value: formatPercent(calc.markupOnTotalCost) });
  }

  const tables: ResultTable[] = [
    {
      title: "How it was calculated",
      headers: ["Step", "Value"],
      rows: [
        ["Selling price (S)", rupee(calc.sellingPrice)],
        ["Product cost (C)", rupee(calc.cost)],
        ["Gross profit = S − C", rupee(calc.grossProfit)],
        [`Marketplace fee (${feeTypeLabel})`, rupee(calc.marketplaceFee)],
        ["Shipping + packaging + other costs", rupee(calc.totalOtherCosts)],
        ["Total cost = C + shipping + packaging + other + fee", rupee(calc.totalCost)],
        ["Amount after marketplace fee = S − fee", rupee(calc.amountAfterMarketplaceFee)],
        ["Net profit = selling price − total cost", rupee(calc.netProfit)],
        ["Profit margin = net profit ÷ selling price", pctOrDash(calc.profitMargin)],
        ["Markup = net profit ÷ cost price", pctOrDash(calc.markup)],
        ["Markup on total cost = net profit ÷ total cost", pctOrDash(calc.markupOnTotalCost)],
      ],
    },
    {
      title: "Marketplace fees & assumptions",
      headers: ["Item", "Value"],
      rows: [
        ["Marketplace", calc.marketplaceLabel],
        ["Fee type", feeType === "percent" ? "Percentage of selling price" : "Fixed amount per order"],
        ["Fee entered", feeTypeLabel],
        ["Named-marketplace fees", "Amazon India and Flipkart fees vary by category, seller plan, fulfilment method, weight slabs and taxes. This calculator never assumes a rate — enter the fee you actually pay from your seller dashboard."],
        ["GST", "The selling price is taken as the customer-facing price; no GST is added or deducted automatically. Net profit is before income taxes."],
        ["Scope", "Net profit is profit per unit before fixed costs (rent, staff, subscriptions) and before income tax — use the break-even calculator for fixed-cost math."],
        ["Disclaimer", "Results are estimates for pricing decisions. Verify current marketplace fees and your actual costs before relying on any figure."],
      ],
    },
  ];

  return { results, tables };
};