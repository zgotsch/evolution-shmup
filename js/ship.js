function Ship(entity, health) {
    this.entity = entity;
    this.health = health;
    this.weapons = {};
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
Ship.prototype.damage = function(damage) {
    this.health -= damage.amount;
    if(this.health <= 0) {
        tempCreateExplosion(getEntityCenter(this.entity));
        return true;
    } else {
        return false;
    }
};

function Enemy(pos) {
    var enemy_update_func = function(dt, entity) {
        //new_pos = add2d(old_pos, mul2d(enemySpeed, dt));
        direction_to_player = normalize(sub2d(playerEntity.pos, entity.pos));
        new_pos = add2d(entity.pos, mul2d(direction_to_player, enemySpeed * dt));
        return new_pos;
    }
    var shipEntity = new Entity(pos, new Sprite('resources/sprites.png', [0, 78],
                                [80, 39], 6, [0, 1, 2, 3, 2, 1]),
                                enemy_update_func
                               );
    this.ship = new Ship(shipEntity, 200);
    debug("Enemy created at:" + pos);
}

function tempCreateExplosion(pos) {
    var explosion = {
        pos: pos,
        sprite: new Sprite('resources/sprites.png',
                           [0, 117], [39, 39], 16,
                           [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                           null, true)
    };
    entityPool.push(explosion);
    explosions.push(explosion);
}


function weaponIndexToYCoord(index) {
    return index * 20;
}
function weaponFireLocation(ship, index) {
    var entityCenter = getEntityCenter(ship.entity);
    return add2d(entityCenter, [0, weaponIndexToYCoord(index)]);
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
            var bullet = new Entity(cannonLocation, this.projectileSprite, this.projectileUpdateFunction);
            bullet.weapon = this;
            bullets.push(bullet);
            entityPool.push(bullet);

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
function MachineGun() {
    Weapon.call(this, "MachineGun", {amount: 100, type: "physical"}, 100);

    this.projectileSprite = new Sprite('resources/sprites.png', [0, 39], [18, 8]);
    this.projectileUpdateFunction = machineGunProjectileUpdateFunction;
}
MachineGun.prototype = object(Weapon.prototype);
MachineGun.prototype.constructor = MachineGun;
