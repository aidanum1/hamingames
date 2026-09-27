/* HAMIN GAMES — HAMIN PRACTICE ROOM strings (docs/CONTRACT.md §3.3)
   Namespace: practice.*  (practice-room.html / js/practice-room.js / data/songs.js titles)
   Shared words (PERFECT / GOOD / MISS / COMBO / GO!) come from shell.* in data/translations.js.
   Every language block has exactly the same keys (check: node tools/check-i18n.js).
   H-POINT is a game point — never money. All songs are original. */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      practice: {
        docTitle: 'HAMIN PRACTICE ROOM ♡ HAMIN GAMES',
        help: 'Arrows slide down four lanes. Hit each one right as it touches the ♥ line!\n' +
              'Keyboard: ← ↓ ↑ → or D F J K. Touch / mouse: tap the big buttons or the lanes.\n' +
              'PERFECT = right on the beat · GOOD = a little off (FAST / SLOW tells you which way) · MISS = too early, too late or not hit.\n' +
              'Keep your combo going: every 10 combo raises the score bonus (up to ×2.0).\n' +
              '50% accuracy or more clears the song. Ranks: S = 95%+ with no MISS · A = 85%+ · B = 70%+ · C = 50%+.\n' +
              'Press P or Esc to pause. If the music and the arrows feel out of sync, try TIMING in the song menu.',
        canvas: 'Practice room with four arrow lanes and Hamin dancing',
        noAudio: 'Sound isn’t available right now — you can still play with the arrows ♡',
        loading: 'Loading the song…',
        noSongs: 'The song list could not be loaded.',
        hud: { song: 'Now playing', score: 'SCORE', acc: 'ACC', pause: 'Pause (P)' },
        lane: { group: 'Lane buttons', left: 'Left arrow (D)', down: 'Down arrow (F)', up: 'Up arrow (J)', right: 'Right arrow (K)' },
        menu: {
          title: 'SONG SELECT ♪',
          hello: 'Pick a song and practice with Hamin! Hit each arrow right as it touches the line ♡',
          diffLabel: 'Difficulty', songs: 'Songs',
          start: 'START ▶', howTo: 'HOW TO PLAY',
          timing: 'TIMING {n} ms',
          keys: 'Keys: ← ↓ ↑ → or D F J K · Pause: P / Esc',
          keysTouch: 'Tap the big buttons (or the lanes) when an arrow reaches the line!',
          bpm: '♩ {n}', level: 'Level {n} of 5',
          best: 'BEST {n}', noBest: 'BEST —',
          rankFor: '{diff}: {rank}', rankNone: 'not cleared yet'
        },
        diff: { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' },
        diffShort: { easy: 'E', normal: 'N', hard: 'H' },
        songs: {
          morningStretch: { title: 'Morning Stretch', desc: 'A sleepy, sunny warm-up ☀' },
          mirrorMirror: { title: 'Mirror Mirror', desc: 'Groove along with your reflection ✦' },
          luckyStarStep: { title: 'Lucky Star Step', desc: 'Sparkly steps for stage day ★' }
        },
        judge: { fast: 'FAST', slow: 'SLOW' },
        pause: { title: 'PAUSED', resume: 'RESUME ▶', restart: 'RESTART', quit: 'SONG SELECT', hint: 'P / Esc: resume' },
        result: {
          clear: 'CLEAR! ♡', fail: 'TRY AGAIN…',
          failNote: 'Reach 50% accuracy to clear ♡ You can do it!',
          score: 'SCORE', acc: 'ACCURACY', maxCombo: 'MAX COMBO',
          perfect: 'PERFECT', good: 'GOOD', miss: 'MISS',
          newRecord: 'NEW RECORD!', fullCombo: 'FULL COMBO ♡',
          earned: '+{n} H-POINT',
          retry: 'RETRY', menu: 'SONG SELECT',
          unlocked: 'NEW ITEMS ♡',
          rankLabel: 'Rank {rank}', noRank: 'No rank'
        },
        log: { title: 'PRACTICE LOG ♪', clears: 'Songs cleared', ranksS: 'S ranks', maxCombo: 'Best combo', perfects: 'Total PERFECT' },
        guide: {
          title: 'RANK GUIDE',
          s: '95%+ and no MISS', a: '85% or more', b: '70% or more', c: '50% or more — clear!',
          music: 'All three songs are original chiptunes made for this fan site ♪'
        },
        calib: {
          title: 'TIMING CHECK ⏱',
          desc: 'If the arrows and the music feel out of sync, adjust the timing here.',
          hint: 'Hear the beat after the arrow hits the line? Press +. Before it? Press −.',
          value: '{n} ms',
          minus: 'Earlier by {n} ms', plus: 'Later by {n} ms',
          reset: 'RESET', done: 'DONE',
          testTitle: 'TAP TEST',
          testDesc: 'Press START, then tap TAP ♡ (or Space) on each of the 8 clicks.',
          testStart: 'START ▶', tap: 'TAP ♡',
          listening: 'Tap along with the clicks…',
          result: 'Average {n} ms → timing set ♡',
          tooFew: 'Not enough taps… try once more ♡',
          noAudio: 'The tap test needs sound.'
        },
        announce: {
          start: '{song}, {diff}. Get ready!',
          combo: '{n} combo!',
          result: 'Rank {rank}. Score {score}. Accuracy {acc} percent.',
          fail: 'Not cleared. Score {score}. Accuracy {acc} percent.',
          paused: 'Paused', resumed: 'Resuming after 3 beats'
        }
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      practice: {
        docTitle: '하민 연습실 ♡ HAMIN GAMES',
        help: '화살표가 네 줄을 따라 내려와요. ♥ 선에 닿는 순간 딱 맞춰 눌러요!\n' +
              '키보드: ← ↓ ↑ → 또는 D F J K. 터치 / 마우스: 큰 버튼이나 레인을 탭!\n' +
              'PERFECT = 박자 딱! · GOOD = 살짝 어긋남 (FAST / SLOW로 알려줘요) · MISS = 너무 빠르거나 늦거나 놓침.\n' +
              '콤보를 이어가면 10콤보마다 점수 보너스가 올라가요 (최대 ×2.0).\n' +
              '정확도 50% 이상이면 클리어! 랭크: S = 95% 이상 + MISS 0 · A = 85% 이상 · B = 70% 이상 · C = 50% 이상.\n' +
              'P나 Esc로 일시정지. 음악과 화살표가 어긋나면 곡 선택 화면의 타이밍에서 맞춰 보세요.',
        canvas: '화살표 레인 네 줄과 춤추는 하민이 있는 연습실',
        noAudio: '지금은 소리를 낼 수 없어요 — 화살표만 보고도 플레이할 수 있어요 ♡',
        loading: '곡을 불러오는 중…',
        noSongs: '곡 목록을 불러오지 못했어요.',
        hud: { song: '재생 중', score: '점수', acc: '정확도', pause: '일시정지 (P)' },
        lane: { group: '레인 버튼', left: '왼쪽 화살표 (D)', down: '아래 화살표 (F)', up: '위 화살표 (J)', right: '오른쪽 화살표 (K)' },
        menu: {
          title: '곡 선택 ♪',
          hello: '곡을 골라 하민이랑 같이 연습해요! 화살표가 선에 닿는 순간 눌러요 ♡',
          diffLabel: '난이도', songs: '곡 목록',
          start: '시작 ▶', howTo: '플레이 방법',
          timing: '타이밍 {n} ms',
          keys: '키: ← ↓ ↑ → 또는 D F J K · 일시정지: P / Esc',
          keysTouch: '화살표가 선에 닿으면 큰 버튼(또는 레인)을 탭!',
          bpm: '♩ {n}', level: '레벨 {n} / 5',
          best: '최고 {n}', noBest: '최고 —',
          rankFor: '{diff}: {rank}', rankNone: '아직 클리어 전'
        },
        diff: { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' },
        diffShort: { easy: 'E', normal: 'N', hard: 'H' },
        songs: {
          morningStretch: { title: '모닝 스트레칭', desc: '졸린 눈 비비며 하는 햇살 워밍업 ☀' },
          mirrorMirror: { title: '미러 미러', desc: '거울 속 나랑 같이 그루브 ✦' },
          luckyStarStep: { title: '럭키 스타 스텝', desc: '무대 날을 위한 반짝반짝 스텝 ★' }
        },
        judge: { fast: 'FAST', slow: 'SLOW' },
        pause: { title: '일시정지', resume: '계속하기 ▶', restart: '다시 시작', quit: '곡 선택으로', hint: 'P / Esc: 계속하기' },
        result: {
          clear: '클리어! ♡', fail: '다시 도전…',
          failNote: '정확도 50%면 클리어예요 ♡ 할 수 있어요!',
          score: '점수', acc: '정확도', maxCombo: '최대 콤보',
          perfect: 'PERFECT', good: 'GOOD', miss: 'MISS',
          newRecord: '신기록!', fullCombo: '풀콤보 ♡',
          earned: '+{n} H-POINT',
          retry: '다시 하기', menu: '곡 선택으로',
          unlocked: '새 아이템 ♡',
          rankLabel: '랭크 {rank}', noRank: '랭크 없음'
        },
        log: { title: '연습 일지 ♪', clears: '클리어 횟수', ranksS: 'S 랭크', maxCombo: '최고 콤보', perfects: 'PERFECT 합계' },
        guide: {
          title: '랭크 기준',
          s: '95% 이상 + MISS 0', a: '85% 이상', b: '70% 이상', c: '50% 이상 — 클리어!',
          music: '세 곡 모두 이 팬사이트를 위해 만든 오리지널 칩튠이에요 ♪'
        },
        calib: {
          title: '타이밍 조절 ⏱',
          desc: '화살표와 음악이 어긋나게 느껴지면 여기서 맞춰 주세요.',
          hint: '화살표가 선에 닿은 뒤에 박자가 들리면 +, 먼저 들리면 − 를 눌러요.',
          value: '{n} ms',
          minus: '{n} ms 빠르게', plus: '{n} ms 느리게',
          reset: '초기화', done: '완료',
          testTitle: '탭 테스트',
          testDesc: '시작을 누르고 8번의 “틱” 소리에 맞춰 TAP ♡ (또는 스페이스)를 눌러요.',
          testStart: '시작 ▶', tap: 'TAP ♡',
          listening: '소리에 맞춰 탭해요…',
          result: '평균 {n} ms → 타이밍을 맞췄어요 ♡',
          tooFew: '탭이 부족해요… 한 번 더 해 볼까요? ♡',
          noAudio: '탭 테스트에는 소리가 필요해요.'
        },
        announce: {
          start: '{song}, {diff}. 준비됐나요!',
          combo: '{n} 콤보!',
          result: '랭크 {rank}. 점수 {score}. 정확도 {acc}퍼센트.',
          fail: '클리어하지 못했어요. 점수 {score}. 정확도 {acc}퍼센트.',
          paused: '일시정지', resumed: '3박자 뒤에 다시 시작해요'
        }
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      practice: {
        docTitle: 'Hamin 练习室 ♡ HAMIN GAMES',
        help: '箭头会沿着四条轨道落下，在碰到 ♥ 线的瞬间按下！\n' +
              '键盘：← ↓ ↑ → 或 D F J K。触屏 / 鼠标：点大按钮或轨道。\n' +
              'PERFECT = 正好踩点 · GOOD = 稍微偏了一点（偏早 / 偏晚会提示）· MISS = 太早、太晚或漏按。\n' +
              '保持连击，每 10 连击分数加成就会提高（最高 ×2.0）。\n' +
              '准确率达到 50% 就算通关！评级：S = 95% 以上且无 MISS · A = 85% 以上 · B = 70% 以上 · C = 50% 以上。\n' +
              '按 P 或 Esc 暂停。如果音乐和箭头对不上，可以在选曲菜单里调整“时机”。',
        canvas: '有四条箭头轨道和跳舞的 Hamin 的练习室',
        noAudio: '现在无法播放声音——只看箭头也能玩哦 ♡',
        loading: '正在加载歌曲…',
        noSongs: '歌曲列表加载失败。',
        hud: { song: '正在播放', score: '分数', acc: '准确率', pause: '暂停 (P)' },
        lane: { group: '轨道按钮', left: '左箭头 (D)', down: '下箭头 (F)', up: '上箭头 (J)', right: '右箭头 (K)' },
        menu: {
          title: '选曲 ♪',
          hello: '选一首歌，和 Hamin 一起练习吧！箭头碰到线的瞬间按下 ♡',
          diffLabel: '难度', songs: '歌曲列表',
          start: '开始 ▶', howTo: '玩法说明',
          timing: '时机 {n} ms',
          keys: '按键：← ↓ ↑ → 或 D F J K · 暂停：P / Esc',
          keysTouch: '箭头到达线时，点大按钮（或轨道）！',
          bpm: '♩ {n}', level: '等级 {n} / 5',
          best: '最高 {n}', noBest: '最高 —',
          rankFor: '{diff}：{rank}', rankNone: '尚未通关'
        },
        diff: { easy: '简单', normal: '普通', hard: '困难' },
        diffShort: { easy: '简', normal: '普', hard: '难' },
        songs: {
          morningStretch: { title: '早安伸展操', desc: '迷迷糊糊的阳光热身 ☀' },
          mirrorMirror: { title: '魔镜魔镜', desc: '和镜子里的自己一起律动 ✦' },
          luckyStarStep: { title: '幸运星舞步', desc: '舞台日的闪亮舞步 ★' }
        },
        judge: { fast: '偏早', slow: '偏晚' },
        pause: { title: '已暂停', resume: '继续 ▶', restart: '重新开始', quit: '返回选曲', hint: 'P / Esc：继续' },
        result: {
          clear: '通关！♡', fail: '再试一次…',
          failNote: '准确率达到 50% 就能通关 ♡ 加油！',
          score: '分数', acc: '准确率', maxCombo: '最大连击',
          perfect: 'PERFECT', good: 'GOOD', miss: 'MISS',
          newRecord: '新纪录！', fullCombo: '全连击 ♡',
          earned: '+{n} H-POINT',
          retry: '再来一次', menu: '返回选曲',
          unlocked: '获得新物品 ♡',
          rankLabel: '评级 {rank}', noRank: '无评级'
        },
        log: { title: '练习记录 ♪', clears: '通关次数', ranksS: 'S 评级', maxCombo: '最高连击', perfects: 'PERFECT 总数' },
        guide: {
          title: '评级说明',
          s: '95% 以上且无 MISS', a: '85% 以上', b: '70% 以上', c: '50% 以上 — 通关！',
          music: '三首歌都是为这个粉丝站原创的芯片音乐 ♪'
        },
        calib: {
          title: '时机校准 ⏱',
          desc: '如果觉得箭头和音乐对不上，可以在这里调整。',
          hint: '箭头碰线之后才听到节拍？按 +。先听到？按 −。',
          value: '{n} ms',
          minus: '提前 {n} ms', plus: '延后 {n} ms',
          reset: '重置', done: '完成',
          testTitle: '节拍测试',
          testDesc: '按下开始后，跟着 8 声“嗒”点击 TAP ♡（或空格键）。',
          testStart: '开始 ▶', tap: 'TAP ♡',
          listening: '跟着声音点击…',
          result: '平均 {n} ms → 时机已设置 ♡',
          tooFew: '点击次数不够…再试一次吧 ♡',
          noAudio: '节拍测试需要声音。'
        },
        announce: {
          start: '{song}，{diff}。准备好了吗！',
          combo: '{n} 连击！',
          result: '评级 {rank}。分数 {score}。准确率 {acc}%。',
          fail: '未通关。分数 {score}。准确率 {acc}%。',
          paused: '已暂停', resumed: '3 拍后继续'
        }
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      practice: {
        docTitle: 'Hamin 練習室 ♡ HAMIN GAMES',
        help: '矢印が4つのレーンを流れてくるよ。♥ のラインに重なった瞬間に押そう！\n' +
              'キーボード：← ↓ ↑ → または D F J K。タッチ / マウス：大きいボタンかレーンをタップ。\n' +
              'PERFECT = ぴったり · GOOD = 少しずれた（FAST / SLOW で教えてくれるよ）· MISS = 早すぎ・遅すぎ・押しそびれ。\n' +
              'コンボをつなぐと10コンボごとにスコアボーナスがアップ（最大 ×2.0）。\n' +
              '精度50%以上でクリア！ランク：S = 95%以上でMISSなし · A = 85%以上 · B = 70%以上 · C = 50%以上。\n' +
              'P か Esc で一時停止。音楽と矢印がずれるときは、曲えらびの「タイミング」で調整してね。',
        canvas: '4つの矢印レーンと踊る Hamin がいる練習室',
        noAudio: 'いまは音が出せないみたい — 矢印だけでも遊べるよ ♡',
        loading: '曲を読み込み中…',
        noSongs: '曲リストを読み込めませんでした。',
        hud: { song: '再生中', score: 'スコア', acc: '精度', pause: '一時停止 (P)' },
        lane: { group: 'レーンボタン', left: '左矢印 (D)', down: '下矢印 (F)', up: '上矢印 (J)', right: '右矢印 (K)' },
        menu: {
          title: '曲えらび ♪',
          hello: '曲をえらんで Hamin といっしょに練習しよう！矢印がラインに重なった瞬間に押してね ♡',
          diffLabel: '難易度', songs: '曲リスト',
          start: 'スタート ▶', howTo: 'あそびかた',
          timing: 'タイミング {n} ms',
          keys: 'キー：← ↓ ↑ → または D F J K · 一時停止：P / Esc',
          keysTouch: '矢印がラインに来たら、大きいボタン（かレーン）をタップ！',
          bpm: '♩ {n}', level: 'レベル {n} / 5',
          best: 'ベスト {n}', noBest: 'ベスト —',
          rankFor: '{diff}：{rank}', rankNone: 'まだクリアしていません'
        },
        diff: { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' },
        diffShort: { easy: 'E', normal: 'N', hard: 'H' },
        songs: {
          morningStretch: { title: 'モーニング・ストレッチ', desc: 'ねぼけまなこの朝ウォームアップ ☀' },
          mirrorMirror: { title: 'ミラー・ミラー', desc: '鏡の中の自分とグルーヴ ✦' },
          luckyStarStep: { title: 'ラッキー・スター・ステップ', desc: 'ステージの日のキラキラステップ ★' }
        },
        judge: { fast: 'FAST', slow: 'SLOW' },
        pause: { title: 'ポーズ中', resume: 'つづける ▶', restart: 'やりなおす', quit: '曲えらびへ', hint: 'P / Esc：つづける' },
        result: {
          clear: 'クリア！♡', fail: 'もう一回…',
          failNote: '精度50%でクリアだよ ♡ がんばって！',
          score: 'スコア', acc: '精度', maxCombo: '最大コンボ',
          perfect: 'PERFECT', good: 'GOOD', miss: 'MISS',
          newRecord: '新記録！', fullCombo: 'フルコンボ ♡',
          earned: '+{n} H-POINT',
          retry: 'リトライ', menu: '曲えらびへ',
          unlocked: '新しいアイテム ♡',
          rankLabel: 'ランク {rank}', noRank: 'ランクなし'
        },
        log: { title: '練習ノート ♪', clears: 'クリア回数', ranksS: 'Sランク', maxCombo: '最高コンボ', perfects: 'PERFECT 合計' },
        guide: {
          title: 'ランクのめやす',
          s: '95%以上でMISSなし', a: '85%以上', b: '70%以上', c: '50%以上 — クリア！',
          music: '3曲ともこのファンサイトのためのオリジナル・チップチューンだよ ♪'
        },
        calib: {
          title: 'タイミング調整 ⏱',
          desc: '矢印と音楽がずれて感じたら、ここで調整してね。',
          hint: '矢印がラインに来たあとに音が聞こえたら +、先に聞こえたら − を押そう。',
          value: '{n} ms',
          minus: '{n} ms 早く', plus: '{n} ms 遅く',
          reset: 'リセット', done: 'OK',
          testTitle: 'タップテスト',
          testDesc: 'スタートを押したら、8回の「カッ」に合わせて TAP ♡（かスペース）を押してね。',
          testStart: 'スタート ▶', tap: 'TAP ♡',
          listening: '音に合わせてタップ…',
          result: '平均 {n} ms → タイミングを設定したよ ♡',
          tooFew: 'タップが足りないみたい…もう一回 ♡',
          noAudio: 'タップテストには音が必要です。'
        },
        announce: {
          start: '{song}、{diff}。準備はいい？',
          combo: '{n} コンボ！',
          result: 'ランク {rank}。スコア {score}。精度 {acc}%。',
          fail: 'クリアならず。スコア {score}。精度 {acc}%。',
          paused: 'ポーズ', resumed: '3拍後に再開するよ'
        }
      }
    }
  };

  if (typeof HG.addStrings === 'function') HG.addStrings(STRINGS);
  else (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
})(window.HG = window.HG || {});
