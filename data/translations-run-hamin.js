/* HAMIN GAMES — RUN, HAMIN! strings (docs/CONTRACT.md §3.3)
   Namespace: run.*  (run-hamin.html / js/run-hamin.js)

   Shared words come from data/translations.js: shell.* (PAUSE, RESUME, BEST, COMBO …),
   games.runHamin.title, games.best / games.noBest, games.fmt.meters.
   Every language block has exactly the same keys (check: node tools/check-i18n.js).
   The puppy is never scary: he only wants to play ♡ — keep the tone cute and harmless.
   "HAMIN GAMES", "H-POINT" and the name "Hamin" stay untranslated (Korean may write 하민). */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      run: {
        docTitle: 'RUN, HAMIN! ♡ HAMIN GAMES',
        canvasLabel: 'Run, Hamin! game screen',
        srControls: 'Space, Up or W: jump (hold to jump higher). Down or S: duck. P or Esc: pause. On touch screens: tap to jump, swipe down or use the DUCK button to duck.',
        help: 'A super friendly puppy wants to play with Hamin — so run!\n' +
              '▲ JUMP: Space / ↑ / W, click or tap. Hold for a higher jump.\n' +
              '▼ DUCK: ↓ / S, swipe down or the DUCK button. Duck under hanging flags! In the air it drops you down fast.\n' +
              '❚❚ PAUSE: P or Esc.\n' +
              'Bumping into things makes Hamin stumble and the puppy gets closer (watch the 🐶 meter). If he catches up, the run is over — he only wants cuddles ♡\n' +
              '★ Stars = points · ♡ Hearts push the puppy back · 🍪 Snacks make him stop and sniff · ♪ Notes grow your COMBO.\n' +
              'Power-ups: SPEED UP (dash through anything), SUPER JUMP, STAR SHIELD (blocks one bump), SNACK BOOST (a long sniff break).\n' +
              'The stage changes every 400 m. How far can you go?',
        hud: {
          distance: 'DIST', stars: 'STARS', snacks: 'SNACKS',
          puppy: 'PUPPY', hamin: 'HAMIN',
          gapLabel: 'How close the puppy is',
          gapText: 'Puppy distance {n}%'
        },
        touch: { jump: 'JUMP', duck: 'DUCK', jumpLabel: 'Jump (hold for higher)', duckLabel: 'Duck' },
        start: {
          title: 'RUN HAMIN RUN!',
          desc: 'A super friendly puppy wants to play! Jump, duck and grab snacks so he can’t catch Hamin… (he just wants cuddles ♡)',
          jump: 'JUMP (hold = higher)',
          duck: 'DUCK',
          touch: 'Tap = jump · Swipe down = duck',
          button: 'START ▶',
          loading: 'Loading pictures… {n}%'
        },
        pause: { hint: 'The puppy is waiting too ♡' },
        over: {
          title: 'GOTCHA! ♡',
          line1: 'The puppy just wanted to play! ♡',
          line2: 'Puppy hug time! He’s sooo happy ♡',
          line3: 'Caught! Now it’s belly-rub time ♡',
          stars: 'STARS', snacks: 'SNACKS', stage: 'FARTHEST STAGE',
          retry: 'RETRY ♡'
        },
        stage: {
          label: 'STAGE {n}',
          school: 'SCHOOL STREET', park: 'PARK', city: 'CITY SIDEWALK', river: 'RIVERSIDE', festival: 'FESTIVAL STREET'
        },
        alert: {
          go: 'RUN HAMIN RUN!',
          close: '🐶 TOO CLOSE!',
          speed: '★ SPEED UP!',
          safe: 'SAFE! ♡',
          record: 'NEW RECORD!',
          shield: 'STAR SHIELD!',
          shieldSave: 'SHIELD SAVE! ★',
          snack: 'SNACK BOOST!',
          superJump: 'SUPER JUMP!',
          oops: 'OOPS!',
          sniff: 'sniff sniff… 🍪',
          jumpHint: '▲ JUMP!',
          duckHint: '▼ DUCK!',
          caught: '🐶 GOTCHA! ♡'
        },
        pow: { speed: 'SPEED', jump: 'JUMP', shield: 'SHIELD', sniff: 'SNIFF' },
        say: {
          start: 'Go! Hamin is running.',
          stage: 'Stage {n}: {name}',
          close: 'The puppy is very close!',
          record: 'New record! {d}',
          caught: 'The puppy caught up with Hamin. It just wanted to play!',
          result: 'Distance {d}. Stars {s}. Snacks {k}.',
          paused: 'Paused',
          resumed: 'Ready… go!'
        }
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      run: {
        docTitle: '하민아, 도망쳐! ♡ HAMIN GAMES',
        canvasLabel: '하민아, 도망쳐! 게임 화면',
        srControls: '스페이스, 위 화살표, W: 점프 (길게 누르면 더 높이). 아래 화살표, S: 숙이기. P, Esc: 일시정지. 터치 화면: 탭하면 점프, 아래로 쓸거나 숙이기 버튼을 누르면 숙이기.',
        help: '엄청 다정한 강아지가 하민이랑 놀고 싶대요 — 달려라!\n' +
              '▲ 점프: 스페이스 / ↑ / W, 클릭 또는 탭. 길게 누르면 더 높이 뛰어요.\n' +
              '▼ 숙이기: ↓ / S, 아래로 쓸기 또는 숙이기 버튼. 걸려 있는 깃발 밑은 숙여서 통과! 공중에서 누르면 빠르게 내려와요.\n' +
              '❚❚ 일시정지: P 또는 Esc.\n' +
              '장애물에 부딪히면 하민이가 비틀거리고 강아지가 가까워져요 (🐶 미터를 확인!). 강아지가 따라잡으면 끝 — 그냥 안기고 싶었을 뿐이에요 ♡\n' +
              '★ 별 = 점수 · ♡ 하트 = 강아지와 거리 벌리기 · 🍪 간식 = 강아지가 멈춰서 킁킁 · ♪ 음표 = 콤보 UP.\n' +
              '아이템: 스피드 업 (뭐든 뚫고 달려요), 슈퍼 점프, 스타 실드 (한 번 막아 줘요), 간식 부스트 (긴 킁킁 타임).\n' +
              '400m마다 스테이지가 바뀌어요. 얼마나 멀리 갈 수 있을까?',
        hud: {
          distance: '거리', stars: '별', snacks: '간식',
          puppy: '멍멍이', hamin: '하민',
          gapLabel: '강아지와의 거리',
          gapText: '강아지와의 거리 {n}%'
        },
        touch: { jump: '점프', duck: '숙이기', jumpLabel: '점프 (길게 누르면 더 높이)', duckLabel: '숙이기' },
        start: {
          title: '하민아, 달려라!',
          desc: '엄청 다정한 강아지가 놀자고 쫓아와요! 점프하고 숙이고 간식을 모아서 도망쳐요… (사실 안기고 싶을 뿐 ♡)',
          jump: '점프 (길게 = 더 높이)',
          duck: '숙이기',
          touch: '탭 = 점프 · 아래로 쓸기 = 숙이기',
          button: '시작 ▶',
          loading: '그림 불러오는 중… {n}%'
        },
        pause: { hint: '강아지도 얌전히 기다리는 중 ♡' },
        over: {
          title: '잡혔다! ♡',
          line1: '강아지는 그냥 놀고 싶었을 뿐이에요! ♡',
          line2: '꼬옥 안기 타임! 강아지가 엄청 행복해해요 ♡',
          line3: '잡혔다! 이제 배 쓰다듬어 줄 시간 ♡',
          stars: '별', snacks: '간식', stage: '최고 스테이지',
          retry: '다시 하기 ♡'
        },
        stage: {
          label: '스테이지 {n}',
          school: '학교 앞 길', park: '공원', city: '도시 인도', river: '강변', festival: '축제 거리'
        },
        alert: {
          go: '하민아, 달려라!',
          close: '🐶 너무 가까워!',
          speed: '★ 스피드 업!',
          safe: '세이프! ♡',
          record: '신기록!',
          shield: '스타 실드!',
          shieldSave: '실드로 세이프! ★',
          snack: '간식 부스트!',
          superJump: '슈퍼 점프!',
          oops: '앗!',
          sniff: '킁킁… 🍪',
          jumpHint: '▲ 점프!',
          duckHint: '▼ 숙여!',
          caught: '🐶 잡았다! ♡'
        },
        pow: { speed: '스피드', jump: '점프', shield: '실드', sniff: '킁킁' },
        say: {
          start: '출발! 하민이가 달려요.',
          stage: '스테이지 {n}: {name}',
          close: '강아지가 아주 가까이 왔어요!',
          record: '신기록! {d}',
          caught: '강아지가 하민이를 따라잡았어요. 그냥 놀고 싶었대요!',
          result: '거리 {d}. 별 {s}개. 간식 {k}개.',
          paused: '일시정지',
          resumed: '준비… 출발!'
        }
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      run: {
        docTitle: 'Hamin，快跑！♡ HAMIN GAMES',
        canvasLabel: '「Hamin，快跑！」游戏画面',
        srControls: '空格键、上方向键或 W：跳跃（按住跳得更高）。下方向键或 S：下蹲。P 或 Esc：暂停。触屏：轻点跳跃，向下滑动或按「下蹲」按钮下蹲。',
        help: '超级热情的小狗想和 Hamin 一起玩——快跑！\n' +
              '▲ 跳跃：空格 / ↑ / W，点击或轻点。按住跳得更高。\n' +
              '▼ 下蹲：↓ / S，向下滑动或按「下蹲」按钮。从挂着的彩旗下面钻过去！在空中按会快速落地。\n' +
              '❚❚ 暂停：P 或 Esc。\n' +
              '撞到东西 Hamin 会踉跄一下，小狗就会追近（留意 🐶 距离条）。被追上就结束啦——它只是想要抱抱 ♡\n' +
              '★ 星星 = 分数 · ♡ 爱心 = 拉开距离 · 🍪 零食 = 小狗停下来闻闻 · ♪ 音符 = 连击 UP。\n' +
              '道具：加速（什么都能冲过去）、超级跳、星星护盾（挡住一次碰撞）、零食大放送（小狗会闻很久）。\n' +
              '每 400 米换一个关卡。你能跑多远？',
        hud: {
          distance: '距离', stars: '星星', snacks: '零食',
          puppy: '小狗', hamin: 'Hamin',
          gapLabel: '小狗离得有多近',
          gapText: '与小狗的距离 {n}%'
        },
        touch: { jump: '跳跃', duck: '下蹲', jumpLabel: '跳跃（按住跳得更高）', duckLabel: '下蹲' },
        start: {
          title: 'Hamin，冲呀！',
          desc: '超级热情的小狗想一起玩！跳跃、下蹲、收集零食，别被它追上……（它只是想要抱抱 ♡）',
          jump: '跳跃（按住 = 更高）',
          duck: '下蹲',
          touch: '轻点 = 跳跃 · 下滑 = 下蹲',
          button: '开始 ▶',
          loading: '图片加载中… {n}%'
        },
        pause: { hint: '小狗也在乖乖等你 ♡' },
        over: {
          title: '被抓到啦！♡',
          line1: '小狗只是想一起玩而已！♡',
          line2: '抱抱时间！小狗超级开心 ♡',
          line3: '被抓到啦！现在是摸肚肚时间 ♡',
          stars: '星星', snacks: '零食', stage: '最远关卡',
          retry: '再来一次 ♡'
        },
        stage: {
          label: '第 {n} 关',
          school: '学校前的路', park: '公园', city: '城市人行道', river: '河边', festival: '庙会街'
        },
        alert: {
          go: 'Hamin，冲呀！',
          close: '🐶 太近啦！',
          speed: '★ 加速！',
          safe: '安全！♡',
          record: '新纪录！',
          shield: '星星护盾！',
          shieldSave: '护盾挡住啦！★',
          snack: '零食大放送！',
          superJump: '超级跳！',
          oops: '哎呀！',
          sniff: '闻闻… 🍪',
          jumpHint: '▲ 跳！',
          duckHint: '▼ 蹲下！',
          caught: '🐶 抓到啦！♡'
        },
        pow: { speed: '加速', jump: '超级跳', shield: '护盾', sniff: '闻闻' },
        say: {
          start: '出发！Hamin 开始跑啦。',
          stage: '第 {n} 关：{name}',
          close: '小狗离得好近！',
          record: '新纪录！{d}',
          caught: '小狗追上了 Hamin。它只是想一起玩！',
          result: '距离 {d}。星星 {s}。零食 {k}。',
          paused: '已暂停',
          resumed: '准备……出发！'
        }
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      run: {
        docTitle: 'Hamin、逃げて！♡ HAMIN GAMES',
        canvasLabel: '「Hamin、逃げて！」ゲーム画面',
        srControls: 'スペース・↑・W：ジャンプ（長押しで高く）。↓・S：しゃがむ。P・Esc：ポーズ。タッチ画面：タップでジャンプ、下にスワイプか「しゃがむ」ボタンでしゃがむ。',
        help: 'とっても人なつっこい子犬が Hamin と遊びたがってる——走って！\n' +
              '▲ ジャンプ：スペース / ↑ / W、クリックまたはタップ。長押しで高くジャンプ。\n' +
              '▼ しゃがむ：↓ / S、下にスワイプか「しゃがむ」ボタン。つるされた旗の下はしゃがんで通過！空中で押すとすばやく着地。\n' +
              '❚❚ ポーズ：P か Esc。\n' +
              'ぶつかると Hamin がよろけて子犬が近づくよ（🐶 メーターをチェック）。追いつかれたらおしまい——ただ甘えたいだけなんだけどね ♡\n' +
              '★ スター = スコア · ♡ ハート = 子犬との距離アップ · 🍪 おやつ = 子犬が立ち止まってクンクン · ♪ 音符 = コンボアップ。\n' +
              'パワーアップ：スピードアップ（何でも突破）、スーパージャンプ、スターシールド（1回ガード）、おやつブースト（長いクンクンタイム）。\n' +
              '400m ごとにステージが変わるよ。どこまで行けるかな？',
        hud: {
          distance: 'きょり', stars: 'スター', snacks: 'おやつ',
          puppy: 'わんこ', hamin: 'Hamin',
          gapLabel: '子犬との近さ',
          gapText: '子犬との距離 {n}%'
        },
        touch: { jump: 'ジャンプ', duck: 'しゃがむ', jumpLabel: 'ジャンプ（長押しで高く）', duckLabel: 'しゃがむ' },
        start: {
          title: 'Hamin、走れ走れ！',
          desc: 'とっても人なつっこい子犬が遊びたがってる！ジャンプしてしゃがんで、おやつを集めて逃げよう……（本当は甘えたいだけ ♡）',
          jump: 'ジャンプ（長押し = 高く）',
          duck: 'しゃがむ',
          touch: 'タップ = ジャンプ · 下スワイプ = しゃがむ',
          button: 'スタート ▶',
          loading: '画像を読み込み中… {n}%'
        },
        pause: { hint: '子犬もおりこうに待ってるよ ♡' },
        over: {
          title: 'つかまった！♡',
          line1: '子犬はただ遊びたかっただけ！♡',
          line2: 'ぎゅーっとハグタイム！子犬は大よろこび ♡',
          line3: 'つかまった！おなかなでなでタイム ♡',
          stars: 'スター', snacks: 'おやつ', stage: '最高ステージ',
          retry: 'もう一回 ♡'
        },
        stage: {
          label: 'ステージ {n}',
          school: '学校前の道', park: '公園', city: '街の歩道', river: '川べり', festival: 'お祭り通り'
        },
        alert: {
          go: 'Hamin、走れ走れ！',
          close: '🐶 近すぎ！',
          speed: '★ スピードアップ！',
          safe: 'セーフ！♡',
          record: '新記録！',
          shield: 'スターシールド！',
          shieldSave: 'シールドでセーフ！★',
          snack: 'おやつブースト！',
          superJump: 'スーパージャンプ！',
          oops: 'あっ！',
          sniff: 'クンクン… 🍪',
          jumpHint: '▲ ジャンプ！',
          duckHint: '▼ しゃがんで！',
          caught: '🐶 つかまえた！♡'
        },
        pow: { speed: 'スピード', jump: 'ジャンプ', shield: 'シールド', sniff: 'クンクン' },
        say: {
          start: 'スタート！Hamin が走り出したよ。',
          stage: 'ステージ {n}：{name}',
          close: '子犬がすぐ近くまで来てる！',
          record: '新記録！{d}',
          caught: '子犬が Hamin に追いついた。ただ遊びたかっただけ！',
          result: '距離 {d}。スター {s}。おやつ {k}。',
          paused: 'ポーズ中',
          resumed: 'よーい……スタート！'
        }
      }
    }
  };

  if (typeof HG.addStrings === 'function') HG.addStrings(STRINGS);
  else (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
})(window.HG = window.HG || {});
