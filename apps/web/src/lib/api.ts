import type { VideoGeneration } from '@vidrush/shared';
import type { Plan } from '@vidrush/shared';

export interface GenerationResult {
  title: string;
  hook: string | null;
  script: { scene: number; content: string; duration: string }[];
  visualStyle: { description: string; colors: string[] };
  cameraMovements: { scene: number; movement: string }[];
  timeline: { scene: number; start: string; end: string; label: string }[];
  loop: string | null;
  tags: string[];
  thumbnailConcept: string;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  hasYoutubeConnected: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt_refresh');
}

function setTokens(access: string, refresh?: string) {
  localStorage.setItem('jwt', access);
  if (refresh) {
    localStorage.setItem('jwt_refresh', refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('jwt_refresh');
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    console.error('API Fetch Error:', err);
    throw new Error(
      `Network error: Could not connect to the server at ${API_URL}. Please ensure the backend is running.`
    );
  }

  // If 401 and we have a refresh token, try refreshing
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      try {
        res = await fetch(`${API_URL}${path}`, { ...options, headers });
      } catch (err) {
        throw new Error(`Network error after refresh: Could not connect to ${API_URL}`);
      }
    }
  }

  if (!res.ok) {
    let errorMsg = 'Request failed';
    try {
      const error = await res.json();
      if (typeof error.message === 'string') {
        errorMsg = error.message;
      } else if (Array.isArray(error.message)) {
        errorMsg = error.message.join(', ');
      } else if (error.error) {
        errorMsg = error.error;
      }
    } catch (e) {
      errorMsg = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.access_token, data.refresh_token);
    return data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const data = await fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setTokens(data.access_token, data.refresh_token);
    return data;
  },

  googleLogin(): void {
    window.location.href = `${API_URL}/auth/google`;
  },

  async me(): Promise<MeResponse> {
    return fetchApi<MeResponse>('/auth/me');
  },

  logout(): void {
    clearTokens();
    window.location.href = '/login';
  },
};

export interface DashboardStats {
  totalVideos: number;
  minutesUsed: number;
  minutesLimit: number;
  publishedCount: number;
  thisMonthCount: number;
}

export interface ChannelInfo {
  channelId: string;
  name: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  videoCount: number;
}

export interface DailyVideoStat {
  date: string;
  views: number;
  watchTime: number;
  likes: number;
  subscribersGained: number;
  ctr: number;
}

export interface VideoAnalytics {
  views: number;
  watchTime: number;
  likes: number;
  subscribersGained: number;
  ctr: number;
  dailyStats: DailyVideoStat[];
}

export interface DailyChannelStat {
  date: string;
  views: number;
  watchTime: number;
  likes: number;
  subscribersGained: number;
}

export interface ChannelAnalytics {
  totalViews: number;
  totalWatchTime: number;
  totalLikes: number;
  totalSubscribersGained: number;
  dailyStats: DailyChannelStat[];
}

export const youtube = {
  async getAuthUrl(): Promise<{ url: string }> {
    return fetchApi<{ url: string }>('/youtube/auth');
  },

  async getChannel(): Promise<ChannelInfo | null> {
    return fetchApi<ChannelInfo | null>('/youtube/channel');
  },

  async upload(data: {
    videoGenerationId: string;
    title: string;
    description: string;
    tags: string[];
    privacy: 'public' | 'unlisted' | 'private';
    isShort: boolean;
    scheduledAt?: string;
  }): Promise<{ youtubeVideoId: string; youtubeUrl: string }> {
    return fetchApi('/youtube/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getChannelAnalytics(): Promise<ChannelAnalytics> {
    return fetchApi<ChannelAnalytics>('/youtube/analytics/channel');
  },

  async getVideoAnalytics(youtubeVideoId: string): Promise<VideoAnalytics> {
    return fetchApi<VideoAnalytics>(`/youtube/analytics/video/${youtubeVideoId}`);
  },

  async disconnect(): Promise<void> {
    await fetchApi('/youtube/disconnect', { method: 'DELETE' });
  },
};

export const video = {
  async stats(): Promise<DashboardStats> {
    return fetchApi<DashboardStats>('/video/stats');
  },

  async recent(limit = 6): Promise<VideoGeneration[]> {
    return fetchApi<VideoGeneration[]>(`/video/recent?limit=${limit}`);
  },

  async directGenerate(data: {
    idea: string;
    genre: string;
    aspectRatio: string;
    market: string;
    duration: number;
  }): Promise<{ jobId: string }> {
    return fetchApi<{ jobId: string }>('/video/direct-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async directGenerateWithImage(formData: FormData): Promise<{ jobId: string }> {
    const token = getToken();
    const res = await fetch(`${API_URL}/video/direct-generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || 'Failed to start generation');
    }
    return res.json();
  },

  async generateScript(data: {
    topic: string;
    genre: string;
    aspectRatio: string;
    market: string;
    duration: number;
  }): Promise<GenerationResult> {
    return fetchApi<GenerationResult>('/video/script-preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generate(data: {
    topic: string;
    genre: string;
    aspectRatio: string;
    market: string;
    duration: number;
    pipeline: 'free' | 'premium';
  }): Promise<{ jobId: string }> {
    return fetchApi<{ jobId: string }>('/video/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async saveProject(data: { title: string; videoPath: string; timeline: any }): Promise<any> {
    return fetchApi('/video/project/save', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listProjects(): Promise<any[]> {
    return fetchApi<any[]>('/video/project/list');
  },

  async getProject(id: string): Promise<any> {
    return fetchApi<any>(`/video/project/${id}`);
  },
};

export interface ScriptScene {
  scene_number: number;
  narration: string;
  duration_seconds: number;
  positive_prompt: string;
  negative_prompt: string;
}

export interface ScriptResult {
  title: string;
  hook: string;
  scenes: ScriptScene[];
  loop_ending: string;
  total_words: number;
  estimated_duration_seconds: number;
}

export interface ScriptGenerateDto {
  idea: string;
  genre: string;
  aspectRatio: string;
  language: string;
  durationSeconds: number;
  voiceId?: string;
  generationMode?: 'free' | 'premium';
}

export const scriptEngine = {
  async generateScript(dto: ScriptGenerateDto): Promise<ScriptResult> {
    return fetchApi<ScriptResult>('/script-engine/generate-script', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async generateVideo(dto: ScriptGenerateDto): Promise<{ jobId: string; scriptProjectId: string; status: string }> {
    return fetchApi('/script-engine/generate-video', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async getStatus(projectId: string): Promise<{ status: string; scriptJson: ScriptResult | null; videoJobId: string | null }> {
    return fetchApi(`/script-engine/status/${projectId}`);
  },
};
