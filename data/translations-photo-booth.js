/* HAMIN GAMES — Photo Booth page strings (docs/CONTRACT.md §3.3)
   Namespace: photo.*  (photo-booth.html / js/photo-booth.js)
   Game name comes from games.photoBooth.title (data/translations.js); item, category and hint
   names from data/translations-items.js. Every language block has exactly the same keys
   (check: node tools/check-i18n.js). "HAMIN GAMES", "H-POINT" and "Hamin" are never translated.
   Text drawn INTO the exported photo (brand, date, REC, clock) is language-neutral on purpose.

   Loading: runs before js/i18n.js; data/translations.js installs a queueing HG.addStrings shim. */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      photo: {
        docTitle: 'HAMIN PHOTO BOOTH ♡ HAMIN GAMES',
        sign: '♡ PHOTO BOOTH ♡',
        slot: 'PHOTO ▼',
        steps: 'Photo steps',
        stepTitle: 'STEP {n} ♡ {title}',
        chosen: '{name} selected',
        step: { look: 'LOOK', pose: 'POSE', bg: 'BG', frame: 'FRAME', stickers: 'STICKER', doodle: 'DOODLE', text: 'TEXT', save: 'SAVE' },
        title: {
          look: 'CHOOSE A LOOK', pose: 'POSE & FACE', bg: 'BACKGROUND', frame: 'FRAME',
          stickers: 'STICKERS', doodle: 'DOODLE PEN', text: 'TEXT & DATE', save: 'PRINT & SAVE'
        },
        nav: { prev: 'PREV', next: 'NEXT', toSave: 'TO SAVE', pos: '{n} / {total}' },
        canvas: {
          role: 'photo editor',
          help: 'Photo editor. Click or tap the photo to edit it. Keys: Enter picks the next sticker, arrows move it, plus and minus resize, square brackets turn it, Delete removes, Escape deselects.',
          summary: '{frame} photo, {n} stickers'
        },
        look: {
          lead: 'Which Hamin look goes in the photo today? ♡',
          current: 'MY DRESS UP LOOK',
          sent: 'SENT FROM DRESS UP',
          saved: 'LOOK {n}',
          sentToast: 'Your look from Dress Up arrived in the booth ♡',
          noSaved: 'Looks you save in Dress Up will show up here too ♡',
          toDressUp: 'Make a new look in Dress Up ▶'
        },
        pose: {
          lead: 'Pick a pose card — the first one wears your own look!',
          framing: 'FRAMING',
          face: 'FACE',
          faceNote: 'Faces change only with the first card (your own look).',
          mirror: 'MIRROR',
          fourCut: '4-cut strips mix faces and framing for every shot automatically ♡',
          missing: 'That pose picture is still being drawn, so your look stands in ♡'
        },
        crop: { full: 'FULL', upper: 'UPPER', bust: 'BUST' },
        expr: {
          neutral: 'Calm', smile: 'Smile', big: 'Big smile', sheep: 'Sheep', surprised: 'Wow!',
          focused: 'Focus', wink: 'Wink', pout: 'Pout', eating: 'Yum'
        },
        bg: { lead: 'Where should the photo be taken? ♡' },
        frame: { lead: 'Choose a frame. The size of the saved picture is under each one.' },
        sticker: {
          lead: 'Tap a sticker to put it on the photo ♡',
          cats: 'Sticker categories',
          palette: 'Stickers',
          add: 'Add {name}',
          added: '{name} added',
          removed: '{name} removed',
          selected: '{name} selected',
          full: 'That’s the sticker limit ({n})! Remove some first ♡',
          count: 'STICKERS {n}',
          clear: 'CLEAR ALL',
          clearTitle: 'REMOVE ALL STICKERS?',
          clearText: 'Every sticker on this photo will be removed.',
          cleared: 'All stickers removed',
          howto: 'Drag to move · pull the round ↻ handle to resize and turn · tap ✕ to remove. On touch screens you can pinch with two fingers.'
        },
        doodle: {
          lead: 'Draw right on the photo! The eraser only erases your pen lines.',
          pens: 'PEN',
          glow: 'GLOW',
          glowHint: 'Glow pen: a white line with a halo in the chosen colour',
          size: 'SIZE', sizeS: 'S', sizeM: 'M', sizeL: 'L',
          eraser: 'ERASER',
          undo: 'UNDO',
          clear: 'CLEAR',
          clearTitle: 'ERASE ALL DOODLES?',
          clearText: 'Every pen line will be erased. Stickers and text stay.',
          cleared: 'Doodles erased',
          undone: 'Last line taken back',
          howto: 'Pick a colour, then draw on the photo with your finger or mouse. Ctrl+Z also undoes.'
        },
        color: { pink: 'Pink', blue: 'Blue', mint: 'Mint', orange: 'Orange', purple: 'Purple', ink: 'Dark', white: 'White' },
        text: {
          lead: 'Write a short message, then drag it anywhere ♡',
          label: 'MY TEXT',
          placeholder: 'e.g. best day ♡',
          count: '{n}/{max}',
          color: 'COLOR',
          date: 'DATE STAMP',
          dateOff: 'OFF', dateFilm: 'FILM', dateCute: 'CUTE',
          dateNote: 'Today’s date is stamped in the corner.',
          removed: 'Text removed',
          howto: 'Resize and turn the text with the ↻ handle or the buttons under the photo.'
        },
        tools: {
          label: 'Photo tools',
          forward: 'FRONT', back: 'BACK', smaller: 'SMALLER', bigger: 'BIGGER',
          rotL: 'TURN LEFT', rotR: 'TURN RIGHT', delete: 'DELETE',
          movedForward: 'Moved to the front',
          movedBack: 'Moved behind',
          isFront: 'Already on top',
          isBack: 'Already at the back',
          nothing: 'Nothing to select yet',
          hintStickers: 'Pick a sticker from the list, then drag it on the photo ♡',
          hintText: 'Type your text, then drag it on the photo ♡',
          hintSave: 'All set? Press PRINT ♡',
          hintView: 'Photo preview ♡ Choose your options step by step.'
        },
        lock: {
          title: 'LOCKED ♡',
          exchange: 'EXCHANGE ({cost})',
          wallet: 'You have {n} H-POINT',
          need: 'You need {n} more H-POINT — keep playing ♡',
          notMoney: 'H-POINT is a game point, not real money.',
          play: 'PLAY',
          priceLabel: 'Locked: {cost} H-POINT',
          hintLabel: 'Locked: {hint}',
          failed: 'This item could not be unlocked.'
        },
        save: {
          lead: 'All done? Press PRINT to make your sticker photo ♡',
          print: 'PRINT ♡',
          printAgain: 'PRINT AGAIN',
          printing: 'PRINTING…',
          printingTitle: 'PRINT.exe',
          smile: 'Smile! 3, 2, 1…',
          cheese: 'CHEESE!',
          done: 'Your photo is printed! +{n} H-POINT',
          same: 'This photo is already printed ♡ You can download it again below.',
          title: 'PRINTED! ♡',
          alt: 'Your finished Hamin sticker photo',
          download: 'DOWNLOAD PNG',
          downloading: 'Saving your photo… ♡',
          earned: '+{n} H-POINT',
          unlocked: 'UNLOCKED!',
          edit: 'EDIT MORE',
          newPhoto: 'NEW PHOTO',
          mobileTip: 'On a phone you can also press and hold the picture to save it.',
          note: 'Every new photo gives +50 H-POINT, and your latest one appears in Hamin’s Room ♡',
          taint: 'Saving pictures works on the website (or a local web server). When the page is opened straight from a file, the browser blocks it for safety ♡',
          error: 'Oops, the photo could not be saved. Please try again ♡'
        },
        summary: { look: 'LOOK', pose: 'POSE', bg: 'BACKGROUND', frame: 'FRAME', stickers: 'STICKERS', size: 'SIZE' },
        new: {
          title: 'START A NEW PHOTO?',
          text: 'The stickers, doodles and text on this photo will be cleared (it isn’t printed yet).',
          ok: 'NEW PHOTO',
          done: 'Fresh start! Choose a look ♡'
        },
        help: 'Make your own sticker photo in 8 little steps ♡\n' +
          '1 LOOK — your Dress Up look, a look sent from Dress Up, or a saved look.\n' +
          '2 POSE — a pose card, FULL / UPPER / BUST framing, a face and MIRROR.\n' +
          '3 BACKGROUND and 4 FRAME — 4-cut strip, instant photo, photocard, square or retro webcam.\n' +
          '5 STICKERS — tap to add. Drag to move, pull the round ↻ handle to resize and turn, tap ✕ to remove. Pinch with two fingers on touch screens.\n' +
          '6 DOODLE — six pens plus the GLOW pen. The eraser only erases doodles; UNDO takes back the last line.\n' +
          '7 TEXT/DATE — up to 16 characters you can drag anywhere, plus a date stamp.\n' +
          '8 SAVE — press PRINT, then DOWNLOAD PNG. Every new photo gives +50 H-POINT.\n' +
          'Keyboard (focus the photo first): Enter = next sticker · arrows = move (Shift = faster) · + / − = size · [ ] = turn · Delete = remove · Esc = deselect · Ctrl+Z = undo a doodle.\n' +
          'Locked items tell you how to unlock them. H-POINT is a game point, not money ♡'
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      photo: {
        docTitle: '하민 포토부스 ♡ HAMIN GAMES',
        sign: '♡ 포토부스 ♡',
        slot: '사진 ▼',
        steps: '사진 만들기 단계',
        stepTitle: '{n}단계 ♡ {title}',
        chosen: '{name} 선택!',
        step: { look: '룩', pose: '포즈', bg: '배경', frame: '프레임', stickers: '스티커', doodle: '낙서', text: '글씨', save: '저장' },
        title: {
          look: '룩 고르기', pose: '포즈 & 표정', bg: '배경 고르기', frame: '프레임 고르기',
          stickers: '스티커 꾸미기', doodle: '낙서 펜', text: '글씨 & 날짜', save: '인쇄 & 저장'
        },
        nav: { prev: '이전', next: '다음', toSave: '저장하러', pos: '{n} / {total}' },
        canvas: {
          role: '사진 편집기',
          help: '사진 편집기예요. 사진을 클릭하거나 터치해서 꾸며요. 키보드: Enter는 다음 스티커 선택, 방향키는 이동, +와 -는 크기, 대괄호는 회전, Delete는 삭제, Esc는 선택 해제.',
          summary: '{frame} 사진, 스티커 {n}개'
        },
        look: {
          lead: '오늘 사진은 어떤 하민 룩으로 찍을까요? ♡',
          current: '내 드레스업 룩',
          sent: '드레스업에서 온 룩',
          saved: '룩 {n}',
          sentToast: '드레스업에서 보낸 룩이 포토부스에 도착했어요 ♡',
          noSaved: '드레스업에서 저장한 룩도 여기에 나와요 ♡',
          toDressUp: '드레스업에서 새 룩 만들기 ▶'
        },
        pose: {
          lead: '포즈 카드를 골라요. 첫 번째 카드는 내가 코디한 룩이에요!',
          framing: '구도',
          face: '표정',
          faceNote: '표정은 첫 번째 카드(내 룩)에서만 바꿀 수 있어요.',
          mirror: '좌우 반전',
          fourCut: '네컷 프레임은 컷마다 표정과 구도가 자동으로 바뀌어요 ♡',
          missing: '그 포즈 그림은 아직 그리는 중이라 내 룩으로 대신 찍어요 ♡'
        },
        crop: { full: '전신', upper: '상반신', bust: '얼굴' },
        expr: {
          neutral: '차분', smile: '미소', big: '활짝', sheep: '양 미소', surprised: '깜짝',
          focused: '집중', wink: '윙크', pout: '뾰로통', eating: '냠냠'
        },
        bg: { lead: '어디에서 찍을까요? ♡' },
        frame: { lead: '프레임을 골라요. 저장되는 사진 크기가 아래에 적혀 있어요.' },
        sticker: {
          lead: '스티커를 누르면 사진에 붙어요 ♡',
          cats: '스티커 종류',
          palette: '스티커',
          add: '{name} 붙이기',
          added: '{name} 붙였어요',
          removed: '{name} 뗐어요',
          selected: '{name} 선택됨',
          full: '스티커는 {n}개까지 붙일 수 있어요! 몇 개 떼고 붙여 주세요 ♡',
          count: '스티커 {n}개',
          clear: '모두 떼기',
          clearTitle: '스티커를 모두 뗄까요?',
          clearText: '이 사진에 붙인 스티커가 모두 사라져요.',
          cleared: '스티커를 모두 뗐어요',
          howto: '끌어서 이동 · 동그란 ↻ 손잡이로 크기와 회전 · ✕로 삭제. 터치 화면에서는 두 손가락으로 늘이고 돌릴 수 있어요.'
        },
        doodle: {
          lead: '사진 위에 바로 그려요! 지우개는 펜 그림만 지워요.',
          pens: '펜',
          glow: '반짝',
          glowHint: '반짝 펜: 고른 색으로 빛나는 하얀 선',
          size: '굵기', sizeS: '가늘게', sizeM: '보통', sizeL: '굵게',
          eraser: '지우개',
          undo: '되돌리기',
          clear: '다 지우기',
          clearTitle: '낙서를 모두 지울까요?',
          clearText: '펜으로 그린 선이 모두 지워져요. 스티커와 글씨는 그대로예요.',
          cleared: '낙서를 모두 지웠어요',
          undone: '마지막 선을 되돌렸어요',
          howto: '색을 고르고 손가락이나 마우스로 사진 위에 그려요. Ctrl+Z로도 되돌릴 수 있어요.'
        },
        color: { pink: '분홍', blue: '파랑', mint: '민트', orange: '주황', purple: '보라', ink: '먹색', white: '흰색' },
        text: {
          lead: '짧은 한마디를 쓰고 원하는 곳으로 옮겨요 ♡',
          label: '내 글씨',
          placeholder: '예: 오늘 최고 ♡',
          count: '{n}/{max}',
          color: '색',
          date: '날짜 도장',
          dateOff: '없음', dateFilm: '필름', dateCute: '귀엽게',
          dateNote: '오늘 날짜가 구석에 찍혀요.',
          removed: '글씨를 지웠어요',
          howto: '↻ 손잡이나 사진 아래 버튼으로 글씨 크기와 각도를 바꿔요.'
        },
        tools: {
          label: '사진 도구',
          forward: '앞으로', back: '뒤로', smaller: '작게', bigger: '크게',
          rotL: '왼쪽 회전', rotR: '오른쪽 회전', delete: '삭제',
          movedForward: '맨 앞으로 옮겼어요',
          movedBack: '뒤로 옮겼어요',
          isFront: '이미 맨 앞이에요',
          isBack: '이미 맨 뒤예요',
          nothing: '아직 고를 게 없어요',
          hintStickers: '목록에서 스티커를 고르고 사진 위에서 끌어 옮겨요 ♡',
          hintText: '글씨를 쓰고 사진 위에서 끌어 옮겨요 ♡',
          hintSave: '준비됐나요? 인쇄를 눌러요 ♡',
          hintView: '사진 미리보기 ♡ 한 단계씩 골라 보세요.'
        },
        lock: {
          title: '잠겨 있어요 ♡',
          exchange: '교환 ({cost})',
          wallet: '내 H-POINT: {n}',
          need: 'H-POINT가 {n} 더 필요해요. 조금만 더 놀아요 ♡',
          notMoney: 'H-POINT는 게임 포인트예요. 진짜 돈이 아니에요.',
          play: '게임',
          priceLabel: '잠김: {cost} H-POINT',
          hintLabel: '잠김: {hint}',
          failed: '이 아이템을 열 수 없었어요.'
        },
        save: {
          lead: '다 꾸몄나요? 인쇄를 눌러 스티커 사진을 만들어요 ♡',
          print: '인쇄하기 ♡',
          printAgain: '다시 인쇄',
          printing: '인쇄 중…',
          printingTitle: 'PRINT.exe',
          smile: '웃어요! 3, 2, 1…',
          cheese: '김치~!',
          done: '사진이 나왔어요! +{n} H-POINT',
          same: '이미 인쇄한 사진이에요 ♡ 아래에서 다시 저장할 수 있어요.',
          title: '인쇄 완료! ♡',
          alt: '완성된 하민 스티커 사진',
          download: 'PNG 저장',
          downloading: '사진을 저장하고 있어요… ♡',
          earned: '+{n} H-POINT',
          unlocked: '해금!',
          edit: '더 꾸미기',
          newPhoto: '새 사진',
          mobileTip: '휴대폰에서는 사진을 길게 눌러서 저장할 수도 있어요.',
          note: '새 사진을 만들 때마다 +50 H-POINT! 가장 최근 사진은 하민의 방에 걸려요 ♡',
          taint: '사진 저장은 웹사이트(또는 로컬 웹 서버)에서 돼요. 파일을 바로 열면 브라우저가 안전을 위해 막아요 ♡',
          error: '앗, 사진을 저장하지 못했어요. 다시 해 볼까요? ♡'
        },
        summary: { look: '룩', pose: '포즈', bg: '배경', frame: '프레임', stickers: '스티커', size: '크기' },
        new: {
          title: '새 사진을 만들까요?',
          text: '아직 인쇄하지 않은 사진의 스티커, 낙서, 글씨가 모두 지워져요.',
          ok: '새 사진',
          done: '새로 시작! 룩을 골라요 ♡'
        },
        help: '8단계로 나만의 스티커 사진을 만들어요 ♡\n' +
          '1 룩 — 내 드레스업 룩, 드레스업에서 보낸 룩, 저장한 룩 중에서 골라요.\n' +
          '2 포즈 — 포즈 카드, 전신 / 상반신 / 얼굴 구도, 표정, 좌우 반전.\n' +
          '3 배경, 4 프레임 — 네컷, 폴라로이드, 포토카드, 정사각형, 레트로 웹캠.\n' +
          '5 스티커 — 누르면 붙어요. 끌어서 이동, 동그란 ↻ 손잡이로 크기와 회전, ✕로 삭제. 터치 화면은 두 손가락으로도 돼요.\n' +
          '6 낙서 — 펜 6색과 반짝 펜. 지우개는 낙서만 지우고, 되돌리기는 마지막 선을 취소해요.\n' +
          '7 글씨/날짜 — 16글자까지 쓰고 끌어서 옮겨요. 날짜 도장도 찍을 수 있어요.\n' +
          '8 저장 — 인쇄하기를 누른 뒤 PNG 저장. 새 사진마다 +50 H-POINT!\n' +
          '키보드(먼저 사진을 선택): Enter = 다음 스티커 · 방향키 = 이동(Shift는 빠르게) · + / − = 크기 · [ ] = 회전 · Delete = 삭제 · Esc = 선택 해제 · Ctrl+Z = 낙서 되돌리기.\n' +
          '잠긴 아이템은 여는 방법을 알려 줘요. H-POINT는 게임 포인트예요, 돈이 아니에요 ♡'
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      photo: {
        docTitle: 'Hamin 大头贴 ♡ HAMIN GAMES',
        sign: '♡ 大头贴机 ♡',
        slot: '出片口 ▼',
        steps: '制作步骤',
        stepTitle: '第{n}步 ♡ {title}',
        chosen: '已选择 {name}',
        step: { look: '造型', pose: '姿势', bg: '背景', frame: '相框', stickers: '贴纸', doodle: '涂鸦', text: '文字', save: '保存' },
        title: {
          look: '选择造型', pose: '姿势和表情', bg: '选择背景', frame: '选择相框',
          stickers: '贴纸装饰', doodle: '涂鸦笔', text: '文字和日期', save: '打印和保存'
        },
        nav: { prev: '上一步', next: '下一步', toSave: '去保存', pos: '{n} / {total}' },
        canvas: {
          role: '照片编辑器',
          help: '照片编辑器。点击或轻触照片来装饰。键盘：Enter 选择下一张贴纸，方向键移动，加号和减号调大小，方括号旋转，Delete 删除，Esc 取消选择。',
          summary: '{frame} 照片，{n} 张贴纸'
        },
        look: {
          lead: '今天用哪套 Hamin 造型拍照呢？♡',
          current: '我的换装造型',
          sent: '换装送来的造型',
          saved: '造型 {n}',
          sentToast: '换装送来的造型已经到大头贴机啦 ♡',
          noSaved: '在换装里保存的造型也会显示在这里 ♡',
          toDressUp: '去换装做新造型 ▶'
        },
        pose: {
          lead: '选一张姿势卡，第一张穿的是你搭配的造型！',
          framing: '取景',
          face: '表情',
          faceNote: '只有第一张卡（你的造型）可以换表情。',
          mirror: '镜像',
          fourCut: '四格相框的每一格会自动换表情和取景 ♡',
          missing: '这个姿势图还在绘制中，先用你的造型代替 ♡'
        },
        crop: { full: '全身', upper: '半身', bust: '特写' },
        expr: {
          neutral: '平静', smile: '微笑', big: '大笑', sheep: '小羊笑', surprised: '惊讶',
          focused: '专注', wink: '眨眼', pout: '嘟嘴', eating: '吃吃'
        },
        bg: { lead: '要在哪里拍呢？♡' },
        frame: { lead: '选择相框。下面写着保存的图片尺寸。' },
        sticker: {
          lead: '点一下贴纸就能贴到照片上 ♡',
          cats: '贴纸分类',
          palette: '贴纸',
          add: '添加{name}',
          added: '已添加{name}',
          removed: '已移除{name}',
          selected: '已选中{name}',
          full: '最多只能贴 {n} 张！先撕掉几张吧 ♡',
          count: '贴纸 {n}',
          clear: '全部清除',
          clearTitle: '清除所有贴纸？',
          clearText: '这张照片上的贴纸会全部移除。',
          cleared: '已清除所有贴纸',
          howto: '拖动来移动 · 拉圆形 ↻ 手柄可缩放和旋转 · 点 ✕ 删除。触屏上可以用两根手指缩放。'
        },
        doodle: {
          lead: '直接在照片上画吧！橡皮擦只会擦掉画笔的线。',
          pens: '画笔',
          glow: '荧光',
          glowHint: '荧光笔：带有所选颜色光晕的白线',
          size: '粗细', sizeS: '细', sizeM: '中', sizeL: '粗',
          eraser: '橡皮擦',
          undo: '撤销',
          clear: '全部擦除',
          clearTitle: '擦除所有涂鸦？',
          clearText: '画笔的线会全部擦掉，贴纸和文字会保留。',
          cleared: '涂鸦已擦除',
          undone: '已撤销最后一笔',
          howto: '选好颜色，用手指或鼠标在照片上画。也可以按 Ctrl+Z 撤销。'
        },
        color: { pink: '粉色', blue: '蓝色', mint: '薄荷绿', orange: '橙色', purple: '紫色', ink: '墨色', white: '白色' },
        text: {
          lead: '写一句短短的话，再拖到喜欢的位置 ♡',
          label: '我的文字',
          placeholder: '例：今天超开心 ♡',
          count: '{n}/{max}',
          color: '颜色',
          date: '日期章',
          dateOff: '关', dateFilm: '胶片', dateCute: '可爱',
          dateNote: '今天的日期会印在角落。',
          removed: '已删除文字',
          howto: '用 ↻ 手柄或照片下方的按钮调整文字大小和角度。'
        },
        tools: {
          label: '照片工具',
          forward: '上移', back: '下移', smaller: '缩小', bigger: '放大',
          rotL: '向左转', rotR: '向右转', delete: '删除',
          movedForward: '已移到前面',
          movedBack: '已移到后面',
          isFront: '已经在最前面',
          isBack: '已经在最后面',
          nothing: '还没有可以选择的东西',
          hintStickers: '从列表里选贴纸，再在照片上拖动 ♡',
          hintText: '输入文字，再在照片上拖动 ♡',
          hintSave: '准备好了吗？按打印 ♡',
          hintView: '照片预览 ♡ 一步一步来选择吧。'
        },
        lock: {
          title: '尚未解锁 ♡',
          exchange: '兑换（{cost}）',
          wallet: '现有 H-POINT：{n}',
          need: '还差 {n} H-POINT，再多玩一会儿吧 ♡',
          notMoney: 'H-POINT 是游戏积分，不是真的钱。',
          play: '游戏',
          priceLabel: '未解锁：{cost} H-POINT',
          hintLabel: '未解锁：{hint}',
          failed: '无法解锁这个物品。'
        },
        save: {
          lead: '装饰好了吗？按打印做出你的大头贴 ♡',
          print: '打印 ♡',
          printAgain: '再次打印',
          printing: '打印中…',
          printingTitle: 'PRINT.exe',
          smile: '笑一个！3、2、1…',
          cheese: '茄子~！',
          done: '照片打印好啦！+{n} H-POINT',
          same: '这张照片已经打印过了 ♡ 可以在下面再次下载。',
          title: '打印完成！♡',
          alt: '完成的 Hamin 大头贴',
          download: '下载 PNG',
          downloading: '正在保存照片… ♡',
          earned: '+{n} H-POINT',
          unlocked: '已解锁！',
          edit: '继续装饰',
          newPhoto: '新照片',
          mobileTip: '在手机上也可以长按图片来保存。',
          note: '每张新照片 +50 H-POINT，最新的一张会出现在 Hamin 的房间里 ♡',
          taint: '保存图片需要在网站上（或本地网页服务器）使用。直接打开文件时，浏览器会为了安全阻止保存 ♡',
          error: '哎呀，照片没能保存。再试一次吧 ♡'
        },
        summary: { look: '造型', pose: '姿势', bg: '背景', frame: '相框', stickers: '贴纸', size: '尺寸' },
        new: {
          title: '开始新照片？',
          text: '这张还没打印的照片上的贴纸、涂鸦和文字都会被清除。',
          ok: '新照片',
          done: '重新开始！选择造型吧 ♡'
        },
        help: '只要 8 步就能做出专属大头贴 ♡\n' +
          '1 造型 — 我的换装造型、换装送来的造型或保存的造型。\n' +
          '2 姿势 — 姿势卡、全身 / 半身 / 特写取景、表情和镜像。\n' +
          '3 背景、4 相框 — 四格、拍立得、小卡、方形或复古摄像头。\n' +
          '5 贴纸 — 点一下就贴上。拖动移动，拉圆形 ↻ 手柄缩放和旋转，点 ✕ 删除。触屏可用两根手指操作。\n' +
          '6 涂鸦 — 6 色画笔和荧光笔。橡皮擦只擦涂鸦，撤销会取消最后一笔。\n' +
          '7 文字/日期 — 最多 16 个字，可以随意拖动，还能盖日期章。\n' +
          '8 保存 — 按打印，再下载 PNG。每张新照片 +50 H-POINT！\n' +
          '键盘（先选中照片）：Enter = 下一张贴纸 · 方向键 = 移动（Shift 更快）· + / − = 大小 · [ ] = 旋转 · Delete = 删除 · Esc = 取消选择 · Ctrl+Z = 撤销涂鸦。\n' +
          '未解锁的物品会告诉你解锁方法。H-POINT 是游戏积分，不是钱 ♡'
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      photo: {
        docTitle: 'Hamin プリクラ ♡ HAMIN GAMES',
        sign: '♡ プリクラ ♡',
        slot: 'とりだし口 ▼',
        steps: '作成ステップ',
        stepTitle: 'STEP {n} ♡ {title}',
        chosen: '{name} をえらんだよ',
        step: { look: 'ルック', pose: 'ポーズ', bg: '背景', frame: 'フレーム', stickers: 'スタンプ', doodle: 'らくがき', text: '文字', save: '保存' },
        title: {
          look: 'ルックをえらぶ', pose: 'ポーズ＆表情', bg: '背景をえらぶ', frame: 'フレームをえらぶ',
          stickers: 'スタンプでデコ', doodle: 'らくがきペン', text: '文字＆日付', save: 'プリント＆保存'
        },
        nav: { prev: 'もどる', next: 'つぎへ', toSave: '保存へ', pos: '{n} / {total}' },
        canvas: {
          role: 'フォト編集',
          help: 'フォト編集画面です。写真をクリックかタップしてデコします。キー操作：Enterでつぎのスタンプを選択、矢印キーで移動、プラスとマイナスで大きさ、角かっこで回転、Deleteで削除、Escで選択解除。',
          summary: '{frame} の写真、スタンプ {n} 個'
        },
        look: {
          lead: '今日はどのHaminのルックで撮る？♡',
          current: 'いまのコーデ',
          sent: 'ドレスアップから',
          saved: 'ルック {n}',
          sentToast: 'ドレスアップのルックがプリ機にとどいたよ ♡',
          noSaved: 'ドレスアップで保存したルックもここに出るよ ♡',
          toDressUp: 'ドレスアップで新しいルックを作る ▶'
        },
        pose: {
          lead: 'ポーズカードをえらんでね。1枚目は自分のコーデで撮れるよ！',
          framing: '構図',
          face: '表情',
          faceNote: '表情は1枚目のカード（自分のルック）だけ変えられるよ。',
          mirror: '左右反転',
          fourCut: '4コマフレームは1コマごとに表情と構図が自動で変わるよ ♡',
          missing: 'そのポーズの絵はまだ描いている途中なので、自分のルックで撮るね ♡'
        },
        crop: { full: '全身', upper: '上半身', bust: 'アップ' },
        expr: {
          neutral: 'ふつう', smile: 'にっこり', big: 'ニコニコ', sheep: 'ひつじ笑顔', surprised: 'びっくり',
          focused: '集中', wink: 'ウインク', pout: 'ぷくー', eating: 'もぐもぐ'
        },
        bg: { lead: 'どこで撮る？♡' },
        frame: { lead: 'フレームをえらんでね。下に保存サイズが書いてあるよ。' },
        sticker: {
          lead: 'スタンプをタップすると写真に貼れるよ ♡',
          cats: 'スタンプの種類',
          palette: 'スタンプ',
          add: '{name}を貼る',
          added: '{name}を貼ったよ',
          removed: '{name}をはがしたよ',
          selected: '{name}を選択中',
          full: 'スタンプは{n}個までだよ！少しはがしてから貼ってね ♡',
          count: 'スタンプ {n}',
          clear: 'ぜんぶはがす',
          clearTitle: 'スタンプをぜんぶはがす？',
          clearText: 'この写真のスタンプがすべてなくなります。',
          cleared: 'スタンプをぜんぶはがしたよ',
          howto: 'ドラッグで移動 ・ 丸い ↻ ハンドルで大きさと向き ・ ✕ で削除。タッチ画面では2本指でも操作できるよ。'
        },
        doodle: {
          lead: '写真にそのまま描いてね！消しゴムはペンの線だけ消すよ。',
          pens: 'ペン',
          glow: 'ネオン',
          glowHint: 'ネオンペン：えらんだ色に光る白い線',
          size: '太さ', sizeS: '細', sizeM: '中', sizeL: '太',
          eraser: '消しゴム',
          undo: 'もどす',
          clear: 'ぜんぶ消す',
          clearTitle: 'らくがきをぜんぶ消す？',
          clearText: 'ペンの線がすべて消えます。スタンプと文字はそのままです。',
          cleared: 'らくがきを消したよ',
          undone: '最後の線をもどしたよ',
          howto: '色をえらんで、指かマウスで写真に描いてね。Ctrl+Z でももどせるよ。'
        },
        color: { pink: 'ピンク', blue: 'ブルー', mint: 'ミント', orange: 'オレンジ', purple: 'むらさき', ink: 'こいいろ', white: 'しろ' },
        text: {
          lead: 'ひとことを書いて、好きな場所にドラッグしてね ♡',
          label: 'メッセージ',
          placeholder: '例：さいこうの日 ♡',
          count: '{n}/{max}',
          color: '色',
          date: '日付スタンプ',
          dateOff: 'なし', dateFilm: 'フィルム', dateCute: 'かわいい',
          dateNote: '今日の日付がすみっこに入るよ。',
          removed: '文字を消したよ',
          howto: '↻ ハンドルか写真の下のボタンで、文字の大きさと角度を変えられるよ。'
        },
        tools: {
          label: 'フォトツール',
          forward: '前へ', back: '後ろへ', smaller: '小さく', bigger: '大きく',
          rotL: '左に回す', rotR: '右に回す', delete: '削除',
          movedForward: '前に動かしたよ',
          movedBack: '後ろに動かしたよ',
          isFront: 'もういちばん前だよ',
          isBack: 'もういちばん後ろだよ',
          nothing: 'まだえらべるものがないよ',
          hintStickers: 'リストからスタンプをえらんで、写真の上でドラッグしてね ♡',
          hintText: '文字を入力して、写真の上でドラッグしてね ♡',
          hintSave: '準備OK？プリントをおしてね ♡',
          hintView: 'プレビュー ♡ ひとつずつえらんでいこう。'
        },
        lock: {
          title: 'ロック中 ♡',
          exchange: '交換（{cost}）',
          wallet: '持っている H-POINT：{n}',
          need: 'あと {n} H-POINT 必要だよ。もう少しあそぼう ♡',
          notMoney: 'H-POINT はゲームのポイントで、本物のお金ではありません。',
          play: 'ゲーム',
          priceLabel: 'ロック中：{cost} H-POINT',
          hintLabel: 'ロック中：{hint}',
          failed: 'このアイテムは解放できませんでした。'
        },
        save: {
          lead: 'デコできた？プリントをおしてプリを作ろう ♡',
          print: 'プリント ♡',
          printAgain: 'もう一度プリント',
          printing: 'プリント中…',
          printingTitle: 'PRINT.exe',
          smile: '笑って！3、2、1…',
          cheese: 'はいチーズ！',
          done: 'プリができたよ！+{n} H-POINT',
          same: 'この写真はもうプリントしたよ ♡ 下からもう一度保存できるよ。',
          title: 'できあがり！♡',
          alt: 'できあがった Hamin のプリ',
          download: 'PNGを保存',
          downloading: '写真を保存中… ♡',
          earned: '+{n} H-POINT',
          unlocked: 'ゲット！',
          edit: 'もっとデコる',
          newPhoto: '新しく撮る',
          mobileTip: 'スマホでは画像を長おしして保存することもできるよ。',
          note: '新しい写真ごとに +50 H-POINT！いちばん新しい写真は Haminの部屋 に飾られるよ ♡',
          taint: '写真の保存はウェブサイト（またはローカルのウェブサーバー）で使えます。ファイルを直接開いたときは、安全のためブラウザが止めてしまいます ♡',
          error: 'あれ、写真を保存できなかったよ。もう一度ためしてね ♡'
        },
        summary: { look: 'ルック', pose: 'ポーズ', bg: '背景', frame: 'フレーム', stickers: 'スタンプ', size: 'サイズ' },
        new: {
          title: '新しい写真を作る？',
          text: 'まだプリントしていない写真のスタンプ・らくがき・文字が消えます。',
          ok: '新しく撮る',
          done: 'リスタート！ルックをえらんでね ♡'
        },
        help: '8つのステップで自分だけのプリを作ろう ♡\n' +
          '1 ルック — いまのコーデ、ドレスアップから送ったルック、保存したルック。\n' +
          '2 ポーズ — ポーズカード、全身 / 上半身 / アップの構図、表情、左右反転。\n' +
          '3 背景、4 フレーム — 4コマ、インスタント、トレカ、スクエア、レトロWebカメラ。\n' +
          '5 スタンプ — タップで貼れるよ。ドラッグで移動、丸い ↻ ハンドルで大きさと向き、✕ で削除。タッチ画面は2本指でもOK。\n' +
          '6 らくがき — 6色のペンとネオンペン。消しゴムはらくがきだけ消えて、もどすで最後の線を取り消せるよ。\n' +
          '7 文字/日付 — 16文字まで書いてドラッグで移動。日付スタンプも入れられるよ。\n' +
          '8 保存 — プリントをおしてから PNG を保存。新しい写真ごとに +50 H-POINT！\n' +
          'キーボード（先に写真をえらぶ）：Enter = つぎのスタンプ ・ 矢印 = 移動（Shiftで速く）・ + / − = 大きさ ・ [ ] = 回転 ・ Delete = 削除 ・ Esc = 選択解除 ・ Ctrl+Z = らくがきをもどす。\n' +
          'ロック中のアイテムは解放のしかたを教えてくれるよ。H-POINT はゲームのポイントで、お金ではありません ♡'
      }
    }
  };

  if (typeof HG.addStrings === 'function') HG.addStrings(STRINGS);
  else (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
})(window.HG = window.HG || {});
