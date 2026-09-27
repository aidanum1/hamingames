/* HAMIN GAMES — HAMIN'S LUNCH TIME strings (docs/CONTRACT.md §3.3)
   Namespace: lunch.*  (lunch-time.html / js/lunch-time.js)

   The game title lives in data/translations.js (games.lunchTime.*); generic game
   words (shell.*) are shared there too. Every language block has exactly the same
   keys (check: node tools/check-i18n.js).
   "SHEEP SMILE ♡" is HAMIN GAMES' own name for the happiest lunch reaction — a game
   term, never presented as a real nickname or fact about Hamin. Speech lines are
   simple game reactions, not quotes. */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      lunch: {
        docTitle: 'HAMIN’S LUNCH TIME ♡ HAMIN GAMES',
        playArea: 'Lunch Time game',
        hamin: 'HAMIN ♡',
        help: 'Hamin is hungry! Check the ORDER ticket and serve exactly those foods.\n' +
              'Click or tap the matching foods on the LUNCH COUNTER — or drag them onto the tray. Keys 1–9 and 0 pick the food above each number.\n' +
              'Fill the tray before the timer runs out. Serve fast for a PERFECT!\n' +
              'Serving round after round builds your COMBO for extra points.\n' +
              'A wrong food or TIME UP costs one ♥. Lose all 3 and lunch is over.\n' +
              'From round 6 the counter starts moving (RUSH!) — keep up!\n' +
              '5 PERFECT rounds in a row = SHEEP SMILE ♡, this game’s name for Hamin’s happiest reaction!\n' +
              'P or Esc pauses. Hamin wears your Dress Up look ♡',
        start: {
          desc: 'Hamin is hungry! Serve the order before time runs out ♡',
          step1: 'Check the ORDER',
          step2: 'Pick the foods',
          step3: 'Fill the tray!',
          play: 'START ♡',
          how: 'HOW TO PLAY',
          keys: 'Keys 1–9 · 0 pick foods · P pauses',
          look: 'Hamin is wearing your Dress Up look ♡',
          lookLink: 'Change outfit ▶'
        },
        hud: {
          score: 'SCORE', combo: 'COMBO', round: 'ROUND', lives: 'LIFE', best: 'BEST',
          livesAria: 'Lives: {n} of {max}',
          streak: 'PERFECT streak: {n} of {max}',
          pause: 'Pause'
        },
        order: {
          title: 'ORDER',
          waiting: 'Hamin is waiting for lunch… ♡',
          count: '×{n}',
          done: 'served'
        },
        tray: { title: 'TRAY ♡' },
        counter: {
          title: 'LUNCH COUNTER ♡',
          rush: 'RUSH! ▶▶',
          slot: '{key}: {name}'
        },
        timer: 'Time left',
        food: {
          ramen: 'Ramen', dumplings: 'Dumplings', 'rice-bowl': 'Rice Bowl', kimbap: 'Kimbap',
          tteokbokki: 'Tteokbokki', 'fried-chicken': 'Fried Chicken', strawberry: 'Strawberry',
          'strawberry-cake': 'Strawberry Cake', tangerine: 'Tangerine', watermelon: 'Watermelon',
          'banana-milk': 'Banana Milk', 'strawberry-milk': 'Strawberry Milk', 'fish-bread': 'Fish Bread',
          'ice-cream': 'Ice Cream', cookie: 'Cookie', 'egg-toast': 'Egg Toast'
        },
        pop: {
          perfect: 'PERFECT!', yummy: 'YUMMY!', combo: 'COMBO ×{n}!', wrong: 'WRONG ITEM!',
          timeUp: 'TIME UP!', sheep: 'SHEEP SMILE ♡', rush: 'RUSH HOUR!'
        },
        say: {
          hello: 'Lunch time~! ♡',
          order1: 'This one, please!', order2: 'I’m so hungry~', order3: 'Today I want these!',
          good1: 'Ooh, yes!', good2: 'That one! ♡',
          eat: 'Nom nom…',
          yum1: 'Yummy~! ♡', yum2: 'Thank you!', yum3: 'So good!',
          perfect1: 'Wow, so fast!', perfect2: 'A perfect lunch ♡',
          wrong1: 'Huh? Not that one…', wrong2: 'Oops, wrong one!',
          timeUp1: 'Aww… still hungry…', timeUp2: 'Too slow~',
          sheep: 'Best lunch ever! ♡',
          rush: 'The line is moving!',
          bye: 'Thanks for lunch! ♡'
        },
        face: {
          neutral: 'Hamin is waiting', smile: 'Hamin smiles', big: 'Hamin beams', eating: 'Hamin is eating',
          surprised: 'Hamin looks surprised', pout: 'Hamin pouts', sheep: 'Hamin’s SHEEP SMILE ♡'
        },
        announce: {
          ready: 'Get ready!',
          round: 'Round {n}. Order: {items}.',
          served: '{judge} Plus {pts} points. Score {score}.',
          wrong: 'Wrong item! {n} lives left.',
          timeUp: 'Time up! {n} lives left.',
          sheep: 'SHEEP SMILE! Plus {pts} bonus points.',
          over: 'Lunch is over. Final score {score}.',
          rush: 'Rush hour! The counter is moving.'
        },
        result: {
          title: 'LUNCH IS OVER ♡',
          rounds: 'SERVED', perfects: 'PERFECT', bestCombo: 'BEST COMBO', sheep: 'SHEEP SMILE',
          desserts: 'DESSERTS', score: 'SCORE', best: 'BEST',
          retry: 'RETRY ♡', back: 'BACK',
          rank: 'Rank {r}',
          unlocked: 'NEW ITEMS ♡'
        },
        tip: {
          label: 'TIP ♡',
          text: 'Change Hamin’s outfit in Dress Up — he wears it at lunch, too!',
          link: 'Go to Dress Up ▶'
        }
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      lunch: {
        docTitle: '하민의 점심시간 ♡ HAMIN GAMES',
        playArea: '점심시간 게임 화면',
        hamin: '하민 ♡',
        help: '하민이 배고파요! 주문서(ORDER)를 보고 딱 그 음식만 담아 주세요.\n' +
              '급식 카운터의 음식을 클릭·터치하거나 식판으로 끌어다 놓아요. 숫자 키 1–9, 0으로 번호 위의 음식을 고를 수도 있어요.\n' +
              '타이머가 끝나기 전에 식판을 채우세요. 빨리 채우면 PERFECT!\n' +
              '라운드를 계속 성공하면 콤보가 쌓여서 점수가 더 올라가요.\n' +
              '다른 음식을 고르거나 시간이 끝나면 ♥가 하나 줄어요. 3개를 다 잃으면 점심 끝!\n' +
              '6라운드부터는 카운터가 움직여요(RUSH!). 놓치지 마세요!\n' +
              'PERFECT 5번 연속 = SHEEP SMILE ♡ — 이 게임에서 하민의 가장 행복한 리액션을 부르는 이름이에요!\n' +
              'P 또는 Esc로 일시정지. 하민은 옷 입히기에서 고른 코디를 입고 있어요 ♡',
        start: {
          desc: '하민이 배고파요! 시간 안에 주문한 음식을 담아 주세요 ♡',
          step1: '주문서 확인',
          step2: '음식 고르기',
          step3: '식판 완성!',
          play: '시작 ♡',
          how: '게임 방법',
          keys: '1–9 · 0 키로 음식 선택 · P 일시정지',
          look: '하민은 옷 입히기 코디를 입고 있어요 ♡',
          lookLink: '옷 갈아입히기 ▶'
        },
        hud: {
          score: '점수', combo: '콤보', round: '라운드', lives: '라이프', best: '최고',
          livesAria: '라이프: {max}개 중 {n}개',
          streak: 'PERFECT 연속: {max}번 중 {n}번',
          pause: '일시정지'
        },
        order: {
          title: '주문서',
          waiting: '하민이 점심을 기다리는 중… ♡',
          count: '×{n}',
          done: '완료'
        },
        tray: { title: '식판 ♡' },
        counter: {
          title: '급식 카운터 ♡',
          rush: 'RUSH! ▶▶',
          slot: '{key}: {name}'
        },
        timer: '남은 시간',
        food: {
          ramen: '라면', dumplings: '만두', 'rice-bowl': '덮밥', kimbap: '김밥',
          tteokbokki: '떡볶이', 'fried-chicken': '치킨', strawberry: '딸기',
          'strawberry-cake': '딸기 케이크', tangerine: '귤', watermelon: '수박',
          'banana-milk': '바나나 우유', 'strawberry-milk': '딸기 우유', 'fish-bread': '붕어빵',
          'ice-cream': '아이스크림', cookie: '쿠키', 'egg-toast': '계란 토스트'
        },
        pop: {
          perfect: 'PERFECT!', yummy: '냠냠! YUMMY!', combo: '{n} 콤보!', wrong: '땡! 다른 음식!',
          timeUp: '시간 끝!', sheep: 'SHEEP SMILE ♡', rush: '러시 아워!'
        },
        say: {
          hello: '점심시간이다~! ♡',
          order1: '이거 주세요!', order2: '배고파요~', order3: '오늘은 이거 먹을래요!',
          good1: '오, 그거!', good2: '맞아요 ♡',
          eat: '냠냠…',
          yum1: '맛있다~! ♡', yum2: '고마워요!', yum3: '최고예요!',
          perfect1: '우와, 엄청 빨라요!', perfect2: '완벽한 점심 ♡',
          wrong1: '어? 그거 아닌데…', wrong2: '앗, 잘못 골랐어요!',
          timeUp1: '아직 배고파요…', timeUp2: '너무 늦었어요~',
          sheep: '인생 점심이에요! ♡',
          rush: '줄이 움직여요!',
          bye: '점심 고마워요! ♡'
        },
        face: {
          neutral: '기다리는 하민', smile: '미소 짓는 하민', big: '활짝 웃는 하민', eating: '먹고 있는 하민',
          surprised: '깜짝 놀란 하민', pout: '시무룩한 하민', sheep: '하민의 SHEEP SMILE ♡'
        },
        announce: {
          ready: '준비!',
          round: '{n}라운드. 주문: {items}.',
          served: '{judge} {pts}점 획득. 현재 {score}점.',
          wrong: '다른 음식이에요! 라이프 {n}개 남음.',
          timeUp: '시간 끝! 라이프 {n}개 남음.',
          sheep: 'SHEEP SMILE! 보너스 {pts}점.',
          over: '점심 끝. 최종 점수 {score}점.',
          rush: '러시 아워! 카운터가 움직여요.'
        },
        result: {
          title: '점심 끝 ♡',
          rounds: '서빙', perfects: 'PERFECT', bestCombo: '최고 콤보', sheep: 'SHEEP SMILE',
          desserts: '디저트', score: '점수', best: '최고 기록',
          retry: '다시 하기 ♡', back: '뒤로',
          rank: '{r} 랭크',
          unlocked: '새 아이템 ♡'
        },
        tip: {
          label: 'TIP ♡',
          text: '옷 입히기에서 하민의 옷을 바꾸면 점심시간에도 그 옷을 입어요!',
          link: '옷 입히기로 ▶'
        }
      }
    },

    /* ════════════════ 中文 (简体) ════════════════ */
    'zh-CN': {
      lunch: {
        docTitle: 'Hamin的午餐时间 ♡ HAMIN GAMES',
        playArea: '午餐时间游戏画面',
        hamin: 'HAMIN ♡',
        help: 'Hamin 饿啦！看看点餐单（ORDER），只端上单子上的食物。\n' +
              '点击或轻触午餐柜台上对应的食物，也可以把它拖到餐盘上。数字键 1–9 和 0 可以选择数字上方的食物。\n' +
              '在计时结束前装满餐盘。越快越容易拿到 PERFECT！\n' +
              '一回合接一回合地成功，就能累积连击，得分更高。\n' +
              '选错食物或时间到会失去一颗 ♥。3 颗都没了，午餐就结束啦。\n' +
              '从第 6 回合开始柜台会移动（RUSH!），要跟上哦！\n' +
              '连续 5 次 PERFECT = SHEEP SMILE ♡，这是本游戏给 Hamin 最开心的反应起的名字！\n' +
              '按 P 或 Esc 暂停。Hamin 穿着你在换装里搭配的衣服 ♡',
        start: {
          desc: 'Hamin 饿啦！在时间结束前端上点的餐吧 ♡',
          step1: '看点餐单',
          step2: '选食物',
          step3: '装满餐盘！',
          play: '开始 ♡',
          how: '玩法说明',
          keys: '1–9 · 0 键选食物 · P 暂停',
          look: 'Hamin 穿着你的换装搭配 ♡',
          lookLink: '去换衣服 ▶'
        },
        hud: {
          score: '分数', combo: '连击', round: '回合', lives: '生命', best: '最高',
          livesAria: '生命：{n}/{max}',
          streak: 'PERFECT 连续：{n}/{max}',
          pause: '暂停'
        },
        order: {
          title: '点餐单',
          waiting: 'Hamin 正在等午餐… ♡',
          count: '×{n}',
          done: '已完成'
        },
        tray: { title: '餐盘 ♡' },
        counter: {
          title: '午餐柜台 ♡',
          rush: 'RUSH! ▶▶',
          slot: '{key}：{name}'
        },
        timer: '剩余时间',
        food: {
          ramen: '拉面', dumplings: '饺子', 'rice-bowl': '盖饭', kimbap: '紫菜包饭',
          tteokbokki: '炒年糕', 'fried-chicken': '炸鸡', strawberry: '草莓',
          'strawberry-cake': '草莓蛋糕', tangerine: '橘子', watermelon: '西瓜',
          'banana-milk': '香蕉牛奶', 'strawberry-milk': '草莓牛奶', 'fish-bread': '鲫鱼饼',
          'ice-cream': '冰淇淋', cookie: '曲奇', 'egg-toast': '鸡蛋吐司'
        },
        pop: {
          perfect: 'PERFECT!', yummy: '好吃！YUMMY!', combo: '{n} 连击！', wrong: '拿错啦！',
          timeUp: '时间到！', sheep: 'SHEEP SMILE ♡', rush: '高峰时段！'
        },
        say: {
          hello: '午餐时间到~！♡',
          order1: '我要这个！', order2: '好饿呀~', order3: '今天就吃这些！',
          good1: '哦，对对！', good2: '就是它 ♡',
          eat: '啊呜啊呜…',
          yum1: '好好吃~！♡', yum2: '谢谢你！', yum3: '太棒了！',
          perfect1: '哇，好快！', perfect2: '完美的午餐 ♡',
          wrong1: '咦？不是这个…', wrong2: '哎呀，拿错了！',
          timeUp1: '还是好饿…', timeUp2: '太慢啦~',
          sheep: '最棒的午餐！♡',
          rush: '队伍在移动啦！',
          bye: '谢谢你的午餐！♡'
        },
        face: {
          neutral: '等待中的 Hamin', smile: '微笑的 Hamin', big: '开心大笑的 Hamin', eating: '正在吃饭的 Hamin',
          surprised: '吃惊的 Hamin', pout: '嘟着嘴的 Hamin', sheep: 'Hamin 的 SHEEP SMILE ♡'
        },
        announce: {
          ready: '准备！',
          round: '第 {n} 回合。点餐：{items}。',
          served: '{judge} 获得 {pts} 分。当前 {score} 分。',
          wrong: '拿错啦！还剩 {n} 颗心。',
          timeUp: '时间到！还剩 {n} 颗心。',
          sheep: 'SHEEP SMILE！奖励 {pts} 分。',
          over: '午餐结束。最终得分 {score}。',
          rush: '高峰时段！柜台开始移动了。'
        },
        result: {
          title: '午餐结束 ♡',
          rounds: '上餐', perfects: 'PERFECT', bestCombo: '最高连击', sheep: 'SHEEP SMILE',
          desserts: '甜点', score: '分数', best: '最高纪录',
          retry: '再来一次 ♡', back: '返回',
          rank: '{r} 级',
          unlocked: '新物品 ♡'
        },
        tip: {
          label: 'TIP ♡',
          text: '在换装里给 Hamin 换衣服，午餐时间他也会穿着哦！',
          link: '去换装 ▶'
        }
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      lunch: {
        docTitle: 'Hamin のランチタイム ♡ HAMIN GAMES',
        playArea: 'ランチタイムのゲーム画面',
        hamin: 'HAMIN ♡',
        help: 'Hamin はおなかぺこぺこ！注文票（ORDER）を見て、その料理だけをトレーにのせてね。\n' +
              'ランチカウンターの料理をクリック・タップするか、トレーまでドラッグしよう。数字キー 1–9 と 0 で、番号の上の料理を選べるよ。\n' +
              'タイマーが終わる前にトレーをいっぱいにしよう。はやく出せば PERFECT！\n' +
              'ラウンドを続けて成功するとコンボがたまって、得点アップ！\n' +
              'ちがう料理を選ぶか時間切れで ♥ がひとつ減るよ。3つなくなるとランチ終了。\n' +
              '6ラウンドからカウンターが動き出すよ（RUSH!）。おいていかれないでね！\n' +
              'PERFECT 5回連続 = SHEEP SMILE ♡、このゲームでの Hamin のいちばん幸せなリアクションの名前だよ！\n' +
              'P か Esc で一時停止。Hamin は着せ替えで選んだコーデを着ているよ ♡',
        start: {
          desc: 'Hamin はおなかぺこぺこ！時間内に注文の料理を出してね ♡',
          step1: '注文をチェック',
          step2: '料理をえらぶ',
          step3: 'トレー完成！',
          play: 'スタート ♡',
          how: 'あそびかた',
          keys: '1–9・0 キーで選ぶ・P で一時停止',
          look: 'Hamin は着せ替えのコーデを着ているよ ♡',
          lookLink: '着がえる ▶'
        },
        hud: {
          score: 'スコア', combo: 'コンボ', round: 'ラウンド', lives: 'ライフ', best: 'ベスト',
          livesAria: 'ライフ：{max}個中{n}個',
          streak: 'PERFECT 連続：{max}回中{n}回',
          pause: '一時停止'
        },
        order: {
          title: '注文票',
          waiting: 'Hamin がランチを待ってるよ… ♡',
          count: '×{n}',
          done: 'OK'
        },
        tray: { title: 'トレー ♡' },
        counter: {
          title: 'ランチカウンター ♡',
          rush: 'RUSH! ▶▶',
          slot: '{key}：{name}'
        },
        timer: '残り時間',
        food: {
          ramen: 'ラーメン', dumplings: 'ギョーザ', 'rice-bowl': '丼ぶり', kimbap: 'キンパ',
          tteokbokki: 'トッポッキ', 'fried-chicken': 'フライドチキン', strawberry: 'いちご',
          'strawberry-cake': 'いちごケーキ', tangerine: 'みかん', watermelon: 'スイカ',
          'banana-milk': 'バナナ牛乳', 'strawberry-milk': 'いちご牛乳', 'fish-bread': 'たい焼き',
          'ice-cream': 'アイス', cookie: 'クッキー', 'egg-toast': 'エッグトースト'
        },
        pop: {
          perfect: 'PERFECT!', yummy: 'おいしい！', combo: '{n} コンボ！', wrong: 'ちがうよ！',
          timeUp: '時間切れ！', sheep: 'SHEEP SMILE ♡', rush: 'ラッシュアワー！'
        },
        say: {
          hello: 'ランチタイムだ~！♡',
          order1: 'これください！', order2: 'おなかすいた~', order3: '今日はこれがいいな！',
          good1: 'おっ、それそれ！', good2: 'それだよ ♡',
          eat: 'もぐもぐ…',
          yum1: 'おいしい~！♡', yum2: 'ありがとう！', yum3: 'さいこう！',
          perfect1: 'わあ、はやい！', perfect2: 'かんぺきランチ ♡',
          wrong1: 'あれ？それじゃないよ…', wrong2: 'あっ、まちがえた！',
          timeUp1: 'まだおなかすいてる…', timeUp2: 'おそいよ~',
          sheep: '最高のランチ！♡',
          rush: '列が動いてる！',
          bye: 'ランチありがとう！♡'
        },
        face: {
          neutral: '待っている Hamin', smile: 'ほほえむ Hamin', big: '満面の笑みの Hamin', eating: '食べている Hamin',
          surprised: 'びっくりした Hamin', pout: 'しょんぼりした Hamin', sheep: 'Hamin の SHEEP SMILE ♡'
        },
        announce: {
          ready: '準備して！',
          round: '{n}ラウンド。注文：{items}。',
          served: '{judge} {pts}点ゲット。スコア {score}。',
          wrong: 'ちがう料理！ライフ残り {n}。',
          timeUp: '時間切れ！ライフ残り {n}。',
          sheep: 'SHEEP SMILE！ボーナス {pts}点。',
          over: 'ランチ終了。最終スコア {score}。',
          rush: 'ラッシュアワー！カウンターが動き出したよ。'
        },
        result: {
          title: 'ランチ終了 ♡',
          rounds: '提供数', perfects: 'PERFECT', bestCombo: '最大コンボ', sheep: 'SHEEP SMILE',
          desserts: 'デザート', score: 'スコア', best: 'ベスト',
          retry: 'もう一回 ♡', back: 'もどる',
          rank: 'ランク {r}',
          unlocked: '新アイテム ♡'
        },
        tip: {
          label: 'TIP ♡',
          text: '着せ替えで Hamin の服を変えると、ランチタイムでもその服を着るよ！',
          link: '着せ替えへ ▶'
        }
      }
    }
  };

  if (typeof HG.addStrings === 'function') HG.addStrings(STRINGS);
  else (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
})(window.HG = window.HG || {});
