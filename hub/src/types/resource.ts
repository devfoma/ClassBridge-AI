export type ResourceType = 'text' | 'file';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  file_path: string | null;
  text_content: string | null;
  subject: string | null;
  level: string | null;
  summary: string | null;
  metadata_json: string | null;
  created_at: string;
}

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
