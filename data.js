// ======================================================
// ДАННЫЕ, КОНСТАНТЫ И СПИСКИ МАГАЗИНА (data.js)
// ======================================================

const MAP_SIZE = 2600;
const TILE_SIZE = 80;
const MAX_ARROWS = 70;

let coins = 0;
let equippedHat = 'none';
let equippedSkin = 'classic';
let equippedWeapon = 'bonk_bat';
let ownedHats = ['none'];
let ownedSkins = ['classic'];
let boughtShopUpgrades = [];
let selectedShopUpgradeId = 'heal_full';

function saveGame() {}

function exportSaveFile() {
    const currentWeaponId = (typeof player !== 'undefined' && player && player.weapon) 
        ? player.weapon.id 
        : equippedWeapon;

    const saveData = {
        coins,
        equippedHat,
        equippedSkin,
        equippedWeapon: currentWeaponId,
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

            if (data.equippedWeapon && WEAPONS[data.equippedWeapon]) {
                equippedWeapon = data.equippedWeapon;
                if (typeof player !== 'undefined' && player && typeof player.equipWeapon === 'function') {
                    player.equipWeapon(data.equippedWeapon);
                }
            }

            alert('Сейв успешно загружен! 🪙 Монет: ' + coins);
            if (typeof renderShop === 'function') renderShop();
        } catch (err) {
            alert('Ошибка чтения файла сейва!');
        }
    };
    reader.readAsText(file);
}

const WEAPONS = {
    bonk_bat: { id: 'bonk_bat', name: 'Бита БОНК!', type: 'bonk_bat', baseDmg: 48, reach: 52, swingSpeed: 0.22, critBonus: 0.25 },
    wrench: { id: 'wrench', name: 'Шестигранник IKEA', type: 'wrench', baseDmg: 32, reach: 45, swingSpeed: 0.22, critBonus: 0.12 },
    coin_gun: { id: 'coin_gun', name: 'Монетный Пистолет', type: 'coin_gun', baseDmg: 28, reach: 50, swingSpeed: 0.25, critBonus: 0.20 },
    sword: { id: 'sword', name: 'Меч Рыцаря', type: 'sword', baseDmg: 32, reach: 48, swingSpeed: 0.18, critBonus: 0.05 },
    hammer: { id: 'hammer', name: 'Боевой Молот', type: 'hammer', baseDmg: 55, reach: 45, swingSpeed: 0.11, critBonus: 0.10 },
    spear: { id: 'spear', name: 'Длинное Копье', type: 'spear', baseDmg: 36, reach: 72, swingSpeed: 0.16, critBonus: 0.08 },
    axe: { id: 'axe', name: 'Боевой Топор', type: 'axe', baseDmg: 44, reach: 46, swingSpeed: 0.14, critBonus: 0.12 },
    daggers: { id: 'daggers', name: 'Парные Кинжалы', type: 'daggers', baseDmg: 22, reach: 36, swingSpeed: 0.28, critBonus: 0.25 },
    katana: { id: 'katana', name: 'Катана Самурая', type: 'katana', baseDmg: 38, reach: 52, swingSpeed: 0.20, critBonus: 0.18 },
    staff: { id: 'staff', name: 'Магический Посох', type: 'staff', baseDmg: 30, reach: 42, swingSpeed: 0.15, critBonus: 0.05 },
    holy_stool: { id: 'holy_stool', name: 'Святой Табурет', type: 'holy_stool', baseDmg: 42, reach: 48, swingSpeed: 0.19, critBonus: 0.15 },

    // СУПЕР ОРУЖИЕ
    super_bonk: { id: 'super_bonk', icon: '🏏💥', name: 'Царь-Бита BONK!', type: 'super_bonk', baseDmg: 90, reach: 62, swingSpeed: 0.24, critBonus: 0.35 },
    super_wrench: { id: 'super_wrench', name: 'Мега-Шестигранник Демиурга', type: 'super_wrench', baseDmg: 68, reach: 55, swingSpeed: 0.26, critBonus: 0.25 },
    super_daggers: { id: 'super_daggers', icon: '🗡️✨', name: 'Кинжалы Тени', type: 'super_daggers', baseDmg: 45, reach: 44, swingSpeed: 0.32, critBonus: 0.45 },
    super_sword: { id: 'super_sword', name: 'Клинок Бури', type: 'super_sword', baseDmg: 65, reach: 56, swingSpeed: 0.22, critBonus: 0.20 },
    super_coin_gun: { id: 'super_coin_gun', name: 'Ультракилл-Рейлган', type: 'super_coin_gun', baseDmg: 75, reach: 60, swingSpeed: 0.30, critBonus: 0.35 },
    super_hammer: { id: 'super_hammer', name: 'Молот Титанов', type: 'super_hammer', baseDmg: 95, reach: 55, swingSpeed: 0.14, critBonus: 0.25 },
    super_spear: { id: 'super_spear', name: 'Копье Зевса', type: 'super_spear', baseDmg: 70, reach: 85, swingSpeed: 0.19, critBonus: 0.22 },
    super_axe: { id: 'super_axe', name: 'Топор Хаоса', type: 'super_axe', baseDmg: 82, reach: 58, swingSpeed: 0.17, critBonus: 0.24 },
    super_katana: { id: 'super_katana', name: 'Ямато', type: 'super_katana', baseDmg: 78, reach: 62, swingSpeed: 0.24, critBonus: 0.30 },
    super_staff: { id: 'super_staff', name: 'Посох Сверхновой', type: 'super_staff', baseDmg: 72, reach: 50, swingSpeed: 0.18, critBonus: 0.20 },
    super_holy: { id: 'super_holy', icon: '☀️✨', name: 'Экзорцист 3000', type: 'super_holy', baseDmg: 88, reach: 58, swingSpeed: 0.22, critBonus: 0.30 },
    super_fridge: { id: 'super_fridge', icon: '🧊❄️', name: 'Царь-Холодильник ЗИЛ', type: 'super_fridge', baseDmg: 85, reach: 54, swingSpeed: 0.16, critBonus: 0.25 }
};

const SUPER_WEAPONS_SHOP = [
    { id: 'super_bonk', icon: '🏏💥', name: 'Царь-Бита BONK!', desc: 'Мемный нокаут: дикое отталкивание врагов в Horny Jail с аутентичным звуком БОНК!', price: 800, apply: p => p.equipWeapon('super_bonk') },
    { id: 'super_holy', icon: '☀️✨', name: 'Экзорцист 3000', desc: 'Призывает с небес столпы священного пламени, испепеляя всю область вокруг!', price: 850, apply: p => p.equipWeapon('super_holy') },
    { id: 'super_fridge', icon: '🧊❄️', name: 'Царь-Холодильник ЗИЛ', desc: 'Замораживает целую армию и выпускает град ледяных сосулек!', price: 820, apply: p => p.equipWeapon('super_fridge') },
    { id: 'super_wrench', icon: '🛠️⚡', name: 'Мега-Шестигранник', desc: 'Залп рикошетящих гаек + сборка Боевых Стремянок и Тесла-Катушек', price: 680, apply: p => p.equipWeapon('super_wrench') },
    { id: 'super_daggers', icon: '🗡️✨', name: 'Кинжалы Тени', desc: 'Веер кинжалов + телепортация за спину врага', price: 1000, apply: p => p.equipWeapon('super_daggers') },
    { id: 'super_coin_gun', icon: '🪙⚡', name: 'Ультракилл-Рейлган', desc: 'ПКМ бросает монету, ЛКМ бьет лазером с авто-рикошетом во врага', price: 750, apply: p => p.equipWeapon('super_coin_gun') },
    { id: 'super_sword', icon: '⚡🗡️', name: 'Клинок Бури', desc: 'Выпускает три режущих поток ветра лезвия', price: 600, apply: p => p.equipWeapon('super_sword') },
    { id: 'super_hammer', icon: '🔨💥', name: 'Молот Титанов', desc: 'Создает серию цепных взрывных волн', price: 650, apply: p => p.equipWeapon('super_hammer') },
    { id: 'super_spear', icon: '🔱⚡', name: 'Копье Зевса', desc: 'Пронзает всю карту молнией насквозь', price: 620, apply: p => p.equipWeapon('super_spear') },
    { id: 'super_axe', icon: '🪓🌪️', name: 'Топор Хаоса', desc: 'Притягивает врагов в эпицентр вихря и рубит', price: 620, apply: p => p.equipWeapon('super_axe') },
    { id: 'super_katana', icon: '⚔️🌌', name: 'Ямато Разрез', desc: 'Пространственный разрез пространства в 3 точках', price: 700, apply: p => p.equipWeapon('super_katana') },
    { id: 'super_staff', icon: '🔮☀️', name: 'Посох Сверхновой', desc: 'Сфера гравитации стягивает врагов и детонирует', price: 720, apply: p => p.equipWeapon('super_staff') }
];

const SHOP_ABILITIES = [
    { id: 'heal_full', icon: '❤️', name: 'Аптечка Плотника', desc: 'Полное мгновенное восстановление HP (бесконечно!)', price: 40, repeatable: true, apply: p => { p.hp = p.maxHp; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+FULL HP! ❤️', '#10b981')); } },
    { id: 'repair_kit', icon: '🧰', name: 'Ремкомплект', desc: 'Быстрое восстановление +50 HP прямо в бою (бесконечно!)', price: 25, repeatable: true, apply: p => { p.hp = Math.min(p.maxHp, p.hp + 50); floatingTexts.push(new FloatingText(p.x, p.y - 30, '+50 HP! 🧰', '#10b981')); } },
    { id: 'xp_tome', icon: '📖', name: 'Чертежи IKEA', desc: 'Мгновенно даёт +100 опыта (XP) для повышения уровня (бесконечно!)', price: 60, repeatable: true, apply: p => { p.addXp(100); } },

    { id: 'magnet_drone', icon: '🛸', name: 'Магнитный Дрон', desc: 'Призывает летающий дрон, собирающий ресурсы по всей карте', price: 270, apply: p => { p.hasMagnetDrone = true; } },
    { id: 'spike_frame', icon: '🌵', name: 'Шипованный Каркас', desc: 'Враги, коснувшиеся стула, получают 40 единиц урона шипами', price: 210, apply: p => { p.thorns += 0.40; } },
    { id: 'god_armor', icon: '🛡️', name: 'Броня Богов', desc: 'Неуязвимость на 1.5 сек при падении здоровья ниже 25%', price: 180, apply: p => { p.hasGodArmor = true; } },
    { id: 'orbital_shields', icon: '🔄', name: 'Орбитальные Щиты', desc: 'Два щита вращаются вокруг и отбивают вражеские снаряды', price: 240, apply: p => { p.hasOrbitalShields = true; } },
    { id: 'execute', icon: '☠️', name: 'Казнь Слабых', desc: 'Мгновенно добивает любых врагов с HP ниже 30%', price: 290, apply: p => { p.hasExecute = true; } },
    { id: 'fortune_explosion', icon: '💥', name: 'Дар Фортуны', desc: 'Подбор любого предмета на полу взрывает врагов вокруг', price: 220, apply: p => { p.hasFortuneExplosion = true; } },
    { id: 'poison_trail', icon: '🧪', name: 'Ядовитый След', desc: 'Оставляет за стулом ядовитые лужи, травящие мобов', price: 160, apply: p => { p.hasPoisonTrail = true; } },
    { id: 'berserk', icon: '🩸', name: 'Ярость Берсерка', desc: 'Чем меньше здоровья у стула, тем выше его скорость и урон', price: 200, apply: p => { p.hasBerserk = true; } },
    { id: 'super_magnet', icon: '🧲', name: 'Супер-Магнит', desc: 'Огромный радиус притяжения гвоздей, шурупов и клея (+120)', price: 150, apply: p => { p.pickupRadius += 120; } },
    { id: 'boss_slayer', icon: '🛋️', name: 'Гроза Мебели', desc: '+40% урона по Дивану, Микроволновке и Холодильнику', price: 210, apply: p => { p.bossDamageBonus = (p.bossDamageBonus || 0) + 0.40; } },
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
    { id: 'ghost_chair', icon: '👻', name: 'Стул-Призрак', desc: 'Спасает от гибели: оживляет с 60% HP (1 раз за бой)', price: 350, apply: p => { p.hasGhostChair = true; } },
    { id: 'rocket_dash', icon: '🚀', name: 'Турбо-Ускоритель', desc: 'Откат рывка ускорен на 40%', price: 240, apply: p => { p.dashCooldownMax = Math.max(20, p.dashCooldownMax - 35); } },
    { id: 'moth_trap', icon: '🪤', name: 'Липкая Ловушка', desc: 'Оставляет на полу липкие ловушки, в которых намертво вязнут жуки', price: 170, apply: p => { p.hasMothTrap = true; } },
    { id: 'nuclear_battery', icon: '🔋', name: 'Ядерная Батарейка', desc: 'Все пассивные эффекты и способности перезаряжаются на 35% быстрее', price: 320, apply: p => { p.hasNuclearBattery = true; } },
    { id: 'blood_revenge', icon: '💢', name: 'Опилочная Месть', desc: 'При получении удара во все стороны разлетаются острые щепки', price: 230, apply: p => { p.hasBloodRevenge = true; } },
    { id: 'chicken_leg', icon: '🍗', name: 'Живая Ножка', desc: 'Постоянная регенерация +4 HP каждую секунду', price: 280, apply: p => { p.regenRate += 4; } },
    { id: 'tsar_decree', icon: '👑', name: 'Царский Указ', desc: 'Вражеские стулья наносят тебе на 20% меньше урона', price: 330, apply: p => { p.hasTsarDecree = true; } },
    { id: 'iron_backrest', icon: '🪑', name: 'Стальная Спинка', desc: '+50 к максимальному здоровью и +15% к защите', price: 220, apply: p => { p.maxHp += 50; p.hp += 50; p.defense = Math.min(0.8, p.defense + 0.15); } }
];

const SHOP_STATS = [
    { 
        id: 'titan_reach', icon: '📏', name: 'Длинные Рычаги', 
        desc: '+22 к дальности поражения ЛЮБЫМ оружием (бесконечно!)', 
        price: 180, repeatable: true, 
        apply: p => { p.reachBonus = (p.reachBonus || 0) + 22; p.swordLen += 22; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+22 ДАЛЬНОСТЬ! 📏', '#38bdf8')); } 
    },
    { 
        id: 'heavy_strike', icon: '💥', name: 'Титановый Боёк', 
        desc: '+20 к базовому урону всех атак (бесконечно!)', 
        price: 210, repeatable: true, 
        apply: p => { p.damageBonus += 20; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+20 УРОН! 💥', '#ef4444')); } 
    },
    { 
        id: 'iron_core', icon: '💖', name: 'Стальное Сердце', 
        desc: '+75 к максимальному здоровью и моментальный отхил (бесконечно!)', 
        price: 190, repeatable: true, 
        apply: p => { p.maxHp += 75; p.hp += 75; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+75 MAX HP! 💖', '#10b981')); } 
    },
    { 
        id: 'laser_sharpen', icon: '🎯', name: 'Лазерная Заточка', 
        desc: '+15% к шансу нанести критический удар (вплоть до 95%)', 
        price: 240, repeatable: true, 
        apply: p => { p.critChance = Math.min(0.95, p.critChance + 0.15); floatingTexts.push(new FloatingText(p.x, p.y - 30, '+15% КРИТ! 🎯', '#fbbf24')); } 
    },
    { 
        id: 'vampiric_wood', icon: '🩸', name: 'Кровавая Полынь', 
        desc: '+8 HP вампиризма при уничтожении любого врага (стакается!)', 
        price: 250, repeatable: true, 
        apply: p => { p.vampirism = (p.vampirism || 0) + 8; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+8 ВАМПИРИЗМ! 🩸', '#ef4444')); } 
    },
    { 
        id: 'overdrive_springs', icon: '⚡', name: 'Пружины Овердрайва', 
        desc: 'Откат рывка ускорен еще на 15 кадров (бесконечно до минимума)', 
        price: 270, repeatable: true, 
        apply: p => { p.dashCooldownMax = Math.max(10, p.dashCooldownMax - 15); floatingTexts.push(new FloatingText(p.x, p.y - 30, 'РЫВОК БЫСТРЕЕ! ⚡', '#38bdf8')); } 
    },
    { 
        id: 'granite_base', icon: '🪨', name: 'Гранитный Монолит', 
        desc: '+10% к постоянной защите от любого урона (вплоть до 85%)', 
        price: 260, repeatable: true, 
        apply: p => { p.defense = Math.min(0.85, p.defense + 0.10); floatingTexts.push(new FloatingText(p.x, p.y - 30, '+10% БРОНЯ! 🪨', '#94a3b8')); } 
    },
    { 
        id: 'golden_sponge', icon: '🧲', name: 'Золотая Губка', 
        desc: '+100 к радиусу сбора и +25% к золоту со всех источников (стакается!)', 
        price: 230, repeatable: true, 
        apply: p => { p.pickupRadius += 100; p.coinBonus += 0.25; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+МАГНИТ И ЗОЛОТО! 🧲', '#fbbf24')); } 
    },
    { 
        id: 'tectonic_stomp', icon: '🌋', name: 'Тектонический Стомп', 
        desc: '+35 к урону от удара сверху (Space) по толпе (стакается!)', 
        price: 280, repeatable: true, 
        apply: p => { p.stompDamage += 35; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+35 СТОМП УРОН! 🌋', '#f97316')); } 
    },
    { 
        id: 'turbo_gliders', icon: '🏎️', name: 'Реактивные Полозья', 
        desc: '+0.6 к постоянной скорости перемещения стула (стакается!)', 
        price: 220, repeatable: true, 
        apply: p => { p.speed += 0.6; floatingTexts.push(new FloatingText(p.x, p.y - 30, '+СКОРОСТЬ! 🏎️', '#38bdf8')); } 
    }
];

const SHOP_UPGRADES = [...SHOP_ABILITIES, ...SHOP_STATS];

const HATS = [
    { id: 'none', name: 'Без шляпы', icon: '❌', perk: 'Без бонусов', price: 0 },
    { id: 'ushanka', name: 'Шапка-Ушанка', icon: '💂', perk: '+60 HP и заморозка атакующих', price: 290 },
    { id: 'cyber_visor', name: 'Кибер-Визор', icon: '🥽', perk: '+20% крита и авто-фокус', price: 340 },
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
    { id: 'rgb_gaming', name: 'RGB Геймерский', dark: '#111827', cushion: '#ec4899', isRgb: true, price: 500 },
    { id: 'diamond', name: 'Алмазный Трон', dark: '#0284c7', cushion: '#38bdf8', price: 450 },
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