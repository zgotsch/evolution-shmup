var shipTypes = {
    player: 0,
    enemySmall: 1,
    enemyMedium: 2,
    enemyLarge: 3
};

function shipTypeToSprite(shipType) {
    if(shipType === shipTypes.enemySmall) {
        return new Sprite({
            url: 'resources/placehold.png',
            pos: [0, 45],
            size: [40, 25],
        });
    } else if(shipType === shipTypes.enemyMedium) {
        return new Sprite({
            url: 'resources/placehold.png',
            pos: [0, 70],
            size: [60, 40],
        });
    } else if(shipType === shipTypes.enemyLarge) {
        return new Sprite({
            url: 'resources/placehold.png',
            pos: [0, 110],
            size: [90, 45],
        });
    } else if(shipType === shipTypes.player) {
        return new Sprite({
            url: 'resources/placehold.png',
            pos: [0, 0],
            size: [40, 45],
            frames: [0, 1]
        });
    }
}
function armorToSprites(armors) {
    return armors.map(function(armor) {
        if(armor.type === 'physical') {
            return new Sprite({
                url: 'resources/placehold.png',
                pos: [0, 190],
                size: [40, 25],
            });
        } else {
            return new Sprite({
                url: 'resources/placehold.png',
                pos: [40, 190],
                size: [40, 25],
            });
        }
    });
}

function Ship(type, pos, health, armor, engine) {
    this.type = type;
    this.entity = new Entity(pos, null);
    this.health = health;
    this.weapons = {};
    this.armor = armor;
    this.engine = engine;

    this.entity.sprites = createShipSprites.call(this);

    function createShipSprites() {
        var shipSprites = []
        shipSprites.push(shipTypeToSprite(type)); //hull
        //shipSprites.push(new Sprite({
        //    url: 'resources/placehold.png',
        //    pos: [0, 0],
        //    size: [10, 10],
        //}));
        var armorSprites = armorToSprites(armor);
        armorSprites.forEach(function(sprite) {
            shipSprites.push(sprite);
        });
        return shipSprites;
    }
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
    return {speed: enemySpeed, direction: [0, 1]};
}
function followPlayerBehaviour(ship) {
    var direction_to_player = normalize(sub2d(engine.player.ship.entity.pos, ship.entity.pos));
    return {speed: enemySpeed, direction: direction_to_player};
}

function shipHealthForType(shipType) {
    if(shipType === shipTypes.player) {
        return 500;
    } else if(shipType === shipTypes.enemySmall) {
        return 100;
    } else if(shipType === shipTypes.enemyMedium) {
        return 200;
    } else if(shipType === shipTypes.enemyLarge) {
        return 600;
    }
}

function Enemy(shipType, behaviour, armor) {
   // var shipEntity = new Entity(pos, [new Sprite({
   //     url: 'resources/placehold.png',
   //     pos: [0, 70],
   //     size: [60, 40],
   //     //speed: 6,
   //     frames: [0, 1, 2, 3, 2, 1]
   // })]);
    armor = armor || [{type:'physical', amount:10}];
    this.ship = new Ship(shipType, [0, 0], shipHealthForType(shipType), armor, {speed: 50});
    this.behaviour = behaviour;

    debug("Enemy created: " + this);
}
Enemy.prototype.update = function(dt) {
    this.ship.move(this.behaviour(this.ship), dt);
};

function tempCreateExplosion(pos) {
    var explosion = new Entity(pos, [new Sprite({
        url: 'resources/placehold.png',
        pos: [0, 155],
        size: [20, 20],
        speed: 16,
        frames: [0, 1, 0],
        once: true
    })]);

    engine.renderer.addEntity(explosion);
}


function weaponIndexToLaunchPosition(index) {
    return [5 + index * 20, 0];
}
function weaponFireLocation(ship, index) {
    //var entityCenter = getEntityCenter(ship.entity);
    return add2d(ship.entity.pos, weaponIndexToLaunchPosition(index));
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
    return add2d(entity.pos, mul2d([0, -bulletSpeed], dt));
}
var machineGunProjectileHitFunction = function(hitLocation) {
    tempCreateExplosion(hitLocation);
}

function MachineGun() {
    Weapon.call(this, "MachineGun", {amount: 100, type: "physical"}, 100);

    this.projectileSprite = new Sprite({
        url: 'resources/placehold.png',
        pos: [0, 176],
        size: [5, 10]
    });
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
