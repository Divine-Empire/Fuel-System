const fetchWithRetry = async (url, options = {}, retries = 2, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`Network response was not ok (HTTP ${response.status})`);
    } catch (err) {
      lastError = err;
    }
    if (i < retries) {
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
};

export const fuelService = {
  getDepartmentsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return ['Admin', 'Service', 'Sales'];
    try {
      const response = await fetchWithRetry(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      const resJson = await response.json();
      if (!resJson.success) throw new Error(resJson.error || "Failed to fetch departments");
      const rows = resJson.data.slice(1);
      const departments = rows.map(row => (row[6] || '').toString().trim()).filter(dep => dep !== '');
      return Array.from(new Set(departments));
    } catch (error) {
      console.error("Error fetching departments from sheet:", error);
      return ['Admin', 'Service', 'Sales'];
    }
  },

  uploadFileToDrive: async (base64Data, fileName, mimeType = 'image/jpeg') => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }
    
    const bodyParams = new URLSearchParams({
      action: 'uploadFile',
      base64Data: base64Data,
      fileName: fileName,
      mimeType: mimeType || 'image/jpeg',
      folderId: FOLDER_ID || ''
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) throw new Error(`Upload request failed with status ${response.status}`);
    const resJson = await response.json();
    if (!resJson.success) throw new Error(resJson.error || "File upload failed");
    return resJson.fileUrl;
  }
};
