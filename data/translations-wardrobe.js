/* HAMIN GAMES — Dress Up wardrobe item names (docs/CONTRACT.md §3.3, §11).
   Keys: wardrobe.<id>.name for every item in data/wardrobe.js (ids must match exactly).
   Loaded on every page, because unlock popups, the collection album and the
   H-POINT exchange can show any wardrobe item.

   Shape: one nested object per language — en (fallback), ko, zh-CN, ja — with
   exactly the same keys (verify with: node tools/check-i18n.js).
   Copy rules: EN ≤ ~18 chars, CJK ≤ ~10 chars so names fit 11–12px labels.
   Plain descriptive names only: no brands, logos, school names or official
   costume names.

   Loading: data/*.js run before js/i18n.js. If HG.addStrings is not there yet
   the bundle is queued on HG._pendingStrings; js/i18n.js drains the queue. */
(function (HG) {
  'use strict';

  var STRINGS = {
    /* ════════════════ English (fallback language) ════════════════ */
    en: {
      wardrobe: {
        /* tops */
        'top-bicycle-pocket-tee': { name: 'Bicycle Pocket Tee' },
        'top-practice-tee': { name: 'Practice Room Tee' },
        'top-spirit-ringer-tee': { name: 'Spirit Ringer Tee' },
        'top-mono-mockneck': { name: 'Mono Mock-Neck' },
        'top-pastel-stripe-longsleeve': { name: 'Pastel Stripe Tee' },
        /* shirts */
        'shirt-oxford-white': { name: 'Class Oxford Shirt' },
        'shirt-powder-stripe-overshirt': { name: 'Stripe Overshirt' },
        'shirt-midnight-stage': { name: 'Midnight Shirt' },
        /* knits */
        'knit-navy-vneck': { name: 'Navy V-Neck Knit' },
        'knit-cream-cable-cardigan': { name: 'Cream Cardigan' },
        'knit-open-stitch-stage': { name: 'Open-Stitch Knit' },
        'knit-lavender-sweater-vest': { name: 'Lavender Knit Vest' },
        'knit-stripe-polo': { name: 'Stripe Knit Polo' },
        /* hoodies */
        'hoodie-heather-spirit': { name: 'Spirit Hoodie' },
        'hoodie-mint-crewneck': { name: 'Mint Sweatshirt' },
        'hoodie-charcoal-zip': { name: 'Practice Zip-Up' },
        /* jackets */
        'outer-midnight-panel-jacket': { name: 'Midnight Jacket' },
        'outer-cream-puffer': { name: 'Snowday Puffer' },
        'outer-charcoal-long-coat': { name: 'Departure Coat' },
        'outer-navy-blazer': { name: 'Class Blazer' },
        'outer-light-denim-jacket': { name: 'Light Denim Jacket' },
        /* bottoms */
        'bottom-slim-school-slacks': { name: 'Slim School Slacks' },
        'bottom-wide-beige-chinos': { name: 'Wide Retro Chinos' },
        'bottom-track-pants': { name: 'Track Pants' },
        'bottom-oatmeal-sweatpants': { name: 'Oatmeal Joggers' },
        'bottom-light-straight-jeans': { name: 'Straight Jeans' },
        'bottom-black-stage-pants': { name: 'Stage Pants' },
        /* shoes */
        'shoes-chunky-white-sneakers': { name: 'Chunky Sneakers' },
        'shoes-sporty-runner': { name: 'Sporty Runners' },
        'shoes-doodle-slippers': { name: 'Doodle Slippers' },
        'shoes-black-stage-boots': { name: 'Stage Ankle Boots' },
        'shoes-penny-loafers': { name: 'Penny Loafers' },
        'shoes-lined-winter-boots': { name: 'Snowday Boots' },
        /* accessories */
        'acc-sticker-headphones': { name: 'Sticker Headphones' },
        'acc-striped-school-tie': { name: 'Striped School Tie' },
        'acc-cream-knit-muffler': { name: 'Cream Knit Muffler' },
        'acc-silver-chain': { name: 'Silver Stage Chain' },
        'acc-phone-lanyard': { name: 'Phone Lanyard' },
        'acc-mint-wristband': { name: 'Mint Wristband' },
        'acc-dot-tie': { name: 'Polka Dot Tie' },
        /* bags */
        'bag-cream-canvas-tote': { name: 'Cream Canvas Tote' },
        'bag-black-trainee-backpack': { name: 'Trainee Backpack' },
        'bag-lavender-crossbody': { name: 'Mini Crossbody' },
        /* hats */
        'hat-powder-ball-cap': { name: 'Powder Blue Cap' },
        'hat-lavender-beanie': { name: 'Lavender Beanie' },
        'hat-special-star': { name: 'Star Bucket Hat' },
        /* hairstyles (whole-head layers) */
        'hair-era-a': { name: 'Hair A · Spring' },
        'hair-era-b': { name: 'Hair B · Summer' },
        'hair-era-c': { name: 'Hair C · Winter' },
        'hair-stage-styled': { name: 'Hair D · Stage' }
      }
    },

    /* ════════════════ 한국어 ════════════════ */
    ko: {
      wardrobe: {
        'top-bicycle-pocket-tee': { name: '자전거 포켓 티' },
        'top-practice-tee': { name: '연습실 티셔츠' },
        'top-spirit-ringer-tee': { name: '응원 링거 티' },
        'top-mono-mockneck': { name: '모노 목폴라' },
        'top-pastel-stripe-longsleeve': { name: '파스텔 줄무늬 티' },
        'shirt-oxford-white': { name: '흰 옥스퍼드 셔츠' },
        'shirt-powder-stripe-overshirt': { name: '줄무늬 오버셔츠' },
        'shirt-midnight-stage': { name: '미드나잇 무대 셔츠' },
        'knit-navy-vneck': { name: '네이비 브이넥 니트' },
        'knit-cream-cable-cardigan': { name: '크림 꽈배기 가디건' },
        'knit-open-stitch-stage': { name: '무대 니트' },
        'knit-lavender-sweater-vest': { name: '라벤더 니트 조끼' },
        'knit-stripe-polo': { name: '줄무늬 니트 폴로' },
        'hoodie-heather-spirit': { name: '응원 후드티' },
        'hoodie-mint-crewneck': { name: '민트 맨투맨' },
        'hoodie-charcoal-zip': { name: '연습실 후드집업' },
        'outer-midnight-panel-jacket': { name: '미드나잇 재킷' },
        'outer-cream-puffer': { name: '눈 오는 날 패딩' },
        'outer-charcoal-long-coat': { name: '출국 롱코트' },
        'outer-navy-blazer': { name: '교복 블레이저' },
        'outer-light-denim-jacket': { name: '주말 청재킷' },
        'bottom-slim-school-slacks': { name: '슬림 교복 바지' },
        'bottom-wide-beige-chinos': { name: '와이드 치노 팬츠' },
        'bottom-track-pants': { name: '연습실 트랙 팬츠' },
        'bottom-oatmeal-sweatpants': { name: '오트밀 조거 팬츠' },
        'bottom-light-straight-jeans': { name: '연청 스트레이트' },
        'bottom-black-stage-pants': { name: '무대 슬랙스' },
        'shoes-chunky-white-sneakers': { name: '청키 운동화' },
        'shoes-sporty-runner': { name: '스포티 러닝화' },
        'shoes-doodle-slippers': { name: '낙서 실내화' },
        'shoes-black-stage-boots': { name: '무대 앵클부츠' },
        'shoes-penny-loafers': { name: '페니 로퍼' },
        'shoes-lined-winter-boots': { name: '눈 오는 날 부츠' },
        'acc-sticker-headphones': { name: '스티커 헤드폰' },
        'acc-striped-school-tie': { name: '줄무늬 교복 넥타이' },
        'acc-cream-knit-muffler': { name: '크림 니트 목도리' },
        'acc-silver-chain': { name: '실버 무대 체인' },
        'acc-phone-lanyard': { name: '폰 스트랩' },
        'acc-mint-wristband': { name: '민트 손목밴드' },
        'acc-dot-tie': { name: '땡땡이 넥타이' },
        'bag-cream-canvas-tote': { name: '크림 캔버스 토트' },
        'bag-black-trainee-backpack': { name: '연습생 백팩' },
        'bag-lavender-crossbody': { name: '여행 미니 크로스백' },
        'hat-powder-ball-cap': { name: '하늘색 볼캡' },
        'hat-lavender-beanie': { name: '라벤더 비니' },
        'hat-special-star': { name: '별빛 버킷햇' },
        'hair-era-a': { name: '헤어 A · 봄' },
        'hair-era-b': { name: '헤어 B · 여름' },
        'hair-era-c': { name: '헤어 C · 겨울' },
        'hair-stage-styled': { name: '헤어 D · 무대' }
      }
    },

    /* ════════════════ 简体中文 ════════════════ */
    'zh-CN': {
      wardrobe: {
        'top-bicycle-pocket-tee': { name: '单车口袋T恤' },
        'top-practice-tee': { name: '练习室T恤' },
        'top-spirit-ringer-tee': { name: '应援撞色T恤' },
        'top-mono-mockneck': { name: '黑白半高领' },
        'top-pastel-stripe-longsleeve': { name: '粉彩条纹长袖' },
        'shirt-oxford-white': { name: '白色牛津衬衫' },
        'shirt-powder-stripe-overshirt': { name: '条纹衬衫外套' },
        'shirt-midnight-stage': { name: '午夜舞台衬衫' },
        'knit-navy-vneck': { name: '藏青V领针织' },
        'knit-cream-cable-cardigan': { name: '奶油麻花开衫' },
        'knit-open-stitch-stage': { name: '舞台镂空针织' },
        'knit-lavender-sweater-vest': { name: '薰衣草毛衣背心' },
        'knit-stripe-polo': { name: '条纹针织Polo' },
        'hoodie-heather-spirit': { name: '应援连帽衫' },
        'hoodie-mint-crewneck': { name: '薄荷圆领卫衣' },
        'hoodie-charcoal-zip': { name: '练习室拉链卫衣' },
        'outer-midnight-panel-jacket': { name: '午夜拼接夹克' },
        'outer-cream-puffer': { name: '雪天羽绒服' },
        'outer-charcoal-long-coat': { name: '出发长大衣' },
        'outer-navy-blazer': { name: '校园西装外套' },
        'outer-light-denim-jacket': { name: '周末牛仔夹克' },
        'bottom-slim-school-slacks': { name: '修身校服裤' },
        'bottom-wide-beige-chinos': { name: '复古阔腿卡其裤' },
        'bottom-track-pants': { name: '练习室运动裤' },
        'bottom-oatmeal-sweatpants': { name: '燕麦色束脚裤' },
        'bottom-light-straight-jeans': { name: '浅蓝直筒牛仔裤' },
        'bottom-black-stage-pants': { name: '舞台直筒裤' },
        'shoes-chunky-white-sneakers': { name: '厚底小白鞋' },
        'shoes-sporty-runner': { name: '运动跑鞋' },
        'shoes-doodle-slippers': { name: '涂鸦室内鞋' },
        'shoes-black-stage-boots': { name: '舞台短靴' },
        'shoes-penny-loafers': { name: '便士乐福鞋' },
        'shoes-lined-winter-boots': { name: '雪天加绒靴' },
        'acc-sticker-headphones': { name: '贴纸耳机' },
        'acc-striped-school-tie': { name: '条纹校服领带' },
        'acc-cream-knit-muffler': { name: '奶油针织围巾' },
        'acc-silver-chain': { name: '银色舞台项链' },
        'acc-phone-lanyard': { name: '手机挂绳' },
        'acc-mint-wristband': { name: '薄荷护腕' },
        'acc-dot-tie': { name: '波点领带' },
        'bag-cream-canvas-tote': { name: '奶油帆布托特包' },
        'bag-black-trainee-backpack': { name: '练习生双肩包' },
        'bag-lavender-crossbody': { name: '旅行迷你斜挎包' },
        'hat-powder-ball-cap': { name: '天蓝棒球帽' },
        'hat-lavender-beanie': { name: '薰衣草毛线帽' },
        'hat-special-star': { name: '星光渔夫帽' },
        'hair-era-a': { name: '发型A·春' },
        'hair-era-b': { name: '发型B·夏' },
        'hair-era-c': { name: '发型C·冬' },
        'hair-stage-styled': { name: '发型D·舞台' }
      }
    },

    /* ════════════════ 日本語 ════════════════ */
    ja: {
      wardrobe: {
        'top-bicycle-pocket-tee': { name: '自転車ポケットT' },
        'top-practice-tee': { name: '練習室Tシャツ' },
        'top-spirit-ringer-tee': { name: '応援リンガーT' },
        'top-mono-mockneck': { name: 'モノモックネック' },
        'top-pastel-stripe-longsleeve': { name: 'パステルボーダー' },
        'shirt-oxford-white': { name: '白オックスシャツ' },
        'shirt-powder-stripe-overshirt': { name: 'ストライプシャツ' },
        'shirt-midnight-stage': { name: 'ミッドナイトシャツ' },
        'knit-navy-vneck': { name: '紺Vネックニット' },
        'knit-cream-cable-cardigan': { name: 'クリームカーデ' },
        'knit-open-stitch-stage': { name: 'ステージニット' },
        'knit-lavender-sweater-vest': { name: 'ラベンダーベスト' },
        'knit-stripe-polo': { name: 'ボーダーニットポロ' },
        'hoodie-heather-spirit': { name: '応援パーカー' },
        'hoodie-mint-crewneck': { name: 'ミントスウェット' },
        'hoodie-charcoal-zip': { name: '練習室ジップパーカー' },
        'outer-midnight-panel-jacket': { name: 'ミッドナイトJK' },
        'outer-cream-puffer': { name: '雪の日ダウン' },
        'outer-charcoal-long-coat': { name: '出発ロングコート' },
        'outer-navy-blazer': { name: '制服ブレザー' },
        'outer-light-denim-jacket': { name: '週末デニムJK' },
        'bottom-slim-school-slacks': { name: 'スリム制服パンツ' },
        'bottom-wide-beige-chinos': { name: 'ワイドチノパン' },
        'bottom-track-pants': { name: '練習室ジャージ' },
        'bottom-oatmeal-sweatpants': { name: 'オートミールパンツ' },
        'bottom-light-straight-jeans': { name: 'ライトストレート' },
        'bottom-black-stage-pants': { name: 'ステージパンツ' },
        'shoes-chunky-white-sneakers': { name: '厚底スニーカー' },
        'shoes-sporty-runner': { name: 'スポーティランナー' },
        'shoes-doodle-slippers': { name: 'らくがき上履き' },
        'shoes-black-stage-boots': { name: 'ステージブーツ' },
        'shoes-penny-loafers': { name: 'ペニーローファー' },
        'shoes-lined-winter-boots': { name: '雪の日ブーツ' },
        'acc-sticker-headphones': { name: 'ステッカーヘッドホン' },
        'acc-striped-school-tie': { name: 'ストライプタイ' },
        'acc-cream-knit-muffler': { name: 'クリームマフラー' },
        'acc-silver-chain': { name: 'シルバーチェーン' },
        'acc-phone-lanyard': { name: 'スマホストラップ' },
        'acc-mint-wristband': { name: 'ミントリストバンド' },
        'acc-dot-tie': { name: '水玉ネクタイ' },
        'bag-cream-canvas-tote': { name: 'クリームトート' },
        'bag-black-trainee-backpack': { name: '練習生リュック' },
        'bag-lavender-crossbody': { name: '旅のミニショルダー' },
        'hat-powder-ball-cap': { name: '水色キャップ' },
        'hat-lavender-beanie': { name: 'ラベンダーニット帽' },
        'hat-special-star': { name: '星空バケハ' },
        'hair-era-a': { name: 'ヘアA・春' },
        'hair-era-b': { name: 'ヘアB・夏' },
        'hair-era-c': { name: 'ヘアC・冬' },
        'hair-stage-styled': { name: 'ヘアD・ステージ' }
      }
    }
  };

  if (typeof HG.addStrings === 'function') {
    HG.addStrings(STRINGS);
  } else {
    (HG._pendingStrings = HG._pendingStrings || []).push(STRINGS);
  }
})(window.HG = window.HG || {});
