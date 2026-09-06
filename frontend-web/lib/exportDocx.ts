/**
 * exportDocx.ts — DAS CRM
 * Generates a pixel-faithful, fully editable Word (.docx) document identical in size,
 * position, layout, and styling to the A4 PDF sheet.
 *
 * Sizing and positioning:
 * - A4 Page (210mm × 297mm) with 10mm margins (matches PDF 10mm margin setting)
 * - Proportional typography calibrated in half-points (7.5pt – 12pt) to ensure a single-page fit
 * - Top official Spectro Navy (#002060) accent bar
 * - 2-Column Header: Company Initials Avatar + Details (Left), Title Badge + Doc No + Date (Right)
 * - Unified Party Details card box with Billed To & Tax Identifiers
 * - Items Table with navy headers (#002060), dynamic column widths summing to 100%, and Indian Rupee symbol (₹)
 * - Side-by-side cards: Bank Details & Amount in Words (Left) | Financial Breakdown & Navy Grand Total (Right)
 * - 2-Column Footer: Terms & Conditions (Left) | Authorized Signatory (Right)
 * - Bottom mention strip
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  convertMillimetersToTwip,
} from 'docx';

// ─── Colour Palette (Identical to A4 PDF Preview) ─────────────────────────────
const NAVY = '002060';       // Spectro Executive Navy Blue (#002060)
const WHITE = 'FFFFFF';
const SLATE_50 = 'F8FAFC';   // Card background (#F8FAFC)
const SLATE_200 = 'CBD5E1';  // Light border (#CBD5E1)
const SLATE_400 = '94A3B8';  // Muted text
const SLATE_500 = '64748B';  // Section label text (small uppercase)
const SLATE_600 = '475569';  // Regular text / addresses
const SLATE_700 = '334155';  // Dark text
const SLATE_800 = '1E293B';  // Bold headings
const SLATE_900 = '0F172A';  // Primary dark
const RED_600 = 'DC2626';    // Discounts
const GREEN_600 = '059669';  // Nil rated / Exempt

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ExportCompany {
  name: string;
  logoUrl?: string;
  address: string;
  email: string;
  phone: string;
  gstNo: string;
  panNo: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  upiId: string;
}

export interface ExportParty {
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  shippingAddress?: string;
  gstNo: string;
  panNo: string;
}

export interface ExportCustomColumn {
  id: string;
  name: string;
}

export interface ExportLineItem {
  id: string;
  productName: string;
  description?: string;
  showDescription: boolean;
  hsnCode?: string;
  customValues?: { [colId: string]: string };
  unit: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  discountType: 'flat' | 'percent';
  discountVal: number;
  total: number;
}

export interface ExportPayload {
  docTitle: string;
  docNo: string;
  docDate: string;
  validUntilDate?: string;
  showValidUntil: boolean;
  company: ExportCompany;
  party: ExportParty;
  useSeparateShipping: boolean;
  customShippingAddress?: string;
  items: ExportLineItem[];
  customColumns: ExportCustomColumn[];
  showGstColumn: boolean;
  showHsnColumn: boolean;
  gstType: 'CGST_SGST' | 'IGST' | 'CGST_UTGST' | 'EXEMPT';
  globalGstRate: number;
  overallDiscountType: 'flat' | 'percent';
  overallDiscountVal: number;
  termsText: string;
  subtotal: number;
  totalItemDiscounts: number;
  overallDiscAmount: number;
  effectiveGstTaxTotal: number;
  grandTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rupeeFormat(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function numberToWordsINR(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Rupees Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };
  return 'Rupees ' + inWords(Math.round(amount)) + ' Only';
}

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const lightBorder = { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 };
const boxBorders = { top: lightBorder, bottom: lightBorder, left: lightBorder, right: lightBorder };

const tableCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
  left: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
  right: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
};

// ─── Main Export Function ─────────────────────────────────────────────────────

export async function exportQuotationAsDocx(payload: ExportPayload): Promise<void> {
  const {
    docTitle, docNo, docDate, validUntilDate, showValidUntil,
    company, party, useSeparateShipping, customShippingAddress,
    items, customColumns, showGstColumn, showHsnColumn,
    gstType, globalGstRate,
    overallDiscAmount, totalItemDiscounts,
    termsText, subtotal, grandTotal, cgst, sgst, igst, effectiveGstTaxTotal,
  } = payload;

  const children: (Paragraph | Table)[] = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TOP OFFICIAL SPECTRO NAVY BLUE ACCENT BAR (Matches h-2.5 bg-[#002060])
  // ─────────────────────────────────────────────────────────────────────────────
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorders,
              shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
              margins: { top: 15, bottom: 15, left: 0, right: 0 },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: '', size: 2 })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Tiny gap below accent bar
  children.push(new Paragraph({ spacing: { before: 40, after: 30 }, children: [] }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. HEADER: COMPANY INFO WITH AVATAR (LEFT) + DOCUMENT BADGE & DETAILS (RIGHT)
  // ─────────────────────────────────────────────────────────────────────────────
  const initials = company.name ? company.name.slice(0, 2).toUpperCase() : 'CO';

  // Company Details (Right of Avatar)
  const compDetailsParas: Paragraph[] = [
    new Paragraph({
      spacing: { before: 0, after: 15 },
      children: [
        new TextRun({
          text: company.name,
          bold: true,
          size: 22, // 11pt — Matches text-[14px] in PDF
          color: NAVY,
          font: 'Calibri',
          allCaps: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 15 },
      children: [
        new TextRun({
          text: company.address,
          size: 16, // 8pt — Matches text-[9.5px] in PDF
          color: SLATE_600,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 15 },
      children: [
        new TextRun({ text: 'GSTIN: ', bold: true, size: 16, color: NAVY, font: 'Calibri' }),
        new TextRun({ text: company.gstNo + '  •  ', size: 16, color: NAVY, font: 'Calibri' }),
        new TextRun({ text: 'PAN: ', bold: true, size: 16, color: NAVY, font: 'Calibri' }),
        new TextRun({ text: company.panNo, size: 16, color: NAVY, font: 'Calibri' }),
      ],
    }),
    ...(company.email || company.phone
      ? [
          new Paragraph({
            spacing: { before: 0, after: 10 },
            children: [
              new TextRun({
                text:
                  (company.email ? 'Email: ' + company.email : '') +
                  (company.email && company.phone ? '  |  ' : '') +
                  (company.phone ? 'Phone: ' + company.phone : ''),
                size: 15, // 7.5pt — Matches text-[9px] in PDF
                color: SLATE_500,
                font: 'Calibri',
              }),
            ],
          }),
        ]
      : []),
  ];

  // Nested table for [Avatar Box] + [Company Details]
  const companyBlockTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Navy Avatar Box (Matches 44×44px #002060 box in PDF)
          new TableCell({
            width: { size: 550, type: WidthType.DXA },
            borders: noBorders,
            shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: initials,
                    bold: true,
                    size: 20, // 10pt
                    color: WHITE,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
          // Spacer between avatar and text
          new TableCell({
            width: { size: 140, type: WidthType.DXA },
            borders: noBorders,
            children: [new Paragraph('')],
          }),
          // Text block
          new TableCell({
            borders: noBorders,
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: compDetailsParas,
          }),
        ],
      }),
    ],
  });

  // Right Side: Document Title Badge + Doc No + Date + Valid Until
  const headerRightBadgeTable = new Table({
    alignment: AlignmentType.RIGHT,
    width: { size: 85, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
            margins: { top: 30, bottom: 30, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: docTitle,
                    bold: true,
                    size: 17, // 8.5pt — Matches text-[11px] in PDF
                    color: WHITE,
                    font: 'Calibri',
                    allCaps: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const headerRightParas: (Paragraph | Table)[] = [
    headerRightBadgeTable,
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 30, after: 15 },
      children: [
        new TextRun({
          text: docNo,
          bold: true,
          size: 22, // 11pt — Matches text-[12px] in PDF
          color: NAVY,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 15 },
      children: [
        new TextRun({ text: 'Date: ', size: 16, color: SLATE_600, font: 'Calibri' }),
        new TextRun({ text: docDate, bold: true, size: 16, color: SLATE_900, font: 'Calibri' }),
      ],
    }),
    ...(showValidUntil && validUntilDate
      ? [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: 10 },
            children: [
              new TextRun({ text: 'Valid Until: ', size: 16, color: SLATE_600, font: 'Calibri' }),
              new TextRun({ text: validUntilDate, bold: true, size: 16, color: SLATE_900, font: 'Calibri' }),
            ],
          }),
        ]
      : []),
  ];

  // Assemble Header Table (Bottom border only, exactly like border-b border-slate-200 in PDF)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              borders: { top: noBorder, left: noBorder, right: noBorder, bottom: lightBorder },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 40, left: 0, right: 40 },
              children: [companyBlockTable],
            }),
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: { top: noBorder, left: noBorder, right: noBorder, bottom: lightBorder },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 40, left: 40, right: 0 },
              children: headerRightParas,
            }),
          ],
        }),
      ],
    })
  );

  // Spacing below Header (Matches sectionGap = 6px in PDF)
  children.push(new Paragraph({ spacing: { before: 60, after: 30 }, children: [] }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PARTY INFO (Unified Light Slate Card Box with Billed To & Tax Identifiers)
  // ─────────────────────────────────────────────────────────────────────────────
  const billedParas: Paragraph[] = [
    new Paragraph({
      spacing: { before: 0, after: 15 },
      children: [
        new TextRun({ text: 'BILLED TO (BUYER)', bold: true, size: 15, color: SLATE_500, font: 'Calibri', allCaps: true }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 15 },
      children: [
        new TextRun({ text: party.name, bold: true, size: 20, color: SLATE_900, font: 'Calibri' }),
      ],
    }),
    ...(party.contactPerson
      ? [
          new Paragraph({
            spacing: { before: 0, after: 10 },
            children: [
              new TextRun({ text: 'Attn: ' + party.contactPerson, size: 16, color: SLATE_700, font: 'Calibri' }),
            ],
          }),
        ]
      : []),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({ text: party.address, size: 16, color: SLATE_600, font: 'Calibri' }),
      ],
    }),
  ];

  const taxParas: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 15 },
      children: [
        new TextRun({ text: 'TAX & IDENTIFIERS', bold: true, size: 15, color: SLATE_500, font: 'Calibri', allCaps: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 10 },
      children: [
        new TextRun({ text: 'GSTIN: ', bold: true, size: 16, color: SLATE_700, font: 'Calibri' }),
        new TextRun({ text: party.gstNo, bold: true, size: 16, color: NAVY, font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 10 },
      children: [
        new TextRun({ text: 'PAN: ', bold: true, size: 16, color: SLATE_700, font: 'Calibri' }),
        new TextRun({ text: party.panNo, bold: true, size: 16, color: SLATE_900, font: 'Calibri' }),
      ],
    }),
    ...(party.phone
      ? [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: 10 },
            children: [
              new TextRun({ text: 'Phone: ' + party.phone, size: 16, color: SLATE_600, font: 'Calibri' }),
            ],
          }),
        ]
      : []),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({ text: 'Place of Supply: ', size: 15, color: SLATE_500, font: 'Calibri' }),
        new TextRun({ text: 'Uttar Pradesh', bold: true, size: 15, color: SLATE_800, font: 'Calibri' }),
      ],
    }),
  ];

  const partyTableCells: TableCell[] = [];

  if (useSeparateShipping) {
    const shippedParas: Paragraph[] = [
      new Paragraph({
        spacing: { before: 0, after: 15 },
        children: [
          new TextRun({ text: '🚚 SHIPPED TO (CONSIGNEE)', bold: true, size: 15, color: NAVY, font: 'Calibri', allCaps: true }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 15 },
        children: [
          new TextRun({ text: party.name, bold: true, size: 20, color: SLATE_900, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: customShippingAddress || party.shippingAddress || party.address,
            size: 16,
            color: SLATE_600,
            font: 'Calibri',
          }),
        ],
      }),
    ];

    partyTableCells.push(
      new TableCell({
        width: { size: 34, type: WidthType.PERCENTAGE },
        borders: { top: lightBorder, bottom: lightBorder, left: lightBorder, right: noBorder },
        shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
        margins: { top: 60, bottom: 60, left: 80, right: 50 },
        children: billedParas,
      }),
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        borders: { top: lightBorder, bottom: lightBorder, left: lightBorder, right: noBorder },
        shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
        margins: { top: 60, bottom: 60, left: 60, right: 50 },
        children: shippedParas,
      }),
      new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        borders: { top: lightBorder, bottom: lightBorder, left: noBorder, right: lightBorder },
        shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
        margins: { top: 60, bottom: 60, left: 50, right: 80 },
        children: taxParas,
      })
    );
  } else {
    partyTableCells.push(
      new TableCell({
        width: { size: 55, type: WidthType.PERCENTAGE },
        borders: { top: lightBorder, bottom: lightBorder, left: lightBorder, right: noBorder },
        shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
        margins: { top: 60, bottom: 60, left: 80, right: 50 },
        children: billedParas,
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        borders: { top: lightBorder, bottom: lightBorder, left: noBorder, right: lightBorder },
        shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
        margins: { top: 60, bottom: 60, left: 50, right: 80 },
        children: taxParas,
      })
    );
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: partyTableCells })],
    })
  );

  // Spacing below Party Info (Matches sectionGap = 6px)
  children.push(new Paragraph({ spacing: { before: 60, after: 30 }, children: [] }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. LINE ITEMS TABLE (Navy Headers + Alternating Rows + Exact Column Widths)
  // ─────────────────────────────────────────────────────────────────────────────
  function makeHeaderCell(text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT, widthPct?: number): TableCell {
    return new TableCell({
      width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
      shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      borders: tableCellBorders,
      children: [
        new Paragraph({
          alignment: align,
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text, bold: true, color: WHITE, size: 15, font: 'Calibri', allCaps: true })],
        }),
      ],
    });
  }

  // Calculate dynamic column widths that sum to exactly 100%
  const hsnWidth = showHsnColumn ? 9 : 0;
  const gstWidth = showGstColumn ? 7 : 0;
  const customColWidthEach = customColumns.length > 0 ? Math.min(10, Math.floor(20 / customColumns.length)) : 0;
  const customColsTotalWidth = customColWidthEach * customColumns.length;
  const fixedWidths = 4 + 8 + 12 + 13 + hsnWidth + gstWidth + customColsTotalWidth; // # + Qty + Rate + Amount + others
  const itemDescWidth = Math.max(25, 100 - fixedWidths);

  const tableHeaderCells: TableCell[] = [
    makeHeaderCell('#', AlignmentType.CENTER, 4),
    makeHeaderCell('Item & Description', AlignmentType.LEFT, itemDescWidth),
  ];
  if (showHsnColumn) tableHeaderCells.push(makeHeaderCell('HSN/SAC', AlignmentType.CENTER, hsnWidth));
  customColumns.forEach(col => tableHeaderCells.push(makeHeaderCell(col.name, AlignmentType.CENTER, customColWidthEach)));
  tableHeaderCells.push(makeHeaderCell('Qty', AlignmentType.CENTER, 8));
  tableHeaderCells.push(makeHeaderCell('Rate (₹)', AlignmentType.RIGHT, 12));
  if (showGstColumn) tableHeaderCells.push(makeHeaderCell('GST %', AlignmentType.CENTER, gstWidth));
  tableHeaderCells.push(makeHeaderCell('Amount (₹)', AlignmentType.RIGHT, 13));

  const tableRows: TableRow[] = [
    new TableRow({ children: tableHeaderCells, tableHeader: true }),
  ];

  items.forEach((item, idx) => {
    const baseRowTotal = item.qty * item.unitPrice;
    const rowTax = baseRowTotal * (item.taxRate / 100);
    const displayedRowTotal = showGstColumn ? Math.round(baseRowTotal + rowTax) : baseRowTotal;
    const rowShade = idx % 2 === 1 ? SLATE_50 : WHITE;

    const descParas: Paragraph[] = [
      new Paragraph({
        spacing: { before: 10, after: item.showDescription && item.description ? 8 : 10 },
        children: [new TextRun({ text: item.productName, bold: true, size: 17, font: 'Calibri', color: SLATE_900 })],
      }),
    ];
    if (item.showDescription && item.description && item.description.trim() !== '') {
      descParas.push(
        new Paragraph({
          spacing: { before: 0, after: 10 },
          children: [new TextRun({ text: item.description, size: 15, font: 'Calibri', color: SLATE_600 })],
        })
      );
    }

    const rowCells: TableCell[] = [
      // #
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
        borders: tableCellBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(idx + 1), bold: true, color: SLATE_400, size: 16, font: 'Calibri' })],
          }),
        ],
      }),
      // Item & Description
      new TableCell({
        width: { size: itemDescWidth, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
        borders: tableCellBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
        children: descParas,
      }),
    ];

    if (showHsnColumn) {
      rowCells.push(
        new TableCell({
          width: { size: hsnWidth, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
          borders: tableCellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: item.hsnCode || '—', color: SLATE_600, size: 16, font: 'Calibri' })],
            }),
          ],
        })
      );
    }

    customColumns.forEach(col => {
      rowCells.push(
        new TableCell({
          width: { size: customColWidthEach, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
          borders: tableCellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: item.customValues?.[col.id] || '—', color: SLATE_700, size: 16, font: 'Calibri' })],
            }),
          ],
        })
      );
    });

    // Qty
    rowCells.push(
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
        borders: tableCellBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: item.qty + ' ' + item.unit, bold: true, color: SLATE_800, size: 16, font: 'Calibri' })],
          }),
        ],
      })
    );

    // Rate (₹)
    rowCells.push(
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
        borders: tableCellBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 40, right: 60 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: rupeeFormat(item.unitPrice), bold: true, color: SLATE_800, size: 16, font: 'Calibri' })],
          }),
        ],
      })
    );

    // GST %
    if (showGstColumn) {
      rowCells.push(
        new TableCell({
          width: { size: gstWidth, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
          borders: tableCellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 40, right: 40 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: item.taxRate + '%', bold: true, color: NAVY, size: 16, font: 'Calibri' })],
            }),
          ],
        })
      );
    }

    // Amount (₹)
    rowCells.push(
      new TableCell({
        width: { size: 13, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: rowShade, fill: rowShade },
        borders: tableCellBorders,
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 40, bottom: 40, left: 40, right: 60 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: rupeeFormat(displayedRowTotal), bold: true, color: SLATE_900, size: 17, font: 'Calibri' })],
          }),
        ],
      })
    );

    tableRows.push(new TableRow({ children: rowCells }));
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    })
  );

  // Spacing below Items Table (Matches sectionGap = 6px)
  children.push(new Paragraph({ spacing: { before: 60, after: 30 }, children: [] }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. BANK DETAILS & FINANCIAL SUMMARY (2 Cards Side-by-Side matching PDF)
  // ─────────────────────────────────────────────────────────────────────────────

  // LEFT: Bank Details Card + Total Amount in Words Card
  const bankCardTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: boxBorders,
            shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
            margins: { top: 50, bottom: 50, left: 70, right: 70 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 12 },
                children: [new TextRun({ text: 'BANK PAYMENT DETAILS', bold: true, size: 15, color: SLATE_500, font: 'Calibri', allCaps: true })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 8 },
                children: [new TextRun({ text: 'Bank: ' + company.bankName, bold: true, size: 16, color: SLATE_800, font: 'Calibri' })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 8 },
                children: [new TextRun({ text: 'A/C No: ' + company.accountNo, bold: true, size: 16, color: NAVY, font: 'Calibri' })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 8 },
                children: [new TextRun({ text: 'IFSC: ' + company.ifscCode + '  •  Branch: ' + company.branch, size: 16, color: SLATE_600, font: 'Calibri' })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: 'UPI ID: ' + company.upiId, bold: true, size: 16, color: NAVY, font: 'Calibri' })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const wordsCardTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: boxBorders,
            shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
            margins: { top: 50, bottom: 50, left: 70, right: 70 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 8 },
                children: [new TextRun({ text: 'TOTAL AMOUNT (IN WORDS)', bold: true, size: 15, color: NAVY, font: 'Calibri', allCaps: true })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: numberToWordsINR(grandTotal), bold: true, italics: true, size: 16, color: NAVY, font: 'Calibri' })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // RIGHT: Financial Breakdown & Grand Total Banner
  function totalsRow(label: string, value: string, opts: { bold?: boolean; color?: string; topBorder?: boolean } = {}): TableRow {
    const { bold = false, color = SLATE_700, topBorder = false } = opts;
    const borderObj = topBorder ? { top: lightBorder, bottom: noBorder, left: noBorder, right: noBorder } : noBorders;
    return new TableRow({
      children: [
        new TableCell({
          borders: borderObj,
          margins: { top: 15, bottom: 15, left: 30, right: 30 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: label, size: 16, color: opts.bold ? NAVY : SLATE_600, bold: opts.bold, font: 'Calibri' })],
            }),
          ],
        }),
        new TableCell({
          borders: borderObj,
          margins: { top: 15, bottom: 15, left: 30, right: 30 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: value, size: 16, color, bold: true, font: 'Calibri' })],
            }),
          ],
        }),
      ],
    });
  }

  const totalsInnerRows: TableRow[] = [
    totalsRow('Subtotal (Base Value):', rupeeFormat(subtotal), { color: SLATE_800 }),
  ];

  if (totalItemDiscounts > 0) {
    totalsInnerRows.push(totalsRow('Item Discounts:', '-' + rupeeFormat(totalItemDiscounts), { color: RED_600 }));
  }
  if (overallDiscAmount > 0) {
    totalsInnerRows.push(totalsRow('Overall Discount:', '-' + rupeeFormat(overallDiscAmount), { color: RED_600 }));
  }

  if (gstType === 'EXEMPT' || globalGstRate === 0) {
    totalsInnerRows.push(totalsRow('GST Tax Rate:', '0% (Nil Rated / Exempt)', { color: GREEN_600 }));
  } else if (gstType === 'IGST') {
    totalsInnerRows.push(totalsRow('IGST (' + globalGstRate + '%):', rupeeFormat(effectiveGstTaxTotal), { color: SLATE_700 }));
  } else {
    totalsInnerRows.push(totalsRow('CGST (' + (globalGstRate / 2).toFixed(1) + '%):', rupeeFormat(cgst), { color: SLATE_700 }));
    totalsInnerRows.push(totalsRow('SGST (' + (globalGstRate / 2).toFixed(1) + '%):', rupeeFormat(sgst), { color: SLATE_700 }));
  }

  // Total Tax line
  const taxLabel = gstType === 'EXEMPT' || globalGstRate === 0 ? '0% Exempt' : (gstType === 'IGST' ? 'IGST' : 'CGST+SGST');
  totalsInnerRows.push(
    totalsRow('Total Tax (' + taxLabel + '):', rupeeFormat(effectiveGstTaxTotal), { bold: true, color: NAVY, topBorder: true })
  );

  // Grand Total Solid Navy Bar Row
  totalsInnerRows.push(
    new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
          margins: { top: 40, bottom: 40, left: 60, right: 30 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun({ text: 'GRAND TOTAL', bold: true, color: WHITE, size: 17, font: 'Calibri', allCaps: true })],
            }),
          ],
        }),
        new TableCell({
          borders: noBorders,
          shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
          margins: { top: 40, bottom: 40, left: 30, right: 60 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: rupeeFormat(grandTotal), bold: true, color: WHITE, size: 22, font: 'Calibri' })],
            }),
          ],
        }),
      ],
    })
  );

  const totalsCardTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: boxBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            shading: { type: ShadingType.SOLID, color: SLATE_50, fill: SLATE_50 },
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: totalsInnerRows,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Assemble Side-by-Side Summary & Bank Table (49% / 2% / 49%)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 49, type: WidthType.PERCENTAGE },
              borders: noBorders,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 0, right: 15 },
              children: [
                bankCardTable,
                new Paragraph({ spacing: { before: 20, after: 20 }, children: [] }),
                wordsCardTable,
              ],
            }),
            new TableCell({
              width: { size: 2, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [new Paragraph('')],
            }),
            new TableCell({
              width: { size: 49, type: WidthType.PERCENTAGE },
              borders: noBorders,
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 0, bottom: 0, left: 15, right: 0 },
              children: [totalsCardTable],
            }),
          ],
        }),
      ],
    })
  );

  // Spacing below Bank & Totals
  children.push(new Paragraph({ spacing: { before: 60, after: 30 }, children: [] }));

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. TERMS & CONDITIONS (LEFT) + AUTHORIZED SIGNATORY (RIGHT)
  // ─────────────────────────────────────────────────────────────────────────────
  const termsLines = termsText.split('\n').filter(l => l.trim());
  const termsParas: Paragraph[] = [
    new Paragraph({
      spacing: { before: 0, after: 15 },
      children: [new TextRun({ text: 'TERMS & CONDITIONS', bold: true, size: 15, color: SLATE_500, font: 'Calibri', allCaps: true })],
    }),
    ...termsLines.map(line =>
      new Paragraph({
        spacing: { before: 5, after: 5 },
        children: [new TextRun({ text: line, size: 15, color: SLATE_600, font: 'Calibri' })],
      })
    ),
    new Paragraph({
      spacing: { before: 20, after: 0 },
      children: [new TextRun({ text: 'E. & O.E. — Errors and Omissions Excepted', italics: true, size: 14, color: SLATE_400, font: 'Calibri' })],
    }),
  ];

  const signatoryParas: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 20 },
      children: [new TextRun({ text: 'For ' + company.name, bold: true, size: 17, color: SLATE_800, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 60, after: 15 },
      children: [new TextRun({ text: '___________________________', size: 16, color: SLATE_400, font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: 'AUTHORIZED SIGNATORY', bold: true, size: 15, color: SLATE_500, font: 'Calibri', allCaps: true })],
    }),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              borders: { top: lightBorder, bottom: noBorder, left: noBorder, right: noBorder },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 40, bottom: 20, left: 0, right: 40 },
              children: termsParas,
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              borders: { top: lightBorder, bottom: noBorder, left: noBorder, right: noBorder },
              verticalAlign: VerticalAlign.BOTTOM,
              margins: { top: 40, bottom: 20, left: 40, right: 0 },
              children: signatoryParas,
            }),
          ],
        }),
      ],
    })
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. BOTTOM FIXED FOOTER STRIP (DAS CRM Brand Mention)
  // ─────────────────────────────────────────────────────────────────────────────
  children.push(new Paragraph({ spacing: { before: 40, after: 20 }, children: [] }));

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: lightBorder, bottom: noBorder, left: noBorder, right: noBorder },
              margins: { top: 30, bottom: 15, left: 0, right: 0 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({ text: 'Generated by ', size: 14, color: SLATE_400, font: 'Calibri' }),
                    new TextRun({ text: 'DAS CRM', bold: true, size: 14, color: NAVY, font: 'Calibri' }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: lightBorder, bottom: noBorder, left: noBorder, right: noBorder },
              margins: { top: 30, bottom: 15, left: 0, right: 0 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'Official Estimate Document  •  www.dascrm.com', size: 14, color: SLATE_400, font: 'Calibri' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. ASSEMBLE ECMA-376 COMPLIANT OPENXML WORD DOCUMENT (.docx)
  // ─────────────────────────────────────────────────────────────────────────────
  const doc = new Document({
    creator: 'DAS CRM',
    title: docTitle + ' ' + docNo,
    description: docTitle + ' generated by DAS CRM for ' + party.name,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 16, color: SLATE_900 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(10),
              bottom: convertMillimetersToTwip(10),
              left: convertMillimetersToTwip(10),
              right: convertMillimetersToTwip(10),
            },
          },
        },
        children,
      },
    ],
  });

  // Pack to base64 string for maximum bundler and environment reliability
  const base64String = await Packer.toBase64String(doc);

  // Decode base64 → Uint8Array → Blob with explicit OOXML MIME type
  const binaryStr = atob(base64String);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  const docxBlob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const safeName = party.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filename = docNo.replace(/\//g, '-') + '_' + safeName + '.docx';

  // Native anchor-click download
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = URL.createObjectURL(docxBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', filename);
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 300);
}
