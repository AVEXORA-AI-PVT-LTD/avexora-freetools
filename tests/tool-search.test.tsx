/** @vitest-environment jsdom */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { categories } from "@/tools/categories";
import { DISPLAYED_TOOL_COUNT, toolsByCategory } from "@/tools/registry";
import { ToolSearch } from "@/components/tools/tool-search";
import { buildSearchItems } from "@/components/tools/search-items";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: () => {},
    back: () => {},
    prefetch: () => {},
  }),
}));

const items = buildSearchItems(categories, toolsByCategory);

function filterMatches(q: string) {
  const needle = q.toLowerCase();
  return items.filter(
    (t) =>
      t.name.toLowerCase().includes(needle) ||
      t.categoryName.toLowerCase().includes(needle),
  );
}

let container: HTMLDivElement;
let root: Root;

function mount() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <ToolSearch items={items} displayCount={DISPLAYED_TOOL_COUNT} />,
    );
  });
  const input = container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  act(() => input.focus());
  return input;
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function press(input: HTMLInputElement, key: string) {
  act(() => {
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  });
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  mockPush.mockReset();
  vi.restoreAllMocks();
});

describe("homepage search — tool count placeholder", () => {
  it("uses the centralized 130+ floor count", () => {
    const input = mount();
    expect(input.placeholder).toBe("Search 130+ Avex tools…");
  });
});

describe("homepage search — result completeness", () => {
  for (const q of ["PDF", "Image", "Calculator", "GST", "HR", "Invoice", "Generator", "AI", "JSON"]) {
    it(`every match for "${q}" is rendered in the dropdown (no slice)`, () => {
      const input = mount();
      const expected = filterMatches(q);
      expect(expected.length).toBeGreaterThan(0);
      type(input, q);
      const options = container.querySelectorAll('[role="option"]');
      expect(options.length).toBe(expected.length);
    });
  }

  it("PDF matches enough tools to exceed the old 8-result window", () => {
    const input = mount();
    type(input, "PDF");
    const options = container.querySelectorAll('[role="option"]');
    expect(options.length).toBe(filterMatches("PDF").length);
    expect(options.length).toBeGreaterThan(8);
  });

  it("all arrows can reach the last PDF match", () => {
    const input = mount();
    type(input, "PDF");
    const expected = filterMatches("PDF");
    for (let i = 0; i < expected.length; i++) press(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      `search-option-${expected.length - 1}`,
    );
    expect(
      document
        .getElementById(`search-option-${expected.length - 1}`)
        ?.getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("ArrowUp walks back and ends at no selection", () => {
    const input = mount();
    type(input, "PDF");
    const expected = filterMatches("PDF");
    press(input, "ArrowDown");
    press(input, "ArrowUp");
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
    for (let i = 0; i < expected.length; i++) press(input, "ArrowDown");
    press(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      `search-option-${expected.length - 1}`,
    );
  });

  it("the active result is scrolled into view on every index change", () => {
    const input = mount();
    type(input, "PDF");
    const expected = filterMatches("PDF");
    press(input, "ArrowDown");
    for (let i = 0; i < expected.length; i++) {
      press(input, "ArrowDown");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    }
  });
});

describe("homepage search — keyboard interaction", () => {
  it("Enter opens the highlighted result via the trusted route", () => {
    const input = mount();
    type(input, "Invoice");
    const expected = filterMatches("Invoice");
    press(input, "ArrowDown");
    press(input, "ArrowDown");
    press(input, "Enter");
    const m = expected[1];
    expect(mockPush).toHaveBeenCalledWith(`/${m.category}/${m.slug}`);
  });

  it("Enter with no highlight opens the best (first) match", () => {
    const input = mount();
    type(input, "JSON");
    const expected = filterMatches("JSON");
    press(input, "Enter");
    expect(mockPush).toHaveBeenCalledWith(
      `/${expected[0].category}/${expected[0].slug}`,
    );
  });

  it("Escape closes the dropdown, keeps the query, and typing reopens", () => {
    const input = mount();
    type(input, "PDF");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    press(input, "Escape");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(input.value).toBe("PDF");
    expect(document.activeElement).toBe(input);
    expect(mockPush).not.toHaveBeenCalled();
    type(input, "Calc");
    expect(input.getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking outside closes the dropdown", () => {
    const input = mount();
    type(input, "PDF");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    act(() => {
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("homepage search — matching and empty states", () => {
  it("matches by tool name and category, once, per tool", () => {
    const input = mount();
    type(input, "PDF");
    const slugs = Array.from(
      container.querySelectorAll('[role="option"] a'),
      (a) => a.getAttribute("href"),
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("shows the existing empty state for no matches", () => {
    const input = mount();
    type(input, "zzzzz");
    expect(container.querySelectorAll('[role="option"]').length).toBe(0);
    expect(container.textContent).toContain("No tools match");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("clearing the query restores the closed/empty default", () => {
    const input = mount();
    type(input, "PDF");
    expect(container.querySelectorAll('[role="option"]').length).toBeGreaterThan(0);
    type(input, "");
    expect(container.querySelectorAll('[role="option"]').length).toBe(0);
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("homepage search — dropdown mechanics", () => {
  it("listbox is scrollable and capped below the viewport height", () => {
    const input = mount();
    type(input, "Calculator");
    const listbox = container.querySelector('[role="listbox"]')!;
    const classes = listbox.getAttribute("class")!;
    expect(classes).toContain("overflow-y-auto");
    expect(classes).not.toContain("overflow-hidden");
    expect(classes).toContain("max-h-72");
  });

  it("exposes combobox/listbox/option roles with the right ids", () => {
    const input = mount();
    type(input, "Image");
    expect(input.getAttribute("aria-controls")).toBe("search-listbox");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    const listbox = container.querySelector('[role="listbox"]')!;
    expect(listbox.id).toBe("search-listbox");
    expect(container.querySelectorAll('[role="option"]').length).toBe(
      filterMatches("Image").length,
    );
  });
});

describe("future tool registry integration", () => {
  it("derives every searchable tool from the live registry, not a hardcoded list", () => {
    const names = buildSearchItems(categories, toolsByCategory);
    expect(names.length).toBeGreaterThan(130);
    expect(names.every((t) => t.slug.length > 0)).toBe(true);
  });
});