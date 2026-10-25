// ======================================================
// ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ, ОБРАБОТЧИКИ И МАГАЗИН (game.js)
// ======================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

let gameRunning = false;
let gamePaused = false;
let animFrameId = null;
let currentMode = 'classic';
let currentWeaponType = 'coin_gun';
let controlScheme = 'universal';
let bossTimer = 300;
let bossInstance = null;
let bossCounter = 0;
let hardcoreLives = 3;

let dustParticles = [];
let floatingTexts = [];
let barrels = [];
let chests = [];
let floorItems = [];
let trampolines = [];
let bossCushions = [];
let magicOrbs = [];
let shockwaves = [];
let poisonPools = [];
let boomerangs = [];
let currentShopTab = 'upgrades';

let royaleRadius = MAP_SIZE * 0.72;
let player = new Chair(MAP_SIZE / 2, MAP_SIZE / 2 + 250, "Дубовый Воин");
let chairs = [];
let bugs = [];
let arrows = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const mouse = { x: canvas.width / 2, y: canvas.height / 2, worldX: 0, worldY: 0 };
const keys = {};

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Отключаем меню браузера на ПКМ
window.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('mousedown', (e) => {
    sounds.init();
    if (!gameRunning || gamePaused || !player || player.hp <= 0) return;

    if (e.button === 0) {
        player.triggerSwing(); // ЛКМ: Выстрел / замах
    } else if (e.button === 2) {
        player.triggerAltAction(); // ПКМ: Бросок монеты
    }
});

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Escape' && gameRunning) {
        exitToMainMenu(); return;
    }
    if (!gameRunning || gamePaused || !player || player.hp <= 0) return;

    if (e.code === 'KeyR' || e.code === 'KeyC') player.triggerAltAction();
    if (e.code === 'KeyQ' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') player.triggerDash();
    if (e.code === 'Space') {
        if (controlScheme === 'keyboard_only' && player.stompCooldown > 0) player.triggerSwing();
        else player.triggerStomp();
    }
    if (e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'Enter') player.triggerSwing();
});

window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function startLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(gameLoop);
}

function exitToMainMenu() {
    gameRunning = false; gamePaused = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    document.getElementById('hud').style.display = 'none';
    document.getElementById('level-up-modal').style.display = 'none';
    document.getElementById('shop-modal').style.display = 'none';
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('menu-overlay').style.display = 'flex';
}

function updateHardcoreHUD() {
    const badge = document.getElementById('hud-lives-badge');
    if (currentMode === 'hardcore') {
        badge.style.display = 'block';
        badge.innerText = 'Жизни: ' + (hardcoreLives > 0 ? '❤️'.repeat(hardcoreLives) : '💀');
    } else {
        badge.style.display = 'none';
    }
}

function showLevelUpModal() {
    gamePaused = true;
    const choices = document.getElementById('level-up-choices');
    choices.innerHTML = '';
    const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(upg => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="icon">${upg.icon}</div>
            <div class="title">${upg.title}</div>
            <div class="desc">${upg.desc}</div>
        `;
        card.onclick = () => {
            upg.apply(player);
            document.getElementById('level-up-modal').style.display = 'none';
            gamePaused = false; startLoop();
        };
        choices.appendChild(card);
    });
    document.getElementById('level-up-modal').style.display = 'flex';
}

function openShopMenu() { toggleShop(true); }

function toggleShop(show) {
    document.getElementById('shop-coins').innerText = coins;
    document.getElementById('shop-modal').style.display = show ? 'flex' : 'none';
    if (show) {
        gamePaused = true; renderShop();
    } else {
        gamePaused = false;
        if (gameRunning) startLoop();
    }
}

function switchShopTab(tab) {
    currentShopTab = tab;
    document.getElementById('tab-upgrades-btn').className = `tab-btn ${tab === 'upgrades' ? 'active' : ''}`;
    document.getElementById('tab-super-btn').className = `tab-btn ${tab === 'super' ? 'active' : ''}`;
    document.getElementById('tab-hats-btn').className = `tab-btn ${tab === 'hats' ? 'active' : ''}`;
    document.getElementById('tab-colors-btn').className = `tab-btn ${tab === 'colors' ? 'active' : ''}`;
    renderShop();
}

// РЕНДЕР МАГАЗИНА: СЛЕВА ИНСПЕКТОР, СПРАВА КВАДРАТЫ
function renderShop() {
    const area = document.getElementById('shop-content-area');
    area.innerHTML = '';
    document.getElementById('shop-coins').innerText = coins;

    if (currentShopTab === 'upgrades') {
        const container = document.createElement('div');
        container.className = 'shop-container-2col';

        const curUpg = SHOP_UPGRADES.find(u => u.id === selectedShopUpgradeId) || SHOP_UPGRADES[0];
        const isBought = boughtShopUpgrades.includes(curUpg.id);

        const detailPanel = document.createElement('div');
        detailPanel.className = 'shop-detail-panel';
        detailPanel.innerHTML = `
            <div>
                <div class="shop-detail-icon">${curUpg.icon}</div>
                <div class="shop-detail-title">${curUpg.name}</div>
                <div class="shop-detail-desc">${curUpg.desc}</div>
            </div>
            <div>
                <div class="shop-detail-price">${isBought ? '✅ КУПЛЕНО' : curUpg.price + ' 🪙'}</div>
                <button class="btn ${isBought ? 'btn-sec' : ''}" id="buy-upgrade-btn" style="margin-bottom:0;">
                    ${isBought ? 'АКТИВНО' : 'КУПИТЬ'}
                </button>
            </div>
        `;

        detailPanel.querySelector('#buy-upgrade-btn').onclick = () => {
            if (isBought) return;
            if (coins >= curUpg.price) {
                coins -= curUpg.price;
                boughtShopUpgrades.push(curUpg.id);
                curUpg.apply(player);
                sounds.playLevelUp();
                renderShop();
            } else alert(`Не хватает монет! Нужно ${curUpg.price} 🪙`);
        };

        const grid = document.createElement('div');
        grid.className = 'shop-emoji-grid';

        SHOP_UPGRADES.forEach(u => {
            const slot = document.createElement('div');
            const bought = boughtShopUpgrades.includes(u.id);
            const active = u.id === selectedShopUpgradeId;
            slot.className = `emoji-slot ${bought ? 'bought' : ''} ${active ? 'active' : ''}`;
            slot.innerText = u.icon;
            slot.title = u.name;
            slot.onclick = () => {
                selectedShopUpgradeId = u.id;
                renderShop();
            };
            grid.appendChild(slot);
        });

        container.appendChild(detailPanel);
        container.appendChild(grid);
        area.appendChild(container);

    } else if (currentShopTab === 'super') {
        const grid = document.createElement('div');
        grid.className = 'shop-grid';
        SUPER_WEAPONS_SHOP.forEach(w => {
            const item = document.createElement('div');
            item.className = 'shop-item';
            const isEquipped = player.weapon.id === w.id;
            item.innerHTML = `
                <div style="font-size:26px;">${w.icon}</div>
                <div style="font-weight:bold; font-size:13px; color:#c084fc;">${w.name}</div>
                <div style="font-size:11px; color:#e9d5ff;">${w.desc}</div>
                <div style="font-weight:bold; color:#fbbf24; margin-top:6px;">${isEquipped ? '✨ В РУКАХ' : w.price + ' 🪙'}</div>
            `;
            item.onclick = () => {
                if (isEquipped) return;
                if (coins >= w.price) {
                    coins -= w.price; w.apply(player);
                    sounds.playLevelUp(); renderShop();
                } else alert(`Нужно ${w.price} 🪙`);
            };
            grid.appendChild(item);
        });
        area.appendChild(grid);

    } else if (currentShopTab === 'hats') {
        const grid = document.createElement('div');
        grid.className = 'shop-grid';
        HATS.forEach(hat => {
            const owned = ownedHats.includes(hat.id);
            const equipped = equippedHat === hat.id;
            const item = document.createElement('div');
            item.className = `shop-item ${owned ? 'owned' : ''}`;
            item.innerHTML = `
                <div style="font-size:26px;">${hat.icon}</div>
                <div style="font-weight:bold; font-size:13px;">${hat.name}</div>
                <div style="font-size:11px; color:#38bdf8;">${hat.perk}</div>
                <div style="font-size:12px; margin-top:4px;">${owned ? (equipped ? 'ЭКИПИРОВАНО' : 'КУПЛЕНО') : hat.price + ' 🪙'}</div>
            `;
            item.onclick = () => {
                if (owned) {
                    equippedHat = hat.id; player.hat = hat.id; player.applyHatPerks();
                } else if (coins >= hat.price) {
                    coins -= hat.price; ownedHats.push(hat.id);
                    equippedHat = hat.id; player.hat = hat.id; player.applyHatPerks();
                }
                renderShop();
            };
            grid.appendChild(item);
        });
        area.appendChild(grid);

    } else if (currentShopTab === 'colors') {
        const grid = document.createElement('div');
        grid.className = 'shop-grid';
        CHAIR_SKINS.forEach(skin => {
            const owned = ownedSkins.includes(skin.id);
            const equipped = equippedSkin === skin.id;
            const item = document.createElement('div');
            item.className = `shop-item ${owned ? 'owned' : ''}`;
            item.innerHTML = `
                <div style="width:32px; height:32px; border-radius:6px; background:${skin.cushion}; border:2px solid ${skin.dark}; margin:0 auto 4px auto;"></div>
                <div style="font-weight:bold; font-size:12px;">${skin.name}</div>
                <div style="font-size:11px; margin-top:4px;">${owned ? (equipped ? 'ЭКИПИРОВАНО' : 'ВЫБРАТЬ') : skin.price + ' 🪙'}</div>
            `;
            item.onclick = () => {
                if (owned) {
                    equippedSkin = skin.id; player.skin = skin;
                } else if (coins >= skin.price) {
                    coins -= skin.price; ownedSkins.push(skin.id);
                    equippedSkin = skin.id; player.skin = skin;
                }
                renderShop();
            };
            grid.appendChild(item);
        });
        area.appendChild(grid);
    }
}

function forceBoss() {
    if (!bossInstance && gameRunning && !gamePaused) {
        sounds.playBounce(); bossCounter++;
        bossInstance = (bossCounter % 2 === 1) ? new SofaBoss(player.x, player.y - 350) : new MicrowaveBoss(player.x, player.y - 350);
    }
}

function startGame() {
    sounds.init();
    const nameInput = document.getElementById('player-name').value.trim() || 'Дубовый Воин';
    currentMode = document.getElementById('game-mode-select').value;
    currentWeaponType = document.getElementById('weapon-select').value;
    controlScheme = document.getElementById('control-scheme-select').value;
    hardcoreLives = 3;
    updateHardcoreHUD();

    player = new Chair(MAP_SIZE / 2, MAP_SIZE / 2 + 250, nameInput, false, CHAIR_SKINS.find(s => s.id === equippedSkin) || CHAIR_SKINS[0], currentWeaponType);

    // === ЧИТ-КОД SECRETDEV (ЧИСТЫЕ СТАТЫ БЕЗ ВИЗУАЛЬНОГО ХАОСА И БЕЗ АВТОСЕЙВА) ===
    const clean = nameInput.toLowerCase();
    if (clean === 'secretdev') {
        coins = 1000000;             // 1 000 000 монет на тесты
        player.maxHp = 99999;        // Дофига ХП
        player.hp = 99999;
        player.damageBonus = 999;    // Мощный урон
        player.speed = 4.8;          // Умеренная скорость
        player.pickupRadius = 50;    // Сниженный, аккуратный радиус подбора
        player.critChance = 0.4;     // Крит
        player.regenRate = 10;       // Регенерация
        // Никаких пил, стрел, молний, гигантов и автосейва!
        sounds.playLevelUp();
        floatingTexts.push(new FloatingText(player.x, player.y - 30, '🛠️ DEV MODE АКТИВИРОВАН!', '#38bdf8'));
    } else if (clean === 'пидор' || clean === 'блядота' || clean === 'какашка') {
        player.maxHp = 150; player.hp = 150; player.damageBonus = 15; player.speed *= 1.3; player.coinBonus = 0.3;
    }

    // Применяем купленные способности
    boughtShopUpgrades.forEach(id => {
        const upg = SHOP_UPGRADES.find(u => u.id === id);
        if (upg) upg.apply(player);
    });

    chairs = [player];
    bugs = []; arrows = []; barrels = []; chests = []; floorItems = [];
    trampolines = []; bossCushions = []; floatingTexts = []; magicOrbs = [];
    shockwaves = []; poisonPools = []; boomerangs = []; airSlashes = [];
    judgementCuts = []; superNovaOrbs = []; tossedCoins = []; railBeams = [];
    nutProjectiles = []; ikeaTurrets = []; ikeaTeslas = []; activeMines = []; stickyTraps = [];

    bossInstance = null; bossCounter = 0;
    royaleRadius = MAP_SIZE * 0.72;
    bossTimer = currentMode === 'bossrush' ? 45 : 300;

    const botCount = currentMode === 'royale' ? 32 : 20;
    const weaponKeys = Object.keys(WEAPONS).filter(k => !k.startsWith('super_'));
    for (let i = 0; i < botCount; i++) {
        const botW = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        chairs.push(new Chair(Math.random() * (MAP_SIZE - 200) + 100, Math.random() * (MAP_SIZE - 200) + 100, BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], true, null, botW));
    }

    const types = ['nail', 'nail', 'screw', 'glue', 'varnish', 'wheels'];
    for (let i = 0; i < 180; i++) floorItems.push(new FloorItem(Math.random() * MAP_SIZE, Math.random() * MAP_SIZE, types[Math.floor(Math.random() * types.length)]));
    for (let i = 0; i < 12; i++) {
        barrels.push(new Barrel(Math.random() * (MAP_SIZE - 200) + 100, Math.random() * (MAP_SIZE - 200) + 100));
        chests.push(new Chest(Math.random() * (MAP_SIZE - 200) + 100, Math.random() * (MAP_SIZE - 200) + 100));
        trampolines.push(new Trampoline(Math.random() * (MAP_SIZE - 200) + 100, Math.random() * (MAP_SIZE - 200) + 100));
    }

    document.getElementById('hud-mode-badge').innerText = `Режим: ${currentMode}`;
    document.getElementById('hud-weapon-badge').innerText = `Оружие: ${player.weapon.name}`;
    document.getElementById('menu-overlay').style.display = 'none';
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    gameRunning = true; gamePaused = false;
    startLoop();
}

function restartGame() {
    document.getElementById('game-over-modal').style.display = 'none';
    startGame();
}

setInterval(() => {
    if (gameRunning && !gamePaused && bossTimer > 0) {
        bossTimer--;
        const m = String(Math.floor(bossTimer / 60)).padStart(2, '0');
        const s = String(bossTimer % 60).padStart(2, '0');
        document.getElementById('boss-timer').innerText = `${m}:${s}`;
        if (bossTimer === 0) forceBoss();
    }
}, 1000);

function handleStoolCollisions() {
    for (let i = 0; i < chairs.length; i++) {
        for (let j = i + 1; j < chairs.length; j++) {
            const s1 = chairs[i], s2 = chairs[j];
            if (!s1 || !s2 || s1.hp <= 0 || s2.hp <= 0) continue;

            const dx = s2.x - s1.x, dy = s2.y - s1.y;
            const dist = Math.hypot(dx, dy);
            const minDist = s1.radius + s2.radius;

            if (dist < minDist && dist > 0.001) {
                const overlap = minDist - dist;
                const nx = dx / dist, ny = dy / dist;

                s1.x -= nx * overlap * 0.5; s1.y -= ny * overlap * 0.5;
                s2.x += nx * overlap * 0.5; s2.y += ny * overlap * 0.5;

                const rvx = s2.vx - s1.vx, rvy = s2.vy - s1.vy;
                const velAlong = rvx * nx + rvy * ny;

                if (velAlong < 0) {
                    const impulse = -velAlong * (s1.knockbackMult || 1.0);
                    s1.vx -= nx * impulse * 0.85; s1.vy -= ny * impulse * 0.85;
                    s2.vx += nx * impulse * 0.85; s2.vy += ny * impulse * 0.85;

                    const relSpeed = Math.hypot(rvx, rvy);
                    if (relSpeed > 2.5) {
                        sounds.playHit();
                        s1.takeDamage(12 * (relSpeed / 5), s2);
                        if (s2.hp > 0) s2.takeDamage(12 * (relSpeed / 5), s1);
                    }
                }
            }
        }
    }
}

function renderMinimap() {
    minimapCtx.clearRect(0, 0, 130, 130);
    minimapCtx.fillStyle = '#0f172a'; minimapCtx.fillRect(0, 0, 130, 130);
    const scale = 130 / MAP_SIZE;

    minimapCtx.fillStyle = 'rgba(234, 179, 8, 0.2)';
    minimapCtx.beginPath(); minimapCtx.arc(MAP_SIZE / 2 * scale, MAP_SIZE / 2 * scale, 300 * scale, 0, Math.PI * 2); minimapCtx.fill();

    minimapCtx.fillStyle = '#ef4444';
    chairs.forEach(c => {
        if (c !== player && c.hp > 0) minimapCtx.fillRect(c.x * scale - 1, c.y * scale - 1, 2.5, 2.5);
    });
    if (bossInstance && bossInstance.hp > 0) {
        minimapCtx.fillStyle = '#f59e0b';
        minimapCtx.beginPath(); minimapCtx.arc(bossInstance.x * scale, bossInstance.y * scale, 4.5, 0, Math.PI * 2); minimapCtx.fill();
    }
    if (player && player.hp > 0) {
        minimapCtx.fillStyle = '#10b981';
        minimapCtx.beginPath(); minimapCtx.arc(player.x * scale, player.y * scale, 4, 0, Math.PI * 2); minimapCtx.fill();
    }
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const camera = { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2 };
    mouse.worldX = mouse.x + camera.x; mouse.worldY = mouse.y + camera.y;

    const startCol = Math.floor(camera.x / TILE_SIZE), endCol = Math.floor((camera.x + canvas.width) / TILE_SIZE) + 1;
    const startRow = Math.floor(camera.y / TILE_SIZE), endRow = Math.floor((camera.y + canvas.height) / TILE_SIZE) + 1;
    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            ctx.fillStyle = (c + r) % 2 === 0 ? '#070c1e' : '#030611';
            ctx.fillRect(c * TILE_SIZE - camera.x, r * TILE_SIZE - camera.y, TILE_SIZE, TILE_SIZE);
        }
    }

    // Кухонный стол
    ctx.save();
    ctx.fillStyle = '#654321'; ctx.fillRect(MAP_SIZE / 2 - 160 - camera.x, MAP_SIZE / 2 - 100 - camera.y, 320, 200);
    ctx.strokeStyle = '#3d2612'; ctx.lineWidth = 5; ctx.strokeRect(MAP_SIZE / 2 - 160 - camera.x, MAP_SIZE / 2 - 100 - camera.y, 320, 200);
    ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center';
    ctx.fillText('КУХОННЫЙ СТОЛ', MAP_SIZE / 2 - camera.x, MAP_SIZE / 2 + 8 - camera.y);
    ctx.restore();

    ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 8;
    ctx.strokeRect(-camera.x, -camera.y, MAP_SIZE, MAP_SIZE);

    if (currentMode === 'royale') {
        royaleRadius = Math.max(220, royaleRadius - 0.22);
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(MAP_SIZE / 2 - camera.x, MAP_SIZE / 2 - camera.y, Math.max(1, royaleRadius), 0, Math.PI * 2); ctx.stroke();
        if (Math.hypot(player.x - MAP_SIZE / 2, player.y - MAP_SIZE / 2) > royaleRadius) player.takeDamage(0.6, null);
    }

    // Мины и ловушки
    for (let i = activeMines.length - 1; i >= 0; i--) {
        activeMines[i].update(); activeMines[i].draw(camera);
        if (activeMines[i].timer <= 0) activeMines.splice(i, 1);
    }
    for (let i = stickyTraps.length - 1; i >= 0; i--) {
        stickyTraps[i].update(); stickyTraps[i].draw(camera);
        if (stickyTraps[i].life <= 0) stickyTraps.splice(i, 1);
    }

    // Гайки
    for (let i = nutProjectiles.length - 1; i >= 0; i--) {
        nutProjectiles[i].update(); nutProjectiles[i].draw(camera);
        if (nutProjectiles[i].life <= 0 || nutProjectiles[i].bounces <= 0) nutProjectiles.splice(i, 1);
    }
    for (let i = ikeaTurrets.length - 1; i >= 0; i--) {
        ikeaTurrets[i].update(); ikeaTurrets[i].draw(camera);
        if (ikeaTurrets[i].life <= 0) ikeaTurrets.splice(i, 1);
    }
    for (let i = ikeaTeslas.length - 1; i >= 0; i--) {
        ikeaTeslas[i].update(); ikeaTeslas[i].draw(camera);
        if (ikeaTeslas[i].life <= 0) ikeaTeslas.splice(i, 1);
    }

    for (let i = poisonPools.length - 1; i >= 0; i--) {
        poisonPools[i].update(); poisonPools[i].draw(camera);
        if (poisonPools[i].life <= 0) poisonPools.splice(i, 1);
    }
    for (let i = boomerangs.length - 1; i >= 0; i--) {
        boomerangs[i].update(); boomerangs[i].draw(camera);
        if (boomerangs[i].life <= 0 || (boomerangs[i].returning && Math.hypot(boomerangs[i].x - player.x, boomerangs[i].y - player.y) < 25)) boomerangs.splice(i, 1);
    }
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        shockwaves[i].update(); shockwaves[i].draw(camera);
        if (shockwaves[i].life <= 0) shockwaves.splice(i, 1);
    }
    for (let i = tossedCoins.length - 1; i >= 0; i--) {
        tossedCoins[i].update(); tossedCoins[i].draw(camera);
        if (tossedCoins[i].life <= 0 || tossedCoins[i].hit) tossedCoins.splice(i, 1);
    }
    for (let i = railBeams.length - 1; i >= 0; i--) {
        railBeams[i].update(); railBeams[i].draw(camera);
        if (railBeams[i].life <= 0) railBeams.splice(i, 1);
    }
    for (let i = judgementCuts.length - 1; i >= 0; i--) {
        judgementCuts[i].update(); judgementCuts[i].draw(camera);
        if (judgementCuts[i].timer <= 0) judgementCuts.splice(i, 1);
    }
    for (let i = superNovaOrbs.length - 1; i >= 0; i--) {
        superNovaOrbs[i].update(); superNovaOrbs[i].draw(camera);
        if (superNovaOrbs[i].life <= 0 || superNovaOrbs[i].x < 0 || superNovaOrbs[i].x > MAP_SIZE || superNovaOrbs[i].y < 0 || superNovaOrbs[i].y > MAP_SIZE) superNovaOrbs.splice(i, 1);
    }
    for (let i = airSlashes.length - 1; i >= 0; i--) {
        airSlashes[i].update(); airSlashes[i].draw(camera);
        if (airSlashes[i].x < 0 || airSlashes[i].x > MAP_SIZE || airSlashes[i].y < 0 || airSlashes[i].y > MAP_SIZE || airSlashes[i].life <= 0) airSlashes.splice(i, 1);
    }
    for (let i = magicOrbs.length - 1; i >= 0; i--) {
        magicOrbs[i].update(); magicOrbs[i].draw(camera);
        if (magicOrbs[i].life <= 0 || magicOrbs[i].x < 0 || magicOrbs[i].x > MAP_SIZE || magicOrbs[i].y < 0 || magicOrbs[i].y > MAP_SIZE) magicOrbs.splice(i, 1);
    }

    trampolines.forEach(t => {
        t.update(); t.draw(camera);
        if (Math.hypot(player.x - t.x, player.y - t.y) < player.radius + t.radius) t.trigger(player);
    });
    barrels.forEach(b => b.draw(camera));
    chests.forEach(c => c.draw(camera));

    for (let i = floorItems.length - 1; i >= 0; i--) {
        const item = floorItems[i];
        item.draw(camera);
        if (player.hp > 0 && Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + player.pickupRadius) {
            sounds.playPick();
            if (player.hasFortuneExplosion) {
                sounds.playExplosion();
                shockwaves.push(new Shockwave(player.x, player.y, 110, '#fbbf24'));
                bugs.forEach(b => { if (Math.hypot(b.x - player.x, b.y - player.y) < 110) b.hp -= 40; });
            }
            if (item.type === 'nail') player.addXp(15);
            else if (item.type === 'screw') player.addXp(25);
            else if (item.type === 'glue') {
                player.hp = Math.min(player.maxHp, player.hp + 35);
                floatingTexts.push(new FloatingText(player.x, player.y - player.radius, '+35 HP', '#10b981'));
            } else if (item.type === 'varnish') player.buffVarnish = 360;
            else if (item.type === 'wheels') player.buffWheels = 360;

            floorItems.splice(i, 1);
            floorItems.push(new FloorItem(Math.random() * MAP_SIZE, Math.random() * MAP_SIZE, item.type));
        }
    }

    for (let i = bossCushions.length - 1; i >= 0; i--) {
        const c = bossCushions[i];
        c.x += c.vx; c.y += c.vy; c.life--;
        ctx.save();
        ctx.translate(c.x - camera.x, c.y - camera.y);
        ctx.fillStyle = '#be123c'; ctx.fillRect(-c.radius, -c.radius, c.radius * 2, c.radius * 2);
        ctx.restore();
        if (player.hp > 0 && Math.hypot(player.x - c.x, player.y - c.y) < player.radius + c.radius) {
            player.takeDamage(c.damage, null); bossCushions.splice(i, 1); continue;
        }
        if (c.life <= 0) bossCushions.splice(i, 1);
    }

    for (let aIdx = arrows.length - 1; aIdx >= 0; aIdx--) {
        const arrow = arrows[aIdx];
        arrow.update(); arrow.draw(camera);
        if (arrow.x < 0 || arrow.x > MAP_SIZE || arrow.y < 0 || arrow.y > MAP_SIZE || arrow.life <= 0) {
            arrows.splice(aIdx, 1); continue;
        }
        if (bossInstance && Math.hypot(arrow.x - bossInstance.x, arrow.y - bossInstance.y) < bossInstance.radius) {
            bossInstance.takeDamage(arrow.damage); arrows.splice(aIdx, 1); continue;
        }
        for (let bIdx = bugs.length - 1; bIdx >= 0; bIdx--) {
            if (Math.hypot(arrow.x - bugs[bIdx].x, arrow.y - bugs[bIdx].y) < bugs[bIdx].radius) {
                bugs[bIdx].hp -= arrow.damage; arrows.splice(aIdx, 1); break;
            }
        }
    }

    if (bossInstance) { bossInstance.update(); bossInstance.draw(camera); }

    const maxBugs = currentMode === 'swarm' ? 65 : 25;
    if (bugs.length < maxBugs && Math.random() < 0.04) {
        const angle = Math.random() * Math.PI * 2, dist = Math.random() * 500 + 350;
        bugs.push(new Bug(player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist, Math.random() > 0.5));
    }

    for (let i = bugs.length - 1; i >= 0; i--) {
        const bug = bugs[i];
        bug.update(); bug.draw(camera);
        if (bug.hp <= 0) {
            player.onKillTarget();
            player.addXp(bug.isMosquito ? 12 : (bug.isCookie ? 16 : 22));
            bugs.splice(i, 1);
        }
    }

    handleStoolCollisions();

    for (let i = chairs.length - 1; i >= 0; i--) {
        const chair = chairs[i];
        chair.update(); chair.draw(camera);
        if (chair.hp <= 0 && chair !== player) chairs.splice(i, 1);
    }

    for (let idx = floatingTexts.length - 1; idx >= 0; idx--) {
        floatingTexts[idx].update(); floatingTexts[idx].draw(camera);
        if (floatingTexts[idx].life <= 0) floatingTexts.splice(idx, 1);
    }

    renderMinimap();

    document.getElementById('hud-lvl').innerText = player.level;
    document.getElementById('hud-xp-val').innerText = `${Math.floor(player.xp)}/${player.nextXp}`;
    document.getElementById('hud-xp-bar').style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;
    document.getElementById('hud-hp').innerText = `${Math.ceil(Math.max(0, player.hp))}/${player.maxHp}`;
    document.getElementById('hud-coins').innerText = coins;
    document.getElementById('hud-bow-status').innerText = player.hasBow ? `🏹 Лук: Вкл` : '🏹 Лук: Выкл';
    document.getElementById('hud-saw-status').innerText = player.hasSaw ? `⚙️ Пила: Вкл` : '⚙️ Пила: Выкл';

    const dashElem = document.getElementById('hud-dash-status');
    dashElem.innerText = player.dashCooldownTimer <= 0 ? '⚡ Рывок (Q): Готов' : `⚡ Рывок: ${(player.dashCooldownTimer/60).toFixed(1)}с`;

    const stompElem = document.getElementById('hud-stomp-status');
    stompElem.innerText = player.stompCooldown <= 0 ? '🛑 Удар (Space): Готов' : `🛑 Удар: ${(player.stompCooldown/60).toFixed(1)}с`;

    if (gameRunning && !gamePaused) animFrameId = requestAnimationFrame(gameLoop);
}