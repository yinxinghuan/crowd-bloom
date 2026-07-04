declare module '@shared/runtime' {
  export interface AigramResponse<T = unknown> {
    retcode: number;
    errcode?: number;
    msg: string;
    data: T;
  }
  export const api_origin: string | null;
  export const telegramId: string | null;
  export const isInAigram: boolean;
  export function callAigramAPI<T = unknown>(
    url: string,
    method?: 'GET' | 'POST',
    data?: unknown,
  ): Promise<T>;
  export function openAigramProfile(userId: string): void;
  export function getGameUuid(): string | null;
}

declare module '@shared/save' {
  export interface UseGameSave<T> {
    savedData: T | null | undefined;
    loaded: boolean;
    hasSave: boolean;
    persist: (data: T) => void;
    clear: () => Promise<void>;
  }
  export function useGameSave<T>(gameId: string): UseGameSave<T>;
}
