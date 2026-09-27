/* HAMIN GAMES — common UI strings (docs/CONTRACT.md §3.3)
   Namespaces: common.* nav.* footer.* settings.* popup.* shell.* games.* hpoint.*
   Catalog names live in data/translations-items.js, page strings in
   data/translations-<page>.js. Every language block has exactly the same keys.

   "HAMIN GAMES", "H-POINT" and "Hamin" are never translated. Language names in
   the selector are always written in their own script (see js/i18n.js).

   Loading: this file is the FIRST script on every page, before js/i18n.js.
   It installs a tiny HG.addStrings() shim that queues bundles on
   HG._pendingStrings; js/i18n.js replaces the shim and drains the queue. */
(function (HG) {
  'use strict';

  if (typeof HG.addStrings !== 'function') {
    HG.addStrings = function (bundle) {
      (HG._pendingStrings = HG._pendingStrings || []).push(bundle);
    };
  }

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      common: {
        brand: 'HAMIN GAMES',
        tagline: '♡ Hamin’s little mini-game world ♡',
        skip: 'Skip to content',
        close: 'CLOSE', ok: 'OK', cancel: 'CANCEL', yes: 'YES', no: 'NO',
        confirm: 'ARE YOU SURE?',
        back: 'BACK', play: 'PLAY', start: 'START', next: 'NEXT', prev: 'PREV',
        loading: 'LOADING…', new: 'NEW!', hot: 'HOT!', soon: 'SOON',
        locked: 'LOCKED', owned: 'OWNED', buy: 'EXCHANGE',
        on: 'ON', off: 'OFF', auto: 'AUTO',
        language: 'LANGUAGE', languageGroup: 'Choose language',
        settings: 'Settings', sound: 'Sound', soundOn: 'Sound: ON', soundOff: 'Sound: OFF',
        help: 'Help', menu: 'Menu',
        storageMemory: 'Saving is not available in this browser mode. Your progress will last until you close this tab.',
        storageCorrupt: 'Your save data could not be read, so a fresh save was started. (A backup copy was kept.)',
        storageFuture: 'This save is from a newer version of HAMIN GAMES, so a fresh save was started. (A backup copy was kept.)',
        storageFull: 'Browser storage is full, so progress can’t be saved right now.',
        imageMissing: 'Picture coming soon'
      },
      nav: {
        label: 'Main menu', tabbar: 'Quick menu',
        home: 'HOME', game: 'GAME', photo: 'PHOTO', collection: 'COLLECTION', myRoom: 'MY ROOM'
      },
      footer: {
        disclaimer: 'Fan-made · Unofficial · Non-commercial · Not affiliated with SM Entertainment',
        love: 'BEST VIEWED WITH LOVE ♡',
        visitor: 'YOU ARE VISITOR NO. {n} ♡',
        visitorLucky: 'Lucky number 0524! ✨',
        clock: 'Current time',
        sheep: 'A tiny sheep',
        note: 'No accounts · No personal data · Progress is saved only in this browser',
        art: 'All characters are original fan drawings. No official photos, logos or music are used.'
      },
      settings: {
        open: 'Open settings', title: 'SETTINGS',
        language: 'Language', sound: 'Sound', display: 'Display', saveData: 'Save data',
        music: 'Music', sfx: 'Sound effects', mute: 'Mute all sounds', volume: '{n}%',
        motion: 'Reduced motion', motionAuto: 'AUTO', motionOn: 'ON', motionOff: 'OFF',
        motionHint: 'AUTO follows your device setting.',
        sparkles: 'Cursor sparkles',
        saveNote: 'Progress is saved only in this browser. Export a backup file to move it to another browser.',
        export: 'EXPORT SAVE', import: 'IMPORT SAVE', reset: 'RESET PROGRESS',
        exportOk: 'Save file downloaded ♡', exportFail: 'Could not download the save file.',
        importConfirmTitle: 'IMPORT SAVE?',
        importConfirmText: 'Your current progress will be replaced by the imported save. Continue?',
        importOk: 'Save imported! Reloading…', importOkMemory: 'Save imported for this tab.',
        importError: {
          parse: 'That file is not a valid save file.',
          invalid: 'That file does not look like a HAMIN GAMES save.',
          newer: 'That save is from a newer version and cannot be loaded here.',
          size: 'That file is too big to be a save file.',
          read: 'The file could not be read.'
        },
        resetConfirmTitle: 'RESET PROGRESS?',
        resetConfirmText: 'All H-POINT, items, memories and records will be erased. Language and sound settings stay. This cannot be undone!',
        resetOk: 'Progress reset. Starting fresh…'
      },
      popup: {
        close: 'Close', region: 'Notifications',
        unlock: { title: 'NEW ITEM!' },
        memory: { title: 'NEW MEMORY ♡' },
        achievement: { title: 'ACHIEVEMENT!' },
        record: { title: 'NEW RECORD!', text: '{game}: {score}' },
        secret: { title: 'SECRET FOUND!', text: 'You found a hidden secret! +{n} H-POINT' },
        hpoint: { title: 'H-POINT GET!' },
        reward: '+{n} H-POINT',
        more: '…and {n} more! Check the COLLECTION ♡'
      },
      shell: {
        back: 'BACK', backLabel: 'Back to the HAMIN GAMES home page',
        help: 'HELP', helpTitle: 'HOW TO PLAY', noHelp: 'Have fun and play at your own pace ♡',
        sound: 'Sound', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen',
        pause: 'PAUSE', paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART', quit: 'QUIT',
        start: 'START', play: 'PLAY', playAgain: 'PLAY AGAIN', tryAgain: 'TRY AGAIN',
        menu: 'MENU', backToMenu: 'BACK TO MENU', home: 'HOME',
        ready: 'READY?', go: 'GO!', loading: 'LOADING…',
        results: 'RESULTS', clear: 'CLEAR!', gameOver: 'GAME OVER', timeUp: 'TIME UP!', finish: 'FINISH!',
        score: 'SCORE', best: 'BEST', newRecord: 'NEW RECORD!', rank: 'RANK', time: 'TIME',
        combo: 'COMBO', maxCombo: 'MAX COMBO', lives: 'LIFE', level: 'LEVEL', stage: 'STAGE', distance: 'DISTANCE',
        perfect: 'PERFECT!', great: 'GREAT!', good: 'GOOD', miss: 'MISS',
        earned: '+{n} H-POINT', stars: '{n} of 3 stars', unlocked: 'UNLOCKED!',
        tutorial: 'HOW TO PLAY', gotIt: 'GOT IT!', dontShow: 'Don’t show this again',
        controls: 'CONTROLS', keyboard: 'Keyboard', touch: 'Touch', mouse: 'Mouse',
        pauseHint: 'Press P or Esc to pause',
        btnLeft: 'LEFT', btnRight: 'RIGHT', btnUp: 'UP', btnDown: 'DOWN',
        btnJump: 'JUMP', btnSlide: 'SLIDE', btnAction: 'ACTION',
        rotate: 'Turn your phone sideways for a bigger screen!'
      },
      games: {
        dressUp: { title: 'HAMIN DRESS UP', desc: 'Mix and match outfits, hair and accessories, then clear the style challenges!' },
        photoBooth: { title: 'HAMIN PHOTO BOOTH', desc: 'Pick a pose, a frame and cute stickers to make your own sticker photo!' },
        runHamin: { title: 'RUN, HAMIN!', desc: 'A puppy wants to play! Run, jump over obstacles and grab snacks!' },
        lunchTime: { title: 'HAMIN’S LUNCH TIME', desc: 'Make the perfect lunch before time runs out. Keep the combo going to make Hamin smile!' },
        practiceRoom: { title: 'HAMIN PRACTICE ROOM', desc: 'Hit the notes to the beat and get ready for the stage!' },
        myRoom: { title: 'HAMIN’S ROOM', desc: 'Decorate Hamin’s cozy room with the items you collect.' },
        soonPicnic: { title: 'HAMIN’S PICNIC' },
        soonBand: { title: 'HAMIN BAND' },
        soonSnow: { title: 'SNOW DAY' },
        soon: { desc: 'Coming soon… please wait for it ♡' },
        comingSoon: 'COMING SOON', play: 'PLAY ▶',
        best: 'BEST {v}', noBest: 'BEST —',
        fmt: { meters: '{n} m', points: '{n} pts', stars: '★ {n}' }
      },
      hpoint: {
        label: 'H-POINT', aria: 'H-POINT: {n}',
        what: 'H-POINT is earned by playing games. Exchange it for cute items in the COLLECTION. It is not real money!',
        earned: '+{n} H-POINT', spent: '−{n} H-POINT', cost: '{n} H-POINT', total: 'Total earned: {n}',
        notEnough: 'Not enough H-POINT yet… keep playing ♡', owned: 'Already yours!',
        exchange: 'H-POINT EXCHANGE',
        reason: {
          finish: 'Game clear bonus', record: 'New record bonus', achievement: 'Achievement bonus',
          secret: 'Secret bonus', gift: 'Gift'
        }
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      common: {
        brand: 'HAMIN GAMES',
        tagline: '♡ 하민의 작은 미니게임 세상 ♡',
        skip: '본문 바로가기',
        close: '닫기', ok: '확인', cancel: '취소', yes: '네', no: '아니요',
        confirm: '정말 할까요?',
        back: '뒤로', play: '플레이', start: '시작', next: '다음', prev: '이전',
        loading: '로딩 중…', new: 'NEW!', hot: 'HOT!', soon: '준비중',
        locked: '잠김', owned: '보유중', buy: '교환',
        on: '켜기', off: '끄기', auto: '자동',
        language: 'LANGUAGE', languageGroup: '언어 선택',
        settings: '설정', sound: '소리', soundOn: '소리: 켜짐', soundOff: '소리: 꺼짐',
        help: '도움말', menu: '메뉴',
        storageMemory: '이 브라우저 모드에서는 저장할 수 없어요. 탭을 닫기 전까지만 진행 상황이 유지돼요.',
        storageCorrupt: '저장 데이터를 읽을 수 없어서 새로 시작했어요. (백업은 따로 보관했어요.)',
        storageFuture: '더 새로운 버전의 저장 데이터라서 새로 시작했어요. (백업은 따로 보관했어요.)',
        storageFull: '브라우저 저장 공간이 가득 차서 지금은 저장할 수 없어요.',
        imageMissing: '그림 준비중'
      },
      nav: {
        label: '메인 메뉴', tabbar: '빠른 메뉴',
        home: '홈', game: '게임', photo: '포토', collection: '컬렉션', myRoom: '마이룸'
      },
      footer: {
        disclaimer: '팬메이드 · 비공식 · 비상업적 · SM엔터테인먼트와 무관합니다',
        love: 'BEST VIEWED WITH LOVE ♡',
        visitor: '당신은 {n}번째 방문자 ♡',
        visitorLucky: '행운의 숫자 0524! ✨',
        clock: '현재 시각',
        sheep: '작은 양',
        note: '계정 없음 · 개인정보 수집 없음 · 진행 상황은 이 브라우저에만 저장돼요',
        art: '모든 캐릭터는 팬이 직접 그린 오리지널 그림이에요. 공식 사진, 로고, 음악은 사용하지 않아요.'
      },
      settings: {
        open: '설정 열기', title: '설정',
        language: '언어', sound: '사운드', display: '화면', saveData: '저장 데이터',
        music: '배경음악', sfx: '효과음', mute: '모든 소리 끄기', volume: '{n}%',
        motion: '움직임 줄이기', motionAuto: '자동', motionOn: '켜기', motionOff: '끄기',
        motionHint: '자동은 기기 설정을 따라가요.',
        sparkles: '커서 반짝이',
        saveNote: '진행 상황은 이 브라우저에만 저장돼요. 다른 브라우저로 옮기려면 백업 파일을 내보내 주세요.',
        export: '저장 내보내기', import: '저장 불러오기', reset: '진행 초기화',
        exportOk: '저장 파일을 다운로드했어요 ♡', exportFail: '저장 파일을 다운로드할 수 없어요.',
        importConfirmTitle: '저장 데이터를 불러올까요?',
        importConfirmText: '지금의 진행 상황이 불러온 데이터로 바뀌어요. 계속할까요?',
        importOk: '불러오기 완료! 새로고침할게요…', importOkMemory: '이 탭에서만 불러왔어요.',
        importError: {
          parse: '올바른 저장 파일이 아니에요.',
          invalid: 'HAMIN GAMES 저장 파일이 아닌 것 같아요.',
          newer: '더 새로운 버전의 저장 파일이라 불러올 수 없어요.',
          size: '저장 파일이라기엔 너무 커요.',
          read: '파일을 읽을 수 없어요.'
        },
        resetConfirmTitle: '진행 상황을 초기화할까요?',
        resetConfirmText: 'H-POINT, 아이템, 추억, 기록이 모두 지워져요. 언어와 사운드 설정은 그대로예요. 되돌릴 수 없어요!',
        resetOk: '초기화했어요. 처음부터 시작할게요…'
      },
      popup: {
        close: '닫기', region: '알림',
        unlock: { title: '새 아이템!' },
        memory: { title: '새로운 추억 ♡' },
        achievement: { title: '업적 달성!' },
        record: { title: '신기록!', text: '{game}: {score}' },
        secret: { title: '비밀 발견!', text: '숨겨진 비밀을 찾았어요! +{n} H-POINT' },
        hpoint: { title: 'H-POINT 획득!' },
        reward: '+{n} H-POINT',
        more: '…외 {n}개 더! 컬렉션을 확인해 보세요 ♡'
      },
      shell: {
        back: '뒤로', backLabel: 'HAMIN GAMES 홈으로 돌아가기',
        help: '도움말', helpTitle: '게임 방법', noHelp: '천천히 즐겁게 플레이해 주세요 ♡',
        sound: '소리', fullscreen: '전체 화면', exitFullscreen: '전체 화면 끝내기',
        pause: '일시정지', paused: '일시정지 중', resume: '계속하기', restart: '다시 시작', quit: '그만하기',
        start: '시작', play: '플레이', playAgain: '한 번 더', tryAgain: '다시 도전',
        menu: '메뉴', backToMenu: '메뉴로', home: '홈',
        ready: '준비됐나요?', go: 'GO!', loading: '로딩 중…',
        results: '결과', clear: '클리어!', gameOver: '게임 오버', timeUp: '시간 끝!', finish: '끝!',
        score: '점수', best: '최고 기록', newRecord: '신기록!', rank: '랭크', time: '시간',
        combo: '콤보', maxCombo: '최대 콤보', lives: '라이프', level: '레벨', stage: '스테이지', distance: '거리',
        perfect: 'PERFECT!', great: 'GREAT!', good: 'GOOD', miss: 'MISS',
        earned: '+{n} H-POINT', stars: '별 3개 중 {n}개', unlocked: '잠금 해제!',
        tutorial: '게임 방법', gotIt: '알겠어요!', dontShow: '다시 보지 않기',
        controls: '조작법', keyboard: '키보드', touch: '터치', mouse: '마우스',
        pauseHint: 'P 또는 Esc 키로 일시정지',
        btnLeft: '왼쪽', btnRight: '오른쪽', btnUp: '위', btnDown: '아래',
        btnJump: '점프', btnSlide: '슬라이드', btnAction: '액션',
        rotate: '휴대폰을 가로로 돌리면 화면이 더 커져요!'
      },
      games: {
        dressUp: { title: '하민 옷 입히기', desc: '옷, 헤어, 액세서리를 골라 코디하고 스타일 챌린지를 클리어하세요!' },
        photoBooth: { title: '하민 포토부스', desc: '포즈, 프레임, 귀여운 스티커를 골라 나만의 스티커 사진을 만들어요!' },
        runHamin: { title: '하민아, 도망쳐!', desc: '강아지가 놀자고 쫓아와요! 달리고 점프하며 간식을 모아요!' },
        lunchTime: { title: '하민의 점심시간', desc: '시간 안에 완벽한 점심을 차려요. 콤보를 이어서 하민을 웃게 해 주세요!' },
        practiceRoom: { title: '하민 연습실', desc: '박자에 맞춰 노트를 치며 무대를 준비해요!' },
        myRoom: { title: '하민의 방', desc: '모은 아이템으로 하민의 아늑한 방을 꾸며요.' },
        soonPicnic: { title: '하민의 소풍' },
        soonBand: { title: '하민 밴드' },
        soonSnow: { title: '눈 오는 날' },
        soon: { desc: '곧 만나요… 조금만 기다려 주세요 ♡' },
        comingSoon: '준비중', play: '플레이 ▶',
        best: '최고 {v}', noBest: '최고 —',
        fmt: { meters: '{n}m', points: '{n}점', stars: '★ {n}' }
      },
      hpoint: {
        label: 'H-POINT', aria: 'H-POINT: {n}',
        what: 'H-POINT는 게임을 플레이하면 모여요. 컬렉션에서 귀여운 아이템으로 교환할 수 있어요. 진짜 돈이 아니에요!',
        earned: '+{n} H-POINT', spent: '−{n} H-POINT', cost: '{n} H-POINT', total: '누적 획득: {n}',
        notEnough: 'H-POINT가 아직 부족해요… 조금 더 플레이해 봐요 ♡', owned: '이미 가지고 있어요!',
        exchange: 'H-POINT 교환소',
        reason: {
          finish: '게임 완료 보너스', record: '신기록 보너스', achievement: '업적 보너스',
          secret: '비밀 보너스', gift: '선물'
        }
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      common: {
        brand: 'HAMIN GAMES',
        tagline: '♡ Hamin 的小游戏世界 ♡',
        skip: '跳到正文',
        close: '关闭', ok: '确定', cancel: '取消', yes: '是', no: '否',
        confirm: '确定吗？',
        back: '返回', play: '开始玩', start: '开始', next: '下一个', prev: '上一个',
        loading: '加载中…', new: 'NEW!', hot: 'HOT!', soon: '敬请期待',
        locked: '未解锁', owned: '已拥有', buy: '兑换',
        on: '开', off: '关', auto: '自动',
        language: 'LANGUAGE', languageGroup: '选择语言',
        settings: '设置', sound: '声音', soundOn: '声音：开', soundOff: '声音：关',
        help: '帮助', menu: '菜单',
        storageMemory: '当前浏览器模式无法保存。关闭此标签页之前，进度都会保留。',
        storageCorrupt: '无法读取存档，已重新开始。（已保留一份备份）',
        storageFuture: '这个存档来自更新的版本，已重新开始。（已保留一份备份）',
        storageFull: '浏览器存储空间已满，暂时无法保存进度。',
        imageMissing: '图片准备中'
      },
      nav: {
        label: '主菜单', tabbar: '快捷菜单',
        home: '首页', game: '游戏', photo: '大头贴', collection: '收藏', myRoom: '我的房间'
      },
      footer: {
        disclaimer: '粉丝自制 · 非官方 · 非商业 · 与SM娱乐无关',
        love: 'BEST VIEWED WITH LOVE ♡',
        visitor: '你是第 {n} 位访客 ♡',
        visitorLucky: '幸运数字 0524！✨',
        clock: '当前时间',
        sheep: '一只小羊',
        note: '无需账号 · 不收集个人信息 · 进度只保存在此浏览器中',
        art: '所有角色均为粉丝原创绘画，未使用任何官方照片、标志或音乐。'
      },
      settings: {
        open: '打开设置', title: '设置',
        language: '语言', sound: '声音', display: '显示', saveData: '存档',
        music: '背景音乐', sfx: '音效', mute: '全部静音', volume: '{n}%',
        motion: '减少动态效果', motionAuto: '自动', motionOn: '开', motionOff: '关',
        motionHint: '“自动”会跟随设备设置。',
        sparkles: '鼠标闪光',
        saveNote: '进度只保存在此浏览器中。导出备份文件即可转移到其他浏览器。',
        export: '导出存档', import: '导入存档', reset: '重置进度',
        exportOk: '存档已下载 ♡', exportFail: '无法下载存档文件。',
        importConfirmTitle: '导入存档？',
        importConfirmText: '当前进度将被导入的存档替换。要继续吗？',
        importOk: '导入成功！正在重新加载…', importOkMemory: '已在此标签页中导入。',
        importError: {
          parse: '这不是有效的存档文件。',
          invalid: '这似乎不是 HAMIN GAMES 的存档。',
          newer: '这个存档来自更新的版本，无法在这里读取。',
          size: '文件太大了，不像是存档文件。',
          read: '无法读取这个文件。'
        },
        resetConfirmTitle: '重置进度？',
        resetConfirmText: '所有 H-POINT、物品、回忆和纪录都会被清除。语言和声音设置会保留。此操作无法撤销！',
        resetOk: '已重置，重新开始…'
      },
      popup: {
        close: '关闭', region: '通知',
        unlock: { title: '获得新物品！' },
        memory: { title: '新的回忆 ♡' },
        achievement: { title: '达成成就！' },
        record: { title: '新纪录！', text: '{game}：{score}' },
        secret: { title: '发现秘密！', text: '你发现了隐藏的秘密！+{n} H-POINT' },
        hpoint: { title: '获得 H-POINT！' },
        reward: '+{n} H-POINT',
        more: '……还有 {n} 个！快去收藏看看 ♡'
      },
      shell: {
        back: '返回', backLabel: '返回 HAMIN GAMES 首页',
        help: '帮助', helpTitle: '玩法说明', noHelp: '按照自己的节奏开心地玩吧 ♡',
        sound: '声音', fullscreen: '全屏', exitFullscreen: '退出全屏',
        pause: '暂停', paused: '已暂停', resume: '继续', restart: '重新开始', quit: '退出',
        start: '开始', play: '开始玩', playAgain: '再玩一次', tryAgain: '再试一次',
        menu: '菜单', backToMenu: '返回菜单', home: '首页',
        ready: '准备好了吗？', go: 'GO!', loading: '加载中…',
        results: '结果', clear: '通关！', gameOver: '游戏结束', timeUp: '时间到！', finish: '结束！',
        score: '分数', best: '最高纪录', newRecord: '新纪录！', rank: '评级', time: '时间',
        combo: '连击', maxCombo: '最大连击', lives: '生命', level: '等级', stage: '关卡', distance: '距离',
        perfect: 'PERFECT!', great: 'GREAT!', good: 'GOOD', miss: 'MISS',
        earned: '+{n} H-POINT', stars: '3 颗星中的 {n} 颗', unlocked: '已解锁！',
        tutorial: '玩法说明', gotIt: '明白了！', dontShow: '不再显示',
        controls: '操作方法', keyboard: '键盘', touch: '触屏', mouse: '鼠标',
        pauseHint: '按 P 或 Esc 暂停',
        btnLeft: '左', btnRight: '右', btnUp: '上', btnDown: '下',
        btnJump: '跳跃', btnSlide: '滑行', btnAction: '动作',
        rotate: '把手机横过来，画面会更大哦！'
      },
      games: {
        dressUp: { title: 'Hamin 换装', desc: '自由搭配服装、发型和配饰，完成各种造型挑战！' },
        photoBooth: { title: 'Hamin 大头贴', desc: '选择姿势、相框和可爱的贴纸，制作专属大头贴！' },
        runHamin: { title: 'Hamin，快跑！', desc: '小狗追过来想一起玩！奔跑、跳过障碍，收集零食吧！' },
        lunchTime: { title: 'Hamin的午餐时间', desc: '在时间结束前做出完美的午餐。保持连击，让 Hamin 笑起来吧！' },
        practiceRoom: { title: 'Hamin 练习室', desc: '跟着节拍敲击音符，为舞台做好准备！' },
        myRoom: { title: 'Hamin的房间', desc: '用收集到的物品装饰 Hamin 温馨的房间。' },
        soonPicnic: { title: 'Hamin的野餐' },
        soonBand: { title: 'Hamin 乐队' },
        soonSnow: { title: '下雪天' },
        soon: { desc: '即将推出……请耐心等待 ♡' },
        comingSoon: '敬请期待', play: '开始玩 ▶',
        best: '最高 {v}', noBest: '最高 —',
        fmt: { meters: '{n} 米', points: '{n} 分', stars: '★ {n}' }
      },
      hpoint: {
        label: 'H-POINT', aria: 'H-POINT：{n}',
        what: 'H-POINT 通过玩游戏获得，可以在收藏页面兑换可爱的物品。它不是真钱哦！',
        earned: '+{n} H-POINT', spent: '−{n} H-POINT', cost: '{n} H-POINT', total: '累计获得：{n}',
        notEnough: 'H-POINT 还不够……再多玩一会儿吧 ♡', owned: '已经拥有啦！',
        exchange: 'H-POINT 兑换所',
        reason: {
          finish: '完成游戏奖励', record: '新纪录奖励', achievement: '成就奖励',
          secret: '秘密奖励', gift: '礼物'
        }
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      common: {
        brand: 'HAMIN GAMES',
        tagline: '♡ Hamin の小さなミニゲームワールド ♡',
        skip: '本文へスキップ',
        close: '閉じる', ok: 'OK', cancel: 'キャンセル', yes: 'はい', no: 'いいえ',
        confirm: '本当にいいですか？',
        back: '戻る', play: 'プレイ', start: 'スタート', next: '次へ', prev: '前へ',
        loading: '読み込み中…', new: 'NEW!', hot: 'HOT!', soon: '準備中',
        locked: 'ロック中', owned: '所持中', buy: '交換',
        on: 'オン', off: 'オフ', auto: '自動',
        language: 'LANGUAGE', languageGroup: '言語を選ぶ',
        settings: '設定', sound: 'サウンド', soundOn: 'サウンド：オン', soundOff: 'サウンド：オフ',
        help: 'ヘルプ', menu: 'メニュー',
        storageMemory: 'このブラウザモードでは保存できません。タブを閉じるまで進行状況は残ります。',
        storageCorrupt: 'セーブデータが読み込めなかったので、新しく始めました。（バックアップは保管してあります）',
        storageFuture: '新しいバージョンのセーブデータなので、新しく始めました。（バックアップは保管してあります）',
        storageFull: 'ブラウザの保存容量がいっぱいなので、今は保存できません。',
        imageMissing: '画像準備中'
      },
      nav: {
        label: 'メインメニュー', tabbar: 'クイックメニュー',
        home: 'ホーム', game: 'ゲーム', photo: 'プリクラ', collection: 'コレクション', myRoom: 'マイルーム'
      },
      footer: {
        disclaimer: 'ファンメイド · 非公式 · 非営利 · SMエンタテインメントとは無関係です',
        love: 'BEST VIEWED WITH LOVE ♡',
        visitor: 'あなたは {n} 人目の訪問者です ♡',
        visitorLucky: 'ラッキーナンバー 0524！✨',
        clock: '現在時刻',
        sheep: '小さなひつじ',
        note: 'アカウント不要 · 個人情報なし · 進行状況はこのブラウザだけに保存されます',
        art: 'キャラクターはすべてファンによるオリジナルイラストです。公式の写真・ロゴ・音楽は使用していません。'
      },
      settings: {
        open: '設定を開く', title: '設定',
        language: '言語', sound: 'サウンド', display: '表示', saveData: 'セーブデータ',
        music: 'BGM', sfx: '効果音', mute: 'すべての音をミュート', volume: '{n}%',
        motion: '動きを減らす', motionAuto: '自動', motionOn: 'オン', motionOff: 'オフ',
        motionHint: '「自動」は端末の設定に合わせます。',
        sparkles: 'カーソルのキラキラ',
        saveNote: '進行状況はこのブラウザだけに保存されます。別のブラウザに移すときはバックアップファイルを書き出してください。',
        export: 'セーブを書き出す', import: 'セーブを読み込む', reset: '進行状況をリセット',
        exportOk: 'セーブファイルをダウンロードしました ♡', exportFail: 'セーブファイルをダウンロードできませんでした。',
        importConfirmTitle: 'セーブを読み込みますか？',
        importConfirmText: '今の進行状況は読み込んだデータに置き換わります。続けますか？',
        importOk: '読み込み完了！再読み込みします…', importOkMemory: 'このタブで読み込みました。',
        importError: {
          parse: '正しいセーブファイルではありません。',
          invalid: 'HAMIN GAMES のセーブファイルではないようです。',
          newer: '新しいバージョンのセーブファイルなので、ここでは読み込めません。',
          size: 'セーブファイルにしては大きすぎます。',
          read: 'ファイルを読み込めませんでした。'
        },
        resetConfirmTitle: '進行状況をリセットしますか？',
        resetConfirmText: 'H-POINT、アイテム、思い出、記録がすべて消えます。言語とサウンドの設定はそのままです。元には戻せません！',
        resetOk: 'リセットしました。最初から始めます…'
      },
      popup: {
        close: '閉じる', region: 'お知らせ',
        unlock: { title: 'アイテムGET!' },
        memory: { title: '新しい思い出 ♡' },
        achievement: { title: '実績解除！' },
        record: { title: '新記録！', text: '{game}：{score}' },
        secret: { title: 'ひみつ発見！', text: 'かくれたひみつを見つけました！+{n} H-POINT' },
        hpoint: { title: 'H-POINT GET!' },
        reward: '+{n} H-POINT',
        more: '…ほかに {n} 個！コレクションをチェックしてね ♡'
      },
      shell: {
        back: '戻る', backLabel: 'HAMIN GAMES のホームに戻る',
        help: 'ヘルプ', helpTitle: 'あそびかた', noHelp: '自分のペースで楽しんでね ♡',
        sound: 'サウンド', fullscreen: '全画面', exitFullscreen: '全画面を終了',
        pause: 'ポーズ', paused: 'ポーズ中', resume: 'つづける', restart: 'やりなおす', quit: 'やめる',
        start: 'スタート', play: 'プレイ', playAgain: 'もう一回', tryAgain: 'もう一度チャレンジ',
        menu: 'メニュー', backToMenu: 'メニューへ', home: 'ホーム',
        ready: 'READY?', go: 'GO!', loading: '読み込み中…',
        results: 'リザルト', clear: 'クリア！', gameOver: 'ゲームオーバー', timeUp: 'タイムアップ！', finish: 'おしまい！',
        score: 'スコア', best: 'ベスト', newRecord: '新記録！', rank: 'ランク', time: 'タイム',
        combo: 'コンボ', maxCombo: '最大コンボ', lives: 'ライフ', level: 'レベル', stage: 'ステージ', distance: 'きょり',
        perfect: 'PERFECT!', great: 'GREAT!', good: 'GOOD', miss: 'MISS',
        earned: '+{n} H-POINT', stars: '星3つ中 {n}つ', unlocked: 'アンロック！',
        tutorial: 'あそびかた', gotIt: 'わかった！', dontShow: '次から表示しない',
        controls: '操作方法', keyboard: 'キーボード', touch: 'タッチ', mouse: 'マウス',
        pauseHint: 'P か Esc キーでポーズ',
        btnLeft: '左', btnRight: '右', btnUp: '上', btnDown: '下',
        btnJump: 'ジャンプ', btnSlide: 'スライド', btnAction: 'アクション',
        rotate: 'スマホを横向きにすると画面が大きくなるよ！'
      },
      games: {
        dressUp: { title: 'Hamin 着せ替え', desc: '服・ヘア・小物を組み合わせて、スタイルチャレンジをクリアしよう！' },
        photoBooth: { title: 'Hamin プリクラ', desc: 'ポーズ・フレーム・かわいいスタンプを選んで、自分だけのプリクラを作ろう！' },
        runHamin: { title: 'Hamin、逃げて！', desc: '子犬が遊ぼうと追いかけてくる！走って障害物をジャンプ、おやつを集めよう！' },
        lunchTime: { title: 'Hamin のランチタイム', desc: '時間内にかんぺきなランチを作ろう。コンボをつなげて Hamin をにっこりさせてね！' },
        practiceRoom: { title: 'Hamin 練習室', desc: 'リズムに合わせてノーツをたたいて、ステージの準備をしよう！' },
        myRoom: { title: 'Hamin の部屋', desc: '集めたアイテムで Hamin のおへやをかわいく飾ろう。' },
        soonPicnic: { title: 'Hamin のピクニック' },
        soonBand: { title: 'Hamin バンド' },
        soonSnow: { title: '雪の日' },
        soon: { desc: 'もうすぐ登場…楽しみに待っててね ♡' },
        comingSoon: '準備中', play: 'プレイ ▶',
        best: 'ベスト {v}', noBest: 'ベスト —',
        fmt: { meters: '{n}m', points: '{n}点', stars: '★ {n}' }
      },
      hpoint: {
        label: 'H-POINT', aria: 'H-POINT：{n}',
        what: 'H-POINT はゲームをあそぶとたまります。コレクションでかわいいアイテムと交換できます。本物のお金ではありません！',
        earned: '+{n} H-POINT', spent: '−{n} H-POINT', cost: '{n} H-POINT', total: '累計獲得：{n}',
        notEnough: 'H-POINT がまだ足りません…もう少しあそんでみよう ♡', owned: 'もう持っています！',
        exchange: 'H-POINT 交換所',
        reason: {
          finish: 'ゲームクリアボーナス', record: '新記録ボーナス', achievement: '実績ボーナス',
          secret: 'ひみつボーナス', gift: 'プレゼント'
        }
      }
    }
  };

  HG.addStrings(STRINGS);
})(window.HG = window.HG || {});
