// ======================================================
// СЕТЕВОЙ ДВИЖОК PEERJS (P2P МУЛЬТИПЛЕЕР ДО 5 ИГРОКОВ)
// ======================================================

let peer = null;
let myPeerId = null;
let isHost = false;
let isMultiplayer = false;
let connections = []; // Список подключений у Хоста (до 4 клиентов)
let hostConn = null;   // Подключение Клиента к Хосту
let remotePlayers = {}; // id -> { chair: Chair, lastUpdate: number }
let networkSendTimer = 0;

// Генерация короткого кода комнаты (например, STOOL-7492)
function generateRoomCode() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `STOOL-${num}`;
}

// ==========================================
// 1. СОЗДАНИЕ КОМНАТЫ (ХОСТ)
// ==========================================
function createMultiplayerRoom() {
    if (typeof Peer === 'undefined') {
        alert('Ошибка: библиотека PeerJS ещё не загрузилась. Проверь интернет!');
        return;
    }

    const roomCode = generateRoomCode();
    isHost = true;
    isMultiplayer = true;
    connections = [];
    remotePlayers = {};

    showRoomUI('Создание комнаты...', roomCode, '1/5');

    // Подключаемся к бесплатному облаку PeerJS
    peer = new Peer(roomCode, { debug: 1 });

    peer.on('open', (id) => {
        myPeerId = id;
        showRoomUI('Комната готова! Кликни на код, чтобы скопировать:', id, '1/5');
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) startBtn.innerText = 'НАЧАТЬ БИТВУ (ХОСТ) 👑';
    });

    peer.on('connection', (conn) => {
        if (connections.length >= 4) {
            conn.on('open', () => conn.send({ type: 'room_full' }));
            setTimeout(() => conn.close(), 500);
            return;
        }

        connections.push(conn);
        updateRoomPlayersCount();

        conn.on('data', (data) => {
            handleHostIncomingData(conn, data);
        });

        conn.on('close', () => {
            connections = connections.filter(c => c !== conn);
            delete remotePlayers[conn.peer];
            updateRoomPlayersCount();
            broadcastToAll({ type: 'player_leave', peerId: conn.peer });
        });
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        if (err.type === 'unavailable-id') {
            // Если ID занят, пробуем другой
            setTimeout(createMultiplayerRoom, 300);
        } else {
            alert('Ошибка создания комнаты: ' + err.type);
        }
    });
}

// ==========================================
// 2. ВХОД В КОМНАТУ (КЛИЕНТ)
// ==========================================
function joinMultiplayerRoom() {
    if (typeof Peer === 'undefined') {
        alert('Ошибка: библиотека PeerJS ещё не загрузилась. Проверь интернет!');
        return;
    }

    const code = prompt('Введи код комнаты (например, STOOL-1234):');
    if (!code || !code.trim()) return;

    const targetCode = code.trim().toUpperCase();
    isHost = false;
    isMultiplayer = true;
    remotePlayers = {};

    showRoomUI('Подключение к хосту...', targetCode, '...');

    peer = new Peer(); // Случайный ID для клиента

    peer.on('open', (id) => {
        myPeerId = id;
        hostConn = peer.connect(targetCode, { reliable: true });

        hostConn.on('open', () => {
            showRoomUI('✅ Успешно подключено к лобби!', targetCode, 'В игре');
            const startBtn = document.getElementById('start-game-btn');
            if (startBtn) startBtn.innerText = 'ВОЙТИ В БИТВУ ⚔️';
        });

        hostConn.on('data', (data) => {
            handleClientIncomingData(data);
        });

        hostConn.on('close', () => {
            alert('Связь с Хостом потеряна!');
            exitToMainMenu();
        });
    });

    peer.on('error', (err) => {
        alert('Не удалось подключиться к комнате: ' + err.type);
        document.getElementById('mp-room-info').style.display = 'none';
    });
}

// ==========================================
// 3. ОБРАБОТКА ДАННЫХ
// ==========================================
function handleHostIncomingData(senderConn, data) {
    if (data.type === 'state') {
        updateRemotePlayerState(senderConn.peer, data);
        // Хост ретранслирует состояние всем остальным клиентам
        connections.forEach(c => {
            if (c.peer !== senderConn.peer && c.open) {
                c.send(data);
            }
        });
    } else if (data.type === 'damage') {
        // Урон по игроку
        if (data.targetId === myPeerId) {
            if (player && player.hp > 0) player.takeDamage(data.dmg, null);
        } else {
            broadcastToAll(data);
        }
    }
}

function handleClientIncomingData(data) {
    if (data.type === 'room_full') {
        alert('Комната переполнена (максимум 5 игроков)!');
        exitToMainMenu();
    } else if (data.type === 'state') {
        updateRemotePlayerState(data.id, data);
    } else if (data.type === 'player_leave') {
        delete remotePlayers[data.peerId];
    } else if (data.type === 'damage') {
        if (data.targetId === myPeerId && player && player.hp > 0) {
            player.takeDamage(data.dmg, null);
        }
    }
}

function updateRemotePlayerState(id, data) {
    if (!remotePlayers[id]) {
        // Создаем удаленный стул
        const skinObj = CHAIR_SKINS.find(s => s.id === data.skin) || CHAIR_SKINS[0];
        const remoteChair = new Chair(data.x, data.y, data.name || 'Игрок', false, skinObj, data.weaponKey);
        remoteChair.isRemote = true;
        remotePlayers[id] = { chair: remoteChair, lastUpdate: Date.now() };
    }

    const rp = remotePlayers[id].chair;
    rp.x = data.x;
    rp.y = data.y;
    rp.vx = data.vx;
    rp.vy = data.vy;
    rp.angle = data.angle;
    rp.hp = data.hp;
    rp.maxHp = data.maxHp;
    rp.hat = data.hat;
    rp.isDashing = data.isDashing;
    rp.swordAngle = data.swordAngle;
    rp.swordLen = data.swordLen || rp.weapon.reach;

    if (data.weaponKey && rp.weapon.id !== data.weaponKey) {
        rp.equipWeapon(data.weaponKey);
    }

    if (data.isSwinging && !rp.isSwinging) {
        rp.triggerSwing();
    }
    remotePlayers[id].lastUpdate = Date.now();
}

function broadcastToAll(data) {
    connections.forEach(c => {
        if (c.open) c.send(data);
    });
}

// Отправка своего состояния по сети (вызывается из game.js каждые 2 кадра)
function networkSendMyState() {
    if (!isMultiplayer || !player || player.hp <= 0) return;

    networkSendTimer++;
    if (networkSendTimer % 2 !== 0) return; // 30 пакетов в секунду (плавно и без лагов)

    const payload = {
        type: 'state',
        id: myPeerId,
        name: player.name,
        x: Math.round(player.x),
        y: Math.round(player.y),
        vx: Math.round(player.vx * 10) / 10,
        vy: Math.round(player.vy * 10) / 10,
        angle: Math.round(player.angle * 100) / 100,
        hp: Math.round(player.hp),
        maxHp: player.maxHp,
        skin: player.skin ? player.skin.id : 'classic',
        hat: player.hat,
        weaponKey: player.weapon ? player.weapon.id : 'bonk_bat',
        swordLen: player.swordLen,
        swordAngle: player.swordAngle,
        isSwinging: player.isSwinging,
        isDashing: player.isDashing
    };

    if (isHost) {
        broadcastToAll(payload);
    } else if (hostConn && hostConn.open) {
        hostConn.send(payload);
    }
}

// Проверка попадания оружия игрока по удаленным живым друзьям
function networkCheckMeleeHits(effectiveReach, baseDmg) {
    if (!isMultiplayer || !player || player.hp <= 0) return;

    Object.keys(remotePlayers).forEach(peerId => {
        const rp = remotePlayers[peerId].chair;
        if (rp && rp.hp > 0) {
            const dist = Math.hypot(player.x - rp.x, player.y - rp.y);
            if (dist < effectiveReach + rp.radius) {
                const hitPacket = { type: 'damage', targetId: peerId, dmg: baseDmg };
                if (isHost) broadcastToAll(hitPacket);
                else if (hostConn && hostConn.open) hostConn.send(hitPacket);
            }
        }
    });
}

// Обновление и отрисовка друзей на экране
function networkUpdateAndDraw(camera) {
    if (!isMultiplayer) return;

    const now = Date.now();
    Object.keys(remotePlayers).forEach(peerId => {
        const item = remotePlayers[peerId];
        const rp = item.chair;

        // Если от игрока нет вестей 4 секунды — удаляем
        if (now - item.lastUpdate > 4000) {
            delete remotePlayers[peerId];
            return;
        }

        rp.update();
        rp.draw(camera);

        // Зеленая плашка [ИГРОК] над головой друга
        ctx.save();
        ctx.translate(rp.x - camera.x, rp.y - camera.y);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👤 [ИГРОК]', 0, -rp.radius - 24);
        ctx.restore();
    });

    // Обновляем бейдж онлайна в HUD
    const mpBadge = document.getElementById('hud-mp-badge');
    if (mpBadge) {
        mpBadge.style.display = 'block';
        const total = 1 + Object.keys(remotePlayers).length;
        mpBadge.innerText = `Онлайн: ${total}/5 игроков`;
    }
}

// ==========================================
// 4. ИНТЕРФЕЙС ЛОББИ
// ==========================================
function showRoomUI(status, code, count) {
    const box = document.getElementById('mp-room-info');
    const st = document.getElementById('mp-room-status');
    const cd = document.getElementById('mp-room-code');
    const cnt = document.getElementById('mp-players-count');

    if (box) box.style.display = 'block';
    if (st) st.innerText = status;
    if (cd) {
        cd.innerText = code ? `Код: ${code} 📋` : '';
        cd.onclick = () => {
            if (code) {
                navigator.clipboard.writeText(code);
                alert(`Код комнаты ${code} скопирован! Отправь его друзьям.`);
            }
        };
    }
    if (cnt) cnt.innerText = `Игроков в лобби: ${count}`;
}

function updateRoomPlayersCount() {
    const count = 1 + connections.length;
    showRoomUI(isHost ? 'Комната открыта! Ожидание друзей...' : 'В лобби', myPeerId, `${count}/5`);
}