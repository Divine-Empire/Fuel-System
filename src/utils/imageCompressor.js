/**
 * Compresses an image file and converts it to a clean base64 string.
 * Reduces large photos (e.g. 5-15MB) from smartphones to < 300KB
 * ensuring fast, reliable upload to Google Apps Script.
 */
export const compressImage = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    // If non-image (e.g. PDF), convert directly to base64
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result ? reader.result.toString() : '';
        const base64Data = result.includes('base64,') ? result.split('base64,')[1] : result;
        resolve({
          base64: base64Data,
          mimeType: file.type || 'application/octet-stream',
          fileName: file.name || 'document'
        });
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving resize
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          const rawBase64 = event.target.result.toString().split('base64,')[1];
          return resolve({
            base64: rawBase64,
            mimeType: file.type,
            fileName: file.name
          });
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG at specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split('base64,')[1];

        const baseName = (file.name || 'photo').replace(/\.[^/.]+$/, "");
        const newFileName = `${baseName}.jpg`;

        resolve({
          base64: base64Data,
          mimeType: 'image/jpeg',
          fileName: newFileName
        });
      };

      img.onerror = (error) => {
        // Fallback to raw base64 if image decoding fails
        try {
          const rawBase64 = event.target.result.toString().split('base64,')[1];
          resolve({
            base64: rawBase64,
            mimeType: file.type,
            fileName: file.name
          });
        } catch (e) {
          reject(error);
        }
      };

      img.src = event.target.result;
    };

    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
