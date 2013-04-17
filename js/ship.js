function Ship(entity) {
    this.entity = entity;
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
    this.projectileHitFunction = null;
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
            bullets.push(bullet);

            debug("Fired: ", this);
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
    Weapon.call(this, "MachineGun", 100, 100);

    this.projectileSprite = new Sprite('resources/sprites.png', [0, 39], [18, 8]);
    this.projectileUpdateFunction = machineGunProjectileUpdateFunction;
}
MachineGun.prototype = object(Weapon.prototype);
MachineGun.prototype.constructor = MachineGun;
