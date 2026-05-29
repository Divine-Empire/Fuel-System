export const userService = {
  getUsersFromSheet: async () => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) return [];
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Master&headerRow=1&_t=${Date.now()}`);
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success) {
          const rows = resJson.data.slice(1); // skip header row
          return rows.map(row => ({
            name: (row[0] || '').toString().trim(),
            id: (row[1] || '').toString().trim(), // Username maps to user.id
            password: (row[2] || '').toString().trim(),
            role: (row[3] || 'USER').toString().trim().toUpperCase(),
            rowIndex: row[row.length - 1] // RowIndex is appended by Backend.js doGet
          })).filter(u => u.id !== '');
        }
      }
    } catch (error) {
      console.error("Error fetching users from sheet:", error);
    }
    return [];
  },

  createUserInSheet: async (userData) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const rowData = [
      userData.name.trim(),
      userData.id.trim(),
      userData.password.trim(),
      userData.role.trim().toUpperCase()
    ];

    const bodyParams = new URLSearchParams({
      action: 'insert',
      sheetName: 'Master',
      rowData: JSON.stringify(rowData)
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.error || 'Failed to register user');
    }
    return resJson;
  },

  updateUserInSheet: async (userData, oldId) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const rowData = [
      userData.name.trim(),
      userData.id.trim(),
      userData.password.trim(),
      userData.role.trim().toUpperCase()
    ];

    const bodyParams = new URLSearchParams({
      action: 'update',
      sheetName: 'Master',
      idValue: (oldId || userData.id).trim(),
      idColumnIndex: '1', // Column B is Username (0-indexed Col B is 1)
      rowData: JSON.stringify(rowData)
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.error || 'Failed to update user');
    }
    return resJson;
  },

  deleteUserInSheet: async (userId, rowIndex) => {
    const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      throw new Error("Apps Script URL is missing in environment variables");
    }

    const bodyParams = new URLSearchParams({
      action: 'delete',
      sheetName: 'Master',
      idValue: userId.trim(),
      idColumnIndex: '1', // Column B is Username
      rowIndex: rowIndex ? rowIndex.toString() : ''
    });

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resJson = await response.json();
    if (!resJson.success) {
      throw new Error(resJson.error || 'Failed to delete user');
    }
    return resJson;
  }
};
