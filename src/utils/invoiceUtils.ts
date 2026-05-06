import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Invoice } from '../services/billingService';

/**
 * Generates a premium PDF invoice and either downloads it or opens it in a new tab.
 */
export async function generateInvoicePDF(invoice: Invoice, action: 'download' | 'view' = 'download') {
  const doc = new jsPDF() as any;

  // Colors
  const primaryColor = [225, 29, 72]; // Igra primary (pinkish/red)
  const darkColor = [15, 15, 15];
  const grayColor = [100, 100, 100];

  // Fonts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('IGRA STUDIOS', 20, 30);

  // Invoice Label
  doc.setFontSize(32);
  doc.setTextColor(200, 200, 200);
  doc.text('INVOICE', 140, 30);

  // Company Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('https://igrastudios.com', 20, 38);
  doc.text('support@igrastudios.com', 20, 43);

  // Invoice Details Header
  doc.setDrawColor(230, 230, 230);
  doc.line(20, 55, 190, 55);

  // Billing Info
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('BILL TO', 20, 70);
  doc.setFont('helvetica', 'normal');
  doc.text('Customer Account', 20, 78);
  doc.text(`User ID: ${invoice.userId.slice(-8).toUpperCase()}`, 20, 83);

  // Invoice Info
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE #', 140, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, 140, 78);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE', 140, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.createdAt).toLocaleDateString(), 140, 96);

  // Table
  const tableData = invoice.lineItems.map(item => [
    item.description,
    item.quantity.toString(),
    `$${(item.unitPriceCents / 100).toFixed(2)}`,
    `$${(item.totalCents / 100).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 110,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    theme: 'striped'
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 140, finalY);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${(invoice.subtotalCents / 100).toFixed(2)}`, 175, finalY, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Total:', 140, finalY + 10);
  doc.text(`$${(invoice.totalCents / 100).toFixed(2)}`, 175, finalY + 10, { align: 'right' });

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('Thank you for choosing Igra Studios.', 20, 280);
  doc.text('This is a computer generated invoice and does not require a signature.', 20, 285);

  if (action === 'download') {
    doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  } else {
    window.open(doc.output('bloburl'), '_blank');
  }
}
