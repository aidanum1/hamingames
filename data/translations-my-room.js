/* HAMIN GAMES — HAMIN'S ROOM strings (docs/CONTRACT.md §3.3)
   Namespace: myRoom.*  (my-room.html / js/my-room.js)

   Item names (room.<id>.name), categories (roomCat.*), hints (hint.*) and unlock
   labels (unlock.*) are shared and live in data/translations-items.js; H-POINT words
   (hpoint.*), shell.* and footer.visitor in data/translations.js.
   Hamin talks casually to the player (반말 / 口语 / タメ口) like a Cyworld mini-room.
   Every language block has exactly the same keys (check: node tools/check-i18n.js). */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      myRoom: {
        docTitle: 'HAMIN’S ROOM ♡ HAMIN GAMES',
        help: '✎ EDIT: tap an item in MY ITEMS or drag it into the room. Drag things to move them — floor things stay on the floor, wall things stay on the wall.\n' +
              'Click an item for its tools: FLIP, FRONT, BACK or PUT AWAY. You can also drag it back onto MY ITEMS.\n' +
              'Keyboard: Tab picks an item · arrow keys move it (Shift = faster) · F flips · [ and ] send it back / front · Delete puts it away · Esc lets go.\n' +
              '👀 VIEW: click the lamp, CD player, window, camera, clock, plushies and more to play with them. Say hi to Hamin too!\n' +
              '🔒 Locked items unlock by playing the other games, or by exchanging H-POINT (never real money).\n' +
              '♡ Your room saves by itself. Press SAVE ROOM ♡ any time!',
        roomLabel: 'Hamin’s room',
        roomTitle: '♡ HAMIN’S MINI-ROOM ♡',
        helpEdit: 'Edit mode. Drag items to move them. Keyboard: Tab to pick an item, arrow keys to move, F to flip, [ and ] for back and front, Delete to put it away.',
        helpView: 'View mode. Click the lamp, CD player, window and other things to play with them.',
        mode: {
          label: 'Room mode',
          edit: 'EDIT', view: 'VIEW',
          editOn: 'EDIT mode ✎ Move things around!',
          viewOn: 'VIEW mode 👀 Click things to play!'
        },
        save: 'SAVE ROOM ♡',
        saved: 'Room saved ♡',
        savedBonus: 'Room saved ♡ +{n} H-POINT',
        reset: 'RESET',
        resetLabel: 'Reset the room to the starter layout',
        resetTitle: 'RESET THE ROOM?',
        resetText: 'Everything goes back to the starter layout. Your unlocked items stay yours!',
        resetDone: 'The room is back to the start ♡',
        hamin: {
          toggle: 'HAMIN',
          label: 'Show Hamin in the room',
          aria: 'Hamin. Click to say hi!',
          ariaEdit: 'Hamin. Drag or use the arrow keys to move him, click to say hi.',
          hidden: 'Hamin went out for a walk ♡',
          back: 'Hamin is back home ♡'
        },
        status: {
          edit: '✎ EDIT MODE',
          view: '👀 VIEW MODE',
          items: 'ITEMS {n}/{max}',
          counter: 'TODAY {a} | TOTAL {b}',
          counterLabel: 'Room clicks today: {a}. Total: {b}.'
        },
        inv: {
          title: 'MY ITEMS ♡',
          show: 'Show my items',
          count: '{owned}/{total}',
          cats: 'Item categories',
          all: 'All items',
          hint: 'Tap or drag into the room ♡',
          dropHint: 'Drop here to put it away ♡',
          placed: 'IN ROOM',
          copies: '×{n}',
          tileOwned: '{name}: place it in the room',
          tilePlaced: '{name}: already in the room',
          tileCopies: '{name}: {n} in the room. Place one more',
          tileMax: '{name}: {n} in the room (that’s the most)',
          tileBuy: '{name}: locked. Unlock for {cost} H-POINT',
          tileRule: '{name}: locked. {hint}'
        },
        buy: {
          title: 'UNLOCK ITEM?',
          done: '{name} is yours now ♡',
          need: 'You need {n} more H-POINT ♡'
        },
        tools: {
          label: 'Item tools',
          flip: 'FLIP', front: 'FRONT', back: 'BACK', remove: 'PUT AWAY', hide: 'HIDE'
        },
        item: {
          ariaEdit: '{name}. Arrow keys move, F flips, Delete puts it away.',
          ariaPlay: '{name}: click to play'
        },
        msg: {
          placed: '{name} placed ♡',
          removed: '{name} put away',
          flipped: 'Flipped!',
          front: 'Moved to the front',
          back: 'Moved to the back',
          full: 'The room is full! Put something away first ♡',
          floor: 'This one goes on the floor ♡',
          wall: 'This one goes on the wall ♡',
          already: '{name} is already in the room ♡',
          maxCopies: 'That’s enough {name} for now ♡',
          tip: 'Tip: move things around in EDIT, then switch to VIEW and click them ♡'
        },
        act: {
          lampOn: 'Lamp on ♡',
          lampOff: 'Lamp off',
          night: 'Good night ☾',
          day: 'Good morning ☀',
          camera: 'CLICK! 📸',
          clock: 'It’s {time} ♡',
          neonOn: 'Neon ON ♡',
          neonOff: 'Neon OFF',
          lightsOn: 'Twinkle twinkle ✨',
          lightsOff: 'Lights resting…',
          plush: 'Squish ♡',
          starjar: 'Make a wish ✨',
          nowPlaying: '♪ {title}',
          track1: 'Pastel Morning',
          track2: 'Sheep Lullaby',
          track3: 'Mini-room Waltz'
        },
        photo: {
          title: 'MY LAST PHOTO ♡',
          alt: 'Your latest Photo Booth photo',
          none: 'No photos yet… visit the Photo Booth ♡',
          caption: 'Pinned on Hamin’s board ♡',
          go: 'PHOTO BOOTH ▶'
        },
        look: { alt: 'Your saved Dress Up look' },
        laptop: {
          title: 'HAMIN GAMES ♡ EXPLORER',
          address: 'http://www.hamin-games.♡/mini-home',
          nav: 'Browser buttons (just for fun)',
          welcome: 'Welcome to Hamin’s mini-homepage ♡',
          construction: '~ under construction ~',
          news: 'NEWS',
          news1: '[NEW] Hamin’s Room is open! Come and decorate ♡',
          news2: '[EVENT] The CD player loves being played again and again… 💿',
          news3: '[TIP] Every game hides items for this room!',
          links: 'GO PLAY ♡'
        },
        info: {
          title: 'ROOM PROFILE ♡',
          mood: 'TODAY’S MOOD',
          m1: 'cozy ☁', m2: 'sleepy 💤', m3: 'happy ♡', m4: 'excited ★', m5: 'hungry 🍓', m6: 'dreamy ✨',
          owned: 'Room items {owned}/{total}',
          placed: 'In the room: {n}',
          tip: 'Click the lamp, CD player, window, clock and more to play!',
          decorate: '✎ DECORATE'
        },
        talk: {
          t1: 'Welcome to my room ♡',
          t2: 'Do you like the new decorations?',
          t3: 'Shall we listen to some music? ♪',
          t4: 'I tidied up just for you!',
          t5: 'Hehe, that tickles!',
          t6: 'Practice first, then a snack ♡',
          t7: 'Let’s take a photo later!',
          t8: 'I love cozy days like this.',
          t9: 'Did you have lunch yet?',
          t10: 'Let’s go for a run later!',
          t11: 'Thanks for visiting ♡',
          t12: 'Perfect spot for a nap… zzz'
        }
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      myRoom: {
        docTitle: '하민의 방 ♡ HAMIN GAMES',
        help: '✎ 꾸미기: 내 아이템에서 아이템을 누르거나 방으로 끌어다 놓아요. 끌어서 옮길 수 있어요 — 바닥 아이템은 바닥에, 벽 아이템은 벽에만 놓여요.\n' +
              '아이템을 누르면 도구가 나와요: 뒤집기, 앞으로, 뒤로, 넣기. 내 아이템 칸으로 다시 끌어다 놓아도 돼요.\n' +
              '키보드: Tab으로 아이템 선택 · 방향키로 이동 (Shift = 빠르게) · F 뒤집기 · [ ] 뒤로/앞으로 · Delete 넣기 · Esc 선택 해제.\n' +
              '👀 구경: 스탠드, CD 플레이어, 창문, 카메라, 시계, 인형 등을 눌러서 놀아 봐요. 하민이한테 인사도 해 줘요!\n' +
              '🔒 잠긴 아이템은 다른 게임을 플레이하거나 H-POINT로 교환해서 열 수 있어요 (진짜 돈이 아니에요).\n' +
              '♡ 방은 자동으로 저장돼요. 언제든 방 저장 ♡ 버튼을 눌러도 돼요!',
        roomLabel: '하민의 방',
        roomTitle: '♡ 하민의 미니룸 ♡',
        helpEdit: '꾸미기 모드예요. 아이템을 끌어서 옮겨요. 키보드: Tab으로 아이템 선택, 방향키로 이동, F로 뒤집기, [ 와 ] 로 뒤로/앞으로, Delete로 넣기.',
        helpView: '구경 모드예요. 스탠드, CD 플레이어, 창문 같은 물건을 눌러서 놀아 봐요.',
        mode: {
          label: '방 모드',
          edit: '꾸미기', view: '구경',
          editOn: '꾸미기 모드 ✎ 이리저리 옮겨 봐요!',
          viewOn: '구경 모드 👀 물건을 눌러 봐요!'
        },
        save: '방 저장 ♡',
        saved: '방을 저장했어요 ♡',
        savedBonus: '방을 저장했어요 ♡ +{n} H-POINT',
        reset: '초기화',
        resetLabel: '방을 처음 배치로 되돌리기',
        resetTitle: '방을 초기화할까요?',
        resetText: '모든 배치가 처음 상태로 돌아가요. 잠금 해제한 아이템은 그대로 남아요!',
        resetDone: '방이 처음 모습으로 돌아왔어요 ♡',
        hamin: {
          toggle: '하민',
          label: '방에 하민 보이기',
          aria: '하민. 눌러서 인사해 봐요!',
          ariaEdit: '하민. 끌거나 방향키로 옮길 수 있고, 누르면 인사해요.',
          hidden: '하민이는 산책 나갔어요 ♡',
          back: '하민이가 집에 돌아왔어요 ♡'
        },
        status: {
          edit: '✎ 꾸미기 모드',
          view: '👀 구경 모드',
          items: '아이템 {n}/{max}',
          counter: 'TODAY {a} | TOTAL {b}',
          counterLabel: '오늘 방에서 누른 횟수 {a}번, 전체 {b}번.'
        },
        inv: {
          title: '내 아이템 ♡',
          show: '내 아이템 보기',
          count: '{owned}/{total}',
          cats: '아이템 종류',
          all: '전체 아이템',
          hint: '누르거나 방으로 끌어다 놓아요 ♡',
          dropHint: '여기에 놓으면 넣어 둬요 ♡',
          placed: '배치됨',
          copies: '×{n}',
          tileOwned: '{name}: 방에 놓기',
          tilePlaced: '{name}: 이미 방에 있어요',
          tileCopies: '{name}: 방에 {n}개 있어요. 하나 더 놓기',
          tileMax: '{name}: 방에 {n}개 있어요 (최대예요)',
          tileBuy: '{name}: 잠김. {cost} H-POINT로 잠금 해제',
          tileRule: '{name}: 잠김. {hint}'
        },
        buy: {
          title: '아이템을 잠금 해제할까요?',
          done: '이제 {name}은(는) 내 거예요 ♡',
          need: 'H-POINT가 {n} 더 필요해요 ♡'
        },
        tools: {
          label: '아이템 도구',
          flip: '뒤집기', front: '앞으로', back: '뒤로', remove: '넣기', hide: '숨기기'
        },
        item: {
          ariaEdit: '{name}. 방향키로 이동, F로 뒤집기, Delete로 넣기.',
          ariaPlay: '{name}: 눌러서 놀기'
        },
        msg: {
          placed: '{name}을(를) 놓았어요 ♡',
          removed: '{name}을(를) 넣어 뒀어요',
          flipped: '뒤집었어요!',
          front: '앞으로 옮겼어요',
          back: '뒤로 옮겼어요',
          full: '방이 꽉 찼어요! 먼저 하나를 넣어 줘요 ♡',
          floor: '이건 바닥에 놓아야 해요 ♡',
          wall: '이건 벽에 걸어야 해요 ♡',
          already: '{name}은(는) 이미 방에 있어요 ♡',
          maxCopies: '{name}은(는) 이 정도면 충분해요 ♡',
          tip: '팁: 꾸미기에서 배치하고, 구경 모드에서 물건을 눌러 봐요 ♡'
        },
        act: {
          lampOn: '불 켰어요 ♡',
          lampOff: '불 껐어요',
          night: '잘 자요 ☾',
          day: '좋은 아침 ☀',
          camera: '찰칵! 📸',
          clock: '지금은 {time} ♡',
          neonOn: '네온 ON ♡',
          neonOff: '네온 OFF',
          lightsOn: '반짝반짝 ✨',
          lightsOff: '전구가 쉬는 중…',
          plush: '말랑 ♡',
          starjar: '소원을 빌어 봐요 ✨',
          nowPlaying: '♪ {title}',
          track1: '파스텔 모닝',
          track2: '양 자장가',
          track3: '미니룸 왈츠'
        },
        photo: {
          title: '최근 사진 ♡',
          alt: '포토부스에서 찍은 최근 사진',
          none: '아직 사진이 없어요… 포토부스에 가 봐요 ♡',
          caption: '하민이의 보드에 붙여 뒀어요 ♡',
          go: '포토부스 ▶'
        },
        look: { alt: '드레스업에서 저장한 코디' },
        laptop: {
          title: 'HAMIN GAMES ♡ 익스플로러',
          address: 'http://www.hamin-games.♡/mini-home',
          nav: '브라우저 버튼 (그냥 장식이에요)',
          welcome: '하민의 미니홈피에 온 걸 환영해요 ♡',
          construction: '~ 공사 중 ~',
          news: '새소식',
          news1: '[NEW] 하민의 방 오픈! 놀러 와서 꾸며 줘요 ♡',
          news2: '[EVENT] CD 플레이어는 여러 번 틀어 주는 걸 좋아한대요… 💿',
          news3: '[TIP] 게임마다 이 방에 놓을 아이템이 숨어 있어요!',
          links: '놀러 가기 ♡'
        },
        info: {
          title: '미니룸 프로필 ♡',
          mood: '오늘의 기분',
          m1: '포근 ☁', m2: '졸림 💤', m3: '행복 ♡', m4: '신남 ★', m5: '배고픔 🍓', m6: '몽글몽글 ✨',
          owned: '방 아이템 {owned}/{total}',
          placed: '방에 놓인 것: {n}개',
          tip: '스탠드, CD 플레이어, 창문, 시계 등을 눌러서 놀아 봐요!',
          decorate: '✎ 꾸미기'
        },
        talk: {
          t1: '내 방에 온 걸 환영해 ♡',
          t2: '새로 꾸민 거 마음에 들어?',
          t3: '우리 음악 들을까? ♪',
          t4: '너 온다고 방 정리했어!',
          t5: '헤헤, 간지러워!',
          t6: '연습 먼저 하고 간식 먹자 ♡',
          t7: '이따가 같이 사진 찍자!',
          t8: '이렇게 포근한 날이 좋아.',
          t9: '점심은 먹었어?',
          t10: '이따 같이 달리기하자!',
          t11: '놀러 와 줘서 고마워 ♡',
          t12: '여기 낮잠 자기 딱 좋다… 쿨쿨'
        }
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      myRoom: {
        docTitle: 'Hamin 的房间 ♡ HAMIN GAMES',
        help: '✎ 装饰：点一下“我的道具”里的物品，或把它拖进房间。拖动就能移动——地板上的东西只能放地板，墙上的东西只能挂墙上。\n' +
              '点一下物品会出现工具：翻转、前移、后移、收起。也可以把它拖回“我的道具”。\n' +
              '键盘：Tab 选择物品 · 方向键移动（Shift = 更快）· F 翻转 · [ ] 后移/前移 · Delete 收起 · Esc 取消选择。\n' +
              '👀 观赏：点台灯、CD 机、窗户、相机、时钟、玩偶等一起玩吧。也跟 Hamin 打个招呼！\n' +
              '🔒 未解锁的物品可以通过玩其他游戏，或用 H-POINT 兑换来解锁（不是真钱哦）。\n' +
              '♡ 房间会自动保存。随时都可以按“保存房间 ♡”！',
        roomLabel: 'Hamin 的房间',
        roomTitle: '♡ Hamin 的迷你小屋 ♡',
        helpEdit: '装饰模式。拖动物品来移动。键盘：Tab 选择物品，方向键移动，F 翻转，[ 和 ] 后移/前移，Delete 收起。',
        helpView: '观赏模式。点台灯、CD 机、窗户等东西一起玩吧。',
        mode: {
          label: '房间模式',
          edit: '装饰', view: '观赏',
          editOn: '装饰模式 ✎ 随意摆一摆吧！',
          viewOn: '观赏模式 👀 点点东西玩吧！'
        },
        save: '保存房间 ♡',
        saved: '房间已保存 ♡',
        savedBonus: '房间已保存 ♡ +{n} H-POINT',
        reset: '重置',
        resetLabel: '把房间恢复成最初的摆设',
        resetTitle: '要重置房间吗？',
        resetText: '所有摆设都会回到最初的样子。已解锁的物品还是你的！',
        resetDone: '房间恢复原样啦 ♡',
        hamin: {
          toggle: 'Hamin',
          label: '在房间里显示 Hamin',
          aria: 'Hamin。点一下打个招呼吧！',
          ariaEdit: 'Hamin。可以拖动或用方向键移动，点一下会打招呼。',
          hidden: 'Hamin 出去散步啦 ♡',
          back: 'Hamin 回家啦 ♡'
        },
        status: {
          edit: '✎ 装饰模式',
          view: '👀 观赏模式',
          items: '物品 {n}/{max}',
          counter: 'TODAY {a} | TOTAL {b}',
          counterLabel: '今天在房间里点了 {a} 次，总共 {b} 次。'
        },
        inv: {
          title: '我的道具 ♡',
          show: '显示我的道具',
          count: '{owned}/{total}',
          cats: '道具分类',
          all: '全部道具',
          hint: '点一下或拖进房间 ♡',
          dropHint: '放到这里就收起来 ♡',
          placed: '已摆放',
          copies: '×{n}',
          tileOwned: '{name}：放进房间',
          tilePlaced: '{name}：已经在房间里了',
          tileCopies: '{name}：房间里有 {n} 个，再放一个',
          tileMax: '{name}：房间里有 {n} 个（已经最多了）',
          tileBuy: '{name}：未解锁。用 {cost} H-POINT 解锁',
          tileRule: '{name}：未解锁。{hint}'
        },
        buy: {
          title: '要解锁这个物品吗？',
          done: '{name} 是你的啦 ♡',
          need: '还需要 {n} H-POINT ♡'
        },
        tools: {
          label: '物品工具',
          flip: '翻转', front: '前移', back: '后移', remove: '收起', hide: '隐藏'
        },
        item: {
          ariaEdit: '{name}。方向键移动，F 翻转，Delete 收起。',
          ariaPlay: '{name}：点一下来玩'
        },
        msg: {
          placed: '放好了 {name} ♡',
          removed: '收起了 {name}',
          flipped: '翻转啦！',
          front: '移到前面了',
          back: '移到后面了',
          full: '房间放满啦！先收起一些东西吧 ♡',
          floor: '这个要放在地板上哦 ♡',
          wall: '这个要挂在墙上哦 ♡',
          already: '{name} 已经在房间里了 ♡',
          maxCopies: '{name} 已经够多啦 ♡',
          tip: '小提示：在装饰模式摆好，再切换到观赏模式点点看 ♡'
        },
        act: {
          lampOn: '开灯啦 ♡',
          lampOff: '关灯了',
          night: '晚安 ☾',
          day: '早安 ☀',
          camera: '咔嚓！📸',
          clock: '现在是 {time} ♡',
          neonOn: '霓虹灯 ON ♡',
          neonOff: '霓虹灯 OFF',
          lightsOn: '一闪一闪 ✨',
          lightsOff: '灯串休息中…',
          plush: '软绵绵 ♡',
          starjar: '许个愿吧 ✨',
          nowPlaying: '♪ {title}',
          track1: '粉彩早晨',
          track2: '小羊摇篮曲',
          track3: '小屋圆舞曲'
        },
        photo: {
          title: '最新的照片 ♡',
          alt: '在大头贴里拍的最新照片',
          none: '还没有照片……去大头贴拍一张吧 ♡',
          caption: '贴在 Hamin 的留言板上啦 ♡',
          go: '大头贴 ▶'
        },
        look: { alt: '在换装里保存的造型' },
        laptop: {
          title: 'HAMIN GAMES ♡ 浏览器',
          address: 'http://www.hamin-games.♡/mini-home',
          nav: '浏览器按钮（只是装饰）',
          welcome: '欢迎来到 Hamin 的迷你主页 ♡',
          construction: '~ 施工中 ~',
          news: '最新消息',
          news1: '[NEW] Hamin 的房间开张啦！快来装饰吧 ♡',
          news2: '[EVENT] 听说 CD 机很喜欢被一放再放…… 💿',
          news3: '[TIP] 每个游戏里都藏着这个房间的道具！',
          links: '去玩吧 ♡'
        },
        info: {
          title: '小屋资料 ♡',
          mood: '今日心情',
          m1: '温馨 ☁', m2: '困困 💤', m3: '开心 ♡', m4: '兴奋 ★', m5: '饿了 🍓', m6: '梦幻 ✨',
          owned: '房间道具 {owned}/{total}',
          placed: '房间里有 {n} 件',
          tip: '点台灯、CD 机、窗户、时钟等一起玩吧！',
          decorate: '✎ 装饰'
        },
        talk: {
          t1: '欢迎来我的房间 ♡',
          t2: '新装饰喜欢吗？',
          t3: '一起听音乐吧？♪',
          t4: '为了你特地收拾好了！',
          t5: '嘿嘿，好痒！',
          t6: '先练习，再吃点心 ♡',
          t7: '等会儿一起拍照吧！',
          t8: '最喜欢这样温馨的日子了。',
          t9: '吃过午饭了吗？',
          t10: '等会儿一起去跑步吧！',
          t11: '谢谢你来玩 ♡',
          t12: '这里最适合午睡了……呼呼'
        }
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      myRoom: {
        docTitle: 'Hamin のおへや ♡ HAMIN GAMES',
        help: '✎ かざる：「もちもの」のアイテムをタップするか、おへやへドラッグしてね。ドラッグで動かせるよ — 床のものは床に、壁のものは壁にしか置けないよ。\n' +
              'アイテムをクリックすると道具が出るよ：はんてん・前へ・後ろへ・しまう。「もちもの」へドラッグしてもしまえるよ。\n' +
              'キーボード：Tab でアイテムを選ぶ · 矢印キーで移動（Shift = はやく）· F はんてん · [ ] 後ろへ/前へ · Delete しまう · Esc 選択解除。\n' +
              '👀 ながめる：ライト、CD プレーヤー、窓、カメラ、時計、ぬいぐるみなどをクリックして遊ぼう。Hamin にもあいさつしてね！\n' +
              '🔒 ロック中のアイテムは、ほかのゲームで遊ぶか H-POINT と交換すると解放されるよ（本物のお金じゃないよ）。\n' +
              '♡ おへやは自動で保存されるよ。いつでも「へやを保存 ♡」を押してもOK！',
        roomLabel: 'Hamin のおへや',
        roomTitle: '♡ Hamin のミニルーム ♡',
        helpEdit: 'かざるモード。アイテムをドラッグして動かしてね。キーボード：Tab で選ぶ、矢印キーで移動、F ではんてん、[ と ] で後ろへ/前へ、Delete でしまう。',
        helpView: 'ながめるモード。ライトや CD プレーヤー、窓などをクリックして遊んでね。',
        mode: {
          label: 'おへやモード',
          edit: 'かざる', view: 'ながめる',
          editOn: 'かざるモード ✎ 自由に動かしてね！',
          viewOn: 'ながめるモード 👀 クリックして遊ぼう！'
        },
        save: 'へやを保存 ♡',
        saved: 'おへやを保存したよ ♡',
        savedBonus: 'おへやを保存したよ ♡ +{n} H-POINT',
        reset: 'リセット',
        resetLabel: 'おへやをはじめの配置にもどす',
        resetTitle: 'おへやをリセットする？',
        resetText: '配置がぜんぶはじめの状態にもどるよ。解放したアイテムはそのまま残るよ！',
        resetDone: 'おへやがはじめの状態にもどったよ ♡',
        hamin: {
          toggle: 'Hamin',
          label: 'おへやに Hamin を表示',
          aria: 'Hamin。クリックしてあいさつしよう！',
          ariaEdit: 'Hamin。ドラッグか矢印キーで動かせるよ。クリックするとあいさつするよ。',
          hidden: 'Hamin はおさんぽ中 ♡',
          back: 'Hamin がおうちに帰ってきたよ ♡'
        },
        status: {
          edit: '✎ かざるモード',
          view: '👀 ながめるモード',
          items: 'アイテム {n}/{max}',
          counter: 'TODAY {a} | TOTAL {b}',
          counterLabel: 'きょうおへやでクリックした回数 {a}、ぜんぶで {b}。'
        },
        inv: {
          title: 'もちもの ♡',
          show: 'もちものを表示',
          count: '{owned}/{total}',
          cats: 'アイテムの種類',
          all: 'ぜんぶ',
          hint: 'タップかドラッグでおへやへ ♡',
          dropHint: 'ここに置くとしまえるよ ♡',
          placed: '配置中',
          copies: '×{n}',
          tileOwned: '{name}：おへやに置く',
          tilePlaced: '{name}：もうおへやにあるよ',
          tileCopies: '{name}：おへやに {n} 個。もう1つ置く',
          tileMax: '{name}：おへやに {n} 個（これ以上は置けないよ）',
          tileBuy: '{name}：ロック中。{cost} H-POINTで解放',
          tileRule: '{name}：ロック中。{hint}'
        },
        buy: {
          title: 'アイテムを解放する？',
          done: '{name}がきみのものになったよ ♡',
          need: 'H-POINTがあと {n} 必要だよ ♡'
        },
        tools: {
          label: 'アイテムの道具',
          flip: 'はんてん', front: '前へ', back: '後ろへ', remove: 'しまう', hide: 'かくす'
        },
        item: {
          ariaEdit: '{name}。矢印キーで移動、F ではんてん、Delete でしまう。',
          ariaPlay: '{name}：クリックして遊ぶ'
        },
        msg: {
          placed: '{name}を置いたよ ♡',
          removed: '{name}をしまったよ',
          flipped: 'はんてん！',
          front: '前に動かしたよ',
          back: '後ろに動かしたよ',
          full: 'おへやがいっぱい！先に何かしまってね ♡',
          floor: 'これは床に置いてね ♡',
          wall: 'これは壁にかけてね ♡',
          already: '{name}はもうおへやにあるよ ♡',
          maxCopies: '{name}はもう十分だよ ♡',
          tip: 'ヒント：かざるモードで置いたら、ながめるモードでクリックしてみてね ♡'
        },
        act: {
          lampOn: 'ライトON ♡',
          lampOff: 'ライトOFF',
          night: 'おやすみ ☾',
          day: 'おはよう ☀',
          camera: 'パシャ！📸',
          clock: 'いまは {time} ♡',
          neonOn: 'ネオン ON ♡',
          neonOff: 'ネオン OFF',
          lightsOn: 'キラキラ ✨',
          lightsOff: 'ライトおやすみ中…',
          plush: 'むにゅ ♡',
          starjar: 'おねがいごとしてね ✨',
          nowPlaying: '♪ {title}',
          track1: 'パステル・モーニング',
          track2: 'ひつじの子守歌',
          track3: 'ミニルーム・ワルツ'
        },
        photo: {
          title: 'さいきんの写真 ♡',
          alt: 'プリクラでとったさいきんの写真',
          none: 'まだ写真がないよ… プリクラに行ってみてね ♡',
          caption: 'Hamin のボードに貼ったよ ♡',
          go: 'プリクラ ▶'
        },
        look: { alt: 'きせかえで保存したコーデ' },
        laptop: {
          title: 'HAMIN GAMES ♡ エクスプローラー',
          address: 'http://www.hamin-games.♡/mini-home',
          nav: 'ブラウザのボタン（かざりだよ）',
          welcome: 'Hamin のミニホームページへようこそ ♡',
          construction: '～ 工事中 ～',
          news: 'おしらせ',
          news1: '[NEW] Hamin のおへやオープン！かざりに来てね ♡',
          news2: '[EVENT] CD プレーヤーは何回もかけてほしいみたい… 💿',
          news3: '[TIP] どのゲームにもこのおへやのアイテムがかくれてるよ！',
          links: 'あそびに行く ♡'
        },
        info: {
          title: 'ミニルーム プロフィール ♡',
          mood: 'きょうの気分',
          m1: 'ほっこり ☁', m2: 'ねむねむ 💤', m3: 'しあわせ ♡', m4: 'わくわく ★', m5: 'はらぺこ 🍓', m6: 'ゆめごこち ✨',
          owned: 'おへやアイテム {owned}/{total}',
          placed: 'おへやに {n} 個',
          tip: 'ライト、CD プレーヤー、窓、時計などをクリックして遊ぼう！',
          decorate: '✎ かざる'
        },
        talk: {
          t1: 'ぼくの部屋へようこそ ♡',
          t2: '新しいもようがえ、気に入った？',
          t3: 'いっしょに音楽きこうか？♪',
          t4: 'きみが来るから片づけたんだ！',
          t5: 'えへへ、くすぐったい！',
          t6: '練習のあとはおやつ ♡',
          t7: 'あとでいっしょに写真とろう！',
          t8: 'こういうのんびりした日が好き。',
          t9: 'お昼ごはん、もう食べた？',
          t10: 'あとでいっしょに走ろう！',
          t11: '遊びに来てくれてありがとう ♡',
          t12: 'ここ、お昼寝にぴったり… すやすや'
        }
      }
    }
  };

  if (typeof HG.addStrings === 'function') HG.addStrings(STRINGS);
  else (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
})(window.HG = window.HG || {});
