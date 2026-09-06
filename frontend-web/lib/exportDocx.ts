/**
 * exportDocx.ts — DAS CRM
 * Generates a fully editable Word (.docx) document from quotation/invoice data.
 * Uses the `docx` library (pure JS/TS, no server required).
 * Every element — company info, party details, line items, totals, bank details,
 * terms — is represented as editable text runs or table cells in the DOCX.
 *
 * NOTE: Uses native browser download API (URL.createObjectURL) — no file-saver dependency.
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
  convertInchesToTwip,
} from 'docx';


// ─── Colour Palette ────────────────────────────────────────────────────────────
const NAVY = '002060';
const WHITE = 'FFFFFF';
const SLATE_50 = 'F8FAFC';
const SLATE_200 = 'CBD5E1';
const SLATE_500 = '64748B';
const SLATE_700 = '334155';
const SLATE_900 = '0F172A';
const BLUE_800 = '1E40AF';
const RED_600 = 'DC2626';
const GREEN_600 = '059669';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ExportCompany {
  name: string;
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
  return 'Rs.' + n.toLocaleString('en-IN');
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

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
  left: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
  right: { style: BorderStyle.SINGLE, size: 1, color: SLATE_200 },
};

function navyHeaderCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: WHITE, size: 18, font: 'Calibri' })],
      }),
    ],
  });
}

function richCell(paragraphs: Paragraph[], shade?: string, widthPct?: number): TableCell {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: shade ? { type: ShadingType.SOLID, color: shade, fill: shade } : undefined,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    borders: cellBorders,
    children: paragraphs,
  });
}

function simpleDataCell(text: string, options: { bold?: boolean; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; shade?: string; widthPct?: number; size?: number } = {}): TableCell {
  const { bold = false, color = SLATE_900, align = AlignmentType.LEFT, shade, widthPct, size = 18 } = options;
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: shade ? { type: ShadingType.SOLID, color: shade, fill: shade } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    borders: cellBorders,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text, bold, color, size, font: 'Calibri' })],
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: NAVY } },
    children: [
      new TextRun({ text, bold: true, color: NAVY, size: 22, font: 'Calibri', allCaps: true }),
    ],
  });
}

function fieldPara(label: string, value: string, valueColor = SLATE_900): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 18, font: 'Calibri', color: SLATE_700 }),
      new TextRun({ text: value, size: 18, font: 'Calibri', color: valueColor }),
    ],
  });
}

function dividerRule(): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    border: { bottom: { style: BorderStyle.THICK, size: 6, color: NAVY } },
    children: [],
  });
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function exportQuotationAsDocx(payload: ExportPayload): Promise<void> {
  const {
    docTitle, docNo, docDate, validUntilDate, showValidUntil,
    company, party, useSeparateShipping, customShippingAddress,
    items, customColumns, showGstColumn, showHsnColumn,
    gstType, globalGstRate,
    overallDiscAmount, totalItemDiscounts,
    termsText, subtotal, grandTotal, cgst, sgst, igst,
  } = payload;

  const children: (Paragraph | Table)[] = [];

  // ── SECTION 1: HEADER ────────────────────────────────────────────────────────

  // Top navy bar
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
      children: [new TextRun({ text: '  ', size: 10, font: 'Calibri' })],
    })
  );

  // Company name
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 40 },
      children: [new TextRun({ text: company.name, bold: true, size: 36, color: NAVY, font: 'Calibri', allCaps: true })],
    })
  );

  children.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text: company.address, size: 18, font: 'Calibri', color: SLATE_700 })] }));
  children.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'GSTIN: ' + company.gstNo + '  |  PAN: ' + company.panNo, bold: true, size: 18, font: 'Calibri', color: NAVY })] }));
  children.push(new Paragraph({ spacing: { before: 20, after: 30 }, children: [new TextRun({ text: company.email + '  |  ' + company.phone, size: 18, font: 'Calibri', color: SLATE_500 })] }));

  children.push(dividerRule());

  // Document reference block (right-aligned)
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 60, after: 30 },
      shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
      children: [new TextRun({ text: '  ' + docTitle + '  ', bold: true, size: 26, color: WHITE, font: 'Calibri', allCaps: true })],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: 'Document No: ', bold: true, size: 22, font: 'Calibri', color: SLATE_700 }),
        new TextRun({ text: docNo, bold: true, size: 22, font: 'Calibri', color: NAVY }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 20, after: 20 },
      children: [
        new TextRun({ text: 'Date: ', bold: true, size: 18, font: 'Calibri', color: SLATE_700 }),
        new TextRun({ text: docDate, size: 18, font: 'Calibri', color: SLATE_900 }),
      ],
    })
  );
  if (showValidUntil && validUntilDate) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 20, after: 30 },
        children: [
          new TextRun({ text: 'Valid Until: ', bold: true, size: 18, font: 'Calibri', color: SLATE_700 }),
          new TextRun({ text: validUntilDate, size: 18, font: 'Calibri', color: SLATE_900 }),
        ],
      })
    );
  }

  // ── SECTION 2: PARTY INFO ────────────────────────────────────────────────────

  children.push(sectionHeading('Party Details'));

  const colCount = useSeparateShipping ? 3 : 2;
  const colW = Math.floor(100 / colCount);

  const billedParagraphs: Paragraph[] = [
    new Paragraph({ spacing: { before: 30, after: 20 }, children: [new TextRun({ text: party.name, bold: true, size: 20, font: 'Calibri', color: NAVY })] }),
    ...(party.contactPerson ? [new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'Attn: ' + party.contactPerson, size: 18, font: 'Calibri', color: SLATE_700 })] })] : []),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: party.address, size: 18, font: 'Calibri', color: SLATE_700 })] }),
    new Paragraph({ spacing: { before: 20, after: 30 }, children: [new TextRun({ text: party.email + '  |  ' + party.phone, size: 17, font: 'Calibri', color: SLATE_500 })] }),
  ];

  const taxIdParagraphs: Paragraph[] = [
    new Paragraph({ spacing: { before: 30, after: 20 }, children: [new TextRun({ text: 'GSTIN: ' + party.gstNo, bold: true, size: 18, font: 'Calibri', color: NAVY })] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'PAN: ' + party.panNo, bold: true, size: 18, font: 'Calibri', color: NAVY })] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'Phone: ' + party.phone, size: 18, font: 'Calibri', color: SLATE_700 })] }),
    new Paragraph({ spacing: { before: 20, after: 30 }, children: [new TextRun({ text: 'Place of Supply: Uttar Pradesh', size: 17, font: 'Calibri', color: SLATE_500 })] }),
  ];

  const partyHeaderRow = new TableRow({
    children: [
      navyHeaderCell('Billed To (Buyer)', colW),
      ...(useSeparateShipping ? [navyHeaderCell('Shipped To (Consignee)', colW)] : []),
      navyHeaderCell('Tax & Identifiers', colW),
    ],
  });

  const partyDataCells = [richCell(billedParagraphs, SLATE_50, colW)];
  if (useSeparateShipping) {
    partyDataCells.push(richCell([
      new Paragraph({ spacing: { before: 30, after: 20 }, children: [new TextRun({ text: party.name, bold: true, size: 20, font: 'Calibri', color: NAVY })] }),
      new Paragraph({ spacing: { before: 20, after: 30 }, children: [new TextRun({ text: customShippingAddress || party.shippingAddress || party.address, size: 18, font: 'Calibri', color: SLATE_700 })] }),
    ], SLATE_50, colW));
  }
  partyDataCells.push(richCell(taxIdParagraphs, SLATE_50, colW));

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [partyHeaderRow, new TableRow({ children: partyDataCells })],
  }));

  // ── SECTION 3: LINE ITEMS ────────────────────────────────────────────────────

  children.push(sectionHeading('Line Items'));

  const itemHeaderCells: TableCell[] = [navyHeaderCell('#', 4)];
  itemHeaderCells.push(navyHeaderCell('Item & Description'));
  if (showHsnColumn) itemHeaderCells.push(navyHeaderCell('HSN/SAC', 9));
  customColumns.forEach(col => itemHeaderCells.push(navyHeaderCell(col.name, 10)));
  itemHeaderCells.push(navyHeaderCell('Qty', 7));
  itemHeaderCells.push(navyHeaderCell('Rate', 11));
  if (showGstColumn) itemHeaderCells.push(navyHeaderCell('GST%', 7));
  itemHeaderCells.push(navyHeaderCell('Amount', 12));

  const itemTableRows: TableRow[] = [new TableRow({ children: itemHeaderCells, tableHeader: true })];

  items.forEach((item, idx) => {
    const baseRowTotal = item.qty * item.unitPrice;
    const rowTax = baseRowTotal * (item.taxRate / 100);
    const displayedRowTotal = showGstColumn ? Math.round(baseRowTotal + rowTax) : baseRowTotal;
    const rowShade = idx % 2 !== 0 ? 'F8FAFC' : WHITE;

    const productParagraphs: Paragraph[] = [
      new Paragraph({ spacing: { before: 30, after: 8 }, children: [new TextRun({ text: item.productName, bold: true, size: 18, font: 'Calibri', color: SLATE_900 })] }),
      ...(item.showDescription && item.description
        ? [new Paragraph({ spacing: { before: 0, after: 30 }, children: [new TextRun({ text: item.description, size: 16, font: 'Calibri', color: SLATE_500 })] })]
        : []),
    ];

    const rowCells: TableCell[] = [
      simpleDataCell(String(idx + 1), { align: AlignmentType.CENTER, shade: rowShade }),
      richCell(productParagraphs, rowShade),
    ];
    if (showHsnColumn) rowCells.push(simpleDataCell(item.hsnCode || '—', { align: AlignmentType.CENTER, shade: rowShade, color: SLATE_700 }));
    customColumns.forEach(col => rowCells.push(simpleDataCell(item.customValues?.[col.id] || '—', { align: AlignmentType.CENTER, shade: rowShade, color: SLATE_700 })));
    rowCells.push(simpleDataCell(item.qty + ' ' + item.unit, { align: AlignmentType.CENTER, bold: true, shade: rowShade }));
    rowCells.push(simpleDataCell(rupeeFormat(item.unitPrice), { align: AlignmentType.RIGHT, bold: true, shade: rowShade }));
    if (showGstColumn) rowCells.push(simpleDataCell(item.taxRate + '%', { align: AlignmentType.CENTER, color: NAVY, bold: true, shade: rowShade }));
    rowCells.push(simpleDataCell(rupeeFormat(displayedRowTotal), { align: AlignmentType.RIGHT, bold: true, shade: rowShade }));

    itemTableRows.push(new TableRow({ children: rowCells }));
  });

  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: itemTableRows }));

  // ── SECTION 4: BANK DETAILS + TOTALS ─────────────────────────────────────────

  children.push(sectionHeading('Bank Details & Financial Summary'));

  // GST breakdown
  const taxParas: Paragraph[] = [];
  if (gstType === 'EXEMPT' || globalGstRate === 0) {
    taxParas.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text: 'GST: 0% (Exempt)', size: 18, font: 'Calibri', color: GREEN_600, bold: true })] }));
  } else if (gstType === 'IGST') {
    taxParas.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text: 'IGST (' + globalGstRate + '%): ' + rupeeFormat(igst), size: 18, font: 'Calibri', color: SLATE_700 })] }));
  } else {
    taxParas.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text: 'CGST (' + (globalGstRate / 2).toFixed(1) + '%): ' + rupeeFormat(cgst), size: 18, font: 'Calibri', color: SLATE_700 })] }));
    taxParas.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [new TextRun({ text: 'SGST (' + (globalGstRate / 2).toFixed(1) + '%): ' + rupeeFormat(sgst), size: 18, font: 'Calibri', color: SLATE_700 })] }));
  }

  const bankParagraphs: Paragraph[] = [
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'BANK PAYMENT DETAILS', bold: true, size: 18, font: 'Calibri', color: NAVY, allCaps: true })] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: company.bankName, bold: true, size: 18, font: 'Calibri', color: SLATE_900 })] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'A/C: ' + company.accountNo, bold: true, size: 18, font: 'Calibri', color: NAVY })] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'IFSC: ' + company.ifscCode + '  |  Branch: ' + company.branch, size: 18, font: 'Calibri', color: SLATE_700 })] }),
    new Paragraph({ spacing: { before: 20, after: 30 }, children: [new TextRun({ text: 'UPI: ' + company.upiId, bold: true, size: 18, font: 'Calibri', color: NAVY })] }),
    new Paragraph({ spacing: { before: 20, after: 10 }, children: [new TextRun({ text: 'Amount in Words:', bold: true, size: 18, font: 'Calibri', color: BLUE_800 })] }),
    new Paragraph({ spacing: { before: 10, after: 30 }, children: [new TextRun({ text: numberToWordsINR(grandTotal), size: 18, font: 'Calibri', color: BLUE_800, italics: true })] }),
  ];

  const totalsParagraphs: Paragraph[] = [
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'FINANCIAL TOTALS', bold: true, size: 18, font: 'Calibri', color: NAVY, allCaps: true })] }),
    new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'Subtotal: ' + rupeeFormat(subtotal), size: 18, font: 'Calibri', color: SLATE_700 })] }),
    ...(totalItemDiscounts > 0 ? [new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'Item Discounts: -' + rupeeFormat(totalItemDiscounts), size: 18, font: 'Calibri', color: RED_600 })] })] : []),
    ...(overallDiscAmount > 0 ? [new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: 'Overall Discount: -' + rupeeFormat(overallDiscAmount), size: 18, font: 'Calibri', color: RED_600 })] })] : []),
    ...taxParas,
    new Paragraph({
      spacing: { before: 50, after: 30 },
      shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
      children: [new TextRun({ text: '  GRAND TOTAL: ' + rupeeFormat(grandTotal) + '  ', bold: true, size: 22, font: 'Calibri', color: WHITE })],
    }),
  ];

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [navyHeaderCell('Bank Details', 58), navyHeaderCell('Totals Summary', 42)] }),
      new TableRow({ children: [richCell(bankParagraphs, SLATE_50, 58), richCell(totalsParagraphs, SLATE_50, 42)] }),
    ],
  }));

  // ── SECTION 5: TERMS & SIGNATORY ─────────────────────────────────────────────

  children.push(sectionHeading('Terms & Conditions'));

  const termsLines = termsText.split('\n').filter(l => l.trim());
  termsLines.forEach(line => {
    children.push(new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text: line, size: 18, font: 'Calibri', color: SLATE_700 })],
    }));
  });

  children.push(new Paragraph({
    spacing: { before: 80, after: 40 },
    children: [new TextRun({ text: 'E. & O.E. — Errors and Omissions Excepted', size: 17, font: 'Calibri', color: SLATE_500, italics: true })],
  }));

  // Signatory
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 200, after: 20 },
    children: [new TextRun({ text: 'For ' + company.name, bold: true, size: 20, font: 'Calibri', color: NAVY })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 100, after: 20 },
    children: [new TextRun({ text: '___________________________', size: 20, font: 'Calibri', color: SLATE_500 })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 10, after: 20 },
    children: [new TextRun({ text: 'Authorized Signatory', size: 18, font: 'Calibri', color: SLATE_700, bold: true, allCaps: true })],
  }));

  // Footer
  children.push(dividerRule());
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: 'Generated by ', size: 16, font: 'Calibri', color: SLATE_500 }),
      new TextRun({ text: 'DAS CRM', size: 16, font: 'Calibri', color: NAVY, bold: true }),
      new TextRun({ text: '  •  www.dascrm.com', size: 16, font: 'Calibri', color: SLATE_500 }),
    ],
  }));

  // ── Assemble & Download ───────────────────────────────────────────────────────

  const doc = new Document({
    creator: 'DAS CRM',
    title: docTitle + ' ' + docNo,
    description: docTitle + ' generated by DAS CRM for ' + party.name,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: SLATE_900 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      },
    ],
  });

  const rawBlob = await Packer.toBlob(doc);

  // Official OOXML MIME type for .docx files
  const docxBlob = new Blob([rawBlob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const safeName = party.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filename = docNo.replace(/\//g, '-') + '_' + safeName + '.docx';

  // Use native browser download API — most reliable cross-browser approach.
  // Avoids file-saver SSR issues in Next.js environments.
  if (typeof window === 'undefined') return; // safety guard for SSR
  const url = URL.createObjectURL(docxBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  // Clean up: remove anchor and revoke the object URL to free memory
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 200);
}
