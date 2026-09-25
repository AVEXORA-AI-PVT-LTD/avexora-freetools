import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface PDFTableColumn {
  key: string;
  header: string;
  width?: number;
}

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  dateRangeText: string;
  requestedByText: string;
  summaryItems?: { label: string; value: string }[];
  columns: PDFTableColumn[];
  rows: Record<string, any>[];
}

/**
 * Generates a branded, formatted PDF document byte array using pdf-lib.
 */
export async function generatePDF(options: PDFReportOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait size
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  // Primary Theme Colors
  const primaryColor = rgb(0.91, 0.34, 0.05); // Orange #EA580C
  const darkTextColor = rgb(0.06, 0.09, 0.16); // Slate 900
  const grayTextColor = rgb(0.39, 0.45, 0.55); // Slate 500
  const lightBgColor = rgb(0.97, 0.98, 0.99); // Slate 50
  const borderColor = rgb(0.89, 0.91, 0.94); // Slate 200

  // 1. Header Banner
  page.drawRectangle({
    x: margin,
    y: y - 35,
    width: width - margin * 2,
    height: 35,
    color: primaryColor,
  });

  page.drawText("AVEX TOOLS ADMIN REPORT", {
    x: margin + 12,
    y: y - 24,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  y -= 55;

  // 2. Report Title & Subtitle
  page.drawText(options.title.toUpperCase(), {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: darkTextColor,
  });

  y -= 18;

  if (options.subtitle) {
    page.drawText(options.subtitle, {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: grayTextColor,
    });
    y -= 16;
  }

  // 3. Metadata Card Box
  page.drawRectangle({
    x: margin,
    y: y - 45,
    width: width - margin * 2,
    height: 45,
    color: lightBgColor,
    borderColor,
    borderWidth: 1,
  });

  page.drawText(`Date Range: ${options.dateRangeText}`, {
    x: margin + 12,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: darkTextColor,
  });

  page.drawText(`Generated: ${new Date().toLocaleString()}`, {
    x: margin + 12,
    y: y - 36,
    size: 9,
    font: fontRegular,
    color: grayTextColor,
  });

  page.drawText(`Requested By: ${options.requestedByText}`, {
    x: width / 2 + 10,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: darkTextColor,
  });

  y -= 65;

  // 4. Executive Summary KPI Cards
  if (options.summaryItems && options.summaryItems.length > 0) {
    page.drawText("EXECUTIVE SUMMARY", {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: darkTextColor,
    });
    y -= 15;

    const items = options.summaryItems.slice(0, 4);
    const cardWidth = (width - margin * 2 - (items.length - 1) * 10) / items.length;

    items.forEach((item, index) => {
      const cardX = margin + index * (cardWidth + 10);
      page.drawRectangle({
        x: cardX,
        y: y - 40,
        width: cardWidth,
        height: 40,
        color: lightBgColor,
        borderColor,
        borderWidth: 1,
      });

      page.drawText(item.label.toUpperCase(), {
        x: cardX + 8,
        y: y - 16,
        size: 8,
        font: fontBold,
        color: grayTextColor,
      });

      page.drawText(String(item.value), {
        x: cardX + 8,
        y: y - 32,
        size: 12,
        font: fontBold,
        color: primaryColor,
      });
    });

    y -= 55;
  }

  // 5. Data Table Header & Rows
  page.drawText("DETAILED RECORDS", {
    x: margin,
    y,
    size: 11,
    font: fontBold,
    color: darkTextColor,
  });
  y -= 15;

  // Table Column Setup
  const tableWidth = width - margin * 2;
  const colCount = options.columns.length;
  const defaultColWidth = tableWidth / Math.max(1, colCount);

  const drawTableHeader = (p: typeof page, currentY: number) => {
    p.drawRectangle({
      x: margin,
      y: currentY - 20,
      width: tableWidth,
      height: 20,
      color: rgb(0.95, 0.96, 0.98),
    });

    let xCursor = margin;
    options.columns.forEach((col) => {
      const cw = col.width || defaultColWidth;
      p.drawText(col.header.toUpperCase(), {
        x: xCursor + 5,
        y: currentY - 14,
        size: 8,
        font: fontBold,
        color: darkTextColor,
      });
      xCursor += cw;
    });

    return currentY - 20;
  };

  y = drawTableHeader(page, y);

  // Table Rows
  for (let i = 0; i < options.rows.length; i++) {
    const row = options.rows[i];

    // Page Break Check
    if (y < margin + 40) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
      y = drawTableHeader(page, y);
    }

    const rowBg = i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.98, 0.99);
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: tableWidth,
      height: 18,
      color: rowBg,
      borderColor,
      borderWidth: 0.5,
    });

    let xCursor = margin;
    options.columns.forEach((col) => {
      const cw = col.width || defaultColWidth;
      const rawVal = row[col.key];
      const valStr = rawVal !== null && rawVal !== undefined ? String(rawVal).substring(0, 25) : "-";

      page.drawText(valStr, {
        x: xCursor + 5,
        y: y - 13,
        size: 8,
        font: fontRegular,
        color: darkTextColor,
      });
      xCursor += cw;
    });

    y -= 18;
  }

  // 6. Page Numbers Footer on all pages
  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(`Avex Tools Admin Report · Page ${idx + 1} of ${pages.length}`, {
      x: margin,
      y: margin / 2,
      size: 8,
      font: fontRegular,
      color: grayTextColor,
    });
  });

  return await pdfDoc.save();
}
