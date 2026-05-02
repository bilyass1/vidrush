export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  timeline: Record<string, unknown>;
  exportUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
