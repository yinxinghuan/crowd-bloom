type Locale = 'zh' | 'en';

const dict = {
  en: {
    title: 'Crowd Bloom',
    subtitle: 'Plant your avatar into the shared flower.',
    visible: 'VISIBLE',
    mine: 'MINE',
    plant: 'Plant my face',
    cooldown: '{n}s cooldown',
    loading: 'Loading profile',
    planted: '+1 petal',
    bloomed: 'Bloomed',
    ownCount: '{n} petals saved',
    noAvatarTitle: 'Your avatar is the game piece.',
    noAvatarBody: 'Generate an Aigram avatar first, then come back and plant yourself into the bloom.',
    generateAvatar: 'Generate avatar',
    offPlatform: 'Open in Aigram to plant with your avatar.',
    close: 'Close',
    you: 'YOU',
    demo: 'Preview bloom',
    openProfile: 'Open {n} profile',
  },
  zh: {
    title: 'Crowd Bloom',
    subtitle: '把你的头像种进大家一起长出的花里。',
    visible: '当前花瓣',
    mine: '我的',
    plant: '种下我的头像',
    cooldown: '冷却 {n} 秒',
    loading: '正在读取头像',
    planted: '+1 花瓣',
    bloomed: '已开花',
    ownCount: '已保存 {n} 片花瓣',
    noAvatarTitle: '你的头像就是游戏棋子。',
    noAvatarBody: '先去 Aigram 头像生成工具生成头像，再回来把自己种进这朵公共花里。',
    generateAvatar: '去生成头像',
    offPlatform: '在 Aigram 内打开才能用头像种花。',
    close: '关闭',
    you: '你',
    demo: '预览花朵',
    openProfile: '打开 {n} 的主页',
  },
} satisfies Record<Locale, Record<string, string>>;

function detectLocale(): Locale {
  try {
    const override = localStorage.getItem('game_locale');
    if (override === 'en' || override === 'zh') return override;
  } catch {
    /* ignore */
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

const locale = detectLocale();

export function t(key: keyof typeof dict.en, vars?: { n?: number | string }): string {
  let text = dict[locale][key] || dict.en[key] || key;
  if (vars?.n !== undefined) text = text.replace('{n}', String(vars.n));
  return text;
}

export function isZh(): boolean {
  return locale === 'zh';
}
