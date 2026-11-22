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
let currentWeaponType = 'bonk_bat';
let controlScheme = 'universal';
let bossTimer = 300;
let bossInstance = null;
let bossCounter = 0;
let hardcoreLives = 3;

// КОМБО И ТРЯСКА ЭКРАНА
let comboCount = 0;
let comboTimer = 0;
let screenShake = 0;

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
let currentShopTab = 'abilities';

let royaleRadius = MAP_SIZE * 0.72;
let player = new Chair(MAP_SIZE / 2, MAP_SIZE / 2 + 250, "Дубовый Воин");
let chairs = [];
let bugs = [];
let arrows = [];

// Кэш оружия для ботов (чтобы не тормозить телефоны)
const BASIC_BOT_WEAPONS = Object.keys(WEAPONS).filter(k => !k.startsWith('super_') && k !== 'bonk_bat');

function triggerScreenShake(amt = 5) {
    screenShake = Math.max(screenShake, amt);
}

function registerKill() {
    comboCount++;
    comboTimer = 220;
    const badge = document.getElementById('hud-combo-badge');
    if (badge) {
        badge.style.display = 'block';
        badge.innerText = `🔥 КОМБО: x${comboCount}`;
        if (comboCount === 5) floatingTexts.push(new FloatingText(player.x, player.y - 45, 'БОНК-СТРИК! 💥', '#f59e0b'));
        if (comboCount === 10) floatingTexts.push(new FloatingText(player.x, player.y - 45, 'ТАБУРЕТОР! 👑', '#ef4444'));
    }
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, worldX: 0, worldY: 0 };
const keys = {};

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('mousedown', (e) => {
    sounds.init();
    if (!gameRunning || gamePaused || !player || player.hp <= 0) return;

    if (e.button === 0) {
        player.triggerSwing();
        if (typeof isMultiplayer !== 'undefined' && isMultiplayer && typeof networkCheckMeleeHits === 'function') {
            const effectiveReach = player.swordLen + (player.weapon.type.includes('spear') ? 35 : 0);
            const baseDmg = player.weapon.baseDmg + player.damageBonus;
            networkCheckMeleeHits(effectiveReach, baseDmg);
        }
    } else if (e.button === 2) {
        player.triggerAltAction();
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
    if (e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'Enter') {
        player.triggerSwing();
        if (typeof isMultiplayer !== 'undefined' && isMultiplayer && typeof networkCheckMeleeHits === 'function') {
            const effectiveReach = player.swordLen + (player.weapon.type.includes('spear') ? 35 : 0);
            const baseDmg = player.weapon.baseDmg + player.damageBonus;
            networkCheckMeleeHits(effectiveReach, baseDmg);
        }
    }
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
    if (badge) {
        if (currentMode === 'hardcore') {
            badge.style.display = 'block';
            badge.innerText = 'Жизни: ' + (hardcoreLives > 0 ? '❤️'.repeat(hardcoreLives) : '💀');
        } else {
            badge.style.display = 'none';
        }
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
    const setClass = (id, active) => {
        const el = document.getElementById(id);
        if (el) el.className = `tab-btn ${active ? 'active' : ''}`;
    };
    setClass('tab-abilities-btn', tab === 'abilities');
    setClass('tab-stats-btn', tab === 'stats');
    setClass('tab-super-btn', tab === 'super');
    setClass('tab-hats-btn', tab === 'hats');
    setClass('tab-colors-btn', tab === 'colors');
    renderShop();
}

function renderShop() {
    const area = document.getElementById('shop-content-area');
    area.innerHTML = '';
    document.getElementById('shop-coins').innerText = coins;

    if (currentShopTab === 'abilities' || currentShopTab === 'stats') {
        const isStatsTab = currentShopTab === 'stats';
        const list = isStatsTab ? SHOP_STATS : SHOP_ABILITIES;

        let curUpg = list.find(u => u.id === selectedShopUpgradeId);
        if (!curUpg) {
            curUpg = list[0];
            selectedShopUpgradeId = curUpg.id;
        }

        const isBought = boughtShopUpgrades.includes(curUpg.id);
        const isRepeatable = !!curUpg.repeatable;

        const container = document.createElement('div');
        container.className = 'shop-container-2col';

        const detailPanel = document.createElement('div');
        detailPanel.className = 'shop-detail-panel';

        let priceText = curUpg.price + ' 🪙';
        let btnText = 'КУПИТЬ';
        let btnClass = 'btn';

        if (isRepeatable) {
            priceText = `${curUpg.price} 🪙 (Многоразово)`;
            btnText = `КУПИТЬ (+1)`;
        } else if (isBought) {
            priceText = '✅ КУПЛЕНО';
            btnText = 'АКТИВНО';
            btnClass = 'btn btn-sec';
        }

        detailPanel.innerHTML = `
            <div>
                <div class="shop-detail-icon">${curUpg.icon}</div>
                <div class="shop-detail-title">${curUpg.name}</div>
                <div class="shop-detail-desc">${curUpg.desc}</div>
            </div>
            <div>
                <div class="shop-detail-price">${priceText}</div>
                <button class="${btnClass}" id="buy-upgrade-btn" style="margin-bottom:0;">
                    ${btnText}
                </button>
            </div>
        `;

        detailPanel.querySelector('#buy-upgrade-btn').onclick = () => {
            if (isBought && !isRepeatable) return;
            if (coins >= curUpg.price) {
                coins -= curUpg.price;
                if (!isRepeatable) {
                    boughtShopUpgrades.push(curUpg.id);
                }
                curUpg.apply(player);
                sounds.playLevelUp();
                renderShop();
            } else alert(`Не хватает монет! Нужно ${curUpg.price} 🪙`);
        };

        const grid = document.createElement('div');
        grid.className = 'shop-emoji-grid';

        list.forEach(u => {
            const slot = document.createElement('div');
            const bought = boughtShopUpgrades.includes(u.id);
            const active = u.id === selectedShopUpgradeId;
            const repeatable = !!u.repeatable;

            slot.className = `emoji-slot ${bought && !repeatable ? 'bought' : ''} ${active ? 'active' : ''} ${repeatable ? 'repeatable-slot' : ''}`;
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
        const mod = bossCounter % 3;
        if (mod === 1) bossInstance = new SofaBoss(player.x, player.y - 350);
        else if (mod === 2) bossInstance = new MicrowaveBoss(player.x, player.y - 350);
        else bossInstance = new FridgeBoss(player.x, player.y - 350);
    }
}

function startGame() {
    sounds.init();
    const nameInput = document.getElementById('player-name').value.trim() || 'Дубовый Воин';
    currentMode = document.getElementById('game-mode-select').value;
    
    currentWeaponType = document.getElementById('weapon-select').value;
    const startingWeapon = (WEAPONS[currentWeaponType]) ? currentWeaponType : 'bonk_bat';
    equippedWeapon = startingWeapon;

    controlScheme = document.getElementById('control-scheme-select').value;
    hardcoreLives = 3;
    comboCount = 0;
    updateHardcoreHUD();

    player = new Chair(MAP_SIZE / 2, MAP_SIZE / 2 + 250, nameInput, false, CHAIR_SKINS.find(s => s.id === equippedSkin) || CHAIR_SKINS[0], startingWeapon);

    // ЧИТ-КОДЫ И ПАСХАЛКИ НА НИКИ
    const clean = nameInput.toLowerCase();
    if (clean === 'secretdev') {
        coins = 1000000;
        player.maxHp = 99999;
        player.hp = 99999;
        player.damageBonus = 999;
        player.speed = 4.8;
        player.pickupRadius = 50;
        player.critChance = 0.4;
        player.regenRate = 10;
        sounds.playLevelUp();
        floatingTexts.push(new FloatingText(player.x, player.y - 30, '🛠️ DEV MODE АКТИВИРОВАН!', '#38bdf8'));
    } else if (clean === 'пидор' || clean === 'лох' || clean === 'какашка' || clean === 'блядота') {
        player.maxHp = 260; 
        player.hp = 260; 
        player.damageBonus = 25; 
        player.coinBonus = 0.5;
        player.regenRate += 4;
        floatingTexts.push(new FloatingText(player.x, player.y - 30, '🔥 260 HP + РЕГЕНЕРАЦИЯ!', '#fbbf24'));
    } else {
        player.maxHp = 200;
        player.hp = 200;
    }

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
    holyBeams = [];

    bossInstance = null; bossCounter = 0;
    royaleRadius = MAP_SIZE * 0.72;
    bossTimer = currentMode === 'bossrush' ? 45 : 300;

    // Спавн начальных ботов
    const botCount = currentMode === 'royale' ? 32 : 18;
    const canSpawnBots = (typeof isMultiplayer === 'undefined' || !isMultiplayer || (typeof isHost !== 'undefined' && isHost));
    if (canSpawnBots) {
        for (let i = 0; i < botCount; i++) {
            const botW = BASIC_BOT_WEAPONS[Math.floor(Math.random() * BASIC_BOT_WEAPONS.length)];
            chairs.push(new Chair(Math.random() * (MAP_SIZE - 200) + 100, Math.random() * (MAP_SIZE - 200) + 100, BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], true, null, botW));
        }
    }

    const types = ['nail', 'nail', 'screw', 'glue', 'varnish', 'wheels', 'energy_drink', 'golden_wrench', 'nuke'];
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
        const timerElem = document.getElementById('boss-timer');
        if (timerElem) timerElem.innerText = `${m}:${s}`;
        if (bossTimer === 0) forceBoss();
    }
}, 1000);

// СТОЛКНОВЕНИЯ СТУЛЬЕВ
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
                    if (relSpeed > 3.0) {
                        sounds.playHit();
                        const crashDmg = Math.min(8, Math.round(relSpeed * 0.8));
                        s1.takeDamage(crashDmg, s2);
                        if (s2.hp > 0) s2.takeDamage(crashDmg, s1);
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
    minimapCtx.beginPath(); minimapCtx.arc((MAP_SIZE / 2) * scale, (MAP_SIZE / 2) * scale, 300 * scale, 0, Math.PI * 2); minimapCtx.fill();

    minimapCtx.fillStyle = '#ef4444';
    chairs.forEach(c => {
        if (c !== player && c.hp > 0) minimapCtx.fillRect(c.x * scale - 1, c.y * scale - 1, 2.5, 2.5);
    });

    if (typeof isMultiplayer !== 'undefined' && isMultiplayer && typeof remotePlayers !== 'undefined') {
        minimapCtx.fillStyle = '#10b981';
        Object.keys(remotePlayers).forEach(id => {
            const rp = remotePlayers[id].chair;
            if (rp && rp.hp > 0) {
                minimapCtx.beginPath();
                minimapCtx.arc(rp.x * scale, rp.y * scale, 3.5, 0, Math.PI * 2);
                minimapCtx.fill();
            }
        });
    }

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

    // Безопасная очистка канваса с учетом DPR
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            comboCount = 0;
            const badge = document.getElementById('hud-combo-badge');
            if (badge) badge.style.display = 'none';
        }
    }

    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake * 2;
        shakeY = (Math.random() - 0.5) * screenShake * 2;
        screenShake *= 0.88;
        if (screenShake < 0.2) screenShake = 0;
    }

    const camera = { 
        x: player.x - window.innerWidth / 2 + shakeX, 
        y: player.y - window.innerHeight / 2 + shakeY 
    };
    mouse.worldX = mouse.x + camera.x; mouse.worldY = mouse.y + camera.y;

    const startCol = Math.floor(camera.x / TILE_SIZE), endCol = Math.floor((camera.x + window.innerWidth) / TILE_SIZE) + 1;
    const startRow = Math.floor(camera.y / TILE_SIZE), endRow = Math.floor((camera.y + window.innerHeight) / TILE_SIZE) + 1;
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

    for (let i = activeMines.length - 1; i >= 0; i--) {
        activeMines[i].update(); activeMines[i].draw(camera);
        if (activeMines[i].timer <= 0) activeMines.splice(i, 1);
    }
    for (let i = stickyTraps.length - 1; i >= 0; i--) {
        stickyTraps[i].update(); stickyTraps[i].draw(camera);
        if (stickyTraps[i].life <= 0) stickyTraps.splice(i, 1);
    }
    for (let i = holyBeams.length - 1; i >= 0; i--) {
        holyBeams[i].update(); holyBeams[i].draw(camera);
        if (holyBeams[i].life <= 0) holyBeams.splice(i, 1);
    }
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

    // Сбор предметов с пола
    const extraDroneRadius = player.hasMagnetDrone ? 280 : 0;
    for (let i = floorItems.length - 1; i >= 0; i--) {
        const item = floorItems[i];
        item.draw(camera);
        if (player.hp > 0 && Math.hypot(player.x - item.x, player.y - item.y) < player.radius + item.radius + player.pickupRadius + extraDroneRadius) {
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
            else if (item.type === 'energy_drink') {
                player.buffEnergyDrink = 360;
                sounds.playLevelUp();
                floatingTexts.push(new FloatingText(player.x, player.y - player.radius, '⚡ ТУРБО-ЭНЕРГЕТИК!', '#10b981'));
            } else if (item.type === 'golden_wrench') {
                player.buffQuadDmg = 300;
                sounds.playBounce();
                floatingTexts.push(new FloatingText(player.x, player.y - player.radius, '🌟 x3 УРОН!', '#fbbf24'));
            } else if (item.type === 'nuke') {
                sounds.playExplosion();
                triggerScreenShake(10);
                shockwaves.push(new Shockwave(player.x, player.y, 450, '#ef4444'));
                bugs.forEach(b => { b.hp = 0; });
                floatingTexts.push(new FloatingText(player.x, player.y - player.radius, '☢️ ЯДЕРНАЯ ЗАЧИСТКА!', '#ef4444'));
            }

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

    // Стрелы игрока и ботов (исправленный и закрытый цикл)
    for (let aIdx = arrows.length - 1; aIdx >= 0; aIdx--) {
        const arrow = arrows[aIdx];
        arrow.update(); arrow.draw(camera);
        if (arrow.x < 0 || arrow.x > MAP_SIZE || arrow.y < 0 || arrow.y > MAP_SIZE || arrow.life <= 0) {
            arrows.splice(aIdx, 1); continue;
        }
        if (bossInstance && Math.hypot(arrow.x - bossInstance.x, arrow.y - bossInstance.y) < bossInstance.radius) {
            bossInstance.takeDamage(arrow.damage); arrows.splice(aIdx, 1); continue;
        }
        let arrowHit = false;
        for (let bIdx = bugs.length - 1; bIdx >= 0; bIdx--) {
            if (Math.hypot(arrow.x - bugs[bIdx].x, arrow.y - bugs[bIdx].y) < bugs[bIdx].radius) {
                bugs[bIdx].hp -= arrow.damage;
                arrows.splice(aIdx, 1);
                arrowHit = true;
                break;
            }
        }
        if (arrowHit) continue;

        for (let cIdx = chairs.length - 1; cIdx >= 0; cIdx--) {
            const ch = chairs[cIdx];
            if (ch !== arrow.owner && ch.hp > 0 && Math.hypot(arrow.x - ch.x, arrow.y - ch.y) < ch.radius) {
                ch.takeDamage(arrow.damage, arrow.owner);
                arrows.splice(aIdx, 1);
                break;
            }
        }
    }

    if (bossInstance) { bossInstance.update(); bossInstance.draw(camera); }

    // Спавн жуков
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

    // Респавн ботов в сингле или у Хоста
    const canRespawnBots = (typeof isMultiplayer === 'undefined' || !isMultiplayer || (typeof isHost !== 'undefined' && isHost));
    if (currentMode !== 'royale' && canRespawnBots) {
        const targetBots = currentMode === 'swarm' ? 12 : 18;
        const currentBots = chairs.filter(c => c !== player && c.hp > 0).length;
        if (currentBots < targetBots && Math.random() < 0.035) {
            const botW = BASIC_BOT_WEAPONS[Math.floor(Math.random() * BASIC_BOT_WEAPONS.length)];
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 500 + 450;
            const bx = Math.max(100, Math.min(MAP_SIZE - 100, player.x + Math.cos(angle) * dist));
            const by = Math.max(100, Math.min(MAP_SIZE - 100, player.y + Math.sin(angle) * dist));
            chairs.push(new Chair(bx, by, BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], true, null, botW));
        }
    }

    handleStoolCollisions();

    // Отрисовка стульев
    for (let i = chairs.length - 1; i >= 0; i--) {
        const chair = chairs[i];
        chair.update(); chair.draw(camera);
        if (chair.hp <= 0 && chair !== player) chairs.splice(i, 1);
    }

    // Мультиплеерная отрисовка
    if (typeof isMultiplayer !== 'undefined' && isMultiplayer && typeof networkSendMyState === 'function') {
        networkSendMyState();
        if (typeof networkUpdateAndDraw === 'function') networkUpdateAndDraw(camera);
    }

    for (let idx = floatingTexts.length - 1; idx >= 0; idx--) {
        floatingTexts[idx].update(); floatingTexts[idx].draw(camera);
        if (floatingTexts[idx].life <= 0) floatingTexts.splice(idx, 1);
    }

    renderMinimap();

    // Обновление HUD
    const hudLvl = document.getElementById('hud-lvl');
    if (hudLvl) hudLvl.innerText = player.level;

    const hudXpVal = document.getElementById('hud-xp-val');
    if (hudXpVal) hudXpVal.innerText = `${Math.floor(player.xp)}/${player.nextXp}`;

    const hudXpBar = document.getElementById('hud-xp-bar');
    if (hudXpBar) hudXpBar.style.width = `${Math.min(100, (player.xp / player.nextXp) * 100)}%`;

    const hudHp = document.getElementById('hud-hp');
    if (hudHp) hudHp.innerText = `${Math.ceil(Math.max(0, player.hp))}/${player.maxHp}`;

    const hudCoins = document.getElementById('hud-coins');
    if (hudCoins) hudCoins.innerText = coins;

    const bowStatus = document.getElementById('hud-bow-status');
    if (bowStatus) bowStatus.innerText = player.hasBow ? `🏹 Лук: Вкл` : '🏹 Лук: Выкл';

    const sawStatus = document.getElementById('hud-saw-status');
    if (sawStatus) sawStatus.innerText = player.hasSaw ? `⚙️ Пила: Вкл` : '⚙️ Пила: Выкл';

    const dashElem = document.getElementById('hud-dash-status');
    if (dashElem) dashElem.innerText = player.dashCooldownTimer <= 0 ? '⚡ Рывок (Q): Готов' : `⚡ Рывок: ${(player.dashCooldownTimer/60).toFixed(1)}с`;

    const stompElem = document.getElementById('hud-stomp-status');
    if (stompElem) stompElem.innerText = player.stompCooldown <= 0 ? '🛑 Удар (Space): Готов' : `🛑 Удар: ${(player.stompCooldown/60).toFixed(1)}с`;

    if (gameRunning && !gamePaused) animFrameId = requestAnimationFrame(gameLoop);
}