/* HAMIN GAMES — COLLECTION album + H-POINT EXCHANGE strings (docs/CONTRACT.md §3.3)
   Namespace: collection.*  (collection.html / js/collection.js)

   Item names, memory/achievement texts, hints (hint.*), kind labels (kind.*),
   sticker/room categories, rarity and unlock labels (unlock.*) are shared and live
   in data/translations-items.js; H-POINT words (hpoint.*) in data/translations.js.
   Every language block has exactly the same keys (check: node tools/check-i18n.js).
   H-POINT is always described as a game point — never money. */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      collection: {
        docTitle: 'COLLECTION ♡ HAMIN GAMES',
        title: 'COLLECTION ALBUM ♡',
        label: 'COLLECTION',
        count: '{owned} / {total}',
        aria: 'Collection progress: {owned} of {total} ({n}%)',
        note: 'Starter items are gifts ♡ They aren’t counted in the %.',
        next: 'NEXT ♡ {n}%: {items}',
        allRewards: 'All milestone rewards collected ♡',
        milestone: '{n}% reward: {items}',
        wallet: {
          title: 'MY H-POINT',
          note: 'H-POINT is a game point, not real money. Earn it by playing and trade it for cute items ♡'
        },
        tabs: {
          label: 'Collection categories',
          memories: 'MEMORIES', outfits: 'OUTFITS', poses: 'POSES', stickers: 'STICKERS',
          room: 'ROOM ITEMS', achievements: 'ACHIEVEMENTS', exchange: 'H-POINT EXCHANGE',
          hasNew: 'New items inside!'
        },
        tabCount: '{owned}/{total}',
        complete: 'COMPLETE ★',
        completeToast: '{name} complete! You collected them all ♡',
        memoryNo: 'Memory #{no}',
        secret: 'SECRET',
        starter: 'STARTER',
        locked: '???',
        bonus: 'Bonus — not counted in %',
        empty: {
          outfits: 'The closet is still being filled… check back soon! 👕',
          generic: 'Nothing here yet ♡'
        },
        section: { frames: 'FRAMES', backgrounds: 'BACKGROUNDS', other: 'OTHER' },
        detail: {
          owned: 'Owned ♡',
          starter: 'Starter item — yours from day one ♡',
          howTo: 'HOW TO UNLOCK',
          exchange: 'You can exchange it for {n} H-POINT ♡',
          use: 'USE IT ▶',
          open: '{name}: details',
          got: 'Unlocked: {date}'
        },
        achv: { notYet: 'NOT YET' },
        exchange: {
          intro: 'Trade H-POINT for cute cosmetic items. Prices are fixed — no luck, no real money ♡',
          all: 'ALL',
          filter: 'Filter by kind',
          affordable: 'You can exchange {n} item(s) right now ♡',
          none: 'Keep playing to earn more H-POINT ♡',
          button: 'EXCHANGE',
          need: 'Need {n} more',
          confirmTitle: 'EXCHANGE THIS ITEM?',
          after: 'H-POINT after the exchange: {n}',
          ok: 'EXCHANGE ♡',
          failed: 'This item could not be exchanged.',
          empty: 'Everything is exchanged! A true collector ♡',
          emptyFilter: 'Nothing left to exchange here ♡',
          sorted: 'Sorted by price ♡'
        },
        date: '{y}.{m}.{d}'
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      collection: {
        docTitle: '컬렉션 ♡ HAMIN GAMES',
        title: '컬렉션 앨범 ♡',
        label: '컬렉션',
        count: '{owned} / {total}',
        aria: '컬렉션 진행도: {total}개 중 {owned}개 ({n}%)',
        note: '처음부터 있던 아이템은 선물이에요 ♡ %에는 세지 않아요.',
        next: 'NEXT ♡ {n}%: {items}',
        allRewards: '달성 보상을 모두 모았어요 ♡',
        milestone: '{n}% 보상: {items}',
        wallet: {
          title: '내 H-POINT',
          note: 'H-POINT는 게임 포인트예요, 진짜 돈이 아니에요. 게임을 해서 모으고 귀여운 아이템으로 교환해요 ♡'
        },
        tabs: {
          label: '컬렉션 분류',
          memories: '추억', outfits: '의상', poses: '포즈', stickers: '스티커',
          room: '방 아이템', achievements: '업적', exchange: 'H-POINT 교환소',
          hasNew: '새 아이템이 있어요!'
        },
        tabCount: '{owned}/{total}',
        complete: 'COMPLETE ★',
        completeToast: '{name} 컴플리트! 전부 모았어요 ♡',
        memoryNo: '추억 #{no}',
        secret: 'SECRET',
        starter: '기본',
        locked: '???',
        bonus: '보너스 — %에는 세지 않아요',
        empty: {
          outfits: '옷장을 아직 채우는 중이에요… 곧 다시 와 주세요! 👕',
          generic: '아직 아무것도 없어요 ♡'
        },
        section: { frames: '프레임', backgrounds: '배경', other: '기타' },
        detail: {
          owned: '보유중 ♡',
          starter: '기본 아이템 — 처음부터 당신 거예요 ♡',
          howTo: '잠금 해제 방법',
          exchange: '{n} H-POINT로 교환할 수 있어요 ♡',
          use: '사용하러 가기 ▶',
          open: '{name}: 자세히 보기',
          got: '획득: {date}'
        },
        achv: { notYet: '미달성' },
        exchange: {
          intro: 'H-POINT를 귀여운 꾸미기 아이템으로 교환해요. 가격은 정해져 있어요 — 뽑기도, 진짜 돈도 없어요 ♡',
          all: '전체',
          filter: '종류별로 보기',
          affordable: '지금 {n}개 교환할 수 있어요 ♡',
          none: '게임을 해서 H-POINT를 더 모아 봐요 ♡',
          button: '교환',
          need: '{n} 더 필요',
          confirmTitle: '이 아이템을 교환할까요?',
          after: '교환 후 H-POINT: {n}',
          ok: '교환하기 ♡',
          failed: '이 아이템은 교환할 수 없어요.',
          empty: '전부 교환했어요! 진정한 컬렉터 ♡',
          emptyFilter: '이 종류는 더 교환할 게 없어요 ♡',
          sorted: '가격순 ♡'
        },
        date: '{y}.{m}.{d}'
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      collection: {
        docTitle: '收藏 ♡ HAMIN GAMES',
        title: '收藏相册 ♡',
        label: '收藏',
        count: '{owned} / {total}',
        aria: '收藏进度：{owned} / {total}（{n}%）',
        note: '初始道具是礼物 ♡ 不计入百分比。',
        next: 'NEXT ♡ {n}%：{items}',
        allRewards: '所有阶段奖励都已领取 ♡',
        milestone: '{n}% 奖励：{items}',
        wallet: {
          title: '我的 H-POINT',
          note: 'H-POINT 是游戏积分，不是真钱。玩游戏就能获得，可以兑换可爱的道具 ♡'
        },
        tabs: {
          label: '收藏分类',
          memories: '回忆', outfits: '服装', poses: '姿势', stickers: '贴纸',
          room: '房间道具', achievements: '成就', exchange: 'H-POINT 兑换所',
          hasNew: '有新道具！'
        },
        tabCount: '{owned}/{total}',
        complete: 'COMPLETE ★',
        completeToast: '{name}全部集齐啦！♡',
        memoryNo: '回忆 #{no}',
        secret: 'SECRET',
        starter: '初始',
        locked: '???',
        bonus: '额外——不计入百分比',
        empty: {
          outfits: '衣柜还在慢慢填满中……请稍后再来！👕',
          generic: '这里还什么都没有 ♡'
        },
        section: { frames: '相框', backgrounds: '背景', other: '其他' },
        detail: {
          owned: '已拥有 ♡',
          starter: '初始道具——从第一天起就是你的 ♡',
          howTo: '解锁方法',
          exchange: '可以用 {n} H-POINT 兑换哦 ♡',
          use: '去使用 ▶',
          open: '{name}：查看详情',
          got: '获得日期：{date}'
        },
        achv: { notYet: '未达成' },
        exchange: {
          intro: '用 H-POINT 兑换可爱的装饰道具。价格固定——没有抽奖，也没有真钱 ♡',
          all: '全部',
          filter: '按种类筛选',
          affordable: '现在可以兑换 {n} 件 ♡',
          none: '多玩几局，攒更多 H-POINT 吧 ♡',
          button: '兑换',
          need: '还差 {n}',
          confirmTitle: '要兑换这件道具吗？',
          after: '兑换后的 H-POINT：{n}',
          ok: '兑换 ♡',
          failed: '这件道具无法兑换。',
          empty: '全部兑换完啦！真正的收藏家 ♡',
          emptyFilter: '这个种类没有可以兑换的了 ♡',
          sorted: '按价格排序 ♡'
        },
        date: '{y}.{m}.{d}'
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      collection: {
        docTitle: 'コレクション ♡ HAMIN GAMES',
        title: 'コレクションアルバム ♡',
        label: 'コレクション',
        count: '{owned} / {total}',
        aria: 'コレクション進行度：{total} 個中 {owned} 個（{n}%）',
        note: 'はじめから持っているアイテムはプレゼント ♡ % には数えません。',
        next: 'NEXT ♡ {n}%：{items}',
        allRewards: '達成ごほうびをぜんぶ集めたよ ♡',
        milestone: '{n}% ごほうび：{items}',
        wallet: {
          title: 'マイ H-POINT',
          note: 'H-POINT はゲームのポイントで、本物のお金ではありません。あそんでためて、かわいいアイテムと交換しよう ♡'
        },
        tabs: {
          label: 'コレクションの分類',
          memories: '思い出', outfits: 'コーデ', poses: 'ポーズ', stickers: 'スタンプ',
          room: 'おへやアイテム', achievements: '実績', exchange: 'H-POINT 交換所',
          hasNew: '新しいアイテムがあるよ！'
        },
        tabCount: '{owned}/{total}',
        complete: 'COMPLETE ★',
        completeToast: '{name} コンプリート！ぜんぶ集めたね ♡',
        memoryNo: '思い出 #{no}',
        secret: 'SECRET',
        starter: 'はじめから',
        locked: '???',
        bonus: 'おまけ — % には数えません',
        empty: {
          outfits: 'クローゼットはまだ準備中…また見に来てね！👕',
          generic: 'まだ何もないよ ♡'
        },
        section: { frames: 'フレーム', backgrounds: '背景', other: 'その他' },
        detail: {
          owned: '持っている ♡',
          starter: 'はじめからのアイテム — 最初の日からあなたのもの ♡',
          howTo: 'アンロック方法',
          exchange: '{n} H-POINT で交換できるよ ♡',
          use: '使いに行く ▶',
          open: '{name}：くわしく見る',
          got: '入手日：{date}'
        },
        achv: { notYet: '未達成' },
        exchange: {
          intro: 'H-POINT をかわいいアイテムと交換しよう。価格は固定 — ガチャも本物のお金もなし ♡',
          all: 'すべて',
          filter: '種類でしぼりこむ',
          affordable: '今すぐ {n} 個交換できるよ ♡',
          none: 'もっとあそんで H-POINT をためよう ♡',
          button: '交換',
          need: 'あと {n}',
          confirmTitle: 'このアイテムを交換する？',
          after: '交換後の H-POINT：{n}',
          ok: '交換する ♡',
          failed: 'このアイテムは交換できませんでした。',
          empty: 'ぜんぶ交換したよ！真のコレクター ♡',
          emptyFilter: 'この種類で交換できるものはもうないよ ♡',
          sorted: '価格順 ♡'
        },
        date: '{y}.{m}.{d}'
      }
    }
  };

  if (typeof HG.addStrings === 'function') HG.addStrings(STRINGS);
  else (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
})(window.HG = window.HG || {});
