export type AuraApiMode = "local" | "remote";

const API_BASES: Record<AuraApiMode, string> = {
 local: "http://129.226.144.3",
  // 线上时替换成你的后端域名（例：https://api.your-domain.com）
  remote: "https://your-backend-domain.com",
};

const MODE_STORAGE_KEY = "AURA_API_MODE";
const BASE_STORAGE_KEY = "AURA_API_BASE";
const DEFAULT_MODE: AuraApiMode = "local";

function normalizeBase(base: string): string {
  return base.trim().replace(/\/+$/, "");
}

export function getApiBase(): string {
  const customBase = (uni.getStorageSync(BASE_STORAGE_KEY) || "").toString().trim();
  if (customBase) return normalizeBase(customBase);

  const mode = (uni.getStorageSync(MODE_STORAGE_KEY) || DEFAULT_MODE).toString() as AuraApiMode;
  const base = API_BASES[mode] || API_BASES[DEFAULT_MODE];
  return normalizeBase(base);
}

export function setApiMode(mode: AuraApiMode) {
  uni.setStorageSync(MODE_STORAGE_KEY, mode);
}

export function setCustomApiBase(base: string) {
  uni.setStorageSync(BASE_STORAGE_KEY, normalizeBase(base));
}

export function clearCustomApiBase() {
  uni.removeStorageSync(BASE_STORAGE_KEY);
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
}

const DEVICE_ID_KEY = "AURA_DEVICE_ID";

function randomId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** 获取设备标识，用于云端数据关联（未配置 MySQL 时仅本地有效） */
export function getDeviceId(): string {
  let id = (uni.getStorageSync(DEVICE_ID_KEY) || "").toString().trim();
  if (!id) {
    id = randomId();
    uni.setStorageSync(DEVICE_ID_KEY, id);
  }
  return id;
}

/** 带 device_id 的请求头，用于调用需要持久化的 API */
export function getDataApiHeaders(): Record<string, string> {
  return { "x-device-id": getDeviceId() };
}
