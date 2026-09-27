/* HAMIN GAMES — portal home + 404 page strings (docs/CONTRACT.md §3.3)
   Namespaces: home.*  (index.html / js/home.js)
               notFound.*  (not_found.html — kept here so the 404 page needs no extra file)

   Every language block has exactly the same keys (check: node tools/check-i18n.js).
   "HAMIN GAMES", "H-POINT" and "Hamin" are never translated. Game names are passed
   in as {game} / {room} params from games.* so they always match the menu.
   Daily lines are spoken by the fan-drawn game character about the site and its
   games only — never claims about the real person.

   Loading: runs before js/i18n.js. data/translations.js installs a queueing
   HG.addStrings shim; if this file is ever loaded alone it queues by itself. */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      home: {
        srTitle: 'HAMIN GAMES — fan-made mini-game portal',
        colLeft: 'My status and game menu',
        colRight: 'Room, notices and banners',
        ticker: {
          label: 'UPDATE ♡',
          region: 'Site updates',
          pause: 'Pause the update ticker',
          play: 'Play the update ticker',
          l1: '“{game}” is open — a puppy is waiting to race you 🐶',
          l2: 'New cute stickers arrived in the PHOTO BOOTH ✦',
          l3: 'A new WEEKLY EVENT starts every Monday ♡',
          l4: 'Collect memory cards and fill your COLLECTION album 📒',
          l5: 'Exchange H-POINT for cute items — it’s a game point, not money!',
          l6: 'Decorate {room} with the items you unlock 🛏️',
          l7: 'Psst… a tiny sheep is hiding somewhere on this site 🐑'
        },
        today: {
          title: 'TODAY’S HAMIN ♡',
          badge: 'TODAY',
          date: '{y}.{m}.{d} ({w})',
          moodLabel: 'MOOD ♡ {m}',
          alt: 'Hamin today: {m}',
          tap: 'Talk to Hamin',
          hint: 'Click Hamin for another line ♡',
          l1: 'Hi hi! Did you drink some water today? ♡',
          l2: 'One game together? Just one… okay, maybe two!',
          l3: 'I tidied up my room! Come and see~ 🛏️',
          l4: 'Today’s lucky color is powder blue ☁',
          l5: 'The puppy wants a rematch in “{game}” 🐶',
          l6: 'Stickers, frames, poses… let’s make a cute photo!',
          l7: 'Practice makes perfect… and it’s super fun! 🎵',
          l8: 'Don’t forget to rest your eyes between games~',
          l9: 'Lunch time! What should we eat today? 🍙',
          l10: 'Every memory card is a little treasure ✦',
          moods: {
            neutral: 'CALM', smile: 'SMILEY', 'big-smile': 'SUPER HAPPY', 'sheep-smile': 'SHEEP SMILE',
            surprised: 'SURPRISED', focused: 'FOCUSED', wink: 'PLAYFUL'
          }
        },
        weekday: { sun: 'SUN', mon: 'MON', tue: 'TUE', wed: 'WED', thu: 'THU', fri: 'FRI', sat: 'SAT' },
        event: {
          title: 'WEEKLY EVENT',
          label: 'WEEKLY CHALLENGE ✦',
          period: '{from} ~ {to}',
          go: 'GO ♡',
          clear: 'CLEAR!',
          note: 'Just for fun — no prizes, only smiles ♡',
          done: 'This week’s challenge is cleared! Amazing ♡',
          styleTitle: 'STYLE WEEK: {name}',
          styleText: 'Clear the {name} style challenge in “{game}” ♡',
          lunchTitle: 'LUNCH RUSH WEEK',
          lunchText: 'Score 1,500 points or more in “{game}” ♡',
          runTitle: 'PUPPY RACE WEEK',
          runText: 'Run 1,000 m in one go in “{game}” ♡',
          photoTitle: 'STICKER PHOTO FESTIVAL',
          photoText: 'Make 5 sticker photos in “{game}” ♡',
          rhythmTitle: 'RHYTHM STAR WEEK',
          rhythmText: 'Get an S rank in “{game}” ♡',
          roomTitle: 'COZY ROOM WEEK',
          roomText: 'Place 5 items in “{game}” ♡'
        },
        newGames: { title: 'NEW GAME', more: 'ALL GAMES ▶' },
        hot: { title: 'HOT GAME RANKING', plays: 'PLAYED {n}', first: 'Try it! ♡' },
        all: { title: 'ALL GAMES', count: '{n} games · {m} coming soon' },
        card: { play: 'PLAY ♡' },
        status: {
          title: 'MY STATUS',
          earned: 'TOTAL EARNED', played: 'GAMES PLAYED', days: 'VISIT DAYS',
          note: 'H-POINT is a game point, not money ♡',
          exchange: 'EXCHANGE ▶'
        },
        collect: {
          title: 'COLLECTION',
          owned: '{owned} / {total}',
          aria: 'Collection {n}% complete',
          open: 'OPEN ALBUM ▶',
          note: 'Starter items don’t count ♡'
        },
        menu: { title: 'GAME MENU' },
        achv: {
          title: 'ACHIEVEMENTS',
          count: '{n} / {total}',
          empty: 'None yet… finish any game to get your first ★',
          all: 'SEE ALL ▶'
        },
        room: {
          visit: 'VISIT ROOM ▶',
          aria: 'A small preview of Hamin’s room. Open it to decorate.',
          count: 'Items placed: {n}'
        },
        notice: {
          title: 'NOTICE BOARD',
          readonly: 'Read-only board ♡',
          no: 'No.{n}',
          tags: { notice: 'NOTICE', event: 'EVENT', tip: 'TIP', update: 'UPDATE' },
          n1: 'Welcome to HAMIN GAMES! Play slowly and have fun ♡',
          n2: 'The weekly event changes every Monday ✦',
          n3: 'Your progress lives only in this browser. Export a backup in ⚙ settings!',
          n4: 'New stickers and room items can be found in the COLLECTION',
          n5: 'Rumor: the stars next to the logo like being clicked… ★',
          n6: 'HAMIN GAMES grand opening!! Thank you for visiting ♡'
        },
        banners: {
          title: 'LINK ♡ BANNERS',
          love: { a: 'BEST VIEWED', b: 'WITH LOVE ♡' },
          since: { a: 'HAMIN GAMES', b: 'since 2006 ★' },
          handmade: { a: '100%', b: 'HANDMADE' },
          noads: { a: 'NO ADS', b: 'NO LOGIN ♡' },
          y2k: { a: 'Y2K ✦', b: 'COMPATIBLE' },
          res: { a: '800×600', b: 'LOOKS OK ♡' },
          milk: { a: 'POWERED BY', b: '🍓 MILK' },
          sheep: { a: 'SHEEP', b: 'FRIENDLY 🐑' }
        },
        sheep: 'A tiny sheep is peeking out'
      },
      notFound: {
        docTitle: 'PAGE NOT FOUND ♡ HAMIN GAMES',
        title: 'ERROR ♡ page_not_found.exe',
        heading: 'PAGE NOT FOUND ♡',
        lead: 'Oops! This page wandered off somewhere…',
        text: 'The page you’re looking for doesn’t exist, or it’s still being drawn. Let’s go back and play together!',
        url: 'ADDRESS',
        searching: 'Searching everywhere…',
        notHere: 'Not here… ♡',
        home: 'GO HOME ♡',
        games: 'GAME LIST',
        collection: 'COLLECTION',
        alt: 'Hamin looking surprised',
        line1: 'Huh? Where did the page go?!',
        line2: 'Maybe the puppy ran off with it… 🐶',
        line3: 'Let’s look for it together later ♡',
        code: 'ERROR 404'
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      home: {
        srTitle: 'HAMIN GAMES — 팬메이드 미니게임 포털',
        colLeft: '내 정보와 게임 메뉴',
        colRight: '마이룸, 공지, 배너',
        ticker: {
          label: 'UPDATE ♡',
          region: '사이트 업데이트 소식',
          pause: '업데이트 소식 멈추기',
          play: '업데이트 소식 다시 흐르기',
          l1: '‘{game}’ 오픈 — 강아지가 달리기 시합을 기다려요 🐶',
          l2: '포토부스에 귀여운 새 스티커가 도착했어요 ✦',
          l3: '매주 월요일마다 새로운 주간 이벤트가 시작돼요 ♡',
          l4: '추억 카드를 모아서 컬렉션 앨범을 채워 보세요 📒',
          l5: 'H-POINT로 귀여운 아이템을 교환하세요 — 게임 포인트예요, 진짜 돈이 아니에요!',
          l6: '잠금 해제한 아이템으로 {room}을 꾸며 보세요 🛏️',
          l7: '쉿… 이 사이트 어딘가에 작은 양이 숨어 있대요 🐑'
        },
        today: {
          title: '오늘의 하민 ♡',
          badge: 'TODAY',
          date: '{y}.{m}.{d} ({w})',
          moodLabel: '기분 ♡ {m}',
          alt: '오늘의 하민: {m}',
          tap: '하민에게 말 걸기',
          hint: '하민을 클릭하면 다른 말을 해요 ♡',
          l1: '안녕안녕! 오늘 물은 마셨어요? ♡',
          l2: '같이 게임 한 판 할래요? 딱 한 판만… 아니 두 판!',
          l3: '방 정리 다 했어요! 구경 오세요~ 🛏️',
          l4: '오늘의 행운의 색은 파우더 블루 ☁',
          l5: '‘{game}’에서 강아지가 재대결을 원해요 🐶',
          l6: '스티커, 프레임, 포즈… 귀여운 사진 찍어요!',
          l7: '연습하면 완벽해지고… 엄청 재밌어요! 🎵',
          l8: '게임 사이사이 눈도 쉬어 주기~',
          l9: '점심시간! 오늘은 뭐 먹을까요? 🍙',
          l10: '추억 카드 한 장 한 장이 작은 보물이에요 ✦',
          moods: {
            neutral: '차분', smile: '방긋', 'big-smile': '신남', 'sheep-smile': '양 스마일',
            surprised: '깜짝', focused: '집중', wink: '장난꾸러기'
          }
        },
        weekday: { sun: '일', mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토' },
        event: {
          title: '주간 이벤트',
          label: '주간 챌린지 ✦',
          period: '{from} ~ {to}',
          go: 'GO ♡',
          clear: 'CLEAR!',
          note: '그냥 재미로 해요 — 상품은 없고 웃음만 있어요 ♡',
          done: '이번 주 챌린지 클리어! 최고예요 ♡',
          styleTitle: '스타일 위크: {name}',
          styleText: '‘{game}’에서 {name} 스타일 챌린지를 클리어하세요 ♡',
          lunchTitle: '점심 러시 위크',
          lunchText: '‘{game}’에서 1,500점 이상 받아 보세요 ♡',
          runTitle: '강아지 달리기 위크',
          runText: '‘{game}’에서 한 번에 1,000m를 달려 보세요 ♡',
          photoTitle: '스티커 사진 페스티벌',
          photoText: '‘{game}’에서 스티커 사진을 5장 만들어 보세요 ♡',
          rhythmTitle: '리듬 스타 위크',
          rhythmText: '‘{game}’에서 S랭크를 받아 보세요 ♡',
          roomTitle: '아늑한 방 위크',
          roomText: '‘{game}’에 아이템을 5개 놓아 보세요 ♡'
        },
        newGames: { title: '새 게임', more: '전체 게임 ▶' },
        hot: { title: '인기 게임 순위', plays: '{n}번 플레이', first: '해 보세요! ♡' },
        all: { title: '전체 게임', count: '게임 {n}개 · 준비중 {m}개' },
        card: { play: '플레이 ♡' },
        status: {
          title: '내 정보',
          earned: '누적 획득', played: '플레이 횟수', days: '방문한 날',
          note: 'H-POINT는 게임 포인트예요, 돈이 아니에요 ♡',
          exchange: '교환하러 가기 ▶'
        },
        collect: {
          title: '컬렉션',
          owned: '{owned} / {total}',
          aria: '컬렉션 {n}% 달성',
          open: '앨범 열기 ▶',
          note: '처음부터 있던 아이템은 세지 않아요 ♡'
        },
        menu: { title: '게임 메뉴' },
        achv: {
          title: '업적',
          count: '{n} / {total}',
          empty: '아직 없어요… 아무 게임이나 끝까지 하면 첫 업적을 받아요 ★',
          all: '전체 보기 ▶'
        },
        room: {
          visit: '방 구경 가기 ▶',
          aria: '하민의 방 미리보기예요. 열어서 꾸며 보세요.',
          count: '배치한 아이템: {n}개'
        },
        notice: {
          title: '공지 게시판',
          readonly: '읽기 전용 게시판 ♡',
          no: 'No.{n}',
          tags: { notice: '공지', event: '이벤트', tip: '팁', update: '업데이트' },
          n1: 'HAMIN GAMES에 오신 걸 환영해요! 천천히 즐겨 주세요 ♡',
          n2: '주간 이벤트는 매주 월요일에 바뀌어요 ✦',
          n3: '진행 상황은 이 브라우저에만 저장돼요. ⚙ 설정에서 백업을 내보내 주세요!',
          n4: '새 스티커와 방 아이템은 컬렉션에서 확인할 수 있어요',
          n5: '소문: 로고 옆의 별들은 클릭받는 걸 좋아한대요… ★',
          n6: 'HAMIN GAMES 그랜드 오픈!! 와 주셔서 고마워요 ♡'
        },
        banners: {
          title: 'LINK ♡ 배너',
          love: { a: 'BEST VIEWED', b: 'WITH LOVE ♡' },
          since: { a: 'HAMIN GAMES', b: 'since 2006 ★' },
          handmade: { a: '100%', b: 'HANDMADE' },
          noads: { a: 'NO ADS', b: 'NO LOGIN ♡' },
          y2k: { a: 'Y2K ✦', b: 'COMPATIBLE' },
          res: { a: '800×600', b: 'LOOKS OK ♡' },
          milk: { a: 'POWERED BY', b: '🍓 딸기우유' },
          sheep: { a: 'SHEEP', b: 'FRIENDLY 🐑' }
        },
        sheep: '작은 양이 빼꼼 보고 있어요'
      },
      notFound: {
        docTitle: '페이지를 찾을 수 없어요 ♡ HAMIN GAMES',
        title: 'ERROR ♡ page_not_found.exe',
        heading: '페이지를 찾을 수 없어요 ♡',
        lead: '앗! 이 페이지는 어디론가 산책을 나갔나 봐요…',
        text: '찾으시는 페이지가 없거나 아직 그리는 중이에요. 돌아가서 같이 놀아요!',
        url: '주소',
        searching: '구석구석 찾는 중…',
        notHere: '여기엔 없어요… ♡',
        home: '홈으로 ♡',
        games: '게임 목록',
        collection: '컬렉션',
        alt: '깜짝 놀란 하민',
        line1: '어라? 페이지가 어디 갔지?!',
        line2: '강아지가 물고 간 걸까요… 🐶',
        line3: '나중에 같이 찾아봐요 ♡',
        code: 'ERROR 404'
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      home: {
        srTitle: 'HAMIN GAMES — 粉丝自制小游戏门户',
        colLeft: '我的状态与游戏菜单',
        colRight: '房间、公告与横幅',
        ticker: {
          label: 'UPDATE ♡',
          region: '网站更新',
          pause: '暂停滚动公告',
          play: '继续滚动公告',
          l1: '《{game}》开放啦——小狗正等着和你赛跑 🐶',
          l2: '大头贴里来了新的可爱贴纸 ✦',
          l3: '每周一都会开始新的每周活动 ♡',
          l4: '收集回忆卡片，填满你的收藏相册 📒',
          l5: '用 H-POINT 兑换可爱道具——它是游戏积分，不是真钱哦！',
          l6: '用解锁的道具装饰{room}吧 🛏️',
          l7: '嘘……听说这个网站的某个角落藏着一只小羊 🐑'
        },
        today: {
          title: '今日 Hamin ♡',
          badge: 'TODAY',
          date: '{y}.{m}.{d}（{w}）',
          moodLabel: '心情 ♡ {m}',
          alt: '今天的 Hamin：{m}',
          tap: '和 Hamin 说话',
          hint: '点击 Hamin 会换一句话哦 ♡',
          l1: '嗨嗨！今天喝水了吗？♡',
          l2: '一起玩一局吗？就一局……好吧，两局！',
          l3: '房间整理好啦！快来参观~ 🛏️',
          l4: '今天的幸运色是粉蓝色 ☁',
          l5: '小狗想在《{game}》里再比一场 🐶',
          l6: '贴纸、相框、姿势……来拍张可爱的照片吧！',
          l7: '熟能生巧……而且超好玩！🎵',
          l8: '玩游戏的间隙也要让眼睛休息一下哦~',
          l9: '午餐时间！今天吃什么好呢？🍙',
          l10: '每一张回忆卡片都是小小的宝物 ✦',
          moods: {
            neutral: '平静', smile: '微笑', 'big-smile': '超开心', 'sheep-smile': '小羊笑',
            surprised: '惊讶', focused: '专注', wink: '调皮'
          }
        },
        weekday: { sun: '周日', mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五', sat: '周六' },
        event: {
          title: '每周活动',
          label: '每周挑战 ✦',
          period: '{from} ~ {to}',
          go: 'GO ♡',
          clear: 'CLEAR!',
          note: '纯属娱乐——没有奖品，只有笑容 ♡',
          done: '本周挑战完成！太厉害了 ♡',
          styleTitle: '造型周：{name}',
          styleText: '在《{game}》中完成「{name}」造型挑战 ♡',
          lunchTitle: '午餐冲刺周',
          lunchText: '在《{game}》中拿到 1,500 分以上 ♡',
          runTitle: '小狗赛跑周',
          runText: '在《{game}》中一口气跑 1,000 米 ♡',
          photoTitle: '贴纸照片节',
          photoText: '在《{game}》中制作 5 张贴纸照片 ♡',
          rhythmTitle: '节奏之星周',
          rhythmText: '在《{game}》中拿到 S 评级 ♡',
          roomTitle: '温馨房间周',
          roomText: '在《{game}》里摆放 5 件物品 ♡'
        },
        newGames: { title: '新游戏', more: '全部游戏 ▶' },
        hot: { title: '人气游戏排行', plays: '已玩 {n} 次', first: '来试试吧！♡' },
        all: { title: '全部游戏', count: '{n} 款游戏 · {m} 款即将推出' },
        card: { play: '开始玩 ♡' },
        status: {
          title: '我的状态',
          earned: '累计获得', played: '游戏次数', days: '访问天数',
          note: 'H-POINT 是游戏积分，不是钱哦 ♡',
          exchange: '去兑换 ▶'
        },
        collect: {
          title: '收藏',
          owned: '{owned} / {total}',
          aria: '收藏完成度 {n}%',
          open: '打开相册 ▶',
          note: '初始道具不计入哦 ♡'
        },
        menu: { title: '游戏菜单' },
        achv: {
          title: '成就',
          count: '{n} / {total}',
          empty: '还没有成就……玩完任意一局就能拿到第一个 ★',
          all: '查看全部 ▶'
        },
        room: {
          visit: '参观房间 ▶',
          aria: 'Hamin 房间的小预览。打开就可以装饰啦。',
          count: '已摆放：{n} 件'
        },
        notice: {
          title: '公告栏',
          readonly: '只读公告栏 ♡',
          no: 'No.{n}',
          tags: { notice: '公告', event: '活动', tip: '小贴士', update: '更新' },
          n1: '欢迎来到 HAMIN GAMES！慢慢玩，玩得开心 ♡',
          n2: '每周活动在每周一更换 ✦',
          n3: '游戏进度只保存在这个浏览器里。记得在 ⚙ 设置中导出备份！',
          n4: '新的贴纸和房间道具可以在收藏里查看',
          n5: '传闻：标志旁边的星星很喜欢被点击……★',
          n6: 'HAMIN GAMES 盛大开张！！感谢来访 ♡'
        },
        banners: {
          title: 'LINK ♡ 横幅',
          love: { a: 'BEST VIEWED', b: 'WITH LOVE ♡' },
          since: { a: 'HAMIN GAMES', b: 'since 2006 ★' },
          handmade: { a: '100%', b: 'HANDMADE' },
          noads: { a: 'NO ADS', b: 'NO LOGIN ♡' },
          y2k: { a: 'Y2K ✦', b: 'COMPATIBLE' },
          res: { a: '800×600', b: 'LOOKS OK ♡' },
          milk: { a: 'POWERED BY', b: '🍓 草莓牛奶' },
          sheep: { a: 'SHEEP', b: 'FRIENDLY 🐑' }
        },
        sheep: '一只小羊正在偷看'
      },
      notFound: {
        docTitle: '找不到页面 ♡ HAMIN GAMES',
        title: 'ERROR ♡ page_not_found.exe',
        heading: '找不到页面 ♡',
        lead: '哎呀！这个页面不知道跑到哪里去了……',
        text: '你要找的页面不存在，或者还在绘制中。我们回去一起玩吧！',
        url: '地址',
        searching: '正在到处寻找……',
        notHere: '这里没有……♡',
        home: '回到首页 ♡',
        games: '游戏列表',
        collection: '收藏',
        alt: '一脸惊讶的 Hamin',
        line1: '咦？页面去哪儿了？！',
        line2: '难道是被小狗叼走了……🐶',
        line3: '之后我们一起找找吧 ♡',
        code: 'ERROR 404'
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      home: {
        srTitle: 'HAMIN GAMES — ファンメイドのミニゲームポータル',
        colLeft: 'マイステータスとゲームメニュー',
        colRight: 'おへや・お知らせ・バナー',
        ticker: {
          label: 'UPDATE ♡',
          region: 'サイトの更新情報',
          pause: '更新情報のスクロールを止める',
          play: '更新情報のスクロールを再開する',
          l1: '「{game}」オープン！子犬がかけっこを待ってるよ 🐶',
          l2: 'プリクラにかわいい新スタンプが届いたよ ✦',
          l3: '毎週月曜日に新しいウィークリーイベントがスタート ♡',
          l4: '思い出カードを集めて、コレクションアルバムをうめよう 📒',
          l5: 'H-POINT でかわいいアイテムと交換しよう — ゲームのポイントで、本物のお金じゃないよ！',
          l6: 'アンロックしたアイテムで{room}を飾ろう 🛏️',
          l7: 'しーっ…このサイトのどこかに小さなひつじが隠れてるらしい 🐑'
        },
        today: {
          title: '今日の Hamin ♡',
          badge: 'TODAY',
          date: '{y}.{m}.{d}（{w}）',
          moodLabel: 'きぶん ♡ {m}',
          alt: '今日の Hamin：{m}',
          tap: 'Hamin に話しかける',
          hint: 'Hamin をクリックすると別のセリフが聞けるよ ♡',
          l1: 'やっほー！今日はお水飲んだ？♡',
          l2: 'いっしょに一回あそぶ？一回だけ…やっぱり二回！',
          l3: 'おへやを片づけたよ！見に来て~ 🛏️',
          l4: '今日のラッキーカラーはパウダーブルー ☁',
          l5: '子犬が「{game}」でリベンジしたいって 🐶',
          l6: 'スタンプ、フレーム、ポーズ…かわいい写真を撮ろう！',
          l7: '練習は上達への近道…しかもすっごく楽しい！🎵',
          l8: 'ゲームの合間には目も休めてね~',
          l9: 'ランチタイム！今日は何を食べようかな？🍙',
          l10: '思い出カードは一枚一枚が小さな宝物 ✦',
          moods: {
            neutral: 'おだやか', smile: 'にこにこ', 'big-smile': 'ごきげん', 'sheep-smile': 'ひつじスマイル',
            surprised: 'びっくり', focused: 'しゅうちゅう', wink: 'いたずら'
          }
        },
        weekday: { sun: '日', mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土' },
        event: {
          title: 'ウィークリーイベント',
          label: 'ウィークリーチャレンジ ✦',
          period: '{from} ~ {to}',
          go: 'GO ♡',
          clear: 'CLEAR!',
          note: 'ただのお楽しみ — 景品はないけど、笑顔はあるよ ♡',
          done: '今週のチャレンジクリア！すごい ♡',
          styleTitle: 'スタイルウィーク：{name}',
          styleText: '「{game}」で「{name}」スタイルチャレンジをクリアしよう ♡',
          lunchTitle: 'ランチラッシュウィーク',
          lunchText: '「{game}」で 1,500 点以上をめざそう ♡',
          runTitle: '子犬かけっこウィーク',
          runText: '「{game}」で一度に 1,000m 走ろう ♡',
          photoTitle: 'スタンプ写真フェス',
          photoText: '「{game}」でプリクラを 5 枚作ろう ♡',
          rhythmTitle: 'リズムスターウィーク',
          rhythmText: '「{game}」で S ランクを取ろう ♡',
          roomTitle: 'ほっこりおへやウィーク',
          roomText: '「{game}」にアイテムを 5 個置こう ♡'
        },
        newGames: { title: '新作ゲーム', more: 'ゲーム一覧 ▶' },
        hot: { title: '人気ゲームランキング', plays: '{n} 回プレイ', first: 'やってみよう！♡' },
        all: { title: 'ゲーム一覧', count: '{n} 本 · 準備中 {m} 本' },
        card: { play: 'プレイ ♡' },
        status: {
          title: 'マイステータス',
          earned: '累計獲得', played: 'プレイ回数', days: '来訪日数',
          note: 'H-POINT はゲームのポイントで、お金ではありません ♡',
          exchange: '交換する ▶'
        },
        collect: {
          title: 'コレクション',
          owned: '{owned} / {total}',
          aria: 'コレクション達成率 {n}%',
          open: 'アルバムを開く ▶',
          note: 'はじめから持っているアイテムは数えないよ ♡'
        },
        menu: { title: 'ゲームメニュー' },
        achv: {
          title: '実績',
          count: '{n} / {total}',
          empty: 'まだないよ…どれかのゲームを最後まであそぶと最初の実績がもらえるよ ★',
          all: 'すべて見る ▶'
        },
        room: {
          visit: 'おへやへ ▶',
          aria: 'Hamin の部屋の小さなプレビュー。開くと飾りつけができます。',
          count: '配置中：{n} 個'
        },
        notice: {
          title: 'おしらせ掲示板',
          readonly: '読むだけの掲示板 ♡',
          no: 'No.{n}',
          tags: { notice: 'お知らせ', event: 'イベント', tip: 'ヒント', update: '更新' },
          n1: 'HAMIN GAMES へようこそ！のんびり楽しんでね ♡',
          n2: 'ウィークリーイベントは毎週月曜日に変わるよ ✦',
          n3: '進行状況はこのブラウザにだけ保存されます。⚙ 設定からバックアップを書き出してね！',
          n4: '新しいスタンプやおへやアイテムはコレクションでチェック',
          n5: 'うわさ：ロゴの横の星はクリックされるのが好きらしい…★',
          n6: 'HAMIN GAMES グランドオープン!! 来てくれてありがとう ♡'
        },
        banners: {
          title: 'LINK ♡ バナー',
          love: { a: 'BEST VIEWED', b: 'WITH LOVE ♡' },
          since: { a: 'HAMIN GAMES', b: 'since 2006 ★' },
          handmade: { a: '100%', b: 'HANDMADE' },
          noads: { a: 'NO ADS', b: 'NO LOGIN ♡' },
          y2k: { a: 'Y2K ✦', b: 'COMPATIBLE' },
          res: { a: '800×600', b: 'LOOKS OK ♡' },
          milk: { a: 'POWERED BY', b: '🍓 いちごミルク' },
          sheep: { a: 'SHEEP', b: 'FRIENDLY 🐑' }
        },
        sheep: '小さなひつじがのぞいてる'
      },
      notFound: {
        docTitle: 'ページが見つかりません ♡ HAMIN GAMES',
        title: 'ERROR ♡ page_not_found.exe',
        heading: 'ページが見つかりません ♡',
        lead: 'あれっ！このページはどこかへお散歩に行っちゃったみたい…',
        text: 'お探しのページは存在しないか、まだ描いている途中です。もどっていっしょにあそぼう！',
        url: 'アドレス',
        searching: 'すみずみまで探しています…',
        notHere: 'ここにはないみたい… ♡',
        home: 'ホームへ ♡',
        games: 'ゲーム一覧',
        collection: 'コレクション',
        alt: 'びっくりした Hamin',
        line1: 'あれ？ページはどこに行ったの？！',
        line2: '子犬がくわえて行っちゃったのかな… 🐶',
        line3: 'あとでいっしょに探そうね ♡',
        code: 'ERROR 404'
      }
    }
  };

  if (typeof HG.addStrings === 'function') HG.addStrings(STRINGS);
  else (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
})(window.HG = window.HG || {});
