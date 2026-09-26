/**
 * XLSX / Excel SpreadsheetML Exporter Utility
 * Generates multi-sheet Excel workbooks with summary cards, formatted tables, and sheet tabs.
 */

export interface XLSXSheet {
  name: string;
  columns: { key: string; header: string; width?: number }[];
  rows: Record<string, any>[];
  summary?: { label: string; value: any }[];
}

function escapeXML(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generates an Excel SpreadsheetML XML file (.xlsx/.xml) with multiple sheets, styling, and summary cards.
 */
export function generateXLSX(title: string, sheets: XLSXSheet[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXML(title)}</Title>
  <Created>${new Date().toISOString()}</Created>
  <Company>Avex Tools</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#C2410C"/>
  </Style>
  <Style ss:ID="SubtitleStyle">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#EA580C" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SummaryHeaderStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="NumberStyle">
   <NumberFormat ss:Format="#,##0"/>
  </Style>
  <Style ss:ID="CurrencyStyle">
   <NumberFormat ss:Format="&#34;₹&#34;#,##0.00"/>
  </Style>
  <Style ss:ID="PercentStyle">
   <NumberFormat ss:Format="0.0%"/>
  </Style>
 </Styles>`;

  const xmlSheets = sheets.map((sheet) => {
    let sheetXml = ` <Worksheet ss:Name="${escapeXML(sheet.name)}">\n  <Table>\n`;

    // Column widths
    sheet.columns.forEach((col) => {
      const w = col.width || 120;
      sheetXml += `   <Column ss:Width="${w}"/>\n`;
    });

    // Sheet Title
    sheetXml += `   <Row ss:Height="24">\n    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">${escapeXML(sheet.name)}</Data></Cell>\n   </Row>\n`;
    sheetXml += `   <Row>\n    <Cell ss:StyleID="SubtitleStyle"><Data ss:Type="String">Report: ${escapeXML(title)} | Generated: ${new Date().toLocaleDateString()}</Data></Cell>\n   </Row>\n`;
    sheetXml += `   <Row/>\n`;

    // Summary Box if present
    if (sheet.summary && sheet.summary.length > 0) {
      sheetXml += `   <Row ss:Height="20">\n    <Cell ss:StyleID="SummaryHeaderStyle"><Data ss:Type="String">Metric</Data></Cell>\n    <Cell ss:StyleID="SummaryHeaderStyle"><Data ss:Type="String">Value</Data></Cell>\n   </Row>\n`;
      sheet.summary.forEach((sum) => {
        sheetXml += `   <Row>\n    <Cell><Data ss:Type="String">${escapeXML(sum.label)}</Data></Cell>\n`;
        if (typeof sum.value === "number") {
          sheetXml += `    <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${sum.value}</Data></Cell>\n`;
        } else {
          sheetXml += `    <Cell><Data ss:Type="String">${escapeXML(sum.value)}</Data></Cell>\n`;
        }
        sheetXml += `   </Row>\n`;
      });
      sheetXml += `   <Row/>\n`;
    }

    // Header Row
    sheetXml += `   <Row ss:Height="22">\n`;
    sheet.columns.forEach((col) => {
      sheetXml += `    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>\n`;
    });
    sheetXml += `   </Row>\n`;

    // Data Rows
    sheet.rows.forEach((row) => {
      sheetXml += `   <Row>\n`;
      sheet.columns.forEach((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) {
          sheetXml += `    <Cell><Data ss:Type="String"></Data></Cell>\n`;
        } else if (typeof val === "number") {
          sheetXml += `    <Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">${val}</Data></Cell>\n`;
        } else if (typeof val === "boolean") {
          sheetXml += `    <Cell><Data ss:Type="String">${val ? "TRUE" : "FALSE"}</Data></Cell>\n`;
        } else {
          sheetXml += `    <Cell><Data ss:Type="String">${escapeXML(val)}</Data></Cell>\n`;
        }
      });
      sheetXml += `   </Row>\n`;
    });

    sheetXml += `  </Table>\n </Worksheet>\n`;
    return sheetXml;
  });

  return xmlHeader + "\n" + xmlSheets.join("\n") + "</Workbook>";
}
