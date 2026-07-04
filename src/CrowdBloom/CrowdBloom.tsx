import { useEffect, useMemo, type CSSProperties } from 'react';
import { isInAigram, openAigramProfile } from '@shared/runtime';
import { FIELD_H, FIELD_W, PETAL_COLORS, type BloomPetal } from './types';
import { t } from './i18n';
import { useCrowdBloom } from './hooks/useCrowdBloom';
import { playClick, playMissing, playOpen, playPlant, resumeAudio } from './utils/sounds';
import './CrowdBloom.less';

const RING_RADIUS: Record<number, number> = { 1: 92, 2: 142, 3: 194 };
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

function AuthorChip({ petal }: { petal: BloomPetal }) {
  const isSelf = !!petal.userId && petal.userId === new URLSearchParams(window.location.search).get('telegram_id');
  if (isSelf) {
    return <span className="cb-author cb-author--self">{t('you')}</span>;
  }
  if (!petal.userId) {
    return <span className="cb-author cb-author--demo">{petal.userName || t('demo')}</span>;
  }
  return (
    <button
      type="button"
      className="cb-author"
      disabled={!isInAigram}
      onClick={ev => {
        ev.stopPropagation();
        if (!isInAigram) return;
        playOpen();
        openAigramProfile(petal.userId);
      }}
      aria-label={t('openProfile', { n: petal.userName || 'user' })}
    >
      <span className="cb-author__avatar" aria-hidden>
        {petal.userAvatarUrl ? (
          <img src={petal.userAvatarUrl} alt="" draggable={false} />
        ) : (
          <span>{initialFor(petal.userName)}</span>
        )}
      </span>
      <span className="cb-author__name">{petal.userName || 'Aigram'}</span>
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
          <div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <div className="cb-counts" aria-label="Bloom counters">
            <span>{t('visible')}</span>
            <strong>{bloom.visiblePetals.length || petals.length}</strong>
            <span>{t('mine')}</span>
            <strong>{bloom.ownPetals.length}</strong>
          </div>
        </header>

        <div className="cb-flower" aria-label={t('title')}>
          <div className="cb-flower__rings" aria-hidden />
          <div className="cb-flower__spin">
            {petals.map((petal, index) => {
              const ring = RING_RADIUS[petal.ring] || 92;
              const color = PETAL_COLORS[petal.colorIndex % PETAL_COLORS.length];
              const isMine = !!bloom.telegramId && petal.userId === bloom.telegramId;
              return (
                <div
                  key={petal.id}
                  className={`cb-petal ${isMine ? 'cb-petal--mine' : ''}`}
                  style={{
                    '--angle': `${petal.angle + index * 4}deg`,
                    '--radius': `${ring}px`,
                    '--color': color,
                    '--delay': `${-(petal.pulse % 3000)}ms`,
                    zIndex: 20 + index,
                  } as CSSProperties}
                >
                  <span className="cb-petal__stem" aria-hidden />
                  <span className="cb-petal__body">
                    {petal.userAvatarUrl ? (
                      <img src={petal.userAvatarUrl} alt="" draggable={false} />
                    ) : (
                      <span className="cb-petal__initial">{initialFor(petal.userName)}</span>
                    )}
                  </span>
                </div>
              );
            })}
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

        <section className="cb-strip" aria-label="Recent petals">
          {petals.slice(0, 12).map(petal => (
            <article key={`strip-${petal.id}`} className="cb-strip__item">
              <AuthorChip petal={petal} />
            </article>
          ))}
        </section>

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
