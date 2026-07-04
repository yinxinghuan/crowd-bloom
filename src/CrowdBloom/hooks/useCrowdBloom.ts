import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  api_origin,
  callAigramAPI,
  isInAigram,
  telegramId,
  type AigramResponse,
} from '@shared/runtime';
import { getGameUuid } from '@shared/runtime';
import { useGameSave } from '@shared/save';
import type { BloomMode, BloomPetal, BloomSave, ProfileInfo, SaveRow } from '../types';

const EMPTY_SAVE: BloomSave = { petals: [] };
const MAX_OWN_PETALS = 12;
const MAX_VISIBLE_PETALS = 50;
const COOLDOWN_MS = 45_000;

function makeId() {
  return `petal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function validPetal(value: unknown): value is BloomPetal {
  const p = value as Partial<BloomPetal>;
  return !!p && typeof p.id === 'string' && typeof p.createdAt === 'number';
}

function normalizePetal(p: BloomPetal, userId: string, profile?: ProfileInfo | null): BloomPetal {
  return {
    ...p,
    userId,
    userName: p.userName || profile?.name,
    userAvatarUrl: p.userAvatarUrl || profile?.head_url,
  };
}

function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function callAvatarEditor() {
  if (!api_origin) return;
  const msg = `AW.PROFILE.EDIT-${toBase64(JSON.stringify({}))}`;
  const w = window as any;
  try {
    if (w.webkit?.messageHandlers?.aigram) {
      w.webkit.messageHandlers.aigram.postMessage(msg);
    } else {
      window.parent.postMessage(msg, new URL(api_origin).origin);
    }
  } catch {
    /* ignore */
  }
}

function makePetal(
  user: { id: string; name?: string; avatar?: string },
  ownCount: number,
  communityCount: number,
): BloomPetal {
  const createdAt = Date.now();
  return {
    id: makeId(),
    createdAt,
    ring: ((ownCount % 3) + 1) as 1 | 2 | 3,
    angle: (createdAt / 137) % 360,
    colorIndex: (communityCount + ownCount) % 6,
    pulse: Math.floor(Math.random() * 1000),
    userId: user.id,
    userName: user.name,
    userAvatarUrl: user.avatar,
  };
}

export function useCrowdBloom() {
  const [scale, setScale] = useState(1);
  const [mode, setMode] = useState<BloomMode>('ready');
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [mirror, setMirror] = useState<BloomSave | undefined>(undefined);
  const [community, setCommunity] = useState<BloomPetal[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  const save = useGameSave<BloomSave>('crowd-bloom');
  const sessionId = getGameUuid();

  useEffect(() => {
    const compute = () => {
      setScale(Math.min(window.innerWidth / 390, window.innerHeight / 680));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (mirror === undefined && save.savedData !== undefined) {
      setMirror(save.savedData ?? EMPTY_SAVE);
    }
  }, [mirror, save.savedData]);

  const refreshProfile = useCallback(async () => {
    if (!isInAigram || !telegramId) {
      setProfile(null);
      setProfileLoaded(true);
      return;
    }
    try {
      const res = await callAigramAPI<AigramResponse<ProfileInfo>>(
        `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(telegramId)}`,
        'GET',
      );
      setProfile(res?.data ?? null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  const refreshCommunity = useCallback(async () => {
    if (!isInAigram || !sessionId) return;
    setCommunityLoading(true);
    try {
      const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
        `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      const pairs: Array<{ userId: string; petal: BloomPetal }> = [];
      for (const row of rows) {
        if (!row.user_id || !row.resource_data) continue;
        try {
          const parsed = JSON.parse(row.resource_data) as Partial<BloomSave>;
          for (const petal of parsed.petals || []) {
            if (validPetal(petal)) pairs.push({ userId: row.user_id, petal });
          }
        } catch {
          /* skip corrupt save row */
        }
      }
      pairs.sort((a, b) => b.petal.createdAt - a.petal.createdAt);
      const limited = pairs.slice(0, MAX_VISIBLE_PETALS);
      const uniqueIds = Array.from(new Set(limited.map(p => p.userId)));
      const profiles = await Promise.all(
        uniqueIds.map(async uid => {
          try {
            const r = await callAigramAPI<AigramResponse<ProfileInfo>>(
              `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(uid)}`,
              'GET',
            );
            return [uid, r?.data ?? null] as const;
          } catch {
            return [uid, null] as const;
          }
        }),
      );
      const profileMap = new Map(profiles);
      setCommunity(limited.map(({ userId, petal }) => normalizePetal(petal, userId, profileMap.get(userId))));
    } finally {
      setCommunityLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    void refreshCommunity();
  }, [refreshCommunity]);

  const ownPetals = mirror?.petals ?? [];
  const hasAvatar = !!profile?.head_url;
  const remainingCooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const visiblePetals = useMemo(() => {
    const map = new Map<string, BloomPetal>();
    for (const p of community) map.set(p.id, p);
    for (const p of ownPetals) map.set(p.id, p);
    return Array.from(map.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_VISIBLE_PETALS);
  }, [community, ownPetals]);

  const plant = useCallback(() => {
    if (!mirror || remainingCooldown > 0) return { ok: false, reason: 'cooldown' as const };
    if (!isInAigram) {
      setMode('missing-avatar');
      return { ok: false, reason: 'off-platform' as const };
    }
    if (!telegramId || !hasAvatar) {
      setMode('missing-avatar');
      return { ok: false, reason: 'missing-avatar' as const };
    }
    const petal = makePetal(
      { id: telegramId, name: profile?.name, avatar: profile?.head_url },
      mirror.petals.length,
      visiblePetals.length,
    );
    const next: BloomSave = {
      ...mirror,
      petals: [petal, ...mirror.petals].slice(0, MAX_OWN_PETALS),
    };
    setMirror(next);
    save.persist(next);
    setMode('planted');
    setCooldownUntil(Date.now() + COOLDOWN_MS);
    window.setTimeout(() => setMode(current => (current === 'planted' ? 'ready' : current)), 3000);
    return { ok: true, petal };
  }, [hasAvatar, mirror, profile?.head_url, profile?.name, remainingCooldown, save, visiblePetals.length]);

  const openAvatarEditor = useCallback(() => {
    callAvatarEditor();
  }, []);

  return {
    scale,
    mode,
    setMode,
    isInAigram,
    telegramId,
    profile,
    profileLoaded,
    communityLoading,
    hasAvatar,
    ownPetals,
    visiblePetals,
    remainingCooldown,
    refreshProfile,
    refreshCommunity,
    plant,
    openAvatarEditor,
  };
}
