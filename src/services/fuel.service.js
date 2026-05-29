export const fuelService = {
  getDepartmentsFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return ['Admin', 'Service', 'Sales'];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (!response.ok) throw new Error("Network response was not ok");
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

  uploadFileToDrive: async (base64Data, fileName) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;
    if (!APPS_SCRIPT_URL || !FOLDER_ID) {
      throw new Error("Apps Script URL or Folder ID is missing in environment variables");
    }
    
    const bodyParams = new URLSearchParams({
      action: 'uploadFile',
      base64Data: base64Data,
      fileName: fileName,
      mimeType: 'application/pdf',
      folderId: FOLDER_ID
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) throw new Error("Upload request failed");
    const resJson = await response.json();
    if (!resJson.success) throw new Error(resJson.error || "File upload failed");
    return resJson.fileUrl;
  }
};
