import { isInAigram } from '@shared/runtime';
import { PETAL_COLORS, type BloomPetal } from './types';
import './ReviewPage.less';

const mockNames = ['Maya', 'Jun', 'Rae', 'Noor', 'Ari', 'Lux', 'Vee', 'Theo', 'Iris', 'Sol', 'Nia', 'Bo'];
const ringRadius: Record<number, number> = { 1: 62, 2: 92, 3: 122 };

function makeMockPetals(count = 12): BloomPetal[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `review-petal-${i}`,
    createdAt: Date.now() - i * 1000,
    ring: ((i % 3) + 1) as 1 | 2 | 3,
    angle: i * 43 + 12,
    colorIndex: i % PETAL_COLORS.length,
    pulse: i * 117,
    userId: `review-${i}`,
    userName: mockNames[i % mockNames.length],
  }));
}

function initialFor(name?: string) {
  return (name || '?').slice(0, 1).toUpperCase();
}

function ReviewFlower({ mine = false, planted = false }: { mine?: boolean; planted?: boolean }) {
  const petals = makeMockPetals(planted ? 14 : 11);
  return (
    <div className="cbr-flower" aria-hidden>
      <div className="cbr-flower__rings" />
      {petals.map((petal, index) => {
        const isMine = mine && index === 1;
        return (
          <span
            key={petal.id}
            className={`cbr-petal ${isMine ? 'cbr-petal--mine' : ''}`}
            style={
              {
                '--angle': `${petal.angle}deg`,
                '--radius': `${ringRadius[petal.ring]}px`,
                '--color': PETAL_COLORS[petal.colorIndex],
                zIndex: 10 + index,
              } as React.CSSProperties
            }
          >
            <span className="cbr-petal__stem" />
            <span className="cbr-petal__face">{initialFor(isMine ? 'You' : petal.userName)}</span>
          </span>
        );
      })}
      <span className="cbr-core">Crowd<br />Bloom</span>
      {planted && <span className="cbr-pop">+1 petal</span>}
    </div>
  );
}

function MiniStage({
  title,
  caption,
  mode,
}: {
  title: string;
  caption: string;
  mode: 'ready' | 'missing' | 'planted' | 'community';
}) {
  const isMissing = mode === 'missing';
  const isPlanted = mode === 'planted';
  return (
    <section className="cbr-stage">
      <header className="cbr-stage__top">
        <span>Visible 24</span>
        <span>Mine {isPlanted ? 1 : 0}</span>
      </header>
      <div className="cbr-stage__title">
        <h3>Crowd Bloom</h3>
        <p>{caption}</p>
      </div>
      <ReviewFlower mine={isPlanted} planted={isPlanted} />
      {isMissing && (
        <div className="cbr-missing">
          <span className="cbr-missing__seal">?</span>
          <strong>Your avatar is the game piece.</strong>
          <p>Generate an Aigram avatar first, then come back and plant yourself.</p>
          <span className="cbr-missing__button">Generate avatar</span>
        </div>
      )}
      <footer className="cbr-stage__action">
        <span className="cbr-action__avatar">{isMissing ? '?' : 'Y'}</span>
        <span>{isMissing ? 'Generate avatar' : 'Plant my face'}</span>
      </footer>
      <span className="cbr-stage__label">{title}</span>
    </section>
  );
}

export default function ReviewPage() {
  return (
    <main className="cbr-page">
      <section className="cbr-hero">
        <div className="cbr-hero__kicker">Crowd Bloom review build</div>
        <h1>这是一个用头像共同生长的公共物件，不是彩色圆圈游戏。</h1>
        <p>
          每个椭圆花瓣代表一位 Aigram 用户的头像。玩家种下自己的头像后，
          它会加入公共花；点击别人的头像花瓣会打开对方主页。
        </p>
        <div className="cbr-hero__links">
          <a href="?play=1">查看真实游戏空环境</a>
          <a href="https://github.com/yinxinghuan/crowd-bloom/archive/refs/heads/master.zip">迁移工具 zip</a>
        </div>
      </section>

      <section className="cbr-flow" aria-label="Review screens">
        <MiniStage
          title="01 / 有头像"
          caption="头像会成为可种下的游戏元素。"
          mode="ready"
        />
        <MiniStage
          title="02 / 无头像"
          caption="没有头像时不让玩家进入空玩法。"
          mode="missing"
        />
        <MiniStage
          title="03 / 种下后"
          caption="自己的头像花瓣进入公共花并高亮。"
          mode="planted"
        />
        <MiniStage
          title="04 / 社交状态"
          caption="公共花由最近玩家的头像花瓣组成。"
          mode="community"
        />
      </section>

      <section className="cbr-notes">
        <div>
          <h2>页面和状态</h2>
          <p>正式游戏仍是单屏仪式：ready、missing-avatar、planted feedback 三个状态互斥切换。</p>
        </div>
        <div>
          <h2>为什么需要头像</h2>
          <p>没有 Aigram 头像时，游戏没有可种下的“花瓣”。所以会引导玩家去平台头像生成工具。</p>
        </div>
        <div>
          <h2>迁移环境</h2>
          <p>
            当前页面只在非 Aigram 环境默认展示。Aigram iframe 带 `api_origin` 和 `telegram_id`
            时会自动进入真实游戏。{isInAigram ? '当前已在 Aigram 环境。' : '当前是评审环境。'}
          </p>
        </div>
      </section>
    </main>
  );
}
