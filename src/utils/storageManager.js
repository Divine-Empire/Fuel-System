// Storage Manager - Handle all localStorage operations

const STORAGE_KEYS = {
  USERS: 'pcb_users',
};

const DEFAULT_USERS = [
  { id: 'admin', name: 'Admin User', password: 'admin123', role: 'ADMIN', accessPages: [] },
  { id: 'user', name: 'Employee 1', password: 'user123', role: 'USER', accessPages: [] },
  { id: 'user2', name: 'Employee 2', password: 'user123', role: 'USER', accessPages: [] }
];

export const initializeStorage = () => {
  // Check if we need to clean up legacy/dummy data
  if (!localStorage.getItem('dummy_data_cleaned_v1')) {
    localStorage.clear();
    localStorage.setItem('dummy_data_cleaned_v1', 'true');
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
};

export const getFromStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const saveToStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// User operations
export const getUsers = () => {
  const users = getFromStorage(STORAGE_KEYS.USERS);
  if (!users || !users.some(u => u.id === 'admin')) {
    saveToStorage(STORAGE_KEYS.USERS, DEFAULT_USERS);
    return DEFAULT_USERS;
  }
  return users;
};

export const saveUsers = (users) => saveToStorage(STORAGE_KEYS.USERS, users);

// Export keys
export { STORAGE_KEYS };
