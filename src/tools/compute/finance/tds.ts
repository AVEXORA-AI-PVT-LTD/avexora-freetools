import type { ComputeFn } from "@/types/tools";
import { formatINR, formatPercent, toPositive } from "../format";

export const TDS_SECTIONS: Record<string, { rate: number; label: string }> = {
  "194c-individual": {
    rate: 1,
    label: "194C — Contractor payment (individual/HUF payee)",
  },
  "194c-others": { rate: 2, label: "194C — Contractor payment (company/firm payee)" },
  "194j": { rate: 10, label: "194J — Professional or technical fees" },
  "194i-land-building": { rate: 10, label: "194I — Rent of land or building" },
  "194i-plant-machinery": { rate: 2, label: "194I — Rent of plant & machinery" },
  "194h": { rate: 2, label: "194H — Commission or brokerage" },
  "194a": { rate: 10, label: "194A — Interest (other than securities)" },
};

export const computeTds: ComputeFn = (values) => {
  const amount = toPositive(values.amount);
  const section = TDS_SECTIONS[String(values.section)];
  if (amount === null) return { error: "Enter a payment amount greater than zero." };
  if (!section) return { error: "Select a TDS section." };

  const tds = amount * (section.rate / 100);
  const net = amount - tds;

  return {
    results: [
      { label: "TDS rate applied", value: formatPercent(section.rate) },
      { label: "TDS to deduct", value: formatINR(tds), emphasis: true },
      { label: "Net amount payable", value: formatINR(net) },
      { label: "Gross payment", value: formatINR(amount) },
    ],
  };
};
