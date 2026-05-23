import localforage from 'localforage';

// 初始化 localforage 实例
const storage = localforage.createInstance({
  name: 'csisp-oauth',
  storeName: 'oauth-data',
  description: 'CSISP OAuth 相关数据存储',
});

/**
 * 设置 storage 项
 */
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  await storage.setItem(key, value);
}

/**
 * 获取 storage 项
 */
export async function getStorageItem<T>(key: string): Promise<T | null> {
  const value = await storage.getItem<T>(key);
  return value ?? null;
}

/**
 * 删除 storage 项
 */
export async function removeStorageItem(key: string): Promise<void> {
  await storage.removeItem(key);
}

/**
 * 清空所有 OAuth 相关 storage
 */
export async function clearOAuthStorage(): Promise<void> {
  await storage.clear();
}
