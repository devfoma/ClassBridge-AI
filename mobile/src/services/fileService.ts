import { Directory, File, Paths } from 'expo-file-system';

const RESOURCE_DIR = new Directory(Paths.document, 'classbridge', 'resources');

function ensureDir(): void {
  if (!RESOURCE_DIR.exists) {
    RESOURCE_DIR.create({ intermediates: true, idempotent: true });
  }
}

/** Save a resource's text content to a local file so it is available offline. */
export async function saveResourceText(resourceId: string, text: string): Promise<string> {
  ensureDir();
  const file = new File(RESOURCE_DIR, `${resourceId}.txt`);
  file.write(text);
  return file.uri;
}

export async function readResourceText(path: string): Promise<string> {
  return new File(path).text();
}

/** Download a binary/file resource from the hub into local storage. */
export async function downloadResourceFile(url: string, resourceId: string, ext = ''): Promise<string> {
  ensureDir();
  const destination = new File(RESOURCE_DIR, `${resourceId}${ext}`);
  const file = await File.downloadFileAsync(url, destination, { idempotent: true });
  return file.uri;
}

export async function fileExists(path: string | null): Promise<boolean> {
  if (!path) return false;
  return new File(path).exists;
}
