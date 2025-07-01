import { QRCodeData } from '@/context/QrContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
 
import { Platform } from 'react-native';





export const generateQRCodeHTML = (qrCodes: QRCodeData[], title = 'Generated QR Codes'): string => {
  // Calculate columns based on QR code count
  const getColumns = (count: number) => {
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    return 5;
  };
  
  const columns = getColumns(qrCodes.length);
  const qrSize = columns === 2 ? 150 : columns === 3 ? 120 : 100;
  
  // Create QR code items HTML
  const qrCodesHTML = qrCodes.map(qr => `
    <div class="qr-item">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qr.couponCode)}" />
      <p class="qr-value">${qr.couponCode}</p>
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #E5E5EA;
          }
          h1 {
            font-size: 24px;
            color: #1C1C1E;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            color: #8E8E93;
            margin-top: 0;
          }
          .qr-container {
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: 20px;
            margin-bottom: 20px;
          }
          .qr-item {
            border: 1px solid #E5E5EA;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
          }
          .qr-value {
            font-size: 10px;
            color: #3A3A3C;
            margin-top: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #E5E5EA;
            font-size: 12px;
            color: #8E8E93;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="qr-container">
          ${qrCodesHTML}
        </div>
        
        <div class="footer">
          <p>Generated with QR Code Generator App</p>
        </div>
      </body>
    </html>
  `;
};


/**
 * Generate and print QR codes
 * @param qrCodes Array of QR code data
 * @param title Optional title for the sheet
 */
export const printQRCodes = async (qrCodes: QRCodeData[], title?: string): Promise<void> => {
  try {
    const html = generateQRCodeHTML(qrCodes, title);
    await Print.printAsync({
      html,
    });
  } catch (error) {
    // console.error('Error printing QR codes:', error);
    throw new Error('Failed to print QR codes');
  }
};

/**
 * Generate and share QR codes as PDF
 * @param qrCodes Array of QR code data
 * @param title Optional title for the sheet
 */
export const shareQRCodesAsPDF = async (qrCodes: QRCodeData[], title?: string): Promise<void> => {
  try {
    const html = generateQRCodeHTML(qrCodes, title);
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri);
    } else {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });
    }
  } catch (error) {
    // console.error('Error sharing QR codes as PDF:', error);
    throw new Error('Failed to share QR codes as PDF');
  }
};

