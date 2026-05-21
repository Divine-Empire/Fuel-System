import html2canvas from 'html2canvas';
import divineLogo from '../Assets/divine-logo.svg';

function formatDateTime(dateStr, createdAtStr) {
  try {
    const dateObj = createdAtStr ? new Date(createdAtStr) : (dateStr ? new Date(dateStr) : new Date());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    
    return `${day}-${month}-${year} ${timeStr}`;
  } catch (e) {
    return dateStr || '—';
  }
}

export async function downloadFuelSlip(slipData) {
  // Create a container element formatted like a premium colored receipt card
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '380px';
  container.style.backgroundColor = '#ffffff';
  container.style.boxSizing = 'border-box';

  const dateStr = formatDateTime(slipData.requestDate, slipData.createdAt);
  const locationText = slipData.location === 'Others' 
    ? (slipData.customLocation || 'Others') 
    : `Location ${slipData.location}`;

  container.innerHTML = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: 3px solid #1e3a8a; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <!-- Header Section -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 20px 15px; text-align: center; border-bottom: 3px solid #1e3a8a; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <img src="${divineLogo}" style="width: 80px; height: 60px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));" />
        <div style="color: #ffffff; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.3;">
          Divine Empire Pvt. Ltd.
        </div>
        <div style="color: #93c5fd; font-weight: 700; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">
          Fuel Filling Slip
        </div>
      </div>
      
      <!-- Table Rows Section -->
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.5; color: #1e293b;">
        <tr>
          <td style="width: 42%; padding: 12px 12px; font-weight: 700; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #475569;">Slip No.</td>
          <td style="width: 58%; padding: 12px 12px; font-weight: 800; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-family: monospace; font-size: 14px;">${slipData.slipNo || '—'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 12px; font-weight: 700; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #475569;">Vehicle No.</td>
          <td style="padding: 12px 12px; font-weight: 800; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-transform: uppercase;">${slipData.vehicleNo}</td>
        </tr>
        <tr>
          <td style="padding: 12px 12px; font-weight: 700; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #475569;">Date & Time Issued</td>
          <td style="padding: 12px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 12px 12px; font-weight: 700; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #475569;">Last K.M Reading</td>
          <td style="padding: 12px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${slipData.lastKmReading} KM</td>
        </tr>
        <tr>
          <td style="padding: 12px 12px; font-weight: 700; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #475569;">Issued To</td>
          <td style="padding: 12px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${slipData.issuedTo}</td>
        </tr>
        <tr>
          <td style="padding: 12px 12px; font-weight: 700; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #475569;">Filling Location</td>
          <td style="padding: 12px 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${locationText}</td>
        </tr>
      </table>

      <!-- Footer Seal & Signatory -->
      <div style="background-color: #f8fafc; padding: 15px 12px; text-align: center; border-top: 1px solid #cbd5e1;">
        <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 50px;">
          Seal & Signatory
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; font-weight: 600; padding: 0 10px;">
          <span>DIVINE EMPIRE GROUP</span>
          <span>OFFICIAL USE ONLY</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Pre-load the logo SVG to guarantee it renders in html2canvas
  await new Promise((resolve) => {
    const img = new Image();
    img.src = divineLogo;
    img.onload = resolve;
    img.onerror = resolve;
  });

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // crisp quality
      backgroundColor: null,
      useCORS: true,
      logging: false
    });

    const dataUrl = canvas.toDataURL('image/png');
    
    // Auto download
    const link = document.createElement('a');
    link.download = `${slipData.slipNo || slipData.requestNo || 'slip'}.png`;
    link.href = dataUrl;
    link.click();
    
    document.body.removeChild(container);
    return dataUrl;
  } catch (error) {
    console.error('Error generating canvas fuel slip:', error);
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    return '';
  }
}
