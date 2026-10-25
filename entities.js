// ======================================================
// СУЩНОСТИ, БОССЫ, СНАРЯДЫ И СТУЛЬЯ (entities.js)
// ======================================================

let airSlashes = [];
let judgementCuts = [];
let superNovaOrbs = [];
let tossedCoins = [];
let railBeams = [];
let nutProjectiles = [];
let ikeaTurrets = [];
let ikeaTeslas = [];
let activeMines = [];
let stickyTraps = [];

function distToSegment(p, v, w) {
    const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

class Shockwave {
    constructor(x, y, maxRadius, color = '#f59e0b') {
        this.x = x; this.y = y; this.radius = 10;
        this.maxRadius = maxRadius; this.color = color;
        this.life = 20; this.maxLife = 20;
    }
    update() { this.radius += (this.maxRadius - this.radius) * 0.24; this.life--; }
    draw(camera) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(this.x - camera.x, this.y - camera.y, Math.max(1, this.radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class TossedCoin {
    constructor(x, y, vx, vy, owner, isSuper = false, target = null) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.owner = owner; this.radius = 9; this.spin = 0;
        this.life = 160; this.isSuper = isSuper; this.hit = false;
        this.target = target;
    }
    update() {
        if (this.target && this.target.hp > 0) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 35) {
                this.vx += (dx / dist) * 0.38;
                this.vy += (dy / dist) * 0.38;
            }
        }
        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.94; this.vy *= 0.94;
        this.spin += 0.35; this.life--;
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.spin);
        ctx.fillStyle = this.isSuper ? '#c084fc' : '#fbbf24';
        ctx.shadowColor = this.isSuper ? '#9333ea' : '#f59e0b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * Math.abs(Math.cos(this.spin)), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
}

class RailBeam {
    constructor(x1, y1, x2, y2, color = '#fbbf24') {
        this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
        this.color = color; this.life = 14; this.maxLife = 14;
    }
    update() { this.life--; }
    draw(camera) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(this.x1 - camera.x, this.y1 - camera.y);
        ctx.lineTo(this.x2 - camera.x, this.y2 - camera.y);
        ctx.stroke();
        ctx.restore();
    }
}

class NutProjectile {
    constructor(x, y, angle, damage, owner, isSuper = false) {
        this.x = x; this.y = y; this.speed = 12.5;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.damage = damage; this.owner = owner;
        this.isSuper = isSuper; this.radius = isSuper ? 9 : 7;
        this.bounces = isSuper ? 4 : 2; this.life = 110; this.rot = 0;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.rot += 0.4; this.life--;

        if (this.x < this.radius || this.x > MAP_SIZE - this.radius) {
            this.vx *= -1; this.bounces--; sounds.playClink();
        }
        if (this.y < this.radius || this.y > MAP_SIZE - this.radius) {
            this.vy *= -1; this.bounces--; sounds.playClink();
        }

        for (let i = bugs.length - 1; i >= 0; i--) {
            let b = bugs[i];
            if (Math.hypot(b.x - this.x, b.y - this.y) < b.radius + this.radius) {
                b.hp -= this.damage; sounds.playClink();
                if (this.isSuper) shockwaves.push(new Shockwave(this.x, this.y, 35, '#38bdf8'));
                this.bounces--;
                if (this.bounces <= 0) { this.life = 0; break; }
            }
        }
        for (let c of chairs) {
            if (c !== this.owner && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < c.radius + this.radius) {
                c.takeDamage(this.damage, this.owner);
                sounds.playClink(); this.bounces--;
                if (this.bounces <= 0) { this.life = 0; break; }
            }
        }
        if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < bossInstance.radius + this.radius) {
            bossInstance.takeDamage(this.damage);
            sounds.playClink(); this.bounces--;
            if (this.bounces <= 0) this.life = 0;
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.rot);
        ctx.fillStyle = this.isSuper ? '#38bdf8' : '#94a3b8';
        ctx.strokeStyle = this.isSuper ? '#fef08a' : '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * this.radius, py = Math.sin(a) * this.radius;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class IkeaTurret {
    constructor(x, y, owner) {
        this.x = x; this.y = y; this.owner = owner;
        this.radius = 22; this.life = 750; this.shootCooldown = 0; this.angle = 0;
    }
    update() {
        this.life--;
        if (this.shootCooldown > 0) this.shootCooldown--;
        let target = null, minDist = 380;
        bugs.forEach(b => {
            let d = Math.hypot(b.x - this.x, b.y - this.y);
            if (d < minDist) { minDist = d; target = b; }
        });
        chairs.forEach(c => {
            if (c !== this.owner && c.hp > 0) {
                let d = Math.hypot(c.x - this.x, c.y - this.y);
                if (d < minDist) { minDist = d; target = c; }
            }
        });
        if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < minDist) {
            target = bossInstance;
        }
        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.shootCooldown <= 0) {
                this.shootCooldown = 18;
                sounds.playClink();
                nutProjectiles.push(new NutProjectile(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20, this.angle, 20, this.owner, false));
            }
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-14, -14, 28, 28);
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3;
        ctx.strokeRect(-14, -14, 28, 28);
        ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center';
        ctx.fillText('IKEA', 0, -18);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#475569'; ctx.fillRect(0, -5, 24, 10);
        ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class IkeaTesla {
    constructor(x, y, owner) {
        this.x = x; this.y = y; this.owner = owner;
        this.radius = 20; this.life = 750; this.zapCooldown = 0; this.pulse = 0;
    }
    update() {
        this.life--;
        this.pulse += 0.15;
        if (this.zapCooldown > 0) this.zapCooldown--;
        if (this.zapCooldown <= 0) {
            this.zapCooldown = 32;
            let targets = [];
            const range = 210;
            bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < range) targets.push(b); });
            chairs.forEach(c => { if (c !== this.owner && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < range) targets.push(c); });
            if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < range + bossInstance.radius) targets.push(bossInstance);

            if (targets.length > 0) {
                sounds.playZap();
                targets.slice(0, 4).forEach(t => {
                    railBeams.push(new RailBeam(this.x, this.y, t.x, t.y, '#38bdf8'));
                    shockwaves.push(new Shockwave(t.x, t.y, 35, '#38bdf8'));
                    if (t === bossInstance) t.takeDamage(34);
                    else if (t.takeDamage) t.takeDamage(34, this.owner);
                    else t.hp -= 34;
                });
            }
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#334155'; ctx.fillRect(-12, -8, 24, 20);
        ctx.fillStyle = '#64748b'; ctx.fillRect(-8, -14, 16, 6);
        ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#0284c7'; ctx.shadowBlur = 12 + Math.sin(this.pulse) * 6;
        ctx.beginPath(); ctx.arc(0, -18, 9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class SeatMine {
    constructor(x, y, owner) {
        this.x = x; this.y = y; this.owner = owner;
        this.radius = 16; this.timer = 55;
    }
    update() {
        this.timer--;
        if (this.timer <= 0) {
            sounds.playExplosion();
            shockwaves.push(new Shockwave(this.x, this.y, 110, '#ef4444'));
            bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 110) b.hp -= 95; });
            chairs.forEach(c => {
                if (c !== this.owner && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < 110) c.takeDamage(65, this.owner);
            });
            if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < 110 + bossInstance.radius) bossInstance.takeDamage(120);
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 0);
        ctx.restore();
    }
}

class StickyTrap {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 24; this.life = 450;
    }
    update() {
        this.life--;
        bugs.forEach(b => {
            if (Math.hypot(b.x - this.x, b.y - this.y) < this.radius + b.radius) {
                b.slowTimer = 40; b.hp -= 0.6;
            }
        });
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🪤', 0, 0);
        ctx.restore();
    }
}

class AirSlash {
    constructor(x, y, angle, damage, owner) {
        this.x = x; this.y = y; this.angle = angle; this.speed = 13.5;
        this.damage = damage; this.owner = owner; this.radius = 20; this.life = 45;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 24, -Math.PI * 0.35, Math.PI * 0.35); ctx.stroke();
        ctx.restore();
    }
}

class JudgementCut {
    constructor(x, y, damage, owner) {
        this.x = x; this.y = y; this.damage = damage; this.owner = owner;
        this.timer = 24; this.radius = 48;
    }
    update() {
        this.timer--;
        if (this.timer === 0) {
            sounds.playHit(true);
            shockwaves.push(new Shockwave(this.x, this.y, 65, '#c084fc'));
            bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < this.radius + b.radius) b.hp -= this.damage; });
            chairs.forEach(c => {
                if (c !== this.owner && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < this.radius + c.radius) c.takeDamage(this.damage, this.owner);
            });
            if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < this.radius + bossInstance.radius) bossInstance.takeDamage(this.damage);
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-25, -25); ctx.lineTo(25, 25); ctx.moveTo(25, -25); ctx.lineTo(-25, 25); ctx.stroke();
        ctx.restore();
    }
}

class SuperNovaOrb {
    constructor(x, y, angle, damage, owner) {
        this.x = x; this.y = y; this.angle = angle; this.speed = 6.5;
        this.damage = damage; this.owner = owner; this.radius = 24; this.life = 70;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
        bugs.forEach(b => {
            const dist = Math.hypot(this.x - b.x, this.y - b.y);
            if (dist < 180 && dist > 1) {
                b.x += ((this.x - b.x) / dist) * 3; b.y += ((this.y - b.y) / dist) * 3;
            }
        });
        if (this.life <= 0) this.explode();
    }
    explode() {
        sounds.playExplosion();
        shockwaves.push(new Shockwave(this.x, this.y, 160, '#f59e0b'));
        bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 160) b.hp -= this.damage; });
        chairs.forEach(c => {
            if (c !== this.owner && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < 160) c.takeDamage(this.damage, this.owner);
        });
        if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < 160 + bossInstance.radius) bossInstance.takeDamage(this.damage * 1.5);
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#f59e0b'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class PoisonPool {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 28; this.life = 280; this.maxLife = 280;
    }
    update() {
        this.life--;
        if (this.life % 25 === 0) {
            bugs.forEach(b => {
                if (Math.hypot(b.x - this.x, b.y - this.y) < this.radius + b.radius) {
                    b.hp -= 9; b.slowTimer = 25;
                }
            });
            chairs.forEach(c => {
                if (c !== player && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < this.radius + c.radius) c.takeDamage(7, player);
            });
            if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < this.radius + bossInstance.radius) bossInstance.takeDamage(12);
        }
    }
    draw(camera) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, (this.life / this.maxLife) * 0.55);
        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class Boomerang {
    constructor(owner) {
        this.owner = owner; this.x = owner.x; this.y = owner.y;
        this.angle = owner.angle; this.speed = 12; this.distance = 0;
        this.returning = false; this.spin = 0; this.radius = 14; this.life = 120;
    }
    update() {
        this.spin += 0.35;
        if (!this.returning) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            this.distance += this.speed;
            if (this.distance > 340) this.returning = true;
        } else {
            const targetX = this.owner ? this.owner.x : this.x;
            const targetY = this.owner ? this.owner.y : this.y;
            const retAng = Math.atan2(targetY - this.y, targetX - this.x);
            this.x += Math.cos(retAng) * this.speed;
            this.y += Math.sin(retAng) * this.speed;
        }
        this.life--;
        bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < this.radius + b.radius) b.hp -= 22; });
        chairs.forEach(c => {
            if (c !== this.owner && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < this.radius + c.radius) c.takeDamage(18, this.owner);
        });
        if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < this.radius + bossInstance.radius) bossInstance.takeDamage(25);
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.spin);
        ctx.fillStyle = '#b45309'; ctx.fillRect(-14, -3, 28, 6);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(-3, -14, 6, 28);
        ctx.restore();
    }
}

class MagicOrb {
    constructor(x, y, angle, damage, owner) {
        this.x = x; this.y = y; this.angle = angle; this.speed = 9.5;
        this.damage = damage; this.owner = owner; this.radius = 8; this.life = 75;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color = '#fff') {
        this.x = x; this.y = y; this.text = text; this.color = color; this.life = 45;
    }
    update() { this.y -= 0.8; this.life--; }
    draw(camera) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 45);
        ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = this.color; ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x - camera.x, this.y - camera.y);
        ctx.restore();
    }
}

class FloorItem {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; this.radius = 12; this.pulse = Math.random() * Math.PI;
    }
    draw(camera) {
        this.pulse += 0.05;
        const r = this.radius + Math.sin(this.pulse) * 2;
        const rx = this.x - camera.x, ry = this.y - camera.y;
        ctx.save();
        ctx.translate(rx, ry);
        if (this.type === 'nail') {
            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#94a3b8'; ctx.fillRect(-2, -4, 4, 10);
        } else if (this.type === 'screw') {
            ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(0, 0, Math.max(1, r * 0.7), 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2; ctx.stroke();
        } else if (this.type === 'glue') {
            ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💧', 0, 0);
        } else if (this.type === 'varnish') {
            ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛡️', 0, 0);
        } else if (this.type === 'wheels') {
            ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛞', 0, 0);
        }
        ctx.restore();
    }
}

class Trampoline {
    constructor(x, y) { this.x = x; this.y = y; this.radius = 28; this.cooldown = 0; }
    update() { if (this.cooldown > 0) this.cooldown--; }
    trigger(entity) {
        if (this.cooldown > 0) return;
        this.cooldown = 40; sounds.playBounce();
        const angle = entity.angle || 0;
        entity.vx = Math.cos(angle) * 16; entity.vy = Math.sin(angle) * 16;
        floatingTexts.push(new FloatingText(entity.x, entity.y - entity.radius, 'БАМП!', '#38bdf8'));
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.stroke();
        ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🌀', 0, 0);
        ctx.restore();
    }
}

class Barrel {
    constructor(x, y) { this.x = x; this.y = y; this.radius = 20; this.hp = 25; }
    takeHit(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) { this.explode(); return true; }
        return false;
    }
    explode() {
        sounds.playExplosion();
        const blastRadius = 160;
        bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < blastRadius) b.hp -= 140; });
        chairs.forEach(c => {
            if (c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < blastRadius) c.takeDamage(40, null);
        });
        if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < blastRadius + bossInstance.radius) {
            bossInstance.takeDamage(150);
        }
        if (player && player.hasGoldBarrel) {
            coins += 35;
            floatingTexts.push(new FloatingText(this.x, this.y, '+35 🪙 (Куш!)', '#fbbf24'));
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🌶️', 0, 0);
        ctx.restore();
    }
}

class Chest {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 22; this.hp = 60;
        this.isTrap = Math.random() < 0.35;
    }
    takeHit(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) { this.open(); return true; }
        return false;
    }
    open() {
        if (this.isTrap) {
            sounds.playExplosion();
            if (player && player.hp > 0 && Math.hypot(player.x - this.x, player.y - this.y) < 130) {
                player.takeDamage(25, null);
            }
            for (let i = 0; i < 4; i++) {
                bugs.push(new Bug(this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40, true));
            }
        } else {
            const gain = Math.floor(70 * (currentMode === 'hardcore' ? 2 : 1) * (1 + (player ? player.coinBonus : 0)));
            coins += gain; saveGame(); sounds.playPick();
            floatingTexts.push(new FloatingText(this.x, this.y, `+${gain} 🪙`, '#fbbf24'));
            for (let i = 0; i < 5; i++) floorItems.push(new FloorItem(this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 50, 'nail'));
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.isTrap ? '🧰' : '📦', 0, 0);
        ctx.restore();
    }
}

class Bug {
    constructor(x, y, isMosquito = false, isCookie = false) {
        this.x = x; this.y = y; this.isMosquito = isMosquito; this.isCookie = isCookie;
        this.radius = isMosquito ? 12 : (isCookie ? 14 : 16);
        this.hp = isMosquito ? 35 : (isCookie ? 45 : 60);
        this.maxHp = this.hp;
        this.speed = (isMosquito ? 4.8 : (isCookie ? 4.2 : 3.2)) * (currentMode === 'hardcore' ? 1.25 : 1.0);
        this.angle = Math.random() * Math.PI * 2; this.slowTimer = 0; this.wobble = Math.random() * 10;
    }
    update() {
        if (!player || player.hp <= 0) return;
        this.wobble += 0.2;
        let target = player, minDist = Math.hypot(player.x - this.x, player.y - this.y);

        chairs.forEach(c => {
            if (c.hp > 0) {
                let dist = Math.hypot(c.x - this.x, c.y - this.y);
                if (dist < minDist) { minDist = dist; target = c; }
            }
        });

        const dx = target.x - this.x, dy = target.y - this.y;
        this.angle = Math.atan2(dy, dx) + (this.isMosquito ? Math.sin(this.wobble) * 0.4 : 0);

        let curSpeed = this.speed;
        if (this.slowTimer > 0) { curSpeed *= 0.45; this.slowTimer--; }

        if (minDist > 10) {
            this.x += Math.cos(this.angle) * curSpeed;
            this.y += Math.sin(this.angle) * curSpeed;
        }

        if (minDist < this.radius + target.radius) {
            target.takeDamage(this.isMosquito ? 1.0 : (this.isCookie ? 1.3 : 1.5), null);
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-18, -24, 36, 5);
        ctx.fillStyle = this.slowTimer > 0 ? '#38bdf8' : (this.isMosquito ? '#f59e0b' : (this.isCookie ? '#d97706' : '#10b981'));
        ctx.fillRect(-17, -23, (Math.max(0, this.hp) / this.maxHp) * 34, 3);
        ctx.font = this.isMosquito ? '20px sans-serif' : '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.isMosquito ? '🦟' : (this.isCookie ? '🍪' : '🪲'), 0, 0);
        ctx.restore();
    }
}

class Minion {
    constructor(owner) {
        this.owner = owner; this.x = owner.x + (Math.random() - 0.5) * 60;
        this.y = owner.y + (Math.random() - 0.5) * 60; this.radius = 16; this.speed = 4.2;
    }
    update() {
        if (!this.owner || this.owner.hp <= 0) return;
        let target = null, minDist = 9999;
        bugs.forEach(b => {
            if (b.hp > 0) {
                let d = Math.hypot(b.x - this.x, b.y - this.y);
                if (d < minDist) { minDist = d; target = b; }
            }
        });
        if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < minDist) {
            target = bossInstance; minDist = Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y);
        }
        if (!target) {
            minDist = Math.hypot(this.owner.x - this.x, this.owner.y - this.y);
            if (minDist > 100) target = this.owner;
        }
        if (target) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (minDist > 15) {
                this.x += Math.cos(angle) * this.speed; this.y += Math.sin(angle) * this.speed;
            }
            if (minDist < this.radius + target.radius + 15) {
                if (target === bossInstance) bossInstance.takeDamage(2.5);
                else if (target.hp !== undefined) target.hp -= 2.5;
            }
        }
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#8B4513'; ctx.fillRect(-8, -8, 16, 16);
        ctx.fillStyle = '#a0522d'; ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
    }
}

class SofaBoss {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 65;
        this.hp = currentMode === 'hardcore' ? 2400 : 2000;
        this.maxHp = this.hp; this.speed = currentMode === 'hardcore' ? 2.6 : 2.2;
        this.angle = 0; this.shootTimer = 0;
    }
    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) this.onDeath();
    }
    update() {
        if (!player || player.hp <= 0) return;
        const dx = player.x - this.x, dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);

        if (dist > 20) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }

        if (dist < this.radius + player.radius) player.takeDamage(4, this);

        this.shootTimer++;
        if (this.shootTimer % 120 === 0) {
            const baseAngle = this.angle;
            [-0.25, 0, 0.25].forEach(angOffset => {
                bossCushions.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(baseAngle + angOffset) * 6.5,
                    vy: Math.sin(baseAngle + angOffset) * 6.5,
                    radius: 12, damage: 18, life: 140
                });
            });
        }
    }
    onDeath() {
        coins += Math.floor(250 * (currentMode === 'hardcore' ? 2 : 1));
        saveGame();
        if (player) player.addXp(300);
        floatingTexts.push(new FloatingText(this.x, this.y, 'ДИВАН СЛОМАН! +250 🪙', '#fbbf24'));
        bossInstance = null;
        if (currentMode === 'bossrush') bossTimer = 25;
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-50, -85, 100, 10);
        ctx.fillStyle = '#f43f5e'; ctx.fillRect(-48, -83, (Math.max(0, this.hp) / this.maxHp) * 96, 6);
        ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('ДИВАН-БОСС', 0, -60);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#9f1239'; ctx.fillRect(-50, -40, 100, 80);
        ctx.fillStyle = '#be123c'; ctx.fillRect(-44, -20, 88, 54);
        ctx.fillStyle = '#f43f5e'; ctx.fillRect(-40, -16, 38, 46); ctx.fillRect(2, -16, 38, 46);
        ctx.restore();
    }
}

class MicrowaveBoss {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 60;
        this.hp = currentMode === 'hardcore' ? 2600 : 2200;
        this.maxHp = this.hp; this.speed = 2.0; this.angle = 0;
        this.attackTimer = 0; this.laserActive = false; this.laserTimer = 0;
    }
    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) this.onDeath();
    }
    update() {
        if (!player || player.hp <= 0) return;
        const dx = player.x - this.x, dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);

        if (dist > 25) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }

        if (dist < this.radius + player.radius) player.takeDamage(4.5, this);

        this.attackTimer++;
        if (this.attackTimer % 240 === 0) {
            this.laserActive = true; this.laserTimer = 45;
        }
        if (this.laserActive) {
            this.laserTimer--;
            if (dist < 320 && Math.abs(Math.atan2(dy, dx) - this.angle) < 0.35) player.takeDamage(1.5, this);
            if (this.laserTimer <= 0) this.laserActive = false;
        }
        if (this.attackTimer % 300 === 0) {
            for (let i = 0; i < 3; i++) bugs.push(new Bug(this.x, this.y, false, true));
        }
    }
    onDeath() {
        coins += Math.floor(300 * (currentMode === 'hardcore' ? 2 : 1));
        saveGame();
        if (player) player.addXp(350);
        floatingTexts.push(new FloatingText(this.x, this.y, 'МИКРОВОЛНОВКА ВЗОРВАНА! +300 🪙', '#fbbf24'));
        bossInstance = null;
        if (currentMode === 'bossrush') bossTimer = 25;
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-50, -85, 100, 10);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(-48, -83, (Math.max(0, this.hp) / this.maxHp) * 96, 6);
        ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('МИКРОВОЛНОВКА', 0, -60);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#334155'; ctx.fillRect(-50, -40, 100, 80);
        ctx.fillStyle = this.laserActive ? '#ef4444' : '#0284c7'; ctx.fillRect(-35, -28, 55, 56);
        if (this.laserActive) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'; ctx.lineWidth = 14;
            ctx.beginPath(); ctx.moveTo(35, 0); ctx.lineTo(340, 0); ctx.stroke();
        }
        ctx.restore();
    }
}

class Arrow {
    constructor(x, y, angle, damage, owner) {
        this.x = x; this.y = y; this.angle = angle; this.speed = 11;
        this.damage = damage; this.owner = owner; this.radius = 4; this.life = 100;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.life--;
    }
    draw(camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
        ctx.restore();
    }
}

function triggerHammerChainWave(x, y, radius, dmg, owner, isCrit = false, chainCount = 0) {
    if (chainCount > 6) return;
    const shockColor = isCrit ? '#ef4444' : '#f59e0b';
    shockwaves.push(new Shockwave(x, y, radius, shockColor));

    bugs.forEach(b => {
        if (Math.hypot(b.x - x, b.y - y) < radius + b.radius) {
            b.hp -= dmg;
            if (owner.hasExecute && b.hp <= b.maxHp * 0.3) {
                b.hp = 0; floatingTexts.push(new FloatingText(b.x, b.y, 'КАЗНЬ! ☠️', '#ef4444'));
            }
        }
    });

    if (bossInstance && Math.hypot(bossInstance.x - x, bossInstance.y - y) < radius + bossInstance.radius) {
        bossInstance.takeDamage(dmg);
    }

    chairs.forEach(c => {
        if (c !== owner && c.hp > 0 && Math.hypot(c.x - x, c.y - y) < radius + c.radius) {
            c.takeDamage(dmg, owner);
            if (owner.hasExecute && c.hp <= c.maxHp * 0.3) c.takeDamage(9999, owner);
        }
    });

    if (isCrit) {
        sounds.playExplosion();
        floatingTexts.push(new FloatingText(x, y - 25, 'ЦЕПНОЙ КРИТ! 💥', '#ef4444'));
        const nextCrit = Math.random() < owner.critChance;
        const nextDmg = nextCrit ? dmg * 2 : dmg;
        setTimeout(() => {
            const offX = (Math.random() - 0.5) * 35, offY = (Math.random() - 0.5) * 35;
            triggerHammerChainWave(x + offX, y + offY, radius, nextDmg, owner, nextCrit, chainCount + 1);
        }, 90);
    }
}

class Chair {
    constructor(x, y, name, isBot = false, customSkin = null, weaponKey = 'wrench') {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.name = name; this.isBot = isBot;
        this.baseRadius = 26; this.radius = 26;
        this.hp = 100; this.maxHp = 100; this.speed = 4.0;
        this.level = 1; this.xp = 0; this.nextXp = 50; this.angle = 0;
        this.hat = isBot ? (Math.random() > 0.5 ? HATS[Math.floor(Math.random()*HATS.length)].id : 'none') : equippedHat;
        this.skin = customSkin || (isBot ? CHAIR_SKINS[Math.floor(Math.random() * CHAIR_SKINS.length)] : CHAIR_SKINS[0]);

        this.weapon = WEAPONS[weaponKey] || WEAPONS.wrench;
        this.damageBonus = 0; this.swordLen = this.weapon.reach;
        this.hasBow = false; this.bowLevel = 0; this.extraArrows = 0; this.lastBowShot = 0;
        this.vampirism = 0; this.defense = 0; this.pickupRadius = 0; this.regenRate = 0;
        this.critChance = this.weapon.critBonus || 0; this.thorns = 0; this.coinBonus = 0;
        this.xpMultiplier = 1.0; this.minions = [];

        this.hasSaw = false; this.sawLevel = 0; this.sawAngle = 0; this.titanTimer = 0;
        this.hasTesla = false; this.teslaLevel = 0; this.teslaCooldown = 0;
        this.hasPoisonTrail = false; this.poisonTimer = 0;
        this.hasFrostAura = false; this.hasExplosiveDash = false;
        this.hasBoomerang = false; this.boomerangTimer = 0; this.hasBerserk = false;

        this.hasGodArmor = false; this.godArmorTimer = 0; this.godArmorCooldown = 0;
        this.hasOrbitalShields = false; this.orbitalAngle = 0;
        this.hasExecute = false; this.hasFortuneExplosion = false;
        this.buffVarnish = 0; this.buffWheels = 0;

        // Новые способности из магазина
        this.bossDamageBonus = 0;
        this.hasDashLightning = false;
        this.hasSeatMine = false;
        this.hasFrostDash = false;
        this.hasExtinguisher = false;
        this.extinguisherCooldown = 0;
        this.hasLumberjack = false;
        this.lumberjackHits = 0;
        this.hasHotKettle = false;
        this.hotKettleTimer = 0;
        this.hasSawdustVampire = false;
        this.hasSoapDrift = false;
        this.knockbackMult = 1.0;
        this.hasShadowStep = false;
        this.shadowStepTimer = 0;
        this.hasGoldBarrel = false;
        this.hasGhostChair = false;
        this.hasMothTrap = false;
        this.mothTrapTimer = 0;
        this.hasNuclearBattery = false;
        this.hasBloodRevenge = false;
        this.hasTsarDecree = false;

        this.isDashing = false; this.dashTimer = 0;
        this.dashCooldownMax = 90; this.dashCooldownTimer = 0;
        this.stompCooldown = 0; this.stompDamage = 45;

        this.swordAngle = -0.5; this.isSwinging = false; this.swingProgress = 0;
        this.coinTossCooldown = 0;

        this.applyHatPerks();
    }

    equipWeapon(weaponKey) {
        if (WEAPONS[weaponKey]) {
            this.weapon = WEAPONS[weaponKey];
            this.swordLen = this.weapon.reach;
            this.critChance = Math.min(0.9, 0.05 + (this.weapon.critBonus || 0));
            sounds.playLevelUp();
            floatingTexts.push(new FloatingText(this.x, this.y - 30, `ЭКИПИРОВАНО: ${this.weapon.name}!`, '#fbbf24'));
            const badge = document.getElementById('hud-weapon-badge');
            if (badge) badge.innerText = `Оружие: ${this.weapon.name}`;
        }
    }

    applyHatPerks() {
        if (this.hat === 'crown') this.xpMultiplier += 0.25;
        if (this.hat === 'cowboy') { this.hasBow = true; this.extraArrows++; }
        if (this.hat === 'viking') { this.maxHp += 30; this.hp += 30; this.thorns += 0.20; }
        if (this.hat === 'wizard') { this.pickupRadius += 60; }
        if (this.hat === 'tophat') { this.coinBonus += 0.35; }
        if (this.hat === 'ninja') { this.dashCooldownMax = Math.max(25, this.dashCooldownMax - 30); }
        if (this.hat === 'pirate') { this.critChance = Math.min(0.9, this.critChance + 0.25); }
        if (this.hat === 'robot') { this.defense = Math.min(0.75, this.defense + 0.20); }
        if (this.hat === 'devil') { this.damageBonus += 25; }
        if (this.hat === 'alien') { this.speed *= 1.15; }
        if (this.hat === 'fire') { this.damageBonus += 35; this.vampirism += 10; }
        if (this.hat === 'cat') { this.speed *= 1.18; }
        if (this.hat === 'santa') { this.regenRate += 3; }
    }

    activateTitan(dur = 720) {
        this.titanTimer = dur; this.radius = this.baseRadius * 2;
        floatingTexts.push(new FloatingText(this.x, this.y - this.radius, 'СТУЛ-ГИГАНТ!', '#fbbf24'));
    }

    addXp(amount) {
        if (this.isBot || this.hp <= 0) return;
        this.xp += amount * this.xpMultiplier;
        if (this.xp >= this.nextXp) {
            this.xp -= this.nextXp; this.level++;
            this.nextXp = Math.floor(this.nextXp * 1.35);
            sounds.playLevelUp(); showLevelUpModal();
        }
    }

    takeDamage(dmg, attacker) {
        if (this.hp <= 0) return;
        if (this === player && (this.isDashing || this.godArmorTimer > 0 || this.shadowStepTimer > 0)) return;

        let finalDmg = Math.max(1, dmg * (1 - this.defense));
        if (attacker && attacker.isBot && this.hasTsarDecree) finalDmg *= 0.8;
        if (this.buffVarnish > 0) finalDmg *= 0.3;

        this.hp -= finalDmg;
        floatingTexts.push(new FloatingText(this.x, this.y - this.radius, `-${Math.round(finalDmg)}`, '#ef4444'));

        if (this.hasSeatMine && Math.random() < 0.45) {
            activeMines.push(new SeatMine(this.x, this.y, this));
        }

        if (this.hasBloodRevenge) {
            for (let i = 0; i < 8; i++) {
                const ang = (i * Math.PI) / 4;
                arrows.push(new Arrow(this.x, this.y, ang, 16 + this.damageBonus, this));
            }
        }

        if (this === player && this.hasGodArmor && this.hp > 0 && this.hp < this.maxHp * 0.25 && this.godArmorCooldown <= 0) {
            this.godArmorTimer = 90; this.godArmorCooldown = 1800;
            sounds.playLevelUp(); floatingTexts.push(new FloatingText(this.x, this.y - 30, '🛡️ НЕУЯЗВИМОСТЬ БОГОВ!', '#fbbf24'));
        }

        if (attacker && this.thorns > 0 && attacker !== this && attacker.hp > 0) {
            attacker.takeDamage(finalDmg * this.thorns, null);
        }

        if (this.hp <= 0) {
            if (this.hasGhostChair) {
                this.hasGhostChair = false;
                this.hp = this.maxHp * 0.6;
                sounds.playBounce();
                shockwaves.push(new Shockwave(this.x, this.y, 140, '#a855f7'));
                floatingTexts.push(new FloatingText(this.x, this.y - 35, '👻 СТУЛ-ПРИЗРАК ОЖИЛ!', '#a855f7'));
                return;
            }

            this.hp = 0;
            if (this === player) {
                if (currentMode === 'hardcore') {
                    hardcoreLives--; updateHardcoreHUD();
                    if (hardcoreLives > 0) {
                        this.hp = this.maxHp; sounds.playBounce();
                        floatingTexts.push(new FloatingText(this.x, this.y - this.radius, 'ЖИЗНЬ СОХРАНЕНА!', '#38bdf8'));
                        return;
                    }
                }
                sounds.playDeath();
                document.getElementById('game-over-modal').style.display = 'flex';
                gameRunning = false;
                if (animFrameId) cancelAnimationFrame(animFrameId);
            }
            if (attacker && attacker.hp > 0) attacker.onKillTarget();
        }
    }

    onKillTarget() {
        if (!this.isBot) {
            const mult = (currentMode === 'hardcore' ? 2 : 1) * (1 + this.coinBonus);
            coins += Math.floor(10 * mult);
            saveGame();
        }
        if (this.vampirism > 0 && this.hp > 0) {
            this.hp = Math.min(this.maxHp, this.hp + this.vampirism);
            floatingTexts.push(new FloatingText(this.x, this.y - this.radius - 10, `+${this.vampirism} HP`, '#10b981'));
        }
        if (this.hasSawdustVampire && this.hp > 0) {
            this.hp = Math.min(this.maxHp, this.hp + 15);
            floatingTexts.push(new FloatingText(this.x, this.y - this.radius - 20, '+15 HP (Вампир)', '#10b981'));
        }
    }

    triggerDash() {
        if (!this.isDashing && this.dashCooldownTimer <= 0 && this.hp > 0) {
            this.isDashing = true; this.dashTimer = 14; 
            this.dashCooldownTimer = this.dashCooldownMax; 
            sounds.playDash();

            if (this.hasExplosiveDash) {
                shockwaves.push(new Shockwave(this.x, this.y, 90, '#ef4444'));
                sounds.playExplosion();
                bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 90) b.hp -= 45; });
                chairs.forEach(c => {
                    if (c !== this && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < 90) c.takeDamage(35, this);
                });
            }

            if (this.hasDashLightning) {
                sounds.playZap();
                shockwaves.push(new Shockwave(this.x, this.y, 110, '#38bdf8'));
                bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 130) b.hp -= 40; });
                chairs.forEach(c => {
                    if (c !== this && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < 130) c.takeDamage(35, this);
                });
            }

            if (this.hasFrostDash) {
                shockwaves.push(new Shockwave(this.x, this.y, 100, '#0284c7'));
                bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 130) b.slowTimer = 150; });
            }

            const boost = 15;
            this.vx += Math.cos(this.angle) * boost;
            this.vy += Math.sin(this.angle) * boost;
        }
    }

    triggerStomp() {
        if (this.stompCooldown <= 0 && this.hp > 0) {
            this.stompCooldown = 180;
            sounds.playStomp();
            const shockRadius = this.radius * (this.stompDamage > 50 ? 4.5 : 3.5);
            shockwaves.push(new Shockwave(this.x, this.y, shockRadius, '#a855f7'));
            floatingTexts.push(new FloatingText(this.x, this.y - this.radius, 'УДАР СВЕРХУ!', '#a855f7'));

            bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < shockRadius) b.hp -= this.stompDamage; });
            chairs.forEach(c => {
                if (c !== this && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < shockRadius) {
                    c.takeDamage(this.stompDamage * 0.75, this);
                    const pushAng = Math.atan2(c.y - this.y, c.x - this.x);
                    c.vx += Math.cos(pushAng) * 14 * this.knockbackMult;
                    c.vy += Math.sin(pushAng) * 14 * this.knockbackMult;
                }
            });
            if (bossInstance && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < shockRadius + bossInstance.radius) {
                bossInstance.takeDamage(this.stompDamage);
            }
        }
    }

    triggerAltAction() {
        if (this.hp <= 0) return;
        const wType = this.weapon.type;
        if (wType === 'coin_gun' || wType === 'super_coin_gun') {
            this.tossCoinAtEnemy();
        }
    }

    tossCoinAtEnemy() {
        if (this.coinTossCooldown > 0) return;
        this.coinTossCooldown = 18;
        const isSuper = this.weapon.type === 'super_coin_gun';
        sounds.playCoinToss();

        let potentialTargets = [];
        bugs.forEach(b => { if (b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < 800) potentialTargets.push(b); });
        chairs.forEach(c => { if (c !== this && c.hp > 0 && Math.hypot(c.x - this.x, c.y - this.y) < 800) potentialTargets.push(c); });
        if (bossInstance && bossInstance.hp > 0 && Math.hypot(bossInstance.x - this.x, bossInstance.y - this.y) < 800) potentialTargets.push(bossInstance);

        const coinCount = isSuper ? 3 : 1;
        for (let i = 0; i < coinCount; i++) {
            let target = null;
            if (potentialTargets.length > 0) target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            let targetAngle = this.angle;
            if (target) targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
            if (coinCount > 1) targetAngle += (i - (coinCount - 1) / 2) * 0.25;

            const speed = 7.5 + Math.random() * 2.0;
            tossedCoins.push(new TossedCoin(this.x + Math.cos(this.angle) * 25, this.y + Math.sin(this.angle) * 25, Math.cos(targetAngle) * speed, Math.sin(targetAngle) * speed, this, isSuper, target));
        }
        floatingTexts.push(new FloatingText(this.x, this.y - 25, 'МОНЕТА В ПОЛЕТЕ! 🪙', '#fbbf24'));
    }

    triggerSwing() {
        if (!this.isSwinging && this.hp > 0) {
            this.isSwinging = true; this.swingProgress = 0;
            const wType = this.weapon.type;

            if (wType === 'hammer' || wType === 'super_hammer') sounds.playHammer();
            else if (wType === 'spear' || wType === 'super_spear') sounds.playSpear();
            else if (wType === 'staff' || wType === 'super_staff') sounds.playMagic();
            else if (wType === 'katana' || wType === 'super_katana') {
                this.vx += Math.cos(this.angle) * 7; this.vy += Math.sin(this.angle) * 7;
                sounds.playSpear();
            } else if (wType.includes('coin_gun')) sounds.playZap();
            else if (wType.includes('wrench')) sounds.playClink();
            else sounds.playHit(false);

            this.applyAttackDamage();
        }
    }

    applyAttackDamage() {
        let isCrit = Math.random() < this.critChance;
        if (this.hasLumberjack) {
            this.lumberjackHits++;
            if (this.lumberjackHits >= 4) {
                this.lumberjackHits = 0; isCrit = true;
                floatingTexts.push(new FloatingText(this.x, this.y - 30, 'УДАР ЛЕСОРУБА! 🪓', '#f59e0b'));
            }
        }

        let baseDmg = (this.weapon.baseDmg + this.damageBonus) * (this.titanTimer > 0 ? 2 : 1);
        if (this.hasBerserk && this.hp < this.maxHp) baseDmg *= (1 + (1 - this.hp / this.maxHp) * 0.5);
        if (isCrit) baseDmg *= (this.hasLumberjack ? 3 : 2);

        const wType = this.weapon.type;
        const effectiveReach = this.swordLen + (wType.includes('spear') ? 35 : 0);

        if (wType === 'coin_gun' || wType === 'super_coin_gun') {
            const isSuper = wType === 'super_coin_gun';
            const startX = this.x + Math.cos(this.angle) * 35, startY = this.y + Math.sin(this.angle) * 35;
            const myCoins = tossedCoins.filter(c => c.owner === this && !c.hit);

            if (myCoins.length > 0) {
                let bestCoin = null, minDist = 9999;
                myCoins.forEach(coin => {
                    const d = Math.hypot(coin.x - startX, coin.y - startY);
                    if (d < minDist) { minDist = d; bestCoin = coin; }
                });

                if (bestCoin) {
                    bestCoin.hit = true; sounds.playCoinRicochet();
                    shockwaves.push(new Shockwave(bestCoin.x, bestCoin.y, 50, '#fbbf24'));
                    railBeams.push(new RailBeam(startX, startY, bestCoin.x, bestCoin.y, isSuper ? '#c084fc' : '#f59e0b'));

                    let target = bestCoin.target && bestCoin.target.hp > 0 ? bestCoin.target : null;
                    if (!target) {
                        let enemyDist = 650;
                        bugs.forEach(b => {
                            const d = Math.hypot(b.x - bestCoin.x, b.y - bestCoin.y);
                            if (d < enemyDist) { enemyDist = d; target = b; }
                        });
                        chairs.forEach(c => {
                            if (c !== this && c.hp > 0) {
                                const d = Math.hypot(c.x - bestCoin.x, c.y - bestCoin.y);
                                if (d < enemyDist) { enemyDist = d; target = c; }
                            }
                        });
                        if (bossInstance && Math.hypot(bossInstance.x - bestCoin.x, bossInstance.y - bestCoin.y) < enemyDist) target = bossInstance;
                    }

                    if (target) {
                        const ricochetDmg = baseDmg * (isSuper ? 3.8 : 2.7);
                        railBeams.push(new RailBeam(bestCoin.x, bestCoin.y, target.x, target.y, '#ef4444'));
                        shockwaves.push(new Shockwave(target.x, target.y, 40, '#ef4444'));
                        floatingTexts.push(new FloatingText(bestCoin.x, bestCoin.y - 20, 'УЛЬТРА-РИКОШЕТ! 🪙⚡', '#fbbf24'));

                        if (target === bossInstance) target.takeDamage(ricochetDmg * (1 + this.bossDamageBonus));
                        else if (target.takeDamage) target.takeDamage(ricochetDmg, this);
                        else target.hp -= ricochetDmg;
                    }
                }
            } else {
                const maxRange = isSuper ? 460 : 360;
                const shootX = startX + Math.cos(this.angle) * maxRange, shootY = startY + Math.sin(this.angle) * maxRange;
                railBeams.push(new RailBeam(startX, startY, shootX, shootY, isSuper ? '#c084fc' : '#38bdf8'));

                bugs.forEach(b => {
                    if (distToSegment({ x: b.x, y: b.y }, { x: startX, y: startY }, { x: shootX, y: shootY }) < b.radius + 16) b.hp -= baseDmg * 0.9;
                });
                chairs.forEach(c => {
                    if (c !== this && c.hp > 0 && distToSegment({ x: c.x, y: c.y }, { x: startX, y: startY }, { x: shootX, y: shootY }) < c.radius + 16) c.takeDamage(baseDmg * 0.85, this);
                });
                if (bossInstance && distToSegment({ x: bossInstance.x, y: bossInstance.y }, { x: startX, y: startY }, { x: shootX, y: shootY }) < bossInstance.radius + 20) {
                    bossInstance.takeDamage(baseDmg * 0.9 * (1 + this.bossDamageBonus));
                }
            }
            return;
        }

        if (wType.includes('wrench')) {
            const isSuper = wType === 'super_wrench';
            const nutCount = isSuper ? 5 : 3, spreadStep = isSuper ? 0.16 : 0.22;
            for (let i = 0; i < nutCount; i++) {
                const angleOffset = (i - (nutCount - 1) / 2) * spreadStep;
                nutProjectiles.push(new NutProjectile(this.x + Math.cos(this.angle) * 30, this.y + Math.sin(this.angle) * 30, this.angle + angleOffset, baseDmg * (isSuper ? 0.85 : 0.65), this, isSuper));
            }
            if (isSuper) {
                this.wrenchCombo = (this.wrenchCombo || 0) + 1;
                const spawnX = this.x + Math.cos(this.angle) * 55, spawnY = this.y + Math.sin(this.angle) * 55;
                if (this.wrenchCombo % 4 === 2 && ikeaTurrets.filter(t => t.owner === this).length < 3) {
                    sounds.playBuild(); shockwaves.push(new Shockwave(spawnX, spawnY, 50, '#fbbf24'));
                    floatingTexts.push(new FloatingText(spawnX, spawnY - 20, 'СТРЕМЯНКА-ТУРЕЛЬ! 🔨', '#fbbf24'));
                    ikeaTurrets.push(new IkeaTurret(spawnX, spawnY, this));
                } else if (this.wrenchCombo % 4 === 0 && ikeaTeslas.filter(t => t.owner === this).length < 2) {
                    sounds.playBuild(); shockwaves.push(new Shockwave(spawnX, spawnY, 60, '#38bdf8'));
                    floatingTexts.push(new FloatingText(spawnX, spawnY - 20, 'ТЕСЛА-ВЫШКА! ⚡', '#38bdf8'));
                    ikeaTeslas.push(new IkeaTesla(spawnX, spawnY, this));
                }
            }
        }

        if (wType === 'super_hammer') triggerHammerChainWave(this.x + Math.cos(this.angle) * effectiveReach, this.y + Math.sin(this.angle) * effectiveReach, 210, baseDmg, this, isCrit, 0);
        else if (wType === 'hammer') shockwaves.push(new Shockwave(this.x + Math.cos(this.angle) * effectiveReach, this.y + Math.sin(this.angle) * effectiveReach, 70, '#f59e0b'));

        if (wType === 'super_sword') {
            [-0.22, 0, 0.22].forEach(offset => airSlashes.push(new AirSlash(this.x, this.y, this.angle + offset, baseDmg * 1.5, this)));
        }
        if (wType === 'super_staff') superNovaOrbs.push(new SuperNovaOrb(this.x + Math.cos(this.angle) * 30, this.y + Math.sin(this.angle) * 30, this.angle, baseDmg * 1.8, this));
        else if (wType === 'staff') magicOrbs.push(new MagicOrb(this.x + Math.cos(this.angle) * 35, this.y + Math.sin(this.angle) * 35, this.angle, baseDmg * 0.9, this));

        if (bossInstance && Math.hypot(this.x - bossInstance.x, this.y - bossInstance.y) < effectiveReach + bossInstance.radius) {
            bossInstance.takeDamage(baseDmg * (1 + this.bossDamageBonus));
        }

        bugs.forEach(bug => {
            if (Math.hypot(this.x - bug.x, this.y - bug.y) < effectiveReach + bug.radius) {
                bug.hp -= baseDmg;
                if (this.hasExecute && bug.hp <= bug.maxHp * 0.3) {
                    bug.hp = 0; floatingTexts.push(new FloatingText(bug.x, bug.y, 'КАЗНЬ! ☠️', '#ef4444'));
                }
            }
        });

        chairs.forEach(target => {
            if (target !== this && target.hp > 0 && Math.hypot(this.x - target.x, this.y - target.y) < effectiveReach + target.radius) {
                target.takeDamage(baseDmg, this);
            }
        });

        for (let idx = barrels.length - 1; idx >= 0; idx--) {
            if (Math.hypot(this.x - barrels[idx].x, this.y - barrels[idx].y) < effectiveReach + barrels[idx].radius) {
                if (barrels[idx].takeHit(baseDmg)) barrels.splice(idx, 1);
            }
        }
        for (let idx = chests.length - 1; idx >= 0; idx--) {
            if (Math.hypot(this.x - chests[idx].x, this.y - chests[idx].y) < effectiveReach + chests[idx].radius) {
                if (chests[idx].takeHit(baseDmg)) chests.splice(idx, 1);
            }
        }
    }

    update() {
        if (this.hp <= 0) return;
        const speedMult = this.hasNuclearBattery ? 1.35 : 1.0;

        if (this.coinTossCooldown > 0) this.coinTossCooldown--;
        if (this.shadowStepTimer > 0) this.shadowStepTimer--;
        if (this.regenRate > 0 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + (this.regenRate / 60));

        if (this.hasExtinguisher && this.hp < this.maxHp * 0.5) {
            if (this.extinguisherCooldown <= 0) {
                this.extinguisherCooldown = 360; sounds.playBounce();
                shockwaves.push(new Shockwave(this.x, this.y, 140, '#f8fafc'));
                bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 140) b.slowTimer = 180; });
                floatingTexts.push(new FloatingText(this.x, this.y - 25, 'ОГНЕТУШИТЕЛЬ! 🧯', '#38bdf8'));
            }
        }
        if (this.extinguisherCooldown > 0) this.extinguisherCooldown--;

        if (this.hasHotKettle) {
            this.hotKettleTimer += speedMult;
            if (this.hotKettleTimer >= 360) {
                this.hotKettleTimer = 0; sounds.playExplosion();
                shockwaves.push(new Shockwave(this.x, this.y, 130, '#ef4444'));
                bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 130) b.hp -= 150; });
                floatingTexts.push(new FloatingText(this.x, this.y - 30, 'КИПЯТОК! ☕', '#f97316'));
            }
        }

        if (this.hasMothTrap) {
            this.mothTrapTimer += speedMult;
            if (this.mothTrapTimer >= 480) {
                this.mothTrapTimer = 0; stickyTraps.push(new StickyTrap(this.x, this.y));
            }
        }

        if (this.isDashing) {
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                if (this.hasShadowStep) this.shadowStepTimer = 36;
            }
        }

        if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= speedMult;
        if (this.stompCooldown > 0) this.stompCooldown -= speedMult;
        if (this.buffVarnish > 0) this.buffVarnish--;
        if (this.buffWheels > 0) this.buffWheels--;

        if (this.titanTimer > 0) {
            this.titanTimer--;
            if (this.titanTimer <= 0) this.radius = this.baseRadius;
        }

        if (this.hasOrbitalShields) {
            this.orbitalAngle += 0.06;
            const s1X = this.x + Math.cos(this.orbitalAngle) * 65, s1Y = this.y + Math.sin(this.orbitalAngle) * 65;
            const s2X = this.x + Math.cos(this.orbitalAngle + Math.PI) * 65, s2Y = this.y + Math.sin(this.orbitalAngle + Math.PI) * 65;
            for (let i = bossCushions.length - 1; i >= 0; i--) {
                const c = bossCushions[i];
                if (Math.hypot(c.x - s1X, c.y - s1Y) < 26 || Math.hypot(c.x - s2X, c.y - s2Y) < 26) {
                    sounds.playBounce(); bossCushions.splice(i, 1);
                }
            }
        }

        if (this.hasTesla) {
            this.teslaCooldown += speedMult;
            if (this.teslaCooldown >= 180) {
                this.teslaCooldown = 0;
                let target = null, minDist = 260;
                bugs.forEach(b => {
                    if (b.hp > 0 && Math.hypot(b.x - this.x, b.y - this.y) < minDist) { minDist = Math.hypot(b.x - this.x, b.y - this.y); target = b; }
                });
                if (target) {
                    sounds.playZap(); shockwaves.push(new Shockwave(target.x, target.y, 40, '#38bdf8'));
                    target.hp -= 45 + (this.teslaLevel * 15);
                }
            }
        }

        if (this.hasPoisonTrail) {
            this.poisonTimer++;
            if (this.poisonTimer >= 22) { this.poisonTimer = 0; poisonPools.push(new PoisonPool(this.x, this.y)); }
        }

        if (this.hasFrostAura) {
            bugs.forEach(b => { if (Math.hypot(b.x - this.x, b.y - this.y) < 180) b.slowTimer = 15; });
        }

        if (this.hasBoomerang) {
            this.boomerangTimer += speedMult;
            if (this.boomerangTimer >= 210) { this.boomerangTimer = 0; boomerangs.push(new Boomerang(this)); }
        }

        if (this.hasSaw) {
            this.sawAngle += 0.2;
            const sawReach = this.radius + 32, sawDmg = (1.5 + this.sawLevel * 0.6);
            bugs.forEach(bug => { if (Math.hypot(this.x - bug.x, this.y - bug.y) < sawReach + bug.radius) bug.hp -= sawDmg; });
            if (bossInstance && Math.hypot(this.x - bossInstance.x, this.y - bossInstance.y) < sawReach + bossInstance.radius) bossInstance.takeDamage(sawDmg);
        }

        this.minions.forEach(m => m.update());

        let curSpeed = this.speed * (this.buffWheels > 0 ? 1.6 : 1.0);
        if (this.hasBerserk && this.hp < this.maxHp) curSpeed *= (1 + (1 - this.hp / this.maxHp) * 0.45);

        if (this === player) {
            let moveX = 0, moveY = 0;
            const allowWASD = (controlScheme === 'universal' || controlScheme === 'wasd_mouse' || controlScheme === 'keyboard_only');
            const allowArrows = (controlScheme === 'universal' || controlScheme === 'arrows_mouse' || controlScheme === 'keyboard_only');
            const allowMouseMove = (controlScheme === 'universal' || controlScheme === 'mouse_only');
            const aimWithMouse = (controlScheme !== 'keyboard_only');

            if (allowWASD) {
                if (keys['KeyW']) moveY -= 1; if (keys['KeyS']) moveY += 1;
                if (keys['KeyA']) moveX -= 1; if (keys['KeyD']) moveX += 1;
            }
            if (allowArrows) {
                if (keys['ArrowUp']) moveY -= 1; if (keys['ArrowDown']) moveY += 1;
                if (keys['ArrowLeft']) moveX -= 1; if (keys['ArrowRight']) moveX += 1;
            }

            if (moveX !== 0 || moveY !== 0) {
                const len = Math.hypot(moveX, moveY);
                this.vx += (moveX / len) * curSpeed * 0.25;
                this.vy += (moveY / len) * curSpeed * 0.25;
                if (!aimWithMouse) this.angle = Math.atan2(moveY, moveX);
            } else if (allowMouseMove) {
                const dx = mouse.worldX - this.x, dy = mouse.worldY - this.y;
                if (Math.hypot(dx, dy) > (controlScheme === 'mouse_only' ? 12 : 25)) {
                    const ang = Math.atan2(dy, dx);
                    this.vx += Math.cos(ang) * curSpeed * 0.20;
                    this.vy += Math.sin(ang) * curSpeed * 0.20;
                }
            }
            if (aimWithMouse) this.angle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);
        } else {
            if (Math.random() < 0.02) this.angle = Math.random() * Math.PI * 2;
            this.vx += Math.cos(this.angle) * curSpeed * 0.12;
            this.vy += Math.sin(this.angle) * curSpeed * 0.12;
            if (Math.random() < 0.02) this.triggerSwing();
        }

        this.x += this.vx; this.y += this.vy;
        this.vx *= 0.86; this.vy *= 0.86;
        this.x = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.y));

        if (this.hasBow) {
            const cooldown = Math.max(180, (1000 - this.bowLevel * 150) / speedMult);
            if (Date.now() - this.lastBowShot > cooldown) {
                this.lastBowShot = Date.now();
                arrows.push(new Arrow(this.x, this.y, this.angle, 15 + this.damageBonus, this));
                for (let i = 0; i < this.extraArrows; i++) {
                    const spread = (i + 1) * 0.2 * (i % 2 === 0 ? 1 : -1);
                    arrows.push(new Arrow(this.x, this.y, this.angle + spread, 15 + this.damageBonus, this));
                }
                while (arrows.length > MAX_ARROWS) arrows.shift();
            }
        }

        if (this.isSwinging) {
            this.swingProgress += this.weapon.swingSpeed;
            const wType = this.weapon.type;
            if (wType.includes('spear')) this.swordAngle = -0.15;
            else if (wType.includes('hammer')) this.swordAngle = -1.2 + Math.sin(this.swingProgress) * 2.8;
            else if (wType.includes('coin_gun')) this.swordAngle = -0.1;
            else this.swordAngle = -0.6 + Math.sin(this.swingProgress) * 2.3;

            if (this.swingProgress >= Math.PI) {
                this.isSwinging = false; this.swordAngle = -0.5;
            }
        }
    }

    draw(camera) {
        this.minions.forEach(m => m.draw(camera));
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);

        if (this.titanTimer > 0) ctx.scale(1.8, 1.8);

        if (this.godArmorTimer > 0 || this.shadowStepTimer > 0) {
            ctx.strokeStyle = this.shadowStepTimer > 0 ? '#38bdf8' : '#fbbf24';
            ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, this.radius + 14, 0, Math.PI * 2); ctx.stroke();
        }

        if (this.hasOrbitalShields) {
            [this.orbitalAngle, this.orbitalAngle + Math.PI].forEach(ang => {
                const ox = Math.cos(ang) * 65, oy = Math.sin(ang) * 65;
                ctx.fillStyle = '#38bdf8'; ctx.fillRect(ox - 8, oy - 8, 16, 16);
            });
        }

        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, -this.radius - 12);
        ctx.fillStyle = '#0f172a'; ctx.fillRect(-22, -this.radius - 8, 44, 6);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(-20, -this.radius - 6, (Math.max(0, this.hp) / this.maxHp) * 40, 2.5);

        ctx.rotate(this.angle);

        const skin = this.skin;
        const legOffsets = [ { x: -16, y: -15 }, { x: 12, y: -15 }, { x: -16, y: 15 }, { x: 12, y: 15 } ];
        legOffsets.forEach(leg => {
            ctx.fillStyle = skin.dark; ctx.beginPath(); ctx.arc(leg.x, leg.y, 3.5, 0, Math.PI * 2); ctx.fill();
        });

        ctx.strokeStyle = skin.dark; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(-12, 0, 16, Math.PI * 0.65, Math.PI * 1.35, false); ctx.stroke();

        ctx.fillStyle = skin.dark; ctx.fillRect(-15, -16, 30, 32);
        ctx.fillStyle = skin.cushion; ctx.fillRect(-13, -14, 26, 28);

        const wType = this.weapon.type;

        if (wType.includes('wrench')) {
            ctx.save(); ctx.translate(12, 10); ctx.rotate(this.swordAngle);
            const isSuper = wType === 'super_wrench';
            ctx.fillStyle = isSuper ? '#38bdf8' : '#cbd5e1';
            ctx.fillRect(-5, -12, 8, 14); ctx.fillRect(0, -4, this.swordLen, 8);
            ctx.fillStyle = isSuper ? '#fef08a' : '#94a3b8'; ctx.fillRect(this.swordLen - 5, -5, 8, 10);
            ctx.restore();
        } else if (wType.includes('coin_gun')) {
            ctx.save(); ctx.translate(14, 8);
            ctx.fillStyle = wType === 'super_coin_gun' ? '#fbbf24' : '#475569'; ctx.fillRect(0, -3, 24, 6);
            ctx.fillStyle = '#f59e0b'; ctx.fillRect(6, -5, 8, 10);
            ctx.restore();
        } else {
            ctx.save(); ctx.translate(12, 10); ctx.rotate(this.swordAngle);
            ctx.fillStyle = '#78350f'; ctx.fillRect(-6, -2, 6, 4);
            ctx.fillStyle = '#cbd5e1'; ctx.fillRect(4, -3, this.swordLen - 4, 6);
            ctx.restore();
        }

        const hatObj = HATS.find(h => h.id === this.hat);
        if (hatObj && hatObj.icon !== '❌') {
            ctx.font = '22px sans-serif'; ctx.fillText(hatObj.icon, -3, -20);
        }

        ctx.restore();
    }
}