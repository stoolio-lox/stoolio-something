const MAP_SIZE = 2600;
const TILE_SIZE = 80;
const MAX_ARROWS = 70;

let coins = 0;
let equippedHat = 'none';
let equippedSkin = 'classic';
let ownedHats = ['none'];
let ownedSkins = ['classic'];
let boughtShopUpgrades = [];
let selectedShopUpgradeId = 'heal_full';

// ==========================================
// РУЧНАЯ СИСТЕМА СЕЙВА (БЕЗ АВТОСЕЙВА)
// ==========================================
function saveGame() {
    // Фоновый автосейв выключен
}

function exportSaveFile() {
    const saveData = {
        coins,
        equippedHat,
        equippedSkin,
        ownedHats,
        ownedSkins,
        boughtShopUpgrades
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stool_save.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importSaveFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof data.coins === 'number') coins = data.coins;
            if (data.equippedHat) equippedHat = data.equippedHat;
            if (data.equippedSkin) equippedSkin = data.equippedSkin;
            if (Array.isArray(data.ownedHats)) ownedHats = data.ownedHats;
            if (Array.isArray(data.ownedSkins)) ownedSkins = data.ownedSkins;
            if (Array.isArray(data.boughtShopUpgrades)) boughtShopUpgrades = data.boughtShopUpgrades;
            alert('Сейв успешно загружен! 🪙 Монет: ' + coins);
            if (typeof renderShop === 'function') renderShop();
        } catch (err) {
            alert('Ошибка чтения файла сейва!');
        }
    };
    reader.readAsText(file);
}

const WEAPONS = {
    wrench: { id: 'wrench', name: 'Шестигранник IKEA', type: 'wrench', baseDmg: 32, reach: 45, swingSpeed: 0.22, critBonus: 0.12 },
    coin_gun: { id: 'coin_gun', name: 'Монетный Пистолет', type: 'coin_gun', baseDmg: 28, reach: 50, swingSpeed: 0.25, critBonus: 0.20 },
    sword: { id: 'sword', name: 'Меч Рыцаря', type: 'sword', baseDmg: 32, reach: 48, swingSpeed: 0.18, critBonus: 0.05 },
    hammer: { id: 'hammer', name: 'Боевой Молот', type: 'hammer', baseDmg: 55, reach: 45, swingSpeed: 0.11, critBonus: 0.10 },
    spear: { id: 'spear', name: 'Длинное Копье', type: 'spear', baseDmg: 36, reach: 72, swingSpeed: 0.16, critBonus: 0.08 },
    axe: { id: 'axe', name: 'Боевой Топор', type: 'axe', baseDmg: 44, reach: 46, swingSpeed: 0.14, critBonus: 0.12 },
    daggers: { id: 'daggers', name: 'Парные Кинжалы', type: 'daggers', baseDmg: 22, reach: 36, swingSpeed: 0.28, critBonus: 0.25 },
    katana: { id: 'katana', name: 'Катана Самурая', type: 'katana', baseDmg: 38, reach: 52, swingSpeed: 0.20, critBonus: 0.18 },
    staff: { id: 'staff', name: 'Магический Посох', type: 'staff', baseDmg: 30, reach: 42, swingSpeed: 0.15, critBonus: 0.05 },

    // СУПЕР ОРУЖИЕ
    super_wrench: { id: 'super_wrench', name: 'Мега-Шестигранник Демиурга', type: 'super_wrench', baseDmg: 68, reach: 55, swingSpeed: 0.26, critBonus: 0.25 },
    super_daggers: { id: 'super_daggers', icon: '🗡️✨', name: 'Кинжалы Тени', type: 'super_daggers', baseDmg: 45, reach: 44, swingSpeed: 0.32, critBonus: 0.45 },
    super_sword: { id: 'super_sword', name: 'Клинок Бури', type: 'super_sword', baseDmg: 65, reach: 56, swingSpeed: 0.22, critBonus: 0.20 },
    super_coin_gun: { id: 'super_coin_gun', name: 'Ультракилл-Рейлган', type: 'super_coin_gun', baseDmg: 75, reach: 60, swingSpeed: 0.30, critBonus: 0.35 },
    super_hammer: { id: 'super_hammer', name: 'Молот Титанов', type: 'super_hammer', baseDmg: 95, reach: 55, swingSpeed: 0.14, critBonus: 0.25 },
    super_spear: { id: 'super_spear', name: 'Копье Зевса', type: 'super_spear', baseDmg: 70, reach: 85, swingSpeed: 0.19, critBonus: 0.22 },
    super_axe: { id: 'super_axe', name: 'Топор Хаоса', type: 'super_axe', baseDmg: 82, reach: 58, swingSpeed: 0.17, critBonus: 0.24 },
    super_katana: { id: 'super_katana', name: 'Ямато', type: 'super_katana', baseDmg: 78, reach: 62, swingSpeed: 0.24, critBonus: 0.30 },
    super_staff: { id: 'super_staff', name: 'Посох Сверхновой', type: 'super_staff', baseDmg: 72, reach: 50, swingSpeed: 0.18, critBonus: 0.20 }
};

// МАГАЗИН СУПЕР-ОРУЖИЯ (КИНЖАЛЫ ТЕПЕРЬ 10000 🪙)
const SUPER_WEAPONS_SHOP = [
    { id: 'super_wrench', icon: '🛠️⚡', name: 'Мега-Шестигранник', desc: 'Залп рикошетящих гаек + сборка Боевых Стремянок и Тесла-Катушек', price: 680, apply: p => p.equipWeapon('super_wrench') },
    { id: 'super_daggers', icon: '🗡️✨', name: 'Кинжалы Тени', desc: 'Веер кинжалов + телепортация за спину врага', price: 10000, apply: p => p.equipWeapon('super_daggers') },
    { id: 'super_coin_gun', icon: '🪙⚡', name: 'Ультракилл-Рейлган', desc: 'ПКМ бросает монету, ЛКМ бьет лазером с авто-рикошетом во врага', price: 750, apply: p => p.equipWeapon('super_coin_gun') },
    { id: 'super_sword', icon: '⚡🗡️', name: 'Клинок Бури', desc: 'Выпускает три режущих поток ветра лезвия', price: 600, apply: p => p.equipWeapon('super_sword') },
    { id: 'super_hammer', icon: '🔨💥', name: 'Молот Титанов', desc: 'Создает серию цепных взрывных волн', price: 650, apply: p => p.equipWeapon('super_hammer') },
    { id: 'super_spear', icon: '🔱⚡', name: 'Копье Зевса', desc: 'Пронзает всю карту молнией насквозь', price: 620, apply: p => p.equipWeapon('super_spear') },
    { id: 'super_axe', icon: '🪓🌪️', name: 'Топор Хаоса', desc: 'Притягивает врагов в эпицентр вихря и рубит', price: 620, apply: p => p.equipWeapon('super_axe') },
    { id: 'super_katana', icon: '⚔️🌌', name: 'Ямато Разрез', desc: 'Пространственный разрез пространства в 3 точках', price: 700, apply: p => p.equipWeapon('super_katana') },
    { id: 'super_staff', icon: '🔮☀️', name: 'Посох Сверхновой', desc: 'Сфера гравитации стягивает врагов и детонирует', price: 720, apply: p => p.equipWeapon('super_staff') }
];

// 30 УНИКАЛЬНЫХ СПОСОБНОСТЕЙ
const SHOP_UPGRADES = [
    { id: 'heal_full', icon: '❤️', name: 'Аптечка Плотника', desc: 'Мгновенное и полное восстановление здоровья стула', price: 40, apply: p => { p.hp = p.maxHp; } },
    { id: 'god_armor', icon: '🛡️', name: 'Броня Богов', desc: 'Неуязвимость на 1.5 сек при падении здоровья ниже 25%', price: 180, apply: p => { p.hasGodArmor = true; } },
    { id: 'orbital_shields', icon: '🔄', name: 'Орбитальные Щиты', desc: 'Два щита вращаются вокруг и отбивают вражеские снаряды', price: 240, apply: p => { p.hasOrbitalShields = true; } },
    { id: 'execute', icon: '☠️', name: 'Казнь Слабых', desc: 'Мгновенно добивает любых врагов с HP ниже 30%', price: 290, apply: p => { p.hasExecute = true; } },
    { id: 'fortune_explosion', icon: '💥', name: 'Дар Фортуны', desc: 'Подбор любого предмета на полу взрывает врагов вокруг', price: 220, apply: p => { p.hasFortuneExplosion = true; } },
    { id: 'poison_trail', icon: '🧪', name: 'Ядовитый След', desc: 'Оставляет за стулом ядовитые лужи, травящие мобов', price: 160, apply: p => { p.hasPoisonTrail = true; } },
    { id: 'berserk', icon: '🩸', name: 'Ярость Берсерка', desc: 'Чем меньше здоровья у стула, тем выше его скорость и урон', price: 200, apply: p => { p.hasBerserk = true; } },
    { id: 'super_magnet', icon: '🧲', name: 'Супер-Магнит', desc: 'Огромный радиус притяжения гвоздей, шурупов и клея (+120)', price: 150, apply: p => { p.pickupRadius += 120; } },
    { id: 'boss_slayer', icon: '🛋️', name: 'Гроза Мебели', desc: '+40% дополнительного урона по Дивану и Микроволновке', price: 210, apply: p => { p.bossDamageBonus = (p.bossDamageBonus || 0) + 0.40; } },
    { id: 'dash_lightning', icon: '⚡', name: 'Шоковый Рывок', desc: 'При каждом рывке выпускает дуговые молнии во всех врагов рядом', price: 230, apply: p => { p.hasDashLightning = true; } },
    { id: 'turbo_wheels', icon: '🛞', name: 'Титановые Колеса', desc: 'Постоянная прибавка +0.8 к базовой скорости стула', price: 190, apply: p => { p.speed += 0.8; } },
    { id: 'seat_mine', icon: '💣', name: 'Мина-Сидушка', desc: 'При получении удара сбрасывает мощную мину с задержкой 1 сек', price: 175, apply: p => { p.hasSeatMine = true; } },
    { id: 'frost_dash', icon: '🧊', name: 'Ледяной Занос', desc: 'Рывок замораживает всех задетых врагов на 2.5 секунды', price: 220, apply: p => { p.hasFrostDash = true; } },
    { id: 'extinguisher', icon: '🧯', name: 'Огнетушитель', desc: 'При HP ниже 50% заливает врагов пеной и замедляет в 2 раза', price: 180, apply: p => { p.hasExtinguisher = true; } },
    { id: 'lumberjack_crit', icon: '🪓', name: 'Удар Лесоруба', desc: 'Каждый 4-й взмах гарантированно наносит тройной крит', price: 260, apply: p => { p.hasLumberjack = true; } },
    { id: 'hot_kettle', icon: '☕', name: 'Кипяток из Чайника', desc: 'Каждые 6 сек выплескивает кипяток на 150 урона в толпу', price: 170, apply: p => { p.hasHotKettle = true; } },
    { id: 'sawdust_vampire', icon: '🧛', name: 'Опилочный Вампир', desc: '+15 HP за каждый разбитый в щепки стул врага', price: 210, apply: p => { p.hasSawdustVampire = true; } },
    { id: 'hex_fortune', icon: '🪙', name: 'Золотой Шестигранник', desc: '+40% золота со всех источников (сундуки, боссы, мобы)', price: 250, apply: p => { p.coinBonus += 0.40; } },
    { id: 'soap_drift', icon: '🧼', name: 'Мыльный Дрифт', desc: 'Во время рывка стул наносит урон тараном и отскакивает без вреда', price: 165, apply: p => { p.hasSoapDrift = true; } },
    { id: 'brick_leg', icon: '🧱', name: 'Кирпичная Ножка', desc: 'Сила отталкивания стульев при столкновениях увеличена в 2.5 раза', price: 190, apply: p => { p.knockbackMult = (p.knockbackMult || 1) * 2.5; } },
    { id: 'shadow_step', icon: '🕶️', name: 'Теневой Шаг', desc: 'Полная неуязвимость на 0.6 сек сразу после окончания рывка', price: 310, apply: p => { p.hasShadowStep = true; } },
    { id: 'gold_barrel', icon: '🌶️', name: 'Взрывной Куш', desc: 'Взрыв бочки гарантированно дропает россыпь золотых монет', price: 150, apply: p => { p.hasGoldBarrel = true; } },
    { id: 'ghost_chair', icon: '👻', name: 'Стул-Призрак', desc: 'Спасает от верной гибели: оживляет с 60% HP (1 раз за бой)', price: 350, apply: p => { p.hasGhostChair = true; } },
    { id: 'rocket_dash', icon: '🚀', name: 'Турбо-Ускоритель', desc: 'Откат рывка ускорен на 40%', price: 240, apply: p => { p.dashCooldownMax = Math.max(20, p.dashCooldownMax - 35); } },
    { id: 'moth_trap', icon: '🪤', name: 'Липкая Ловушка', desc: 'Оставляет на полу липкие ловушки, в которых намертво вязнут жуки', price: 170, apply: p => { p.hasMothTrap = true; } },
    { id: 'nuclear_battery', icon: '🔋', name: 'Ядерная Батарейка', desc: 'Все пассивные эффекты и способности перезаряжаются на 35% быстрее', price: 320, apply: p => { p.hasNuclearBattery = true; } },
    { id: 'blood_revenge', icon: '💢', name: 'Опилочная Месть', desc: 'При получении удара во все стороны разлетаются острые щепки', price: 230, apply: p => { p.hasBloodRevenge = true; } },
    { id: 'chicken_leg', icon: '🍗', name: 'Живая Ножка', desc: 'Постоянная регенерация +4 HP каждую секунду', price: 280, apply: p => { p.regenRate += 4; } },
    { id: 'tsar_decree', icon: '👑', name: 'Царский Указ', desc: 'Вражеские стулья впадают в панику и наносят тебе на 20% меньше урона', price: 330, apply: p => { p.hasTsarDecree = true; } },
    { id: 'iron_backrest', icon: '🪑', name: 'Стальная Спинка', desc: '+50 к максимальному здоровью и +15% к постоянной защите', price: 220, apply: p => { p.maxHp += 50; p.hp += 50; p.defense = Math.min(0.8, p.defense + 0.15); } }
];

const HATS = [
    { id: 'none', name: 'Без шляпы', icon: '❌', perk: 'Без бонусов', price: 0 },
    { id: 'crown', name: 'Корона Царя', icon: '👑', perk: '+25% к опыту (XP)', price: 120 },
    { id: 'cowboy', name: 'Ковбойская', icon: '🤠', perk: 'Авто-выстрелы из лука', price: 150 },
    { id: 'viking', name: 'Шлем Викинга', icon: '🪖', perk: '+30 HP и 20% шипы', price: 200 },
    { id: 'wizard', name: 'Колпак Мага', icon: '🧙', perk: '+60 к радиусу сбора', price: 140 },
    { id: 'tophat', name: 'Цилиндр Барона', icon: '🎩', perk: '+35% к золоту', price: 220 },
    { id: 'ninja', name: 'Повязка Ниндзя', icon: '🥷', perk: 'Быстрый откат рывка', price: 260 },
    { id: 'pirate', name: 'Треуголка Пирата', icon: '🏴‍☠️', perk: '+25% к шансу крита', price: 280 },
    { id: 'robot', name: 'Антенна Киборга', icon: '🤖', perk: '+20% защиты', price: 300 },
    { id: 'devil', name: 'Рога Демона', icon: '😈', perk: '+25 урона ко всем атакам', price: 350 },
    { id: 'alien', name: 'Шлем Пришельца', icon: '👽', perk: '+15% к скорости', price: 320 },
    { id: 'fire', name: 'Огненная Корона', icon: '🔥', perk: '+35 урона и вампиризм', price: 450 },
    { id: 'cat', name: 'Кошачьи Ушки', icon: '🐱', perk: '+18% к маневренности', price: 240 },
    { id: 'santa', name: 'Шапка Санты', icon: '🎅', perk: 'Постоянная регенерация HP', price: 280 }
];

const CHAIR_SKINS = [
    { id: 'classic', name: 'Классический Дуб', dark: '#5c2c06', cushion: '#8B4513', price: 0 },
    { id: 'mahogany', name: 'Красное Дерево', dark: '#450a0a', cushion: '#991b1b', price: 80 },
    { id: 'royal_blue', name: 'Королевский Синий', dark: '#172554', cushion: '#1d4ed8', price: 120 },
    { id: 'emerald', name: 'Изумрудный Бархат', dark: '#064e3b', cushion: '#059669', price: 150 },
    { id: 'gold', name: 'Золотой Трон', dark: '#78350f', cushion: '#f59e0b', price: 300 },
    { id: 'cyber', name: 'Неоновый Киберпанк', dark: '#3b0764', cushion: '#c026d3', price: 400 },
    { id: 'shadow', name: 'Тень Бездны', dark: '#020617', cushion: '#334155', price: 350 }
];

const UPGRADE_POOL = [
    { icon: '❤️', title: 'Дубовая Прочность', desc: '+35 к макс. HP и лечение на 35', apply: p => { p.maxHp += 35; p.hp += 35; } },
    { icon: '⚔️', title: 'Заточка Лезвия', desc: '+12 к урону атак', apply: p => { p.damageBonus += 12; } },
    { icon: '👟', title: 'Турбо-Ножки', desc: '+0.5 к скорости передвижения', apply: p => { p.speed += 0.5; } },
    { icon: '🩸', title: 'Вампиризм', desc: '+5 HP за каждого уничтоженного врага', apply: p => { p.vampirism += 5; } },
    { icon: '🛡️', title: 'Толстая Обивка', desc: '+10% к защите от любого урона', apply: p => { p.defense = Math.min(0.7, p.defense + 0.1); } },
    { icon: '🧲', title: 'Магнитный Лак', desc: '+50 к радиусу притягивания ресурсов', apply: p => { p.pickupRadius += 50; } },
    { icon: '🌿', title: 'Живица Дерева', desc: 'Регенерация +2 HP каждую секунду', apply: p => { p.regenRate += 2; } },
    { icon: '🎯', title: 'Критический Спил', desc: '+15% шанс нанести двойной урон', apply: p => { p.critChance = Math.min(0.9, p.critChance + 0.15); } },
    { icon: '⚙️', title: 'Циркулярная Пила', desc: 'Вращающаяся пила режет всех вблизи', apply: p => { p.hasSaw = true; p.sawLevel++; } },
    { icon: '⚡', title: 'Тесла-Катушка', desc: 'Периодически бьет молнией ближайших врагов', apply: p => { p.hasTesla = true; p.teslaLevel++; } },
    { icon: '❄️', title: 'Морозная Аура', desc: 'Замедляет всех наступающих врагов вокруг', apply: p => { p.hasFrostAura = true; } },
    { icon: '🏹', title: 'Оружейный Арбалет', desc: 'Автоматически выпускает стрелы', apply: p => { p.hasBow = true; p.extraArrows++; } },
    { icon: '🪃', title: 'Острый Бумеранг', desc: 'Запускает бумеранг, рассекающий толпу', apply: p => { p.hasBoomerang = true; } },
    { icon: '🔥', title: 'Взрывной Рывок', desc: 'При рывке оставляет за собой взрывную волну', apply: p => { p.hasExplosiveDash = true; } },
    { icon: '🪑', title: 'Стульчик-Миньон', desc: 'Призывает боевой табурет-помощник', apply: p => { p.minions.push(new Minion(p)); } },
    { icon: '👑', title: 'Стул-Гигант', desc: 'Увеличивает размеры и силу ударов', apply: p => { p.activateTitan(1200); } }
];

const BOT_NAMES = [
    'Табурет Смерти', 'Дубовый Громила', 'Стул из ИКЕИ', 'Венский Шпион', 'Стул с Подвохом',
    'Барный Демон', 'Трон Разрушения', 'Опилочный Мститель', 'Стул на Колесиках',
    'Табуретка Бабушки', 'Кресло-Качалка Зла', 'Офисный Самурай', 'Табурет-Берсерк'
];