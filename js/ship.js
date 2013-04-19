function Ship(entity, health, armor, engine) {
    this.entity = entity;
    this.health = health;
    this.weapons = {};
    this.armor = armor;
    this.engine = engine;
}
Ship.prototype.addWeaponAtIndex = function(weapon, index) {
    if(!(index in weapon)) {
        weapon.attach(this);
        this.weapons[index] = weapon;
        weapon.index = index;
        debug("Added weapon: ", weapon, " to ship: ", this);
    }
    else {
        error("Tried to add weapon: ", weapon, " at a full index: ", index);
    }
};
Ship.prototype.fireAllWeapons = function() {
    //todo change to forEach
    for(gun in this.weapons) {
        this.weapons[gun].fire();
    }
};
Ship.prototype.applyArmorToDamage = function(damage) {
    var adjustedDamage = clone(damage);
    for(var i = 0; i < this.armor.length; i++) {
        var armor = this.armor[i];
        if(armor.type === 'all') {
            ;
        }
        if(damage.type === armor.type) {
            adjustedDamage.amount = Math.max(0, damage.amount - armor.amount);
        }
    }
    return adjustedDamage;
};
Ship.prototype.damage = function(damage) {
    damage = this.applyArmorToDamage(damage);
    this.health -= damage.amount;
    if(this.health <= 0) {
        tempCreateExplosion(getEntityCenter(this.entity));
        return true;
    } else {
        return false;
    }
};
Ship.prototype.move = function(intent, dt) {
    //intent is a direction and a speed
    var speed = Math.min(intent.speed, this.engine.speed);
    this.entity.pos = add2d(this.entity.pos, scaleVectorTo(intent.direction, speed * dt));
};

function goStraightBehaviour(ship) {
    return {speed: enemySpeed, direction: [-1, 0]};
}
function followPlayerBehaviour(ship) {
    var direction_to_player = normalize(sub2d(engine.player.ship.entity.pos, ship.entity.pos));
    return {speed: enemySpeed, direction: direction_to_player};
}
function Enemy(pos, behaviour) {
    var shipEntity = new Entity(pos, [new Sprite('resources/sprites.png', [0, 78],
                                [80, 39], 6, [0, 1, 2, 3, 2, 1])]);
    this.ship = new Ship(shipEntity, 200, [{type:'physical', amount:10}], {speed: 50});
    this.behaviour = behaviour;

    debug("Enemy created at:" + pos);
}
Enemy.prototype.update = function(dt) {
    this.ship.move(this.behaviour(this.ship), dt);
};

function tempCreateExplosion(pos) {
    var explosion = new Entity(pos, [new Sprite('resources/sprites.png',
                           [0, 117], [39, 39], 16,
                           [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                           null, true)]);
    engine.renderer.addEntity(explosion);
    //engine.explosions.push(explosion);
}


function weaponIndexToYCoord(index) {
    return 5 + index * 20;
}
function weaponFireLocation(ship, index) {
    //var entityCenter = getEntityCenter(ship.entity);
    return add2d(ship.entity.pos, [0, weaponIndexToYCoord(index)]);
}

function Weapon(name, damage, fireDelay) {
    this.name = "";

    this.projectileSprite = null;
    this.projectileUpdateFunction = null;
    this.projectileExplosionFunction = null;
    this.damage = damage;
    this.fireDelay = fireDelay;

    this.lastFired = null;

    this.index = 0;

    this.ship = null;
}
Weapon.prototype.fire = function() {
    var frameTime = Date.now();
    if(frameTime - this.lastFired > this.fireDelay) {
        this.lastFired = frameTime;

        if(!this.ship) {
            error("Firing unattached weapon", this);
        } else if(!this.projectileSprite) {
            error("Firing unsprited weapon", this);
        } else {
            // All good
            var cannonLocation = weaponFireLocation(this.ship, this.index);
            var bullet = new Projectile(cannonLocation, this.projectileSprite, this.projectileUpdateFunction, this);
            //debug("Fired: ", this);
        }
    }
};
Weapon.prototype.attach = function(ship) {
    this.ship = ship;
};

var machineGunProjectileUpdateFunction = function(dt, entity) {
    return add2d(entity.pos, mul2d([bulletSpeed, 0], dt));
}
var machineGunProjectileHitFunction = function(hitLocation) {
    tempCreateExplosion(hitLocation);
}

function MachineGun() {
    Weapon.call(this, "MachineGun", {amount: 100, type: "physical"}, 100);

    this.projectileSprite = new Sprite('resources/sprites.png', [0, 39], [18, 8]);
    this.projectileUpdateFunction = machineGunProjectileUpdateFunction;
    this.projectileExplosionFunction = machineGunProjectileHitFunction;
}
MachineGun.prototype = object(Weapon.prototype);
MachineGun.prototype.constructor = MachineGun;


function Projectile(pos, sprite, updateFunction, weapon) {
    this.updateFunction = updateFunction;
    this.weapon = weapon;

    this.entity = new Entity(pos, [sprite]);
    engine.playerBullets.push(this);
    engine.renderer.addEntity(this.entity);
}
Projectile.prototype.update = function(dt) {
    //returns false if the entity is offscreen, else returns turn
    if(isEntityOffscreen(this.entity)) {
        this.entity.remove = true;
        return false;
    }

    this.entity.old_pos = this.entity.pos;
    this.entity.pos = this.updateFunction(dt, this.entity);
    this.velocity = mul2d(sub2d(this.entity.pos, this.entity.old_pos), 1/dt);
    return true;
};
