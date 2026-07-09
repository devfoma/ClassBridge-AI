export type ResourceType = 'text' | 'file';

export interface ResourcePublic {
  id: string;
  title: string;
  type: ResourceType;
  subject: string | null;
  level: string | null;
  summary: string | null;
  textContent?: string | null;
  hasFile: boolean;
  createdAt: string;
}

export interface LocalResource {
  id: string;
  title: string;
  type: ResourceType;
  localPath: string | null;
  remotePath: string | null;
  downloaded: number;
  textContent: string | null;
  metadataJson: string | null;
  /** Derived from metadataJson.summary — the AI summary synced from the hub. */
  summary?: string | null;
}
