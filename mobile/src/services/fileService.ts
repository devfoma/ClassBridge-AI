import * as FileSystem from 'expo-file-system';

const RESOURCE_DIR = `${FileSystem.documentDirectory}classbridge/resources/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(RESOURCE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RESOURCE_DIR, { intermediates: true });
  }
}

/** Save a resource's text content to a local file so it is available offline. */
export async function saveResourceText(resourceId: string, text: string): Promise<string> {
  await ensureDir();
  const path = `${RESOURCE_DIR}${resourceId}.txt`;
  await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });
  return path;
}

export async function readResourceText(path: string): Promise<string> {
  return FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
}

/** Download a binary/file resource from the hub into local storage. */
export async function downloadResourceFile(url: string, resourceId: string, ext = ''): Promise<string> {
  await ensureDir();
  const path = `${RESOURCE_DIR}${resourceId}${ext}`;
  const result = await FileSystem.downloadAsync(url, path);
  return result.uri;
}

export async function fileExists(path: string | null): Promise<boolean> {
  if (!path) return false;
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}
