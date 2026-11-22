// ======================================================
// СЕНСОРНЫЙ КОНТРОЛЛЕР ДЛЯ МОБИЛОК И ТЕСТА НА ПК (touch.js)
// ======================================================

const touchControls = {
    enabled: false,
    isMoving: false,
    moveX: 0,
    moveY: 0,
    angle: 0,

    stickTouchId: null,
    isMouseDragging: false,
    stickCenterX: 0,
    stickCenterY: 0,
    maxRadius: 46,

    attackInterval: null,
    forceVisible: false // Переключатель для теста на ПК
};

// Функция переключения видимости джойстика
function updateMobileControlsVisibility() {
    const layer = document.getElementById('mobile-controls-layer');
    if (!layer) return;

    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    const isTouchMode = (typeof controlScheme !== 'undefined' && controlScheme === 'touch_mobile');

    // Показываем, если это телефон, если выбран режим сенсора в меню, или если включен forceVisible на ПК
    if (typeof gameRunning !== 'undefined' && gameRunning && (isTouchDevice || isTouchMode || touchControls.forceVisible)) {
        layer.style.display = 'block';
        touchControls.enabled = true;
    } else {
        layer.style.display = 'none';
        touchControls.enabled = false;
    }
}

// Горячая клавиша "J" на ПК для включения/выключения джойстика прямо в бою
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyJ') {
        touchControls.forceVisible = !touchControls.forceVisible;
        updateMobileControlsVisibility();
        if (typeof floatingTexts !== 'undefined' && typeof player !== 'undefined' && player) {
            floatingTexts.push(new FloatingText(player.x, player.y - 35, touchControls.forceVisible ? '🕹️ ДЖОЙСТИК ВКЛ' : '🕹️ ДЖОЙСТИК ВЫКЛ', '#38bdf8'));
        }
    }
});

function initTouchControls() {
    updateMobileControlsVisibility();

    const stickZone = document.getElementById('touch-stick-zone');
    const stickBase = document.getElementById('touch-stick-base');
    const stickKnob = document.getElementById('touch-stick-knob');

    const btnAttack = document.getElementById('btn-touch-attack');
    const btnCoin = document.getElementById('btn-touch-coin');
    const btnDash = document.getElementById('btn-touch-dash');
    const btnStomp = document.getElementById('btn-touch-stomp');

    if (!stickZone || !stickKnob || !btnAttack) return;

    // Общая функция расчёта смещения джойстика (для пальца и мыши)
    function updateStickPosition(clientX, clientY) {
        const dx = clientX - touchControls.stickCenterX;
        const dy = clientY - touchControls.stickCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            touchControls.isMoving = true;
            touchControls.angle = Math.atan2(dy, dx);

            const clampedDist = Math.min(dist, touchControls.maxRadius);
            const normX = dx / dist;
            const normY = dy / dist;

            touchControls.moveX = normX * (clampedDist / touchControls.maxRadius);
            touchControls.moveY = normY * (clampedDist / touchControls.maxRadius);

            stickKnob.style.transform = `translate(calc(-50% + ${normX * clampedDist}px), calc(-50% + ${normY * clampedDist}px))`;
        } else {
            resetStick();
        }
    }

    function resetStick() {
        touchControls.isMoving = false;
        touchControls.moveX = 0;
        touchControls.moveY = 0;
        stickKnob.style.transform = `translate(-50%, -50%)`;
    }

    // ==========================================
    // 1. УПРАВЛЕНИЕ ДЖОЙСТИКОМ (СЕНСОР НА ТЕЛЕФОНЕ)
    // ==========================================
    stickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sounds.init();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touchControls.stickTouchId === null) {
                touchControls.stickTouchId = touch.identifier;
                const rect = stickBase.getBoundingClientRect();
                touchControls.stickCenterX = rect.left + rect.width / 2;
                touchControls.stickCenterY = rect.top + rect.height / 2;
                updateStickPosition(touch.clientX, touch.clientY);
                break;
            }
        }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (touchControls.stickTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === touchControls.stickTouchId) {
                updateStickPosition(touch.clientX, touch.clientY);
                break;
            }
        }
    }, { passive: false });

    function handleTouchEnd(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchControls.stickTouchId) {
                touchControls.stickTouchId = null;
                resetStick();
                break;
            }
        }
    }
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    // ==========================================
    // 2. УПРАВЛЕНИЕ ДЖОЙСТИКОМ (МЫШЬ НА ПК ДЛЯ ТЕСТА)
    // ==========================================
    stickZone.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation(); // Чтобы ЛКМ не махал битой
        sounds.init();

        touchControls.isMouseDragging = true;
        const rect = stickBase.getBoundingClientRect();
        touchControls.stickCenterX = rect.left + rect.width / 2;
        touchControls.stickCenterY = rect.top + rect.height / 2;
        updateStickPosition(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
        if (!touchControls.isMouseDragging) return;
        e.preventDefault();
        updateStickPosition(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
        if (touchControls.isMouseDragging) {
            touchControls.isMouseDragging = false;
            resetStick();
        }
    });

    // ==========================================
    // 3. ДЕЙСТВИЯ КНОПОК
    // ==========================================
    function doAttackAction() {
        if (!gameRunning || gamePaused || !player || player.hp <= 0) return;
        player.triggerSwing();

        if (typeof isMultiplayer !== 'undefined' && isMultiplayer && typeof networkCheckMeleeHits === 'function') {
            const effectiveReach = player.swordLen + (player.weapon.type.includes('spear') ? 35 : 0);
            const baseDmg = player.weapon.baseDmg + player.damageBonus;
            networkCheckMeleeHits(effectiveReach, baseDmg);
        }
    }

    function startAttack(e) {
        e.preventDefault();
        e.stopPropagation();
        sounds.init();
        doAttackAction();

        if (touchControls.attackInterval) clearInterval(touchControls.attackInterval);
        touchControls.attackInterval = setInterval(() => {
            if (player && !player.isSwinging) {
                doAttackAction();
            }
        }, 120);
    }

    function stopAttack(e) {
        if (e) e.stopPropagation();
        if (touchControls.attackInterval) {
            clearInterval(touchControls.attackInterval);
            touchControls.attackInterval = null;
        }
    }

    // Атака: сенсор + мышь
    btnAttack.addEventListener('touchstart', startAttack, { passive: false });
    btnAttack.addEventListener('touchend', stopAttack);
    btnAttack.addEventListener('touchcancel', stopAttack);
    btnAttack.addEventListener('mousedown', startAttack);
    btnAttack.addEventListener('mouseup', stopAttack);
    window.addEventListener('mouseup', stopAttack);

    // Монета (ПКМ / альт-атака): сенсор + мышь
    function doCoinAction(e) {
        e.preventDefault();
        e.stopPropagation();
        sounds.init();
        if (gameRunning && !gamePaused && player && player.hp > 0) {
            player.triggerAltAction();
        }
    }
    btnCoin.addEventListener('touchstart', doCoinAction, { passive: false });
    btnCoin.addEventListener('mousedown', doCoinAction);

    // Рывок: сенсор + мышь
    function doDashAction(e) {
        e.preventDefault();
        e.stopPropagation();
        sounds.init();
        if (gameRunning && !gamePaused && player && player.hp > 0) {
            player.triggerDash();
        }
    }
    btnDash.addEventListener('touchstart', doDashAction, { passive: false });
    btnDash.addEventListener('mousedown', doDashAction);

    // Удар сверху (Стомп): сенсор + мышь
    function doStompAction(e) {
        e.preventDefault();
        e.stopPropagation();
        sounds.init();
        if (gameRunning && !gamePaused && player && player.hp > 0) {
            player.triggerStomp();
        }
    }
    btnStomp.addEventListener('touchstart', doStompAction, { passive: false });
    btnStomp.addEventListener('mousedown', doStompAction);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTouchControls);
} else {
    initTouchControls();
}

window.addEventListener('resize', updateMobileControlsVisibility);