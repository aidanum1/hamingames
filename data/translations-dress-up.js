/* HAMIN GAMES — HAMIN DRESS UP page strings (docs/CONTRACT.md §3.3)
   Namespace: dressUp.*  (dress-up.html / js/dress-up.js)

   Shared names live elsewhere: wardrobe.<id>.name (data/translations-wardrobe.js);
   category.* slot.* tag.* rarity.* challenge.<id>.name|desc hint.* (data/translations-items.js);
   games.dressUp.title, hpoint.* (data/translations.js).
   Every language block has exactly the same keys (check: node tools/check-i18n.js).
   Result lines talk about the styling game only — never about Hamin himself.
   H-POINT is always a game point, never money. "Hamin", "HAMIN GAMES", "H-POINT" stay as is
   (Korean prose writes 하민). */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback) ════════════════ */
    en: {
      dressUp: {
        welcome: 'Click clothes to dress Hamin ♡ Press ? for help!',
        help: 'HAMIN DRESS UP has two modes ♡\n' +
          '👗 FREE DRESS-UP — Pick a drawer in the CLOSET (Hair, Tops, Jackets…) and click an item to wear it. Click it again to take it off. Change the expression in FACE and the room in BACKGROUNDS. Click Hamin in the mirror to say hi!\n' +
          '🏆 STYLE CHALLENGE — Choose a theme, dress Hamin to match and press DONE ♡. Items with the ♡ mark match the theme, the ★ stat counts extra, and some themes have a MUST-HAVE. 3★ clears a challenge, 5★ is PERFECT!\n' +
          '🔒 Locked items unlock by playing the other games, or can be exchanged for H-POINT. H-POINT is only a game point — never real money.\n' +
          '🎲 RANDOM makes a surprise look · ↺ RESET goes back to the starter outfit · 💾 SAVE LOOK keeps up to 12 looks in 📒 MY LOOKS · 📸 PHOTO BOOTH sends your look to the Photo Booth.\n' +
          '⌨ Keyboard: Tab moves between areas, arrow keys move inside the closet drawers and the item grid, Enter or Space wears an item.',
        mode: { label: 'Game mode', free: 'FREE DRESS-UP', challenge: 'STYLE CHALLENGE' },
        brief: {
          freeTitle: 'FREE DRESS-UP ♡',
          free: 'Mix and match anything you like!',
          freeTip: 'TIP: Clear a STYLE CHALLENGE to earn H-POINT and surprises ♡',
          freeTip2: 'TIP: Save your favorite looks and send them to the Photo Booth ♡',
          now: 'NOW',
          best: 'BEST',
          change: 'CHANGE',
          must: 'Must-have',
          noMust: 'No must-haves — free styling!',
          matchTip: '♡ on an item = it matches the theme. The ★ stat counts extra!'
        },
        cats: { title: 'CLOSET ♡', label: 'Clothes categories', face: 'Face' },
        expr: {
          neutral: 'Calm', smile: 'Smile', big: 'Big smile', sheep: 'Sheep smile', surprised: 'Surprised',
          focused: 'Focused', wink: 'Wink', pout: 'Pout', eating: 'Yummy'
        },
        mirror: {
          title: 'MIRROR ♡',
          label: 'Hamin is wearing: {items}.',
          labelBg: 'Background: {bg}.',
          poke: 'Say hi to Hamin ♡',
          zoomIn: 'Zoom in',
          zoomOut: 'Show the full look',
          today: 'TODAY’S STYLE',
          missing: 'Hamin is getting ready…',
          mini: 'Back to the mirror'
        },
        meter: {
          label: 'Style meter', cute: 'CUTE', cool: 'COOL', cozy: 'COZY', stage: 'STAGE', match: 'THEME MATCH',
          aria: '{name}: {n}%'
        },
        closet: {
          count: '{owned}/{total}',
          countLabel: '{owned} of {total} owned',
          none: 'NONE',
          noneLabel: 'Take off: {slot}',
          rare: 'RARE',
          special: 'SP★',
          new: 'NEW',
          match: 'Matches the theme ♡',
          faceNote: 'The 6 extra faces are only for {hair} ♡'
        },
        info: {
          idle: 'Point at an item to see its details ♡',
          owned: 'Click to wear it!',
          wearing: 'Wearing now ♡ Click again to take it off.',
          wearingFixed: 'Wearing now ♡',
          price: 'Unlock for {cost} H-POINT',
          howTo: 'How to unlock: {hint}',
          face: 'Hamin’s face today ♡ Click Hamin in the mirror for a surprise!'
        },
        item: { on: 'wearing', off: 'not wearing' },
        equip: { on: 'Wearing: {name}', off: 'Took off: {name}', face: 'Face: {name}', bg: 'Background: {name}' },
        buy: {
          title: 'UNLOCK ITEM?',
          text: 'Unlock “{name}” for {cost} H-POINT? H-POINT is a game point, not real money ♡',
          ok: 'UNLOCK ♡',
          done: '{name} is yours now! ♡',
          notEnough: 'You need {n} more H-POINT ({cost} in total). Play games to earn more ♡'
        },
        actions: {
          label: 'Dress up actions',
          random: 'RANDOM', reset: 'RESET', save: 'SAVE LOOK', looks: 'MY LOOKS', photo: 'PHOTO BOOTH ♡', done: 'DONE ♡',
          randomS: 'RANDOM', resetS: 'RESET', saveS: 'SAVE', looksS: 'LOOKS', photoS: 'PHOTO', doneS: 'DONE ♡',
          doneLabel: 'Finish styling and see your stars'
        },
        random: { done: 'Surprise style! 🎲' },
        reset: { title: 'RESET OUTFIT?', text: 'Change Hamin back into the starter outfit?', ok: 'RESET', done: 'Back to the starter look ♡' },
        looks: {
          title: 'MY LOOKS ♡',
          count: '{n} / {max} looks saved',
          empty: 'No saved looks yet. Press SAVE LOOK to keep a style you love!',
          lookNo: 'LOOK #{n}',
          wear: 'WEAR',
          wearLabel: 'Wear {look}',
          photoLabel: 'Send {look} to the Photo Booth',
          delLabel: 'Delete {look}',
          del: 'DELETE',
          delTitle: 'DELETE LOOK?',
          delText: 'This saved look will be deleted. Are you sure?',
          deleted: 'Look deleted.',
          saved: 'Look saved! ({n}/{max}) ♡',
          loaded: 'LOOK #{n} is on ♡',
          same: 'This look is already in MY LOOKS ♡',
          fullTitle: 'MY LOOKS IS FULL',
          fullText: 'You can keep up to {max} looks. Replace the oldest one?',
          replace: 'REPLACE'
        },
        photo: { sending: 'Off to the Photo Booth! 📸' },
        challenge: {
          title: 'STYLE CHALLENGE ♡',
          intro: 'Pick a theme, dress Hamin to match and press DONE ♡. 3★ or more clears the challenge!',
          bg: 'Best background: {name}',
          notYet: 'NEW ♡',
          cleared: 'CLEAR',
          stars: '{n} of 5 stars',
          started: 'Challenge: {name}!',
          bgSet: 'Background → {name} ♡'
        },
        req: {
          anyOf: 'Wear a {slots}',
          anyOfOr: 'Wear a {slots} or the {item}',
          tagged: '{slots} with the “{tag}” tag',
          sep: ' or ',
          ok: 'done',
          miss: 'missing'
        },
        result: {
          windowTitle: 'STYLE CHECK ♡',
          t5: 'PERFECT!', t4: 'GREAT!', t3: 'GOOD', t2: 'NICE TRY', t1: 'ONE MORE TRY!',
          stars: '{n} of 5 stars',
          l5: 'The mirror is sparkling! This styling is a perfect match ♡',
          l4: 'So stylish! One more matching piece and it’s perfect ✨',
          l3: 'Challenge clear! This combo really works ♡',
          l2: 'A cute start! Look for items with the ♡ mark.',
          l1: 'The closet has better matches… let’s mix again ♡',
          tip: 'Tip: {tags} pieces score the most — try filling more slots too!',
          mustOk: '✓ Must-have: {req}',
          mustMiss: '✗ Must-have missing: {req} (up to ★★)',
          clear: 'CHALLENGE CLEAR!',
          newBest: 'NEW BEST!',
          earned: '+{n} H-POINT',
          again: 'Same look as last time — change something to earn H-POINT again ♡',
          keep: 'KEEP STYLING',
          other: 'OTHER CHALLENGE',
          save: 'SAVE LOOK',
          announce: '{title} {n} of 5 stars. Theme match {m}%.'
        }
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      dressUp: {
        welcome: '옷을 클릭해서 하민이를 꾸며 주세요 ♡ 도움말은 ? 버튼!',
        help: '하민 옷 입히기에는 두 가지 모드가 있어요 ♡\n' +
          '👗 자유 코디 — 옷장 서랍(헤어, 상의, 재킷…)을 고르고 아이템을 클릭하면 입어요. 한 번 더 클릭하면 벗어요. [표정]에서 표정을, [배경]에서 방을 바꿀 수 있어요. 거울 속 하민이를 클릭해서 인사해 보세요!\n' +
          '🏆 스타일 챌린지 — 테마를 고르고 어울리게 코디한 뒤 [완성 ♡]을 눌러요. ♡ 표시 아이템은 테마에 어울리고, ★ 능력치는 보너스예요. 필수 아이템이 있는 테마도 있어요. ★3개면 클리어, ★5개면 퍼펙트!\n' +
          '🔒 잠긴 아이템은 다른 게임을 플레이하면 열리거나, H-POINT로 교환할 수 있어요. H-POINT는 게임 포인트일 뿐, 진짜 돈이 아니에요.\n' +
          '🎲 랜덤은 깜짝 코디 · ↺ 리셋은 처음 옷으로 · 💾 코디 저장은 [내 코디]에 최대 12개까지 · 📸 포토부스는 지금 코디를 포토부스로 보내요.\n' +
          '⌨ 키보드: Tab으로 영역 이동, 방향키로 서랍과 아이템 사이를 이동, Enter나 Space로 입기.',
        mode: { label: '게임 모드', free: '자유 코디', challenge: '스타일 챌린지' },
        brief: {
          freeTitle: '자유 코디 ♡',
          free: '마음대로 골라 입혀 보세요!',
          freeTip: 'TIP: 스타일 챌린지를 클리어하면 H-POINT와 선물이 있어요 ♡',
          freeTip2: 'TIP: 마음에 드는 코디는 저장해서 포토부스로 보내 보세요 ♡',
          now: 'NOW',
          best: 'BEST',
          change: '변경',
          must: '필수',
          noMust: '필수 아이템 없음 — 자유롭게!',
          matchTip: '♡ 표시 = 테마에 어울리는 아이템. ★ 능력치는 보너스!'
        },
        cats: { title: '옷장 ♡', label: '옷 카테고리', face: '표정' },
        expr: {
          neutral: '기본', smile: '미소', big: '활짝', sheep: '양 미소', surprised: '깜짝',
          focused: '집중', wink: '윙크', pout: '뾰로통', eating: '냠냠'
        },
        mirror: {
          title: '거울 ♡',
          label: '하민이가 입은 옷: {items}.',
          labelBg: '배경: {bg}.',
          poke: '하민이에게 인사하기 ♡',
          zoomIn: '확대해서 보기',
          zoomOut: '전신 보기',
          today: '오늘의 스타일',
          missing: '하민이가 준비 중이에요…',
          mini: '거울로 돌아가기'
        },
        meter: {
          label: '스타일 게이지', cute: '귀여움', cool: '시크', cozy: '포근', stage: '무대', match: '테마 일치',
          aria: '{name}: {n}%'
        },
        closet: {
          count: '{owned}/{total}',
          countLabel: '{total}개 중 {owned}개 보유',
          none: '없음',
          noneLabel: '{slot} 벗기',
          rare: 'RARE',
          special: 'SP★',
          new: 'NEW',
          match: '테마에 어울려요 ♡',
          faceNote: '추가 표정 6개는 {hair} 전용이에요 ♡'
        },
        info: {
          idle: '아이템에 마우스를 올리면 정보가 보여요 ♡',
          owned: '클릭해서 입어 보세요!',
          wearing: '착용 중 ♡ 한 번 더 클릭하면 벗어요.',
          wearingFixed: '착용 중 ♡',
          price: '{cost} H-POINT로 잠금 해제',
          howTo: '해제 방법: {hint}',
          face: '오늘의 하민이 표정 ♡ 거울 속 하민이를 클릭해 보세요!'
        },
        item: { on: '착용 중', off: '미착용' },
        equip: { on: '착용: {name}', off: '벗음: {name}', face: '표정: {name}', bg: '배경: {name}' },
        buy: {
          title: '아이템 잠금 해제?',
          text: '“{name}”, {cost} H-POINT로 해제할까요? H-POINT는 게임 포인트예요. 진짜 돈이 아니에요 ♡',
          ok: '해제 ♡',
          done: '{name} 획득! ♡',
          notEnough: 'H-POINT가 {n} 부족해요 (필요: {cost}). 게임을 하고 모아 보세요 ♡'
        },
        actions: {
          label: '코디 메뉴',
          random: '랜덤', reset: '리셋', save: '코디 저장', looks: '내 코디', photo: '포토부스 ♡', done: '완성 ♡',
          randomS: '랜덤', resetS: '리셋', saveS: '저장', looksS: '내 코디', photoS: '포토', doneS: '완성 ♡',
          doneLabel: '코디를 끝내고 별점 보기'
        },
        random: { done: '서프라이즈 코디! 🎲' },
        reset: { title: '코디를 리셋할까요?', text: '하민이를 처음 옷으로 갈아입힐까요?', ok: '리셋', done: '처음 코디로 돌아왔어요 ♡' },
        looks: {
          title: '내 코디 ♡',
          count: '저장한 코디 {n} / {max}',
          empty: '아직 저장한 코디가 없어요. [코디 저장]으로 마음에 드는 스타일을 남겨 보세요!',
          lookNo: 'LOOK #{n}',
          wear: '입기',
          wearLabel: '{look} 입기',
          photoLabel: '{look} 포토부스로 보내기',
          delLabel: '{look} 삭제',
          del: '삭제',
          delTitle: '코디를 삭제할까요?',
          delText: '저장한 코디가 삭제돼요. 괜찮아요?',
          deleted: '코디를 삭제했어요.',
          saved: '코디 저장 완료! ({n}/{max}) ♡',
          loaded: 'LOOK #{n} 착용 ♡',
          same: '이미 [내 코디]에 있는 코디예요 ♡',
          fullTitle: '내 코디가 가득 찼어요',
          fullText: '코디는 {max}개까지 저장돼요. 가장 오래된 코디와 바꿀까요?',
          replace: '바꾸기'
        },
        photo: { sending: '포토부스로 출발! 📸' },
        challenge: {
          title: '스타일 챌린지 ♡',
          intro: '테마를 고르고 어울리게 코디한 다음 [완성 ♡]을 눌러요. ★3개 이상이면 클리어!',
          bg: '추천 배경: {name}',
          notYet: 'NEW ♡',
          cleared: 'CLEAR',
          stars: '별 5개 중 {n}개',
          started: '챌린지: {name}!',
          bgSet: '배경 → {name} ♡'
        },
        req: {
          anyOf: '{slots} 착용',
          anyOfOr: '{slots} 또는 {item} 착용',
          tagged: '‘{tag}’ 태그 {slots}',
          sep: ' 또는 ',
          ok: '완료',
          miss: '아직'
        },
        result: {
          windowTitle: '스타일 체크 ♡',
          t5: '퍼펙트!', t4: '멋져요!', t3: '좋아요!', t2: '아쉬워요!', t1: '한 번 더!',
          stars: '별 5개 중 {n}개',
          l5: '거울이 반짝반짝! 테마에 딱 맞는 완벽한 코디예요 ♡',
          l4: '너무 멋져요! 어울리는 아이템 하나만 더 있으면 퍼펙트 ✨',
          l3: '챌린지 클리어! 이 조합 정말 잘 어울려요 ♡',
          l2: '귀여운 시작! ♡ 표시 아이템을 찾아보세요.',
          l1: '옷장에 더 어울리는 옷이 있어요… 다시 골라 볼까요 ♡',
          tip: 'TIP: {tags} 태그 아이템 점수가 높아요. 빈 칸도 채워 보세요!',
          mustOk: '✓ 필수: {req}',
          mustMiss: '✗ 필수 아이템 없음: {req} (최대 ★★)',
          clear: '챌린지 클리어!',
          newBest: '최고 기록!',
          earned: '+{n} H-POINT',
          again: '지난번과 같은 코디예요 — 조금 바꾸면 다시 H-POINT를 받을 수 있어요 ♡',
          keep: '계속 꾸미기',
          other: '다른 챌린지',
          save: '코디 저장',
          announce: '{title} 별 5개 중 {n}개. 테마 일치 {m}%.'
        }
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      dressUp: {
        welcome: '点击衣服给 Hamin 换装 ♡ 按 ? 查看玩法！',
        help: 'Hamin 换装有两种模式 ♡\n' +
          '👗 自由换装 — 在衣柜里选择抽屉（发型、上衣、夹克…），点击单品就能穿上，再点一次就脱下。在「表情」里换表情，在「背景」里换房间。点一点镜子里的 Hamin 打个招呼吧！\n' +
          '🏆 风格挑战 — 选择主题，搭配出合适的造型后按「完成 ♡」。带 ♡ 标记的单品符合主题，★ 属性有额外加分，有些主题还有必备单品。3★ 即可通关，5★ 就是完美！\n' +
          '🔒 上锁的单品可以通过玩其他游戏解锁，或用 H-POINT 兑换。H-POINT 只是游戏积分，绝对不是真钱。\n' +
          '🎲 随机：惊喜搭配 · ↺ 重置：换回初始服装 · 💾 保存搭配：「我的搭配」最多保存 12 套 · 📸 大头贴：把现在的搭配送去大头贴。\n' +
          '⌨ 键盘：Tab 切换区域，方向键在抽屉和单品之间移动，Enter 或空格键穿上。',
        mode: { label: '游戏模式', free: '自由换装', challenge: '风格挑战' },
        brief: {
          freeTitle: '自由换装 ♡',
          free: '随心所欲地搭配吧！',
          freeTip: '小贴士：通关风格挑战可以获得 H-POINT 和惊喜 ♡',
          freeTip2: '小贴士：保存喜欢的搭配，再送去大头贴吧 ♡',
          now: 'NOW',
          best: 'BEST',
          change: '更换',
          must: '必备',
          noMust: '没有必备单品，自由发挥！',
          matchTip: '♡ 标记 = 符合主题的单品。★ 属性有额外加分！'
        },
        cats: { title: '衣柜 ♡', label: '服装分类', face: '表情' },
        expr: {
          neutral: '平静', smile: '微笑', big: '大笑', sheep: '小羊笑', surprised: '惊讶',
          focused: '专注', wink: '眨眼', pout: '嘟嘴', eating: '好好吃'
        },
        mirror: {
          title: '镜子 ♡',
          label: 'Hamin 正在穿：{items}。',
          labelBg: '背景：{bg}。',
          poke: '和 Hamin 打招呼 ♡',
          zoomIn: '放大看看',
          zoomOut: '查看全身',
          today: '今日风格',
          missing: 'Hamin 正在准备中…',
          mini: '回到镜子'
        },
        meter: {
          label: '风格值', cute: '可爱', cool: '酷帅', cozy: '温暖', stage: '舞台', match: '主题契合',
          aria: '{name}：{n}%'
        },
        closet: {
          count: '{owned}/{total}',
          countLabel: '共 {total} 件，已拥有 {owned} 件',
          none: '不穿',
          noneLabel: '脱下{slot}',
          rare: 'RARE',
          special: 'SP★',
          new: 'NEW',
          match: '符合主题 ♡',
          faceNote: '另外 6 种表情是「{hair}」专属 ♡'
        },
        info: {
          idle: '把鼠标移到单品上查看详情 ♡',
          owned: '点击穿上吧！',
          wearing: '穿着中 ♡ 再点一次就脱下。',
          wearingFixed: '穿着中 ♡',
          price: '用 {cost} H-POINT 解锁',
          howTo: '解锁方法：{hint}',
          face: '今天 Hamin 的表情 ♡ 点一点镜子里的 Hamin 吧！'
        },
        item: { on: '穿着中', off: '未穿' },
        equip: { on: '穿上：{name}', off: '脱下：{name}', face: '表情：{name}', bg: '背景：{name}' },
        buy: {
          title: '解锁单品？',
          text: '要用 {cost} H-POINT 解锁“{name}”吗？H-POINT 只是游戏积分，不是真钱 ♡',
          ok: '解锁 ♡',
          done: '获得了 {name}！♡',
          notEnough: '还差 {n} H-POINT（共需 {cost}）。去玩游戏攒一攒吧 ♡'
        },
        actions: {
          label: '换装操作',
          random: '随机', reset: '重置', save: '保存搭配', looks: '我的搭配', photo: '大头贴 ♡', done: '完成 ♡',
          randomS: '随机', resetS: '重置', saveS: '保存', looksS: '搭配', photoS: '大头贴', doneS: '完成 ♡',
          doneLabel: '完成搭配并查看星级'
        },
        random: { done: '惊喜搭配！🎲' },
        reset: { title: '重置搭配？', text: '要让 Hamin 换回初始服装吗？', ok: '重置', done: '换回初始搭配了 ♡' },
        looks: {
          title: '我的搭配 ♡',
          count: '已保存 {n} / {max} 套',
          empty: '还没有保存的搭配。点「保存搭配」留住喜欢的造型吧！',
          lookNo: 'LOOK #{n}',
          wear: '穿上',
          wearLabel: '穿上 {look}',
          photoLabel: '把 {look} 送去大头贴',
          delLabel: '删除 {look}',
          del: '删除',
          delTitle: '删除搭配？',
          delText: '确定要删除这套保存的搭配吗？',
          deleted: '已删除搭配。',
          saved: '搭配已保存！({n}/{max}) ♡',
          loaded: '换上了 LOOK #{n} ♡',
          same: '这套搭配已经在「我的搭配」里了 ♡',
          fullTitle: '我的搭配已满',
          fullText: '最多可以保存 {max} 套。要替换最早的一套吗？',
          replace: '替换'
        },
        photo: { sending: '出发去拍大头贴！📸' },
        challenge: {
          title: '风格挑战 ♡',
          intro: '选择一个主题，搭配出合适的造型后按「完成 ♡」。获得 3★ 以上即可通关！',
          bg: '推荐背景：{name}',
          notYet: 'NEW ♡',
          cleared: 'CLEAR',
          stars: '{n}/5 星',
          started: '挑战：{name}！',
          bgSet: '背景 → {name} ♡'
        },
        req: {
          anyOf: '穿上{slots}',
          anyOfOr: '穿上{slots}或{item}',
          tagged: '带“{tag}”标签的{slots}',
          sep: '或',
          ok: '已完成',
          miss: '未完成'
        },
        result: {
          windowTitle: '风格检查 ♡',
          t5: '完美！', t4: '超棒！', t3: '不错！', t2: '再接再厉', t1: '再试一次！',
          stars: '{n}/5 星',
          l5: '镜子闪闪发光！和主题完美契合的搭配 ♡',
          l4: '好有型！再加一件合适的单品就完美了 ✨',
          l3: '挑战通关！这套搭配真的很合适 ♡',
          l2: '可爱的开始！找找带 ♡ 标记的单品吧。',
          l1: '衣柜里还有更合适的衣服…再搭配一次吧 ♡',
          tip: '小贴士：带「{tags}」标签的单品分数最高，也试着把空位填满吧！',
          mustOk: '✓ 必备：{req}',
          mustMiss: '✗ 缺少必备单品：{req}（最多 ★★）',
          clear: '挑战通关！',
          newBest: '新纪录！',
          earned: '+{n} H-POINT',
          again: '和上次的搭配一样哦——换点什么就能再次获得 H-POINT ♡',
          keep: '继续搭配',
          other: '其他挑战',
          save: '保存搭配',
          announce: '{title} {n}/5 星。主题契合度 {m}%。'
        }
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      dressUp: {
        welcome: '服をクリックして Hamin を着せ替えよう ♡ 遊び方は ? ボタンで！',
        help: 'Hamin 着せ替えには2つのモードがあるよ ♡\n' +
          '👗 フリーコーデ — クローゼットの引き出し（ヘア・トップス・ジャケット…）を選んで、アイテムをクリックすると着られるよ。もう一度クリックで脱ぐよ。「表情」で表情を、「背景」でお部屋を変えられるよ。ミラーの Hamin をクリックしてあいさつしてみてね！\n' +
          '🏆 スタイルチャレンジ — テーマを選んでぴったりのコーデにしたら「完成 ♡」を押そう。♡ マークのアイテムはテーマに合っていて、★ のステータスはボーナス。必須アイテムがあるテーマもあるよ。★3つでクリア、★5つでパーフェクト！\n' +
          '🔒 ロックされたアイテムは、ほかのゲームで遊ぶと解放されたり、H-POINT と交換できたりするよ。H-POINT はゲームのポイントで、本物のお金ではありません。\n' +
          '🎲 ランダム：サプライズコーデ · ↺ リセット：最初の服に戻す · 💾 コーデ保存：マイコーデに12個まで · 📸 プリクラ：今のコーデをプリクラに送る。\n' +
          '⌨ キーボード：Tab でエリア移動、矢印キーで引き出しとアイテムを移動、Enter かスペースで着る。',
        mode: { label: 'ゲームモード', free: 'フリーコーデ', challenge: 'スタイルチャレンジ' },
        brief: {
          freeTitle: 'フリーコーデ ♡',
          free: '好きなように組み合わせてね！',
          freeTip: 'TIP：スタイルチャレンジをクリアすると H-POINT とごほうびがもらえるよ ♡',
          freeTip2: 'TIP：お気に入りのコーデは保存して、プリクラに送ってみよう ♡',
          now: 'NOW',
          best: 'BEST',
          change: '変更',
          must: '必須',
          noMust: '必須アイテムなし — 自由にどうぞ！',
          matchTip: '♡ マーク = テーマに合うアイテム。★ のステータスはボーナス！'
        },
        cats: { title: 'クローゼット ♡', label: '服のカテゴリー', face: '表情' },
        expr: {
          neutral: 'ふつう', smile: 'にっこり', big: '大笑い', sheep: 'ひつじ笑顔', surprised: 'びっくり',
          focused: '真剣', wink: 'ウインク', pout: 'ぷくっ', eating: 'もぐもぐ'
        },
        mirror: {
          title: 'ミラー ♡',
          label: 'Hamin のコーデ：{items}。',
          labelBg: '背景：{bg}。',
          poke: 'Hamin にあいさつ ♡',
          zoomIn: 'ズームで見る',
          zoomOut: '全身を見る',
          today: '今日のスタイル',
          missing: 'Hamin は準備中…',
          mini: 'ミラーに戻る'
        },
        meter: {
          label: 'スタイルメーター', cute: 'キュート', cool: 'クール', cozy: 'ほっこり', stage: 'ステージ', match: 'テーマ一致',
          aria: '{name}：{n}%'
        },
        closet: {
          count: '{owned}/{total}',
          countLabel: '{total}個中 {owned}個 所持',
          none: 'なし',
          noneLabel: '{slot}を脱ぐ',
          rare: 'RARE',
          special: 'SP★',
          new: 'NEW',
          match: 'テーマにぴったり ♡',
          faceNote: '追加の表情6つは「{hair}」専用だよ ♡'
        },
        info: {
          idle: 'アイテムにカーソルを合わせると詳しく見られるよ ♡',
          owned: 'クリックして着てみよう！',
          wearing: '着用中 ♡ もう一度クリックで脱ぐよ。',
          wearingFixed: '着用中 ♡',
          price: '{cost} H-POINT で解放',
          howTo: '解放の方法：{hint}',
          face: '今日の Hamin の表情 ♡ ミラーの Hamin をクリックしてみてね！'
        },
        item: { on: '着用中', off: '未着用' },
        equip: { on: '着用：{name}', off: '脱いだ：{name}', face: '表情：{name}', bg: '背景：{name}' },
        buy: {
          title: 'アイテムを解放する？',
          text: '「{name}」を {cost} H-POINT で解放しますか？H-POINT はゲームのポイントで、本物のお金ではないよ ♡',
          ok: '解放 ♡',
          done: '{name} をゲット！♡',
          notEnough: 'H-POINT があと {n} 足りないよ（必要：{cost}）。ゲームで集めよう ♡'
        },
        actions: {
          label: '着せ替えメニュー',
          random: 'ランダム', reset: 'リセット', save: 'コーデ保存', looks: 'マイコーデ', photo: 'プリクラ ♡', done: '完成 ♡',
          randomS: 'ランダム', resetS: 'リセット', saveS: '保存', looksS: 'マイコーデ', photoS: 'プリクラ', doneS: '完成 ♡',
          doneLabel: 'コーデを完成させて星を見る'
        },
        random: { done: 'サプライズコーデ！🎲' },
        reset: { title: 'コーデをリセット？', text: 'Hamin を最初の服に戻しますか？', ok: 'リセット', done: '最初のコーデに戻したよ ♡' },
        looks: {
          title: 'マイコーデ ♡',
          count: '保存したコーデ {n} / {max}',
          empty: 'まだ保存したコーデはないよ。「コーデ保存」でお気に入りを残そう！',
          lookNo: 'LOOK #{n}',
          wear: '着る',
          wearLabel: '{look} を着る',
          photoLabel: '{look} をプリクラに送る',
          delLabel: '{look} を削除',
          del: '削除',
          delTitle: 'コーデを削除する？',
          delText: 'この保存コーデを削除します。よろしいですか？',
          deleted: 'コーデを削除しました。',
          saved: 'コーデを保存したよ！({n}/{max}) ♡',
          loaded: 'LOOK #{n} に着替えたよ ♡',
          same: 'このコーデはもうマイコーデにあるよ ♡',
          fullTitle: 'マイコーデがいっぱい',
          fullText: 'コーデは {max} 個まで保存できるよ。いちばん古いコーデと入れ替える？',
          replace: '入れ替える'
        },
        photo: { sending: 'プリクラへ出発！📸' },
        challenge: {
          title: 'スタイルチャレンジ ♡',
          intro: 'テーマを選んで、ぴったりのコーデにしたら「完成 ♡」を押してね。★3つ以上でクリア！',
          bg: 'おすすめ背景：{name}',
          notYet: 'NEW ♡',
          cleared: 'CLEAR',
          stars: '5つ星中 {n}つ',
          started: 'チャレンジ：{name}！',
          bgSet: '背景 → {name} ♡'
        },
        req: {
          anyOf: '{slots}を身につける',
          anyOfOr: '{slots}か{item}を身につける',
          tagged: '「{tag}」タグの{slots}',
          sep: 'か',
          ok: 'OK',
          miss: 'まだ'
        },
        result: {
          windowTitle: 'スタイルチェック ♡',
          t5: 'パーフェクト！', t4: 'グレート！', t3: 'グッド！', t2: 'おしい！', t1: 'もう一回！',
          stars: '5つ星中 {n}つ',
          l5: 'ミラーがキラキラ！テーマにぴったりの完璧なコーデ ♡',
          l4: 'とってもおしゃれ！合うアイテムがあと1つでパーフェクト ✨',
          l3: 'チャレンジクリア！この組み合わせ、すごく似合ってる ♡',
          l2: 'かわいいスタート！♡ マークのアイテムを探してみよう。',
          l1: 'クローゼットにもっと合う服があるよ…もう一度選んでみよう ♡',
          tip: 'TIP：「{tags}」タグのアイテムが高得点！空いているところも埋めてみよう！',
          mustOk: '✓ 必須：{req}',
          mustMiss: '✗ 必須アイテムなし：{req}（最大 ★★）',
          clear: 'チャレンジクリア！',
          newBest: '自己ベスト！',
          earned: '+{n} H-POINT',
          again: '前回と同じコーデだよ — 少し変えるとまた H-POINT がもらえるよ ♡',
          keep: 'コーデを続ける',
          other: 'ほかのチャレンジ',
          save: 'コーデ保存',
          announce: '{title} 5つ星中 {n}つ。テーマ一致 {m}%。'
        }
      }
    }
  };

  if (typeof HG.addStrings === 'function') {
    HG.addStrings(STRINGS);
  } else {
    (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
  }
})(window.HG = window.HG || {});
