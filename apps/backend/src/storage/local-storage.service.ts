import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService {
  private readonly uploadsDir: string;
  private readonly backendUrl: string;

  constructor() {
    this.uploadsDir = process.env.LOCAL_STORAGE_PATH
      ? path.resolve(process.env.LOCAL_STORAGE_PATH)
      : path.join(process.cwd(), 'uploads');

    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /** Save a buffer to disk and return its HTTP URL. */
  async saveBuffer(buffer: Buffer, relativePath: string): Promise<string> {
    const fullPath = path.join(this.uploadsDir, relativePath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    return `${this.backendUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /** Resolve a relative path to its absolute path on disk. */
  resolve(relativePath: string): string {
    return path.join(this.uploadsDir, relativePath);
  }
}
