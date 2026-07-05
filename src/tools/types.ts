import type { ComponentType } from "react";

export type ToolKind = "calculator" | "generator" | "file-tool" | "ai-writer";

export type CategorySlug =
  | "finance-calculators"
  | "invoicing-billing"
  | "hr-payroll"
  | "marketing-seo"
  | "ai-writers"
  | "pdf-tools"
  | "image-tools"
  | "text-data-tools"
  | "business-legal"
  | "developer-web";

export interface CategoryDef {
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  ebosModule: string;
  ebosPath: string;
  ctaHeadline: string;
  ctaBody: string;
}

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue>;

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: "number" | "text" | "textarea" | "select" | "date" | "checkbox";
  defaultValue?: FieldValue;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: FieldOption[];
  unit?: string;
  help?: string;
  optional?: boolean;
  rows?: number;
}

export interface ResultItem {
  label: string;
  value: string;
  emphasis?: boolean;
}

export type ComputeResult = { results: ResultItem[] } | { error: string };
export type ComputeFn = (values: FieldValues) => ComputeResult;

export interface GeneratedOutput {
  /** Plain text output shown in a copyable block. */
  text: string;
  /** Suggested filename when downloaded (e.g. "robots.txt"). */
  filename?: string;
}

export type GenerateResult = GeneratedOutput | { error: string };
export type GenerateFn = (values: FieldValues) => GenerateResult;

export interface FaqItem {
  question: string;
  answer: string;
}

interface ToolBase {
  slug: string;
  category: CategorySlug;
  name: string;
  tagline: string;
  seoDescription: string;
  /** "About / how it works" paragraphs rendered below the tool (SEO body copy). */
  about: string[];
  faq: FaqItem[];
  /** Slugs of related tools for internal linking. */
  related: string[];
  /** Require an email before download/copy of produced documents. */
  emailGate?: boolean;
}

export interface CalculatorTool extends ToolBase {
  kind: "calculator";
  fields: FieldDef[];
  compute: ComputeFn;
  /** Recompute on every input change instead of on submit. */
  autoCompute?: boolean;
  submitLabel?: string;
}

export interface GeneratorTool extends ToolBase {
  kind: "generator";
  /** Declarative form + pure generate function... */
  fields?: FieldDef[];
  generate?: GenerateFn;
  /** ...or a fully custom client component for complex tools (e.g. invoice builder). */
  component?: ComponentType;
  submitLabel?: string;
}

export interface FileTool extends ToolBase {
  kind: "file-tool";
  /** Custom client component handling upload → process → download entirely in-browser. */
  component: ComponentType;
}

export interface AiWriterTool extends ToolBase {
  kind: "ai-writer";
  fields: FieldDef[];
  submitLabel?: string;
}

export type ToolConfig = CalculatorTool | GeneratorTool | FileTool | AiWriterTool;
