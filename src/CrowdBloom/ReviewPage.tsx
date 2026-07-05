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

function ReviewFlower({
  mine = false,
  planted = false,
  showPop = planted,
}: {
  mine?: boolean;
  planted?: boolean;
  showPop?: boolean;
}) {
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
      {showPop && <span className="cbr-pop">+1 petal</span>}
    </div>
  );
}

function MiniStage({
  title,
  caption,
  mode,
  className = '',
  showPop,
}: {
  title: string;
  caption: string;
  mode: 'ready' | 'missing' | 'planted' | 'community';
  className?: string;
  showPop?: boolean;
}) {
  const isMissing = mode === 'missing';
  const isPlanted = mode === 'planted';
  return (
    <section className={`cbr-stage ${className}`}>
      <header className="cbr-stage__top">
        <span>Visible 24</span>
        <span>Mine {isPlanted ? 1 : 0}</span>
      </header>
      <div className="cbr-stage__title">
        <h3>Crowd Bloom</h3>
        <p>{caption}</p>
      </div>
      <ReviewFlower mine={isPlanted} planted={isPlanted} showPop={showPop ?? isPlanted} />
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
      <section className="cbr-showcase">
        <div className="cbr-showcase__copy">
          <div className="cbr-hero__kicker">Crowd Bloom review build</div>
          <h1>最终上线画面</h1>
          <p>
            玩家打开后看到的是右侧这张完整单屏：自己的头像作为花瓣种入公共花，
            其他玩家头像围成花冠，底部只有一个仪式按钮。
          </p>
          <div className="cbr-showcase__legend">
            <span>椭圆花瓣 = 玩家头像</span>
            <span>粉色光晕 = 当前玩家</span>
            <span>点击他人花瓣 = 打开主页</span>
          </div>
          <div className="cbr-hero__links">
            <a href="?play=1">查看真实游戏空环境</a>
            <a href="https://github.com/yinxinghuan/crowd-bloom/archive/refs/heads/master.zip">迁移工具 zip</a>
          </div>
        </div>

        <div className="cbr-phone" aria-label="Final game preview">
          <div className="cbr-phone__bar">
            <span />
          </div>
          <MiniStage
            title="最终成品 / 已种下"
            caption="公共花由最近玩家的头像花瓣组成。"
            mode="planted"
            className="cbr-stage--final"
            showPop={false}
          />
        </div>
      </section>

      <section className="cbr-hero cbr-hero--compact">
        <div className="cbr-hero__kicker">State review</div>
        <h2>所有页面状态</h2>
        <p>下面四张是拆开的评审状态，用来确认有头像、无头像、种下反馈和公共社交态。</p>
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
