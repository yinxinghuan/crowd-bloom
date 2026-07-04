import { useEffect, useMemo, type CSSProperties } from 'react';
import { isInAigram, openAigramProfile } from '@shared/runtime';
import { FIELD_H, FIELD_W, PETAL_COLORS, type BloomPetal } from './types';
import { t } from './i18n';
import { useCrowdBloom } from './hooks/useCrowdBloom';
import { playClick, playMissing, playOpen, playPlant, resumeAudio } from './utils/sounds';
import './CrowdBloom.less';

const RING_RADIUS: Record<number, number> = { 1: 78, 2: 116, 3: 152 };
const aigramSrc = './img/aigram.svg';

function demoPetals(): BloomPetal[] {
  return Array.from({ length: 18 }, (_, i) => ({
    id: `demo-${i}`,
    createdAt: Date.now() - i * 900,
    ring: ((i % 3) + 1) as 1 | 2 | 3,
    angle: i * 37,
    colorIndex: i % PETAL_COLORS.length,
    pulse: i * 41,
    userId: '',
    userName: t('demo'),
  }));
}

function initialFor(name?: string) {
  return (name || '?').trim().slice(0, 1).toUpperCase() || '?';
}

function PetalFace({
  petal,
  index,
  currentUserId,
}: {
  petal: BloomPetal;
  index: number;
  currentUserId: string | null;
}) {
  const ring = RING_RADIUS[petal.ring] || 92;
  const color = PETAL_COLORS[petal.colorIndex % PETAL_COLORS.length];
  const isMine = !!currentUserId && petal.userId === currentUserId;
  const canOpen = !!petal.userId && !isMine && isInAigram;
  const content = (
    <>
      <span className="cb-petal__stem" aria-hidden />
      <span className="cb-petal__body">
        {petal.userAvatarUrl ? (
          <img src={petal.userAvatarUrl} alt="" draggable={false} />
        ) : (
          <span className="cb-petal__initial">{initialFor(petal.userName)}</span>
        )}
      </span>
    </>
  );
  const style = {
    '--angle': `${petal.angle + index * 4}deg`,
    '--radius': `${ring}px`,
    '--color': color,
    '--delay': `${-(petal.pulse % 3000)}ms`,
    zIndex: 20 + index,
  } as CSSProperties;

  if (!canOpen) {
    return (
      <div
        className={`cb-petal ${isMine ? 'cb-petal--mine' : ''}`}
        style={style}
        aria-label={petal.userName || t('demo')}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="cb-petal cb-petal--button"
      style={style}
      onClick={ev => {
        ev.stopPropagation();
        playOpen();
        openAigramProfile(petal.userId);
      }}
      aria-label={t('openProfile', { n: petal.userName || 'user' })}
    >
      {content}
    </button>
  );
}

export default function CrowdBloom() {
  const bloom = useCrowdBloom();
  const fallbackPetals = useMemo(() => demoPetals(), []);
  const fireflies = useMemo(
    () =>
      Array.from({ length: 54 }, (_, i) => ({
        x: (i * 37) % 390,
        y: (i * 61) % 650,
        size: 2 + (i % 4),
        delay: i * -120,
      })),
    [],
  );
  const petals = bloom.visiblePetals.length > 0 ? bloom.visiblePetals : fallbackPetals;
  const canPlant = bloom.profileLoaded && bloom.remainingCooldown === 0;

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== ' ' && ev.key !== 'Enter') return;
      ev.preventDefault();
      handleMainAction();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function handleMainAction() {
    resumeAudio();
    playClick();
    if (!canPlant) return;
    const result = bloom.plant();
    if (result.ok) playPlant();
    else playMissing();
  }

  function handleAvatarCta() {
    resumeAudio();
    playOpen();
    bloom.openAvatarEditor();
  }

  return (
    <main className="cb-shell">
      <section
        className="cb-stage"
        style={{
          width: FIELD_W,
          height: FIELD_H,
          transform: `scale(${bloom.scale})`,
        }}
      >
        <div className="cb-fireflies" aria-hidden>
          {fireflies.map((fly, i) => (
            <span
              key={i}
              style={
                {
                  '--x': `${fly.x}px`,
                  '--y': `${fly.y}px`,
                  '--s': `${fly.size}px`,
                  '--delay': `${fly.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <header className="cb-header">
          <span className="cb-header__mark" aria-hidden />
          <span className="cb-header__kicker">{t('visible')} {bloom.visiblePetals.length || petals.length}</span>
          <span className="cb-header__mine">{t('mine')} {bloom.ownPetals.length}</span>
        </header>

        <section className="cb-title-lockup" aria-label={t('title')}>
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </section>

        <div className="cb-flower" aria-label={t('title')}>
          <div className="cb-flower__rings" aria-hidden />
          <div className="cb-flower__spin">
            {petals.map((petal, index) => (
              <PetalFace
                key={petal.id}
                petal={petal}
                index={index}
                currentUserId={bloom.telegramId}
              />
            ))}
          </div>
          <div className="cb-core">
            <span>{bloom.mode === 'planted' ? t('bloomed') : t('title')}</span>
          </div>
        </div>

        {bloom.mode === 'planted' && (
          <div className="cb-pop" aria-live="polite">
            {t('planted')}
          </div>
        )}

        <div className="cb-actions">
          <button
            type="button"
            className="cb-main-button"
            onPointerDown={handleMainAction}
            disabled={!canPlant}
          >
            <span className="cb-main-button__avatar" aria-hidden>
              {bloom.profile?.head_url ? (
                <img src={bloom.profile.head_url} alt="" draggable={false} />
              ) : (
                <span>{initialFor(bloom.profile?.name)}</span>
              )}
            </span>
            <span>
              {!bloom.profileLoaded
                ? t('loading')
                : bloom.remainingCooldown > 0
                  ? t('cooldown', { n: bloom.remainingCooldown })
                  : t('plant')}
            </span>
          </button>
          <p>{bloom.isInAigram ? t('ownCount', { n: bloom.ownPetals.length }) : t('offPlatform')}</p>
        </div>

        {bloom.mode === 'missing-avatar' && (
          <div className="cb-sheet" role="dialog" aria-modal="true" aria-labelledby="cb-avatar-title">
            <div className="cb-sheet__avatar" aria-hidden>
              {bloom.profile?.head_url ? (
                <img src={bloom.profile.head_url} alt="" draggable={false} />
              ) : (
                <span>{initialFor(bloom.profile?.name)}</span>
              )}
            </div>
            <h2 id="cb-avatar-title">{t('noAvatarTitle')}</h2>
            <p>{bloom.isInAigram ? t('noAvatarBody') : t('offPlatform')}</p>
            <button
              type="button"
              className="cb-sheet__primary"
              onPointerDown={handleAvatarCta}
              disabled={!bloom.isInAigram}
            >
              {t('generateAvatar')}
            </button>
            <button
              type="button"
              className="cb-sheet__close"
              onPointerDown={() => {
                playClick();
                bloom.setMode('ready');
              }}
            >
              {t('close')}
            </button>
          </div>
        )}

        <img className="cb-watermark" src={aigramSrc} alt="" draggable={false} />
      </section>
    </main>
  );
}
