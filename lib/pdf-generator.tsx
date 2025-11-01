import type { Invoice, Client } from "./types"

export async function generateInvoicePDF(invoice: Invoice, client: Client): Promise<Blob> {
  // Create HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 40px;
            color: #1e293b;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            font-size: 32px;
            margin-bottom: 8px;
          }
          .invoice-number {
            color: #64748b;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 8px;
          }
          .status-paid {
            background-color: #10b981;
            color: white;
          }
          .status-unpaid {
            background-color: #f59e0b;
            color: white;
          }
          .status-overdue {
            background-color: #ef4444;
            color: white;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .info-block {
            flex: 1;
          }
          .info-block h3 {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .info-block p {
            margin-bottom: 4px;
          }
          .client-info {
            background-color: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 40px;
          }
          .client-info h3 {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .client-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          thead {
            background-color: #f8fafc;
          }
          th {
            text-align: left;
            padding: 12px;
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }
          th:last-child, td:last-child {
            text-align: right;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .totals {
            margin-left: auto;
            width: 300px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .totals-row.total {
            border-top: 2px solid #e2e8f0;
            padding-top: 12px;
            margin-top: 8px;
            font-size: 18px;
            font-weight: bold;
          }
          .notes {
            background-color: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            margin-top: 40px;
          }
          .notes h3 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .notes p {
            color: #64748b;
            font-size: 14px;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">InvoiceFlow</div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <span class="status-badge status-${invoice.status}">${invoice.status}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-block">
            <h3>Issue Date</h3>
            <p>${new Date(invoice.date).toLocaleDateString()}</p>
          </div>
          <div class="info-block">
            <h3>Due Date</h3>
            <p>${new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="client-info">
          <h3>Bill To</h3>
          <div class="client-name">${client.name}</div>
          ${client.company ? `<p>${client.company}</p>` : ""}
          <p>${client.email}</p>
          <p>${client.phone}</p>
          <p>${client.address}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.lineItems
              .map(
                (item) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>$${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Tax (${invoice.taxRate}%)</span>
            <span>$${invoice.taxAmount.toFixed(2)}</span>
          </div>
          ${
            invoice.discount > 0
              ? `
          <div class="totals-row">
            <span>Discount</span>
            <span>-$${invoice.discount.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          <div class="totals-row total">
            <span>Total</span>
            <span>$${invoice.total.toFixed(2)}</span>
          </div>
        </div>

        ${
          invoice.notes
            ? `
        <div class="notes">
          <h3>Notes</h3>
          <p>${invoice.notes}</p>
        </div>
        `
            : ""
        }

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated by InvoiceFlow on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `

  // Convert HTML to Blob for download
  const blob = new Blob([htmlContent], { type: "text/html" })
  return blob
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
