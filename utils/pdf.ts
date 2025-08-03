import { MilkEntry } from "@/components/admin/milkRecords/milkBuyRecords";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export function generateMilkEntriesHTML2(
  entries: MilkEntry[],
  title = "Milk Entries Report"
): string {
  // Calculate totals
  const totalWeight = entries.reduce(
    (sum, e) => sum + (Number(e.weight) || 0),
    0
  );
  const totalAmount = entries.reduce((sum, e) => {
    return sum + (Number(e.weight) || 0) * (Number(e.rate) || 0);
  }, 0);

  // Group entries by date for better organization
  //   const groupedEntries = entries.reduce((groups, entry) => {
  //     const date = new Date(entry.date).toLocaleDateString();
  //     if (!groups[date]) {
  //       groups[date] = [];
  //     }
  //     groups[date].push(entry);
  //     return groups;
  //   }, {} as Record<string, MilkEntry[]>);

  const tableRows = entries
    .map((entry, index) => {
      const total = (
        (Number(entry.weight) || 0) * (Number(entry.rate) || 0)
      ).toFixed(2);
      const dateStr = new Date(entry.date).toLocaleDateString();

      return `
      <tr class="${entry.shift.toLowerCase()}-shift">
        <td class="text-center">${index + 1}</td>
        <td class="text-center">${dateStr}</td>
        <td class="text-center">
          <span class="shift-badge ${entry.shift.toLowerCase()}">${
        entry.shift
      }</span>
        </td>
        <td class="text-left">
          <div class="user-info">
            <img class="user-avatar" src="${entry.byUser.profilePic}" alt="${
        entry.byUser.name
      }" />
            <span>${entry.byUser.name}</span>
          </div>
        </td>
        <td class="text-right">${Number(entry.weight).toFixed(2)}</td>
        <td class="text-center">${
          entry.fat ? Number(entry.fat).toFixed(1) : "N/A"
        }</td>
        <td class="text-center">${Number(entry.snf).toFixed(1)}</td>
        <td class="text-right">₹${Number(entry.rate).toFixed(2)}</td>
        <td class="text-right amount">₹${total}</td>
      </tr>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .document-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }
        
        .document-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
        
        .document-subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        
        .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 12px;
            background: #f8fafc;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
        }
        
        .entries-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .entries-table th {
            background: #1e40af;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #1e40af;
        }
        
        .entries-table td {
            padding: 10px 8px;
            border: 1px solid #e5e7eb;
            font-size: 11px;
        }
        
        .entries-table tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .entries-table tbody tr:hover {
            background: #f3f4f6;
        }
        
        .morning-shift {
            border-left: 3px solid #fbbf24;
        }
        
        .evening-shift {
            border-left: 3px solid #8b5cf6;
        }
        
        .shift-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .shift-badge.morning {
            background: #fef3c7;
            color: #92400e;
        }
        
        .shift-badge.evening {
            background: #ede9fe;
            color: #6b21a8;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .user-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid #e5e7eb;
        }
        
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .amount {
            font-weight: 600;
            color: #059669;
        }
        
        .summary-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        
        .summary-item {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .summary-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .entries-table {
                page-break-inside: avoid;
            }
            
            .entries-table tr {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="document-header">
        <h1 class="document-title">${title}</h1>
        <p class="document-subtitle">Comprehensive Milk Collection Report</p>
        <p class="document-subtitle">Generated on ${new Date().toLocaleDateString(
          "en-IN",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        )}</p>
    </div>

    <div class="report-info">
        <div class="info-item">
            <span class="info-label">Total Entries</span>
            <span class="info-value">${entries.length}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Date Range</span>
            <span class="info-value">
                ${
                  entries.length > 0
                    ? `${new Date(
                        Math.min(
                          ...entries.map((e) => new Date(e.date).getTime())
                        )
                      ).toLocaleDateString()} - 
                   ${new Date(
                     Math.max(...entries.map((e) => new Date(e.date).getTime()))
                   ).toLocaleDateString()}`
                    : "N/A"
                }
            </span>
        </div>
        <div class="info-item">
            <span class="info-label">Report Type</span>
            <span class="info-value">Detailed</span>
        </div>
    </div>

    <table class="entries-table">
        <thead>
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 12%;">Date</th>
                <th style="width: 10%;">Shift</th>
                <th style="width: 20%;">Collected By</th>
                <th style="width: 12%;">Weight (L)</th>
                <th style="width: 10%;">Fat (%)</th>
                <th style="width: 10%;">SNF (%)</th>
                <th style="width: 11%;">Rate (₹/L)</th>
                <th style="width: 10%;">Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>

    <div class="summary-section">
        <h2 class="summary-title">Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">Total Weight</div>
                <div class="summary-value">${totalWeight.toFixed(2)} L</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Amount</div>
                <div class="summary-value">₹${totalAmount.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Average Rate</div>
                <div class="summary-value">₹${
                  totalWeight > 0
                    ? (totalAmount / totalWeight).toFixed(2)
                    : "0.00"
                }/L</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>This is a computer-generated report. No signature required.</p>
        <p>Report generated from Milk Collection Management System</p>
    </div>
</body>
</html>
  `;
}

export function generateMilkEntriesHTML(
  entries: MilkEntry[],
  title = "Milk Entries Report"
): string {
  const rows = entries
    .map((e) => {
      const total = ((Number(e.weight) || 0) * (Number(e.rate) || 0)).toFixed(
        2
      );
      const dateStr = new Date(e.date).toLocaleDateString();
      const shiftColor = e.shift === "Morning" ? "#E3FCEF" : "#FFF4E5";
      return `
      <div class="entry-card" style="background:${shiftColor}">
        <div class="header">
          <span class="date">${dateStr}</span>
          <span class="shift">${e.shift}</span>
        </div>
        <div class="user">
          <img class="avatar" src="${e.byUser.profilePic}" />
          <span class="username">${e.byUser.name}</span>
        </div>
        <div class="details">
          <span>${e.weight} L</span>
          <span>${e.fat ?? "N/A"}%</span>
          <span>${e.snf}%</span>
        </div>
        <div class="footer">
          <span>₹${e.rate}/L</span>
          <strong>₹${total}</strong>
        </div>
      </div>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      body { font-family: sans-serif; padding:20px; }
      .entry-card {
        border:1px solid #ddd;
        border-radius:8px;
        padding:16px;
        margin-bottom:16px;
      }
      .header { display:flex; justify-content:space-between; margin-bottom:8px; }
      .date { font-weight:600; }
      .shift { padding:2px 6px; background:#ccc; border-radius:4px; }
      .user { display:flex; align-items:center; margin-bottom:8px; }
      .avatar { width:32px; height:32px; border-radius:16px; margin-right:8px; }
      .details { display:flex; justify-content:space-between; margin-bottom:8px; }
      .footer { display:flex; justify-content:space-between; font-size:14px; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${rows}
  </body>
</html>`;
}

export const onExportPDF = async (entries: MilkEntry[]) => {
  try {
    // 1) Create HTML for all entries
    const html = generateMilkEntriesHTML2(entries, "Milk Report");

    // 2) Convert to PDF
    const { uri } = await Print.printToFileAsync({ html });

    // 3) Share (or preview) the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share your milk-entry report",
      });
    } else {
      alert("Sharing not available on this device.");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to generate PDF.");
  }
};
