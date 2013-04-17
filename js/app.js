var DEBUG = true;

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

var scoreEl = document.getElementById('score');
var framerateEl = document.getElementById('framerate');


var terrainPattern;
document.getElementById('play-again').addEventListener('click', function() {
    engine.reset();
});

function showGameOverOverlay() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
}
function hideGameOverOverlay() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
}

var engine = new Engine();

resources.onReady(function() {
    terrainPattern = ctx.createPattern(resources.get('resources/terrain.png'), 'repeat');
    engine.start.call(engine);
});
resources.load([
        'resources/sprites.png',
        'resources/terrain.png',
        'resources/laser.png'
        ]);

function Engine() {
    var self = this;

    this.running = false;

    this.renderer = new Renderer(canvas, ctx);

    var framerate = DEBUG;

    var lastTime;

    this.reset = function() {
        self.renderer.reset();

        hideGameOverOverlay();
        self.gameTime = 0;
        self.score = 0;

        self.enemies = [];
        self.player = createPlayer([50, canvas.height / 2], this.renderer);
        self.playerBullets = [];
        self.enemyBullets = [];
    }

    this.reset();

    this.start = function() {
        self.running = true;
        lastTime = Date.now();
        self.gameLoop();
    }
    this.pause = function() {
        self.running = false;
    }

    this.gameLoop = function() {
        var now = Date.now();
        var dt = (now - lastTime) / 1000.0;

        update(dt);
        self.renderer.render(dt);

        lastTime = now;
        if(self.running) {
            requestAnimationFrame(self.gameLoop);
        }
    }

    var frameRates = [];
    function showFrameRate(dt) {
        frameRates.push(1/dt);
        while(frameRates.length > 10) {
            frameRates.shift();
        }
        framerateEl.innerHTML = average(frameRates).toFixed(1);
    }
    function update(dt) {
        self.gameTime += dt;

        self.player.update(dt);
        self.enemies.forEach(function(e) { e.update(dt); });
        //self.playerBullets.forEach(function(pb) { pb.update(dt); });
        for(var i = 0; i < self.playerBullets.length; i++) {
            if(!self.playerBullets[i].update(dt)) {
                self.playerBullets.splice(i, 1);
                i--;
            }
        }
        //self.enemyBullets.forEach(function(eb) { eb.update(dt); });

        checkCollisions();

        if(Math.random() < 1 - Math.pow(.993, self.gameTime)) {
            createAndAddEnemy();
        }

        scoreEl.innerHTML = self.score;
        if(framerate) { showFrameRate(dt); }
    }

    function checkCollisions() {
        enforcePlayerBounds();

        // Check enemy collisions and bullets
        for(var i = 0; i < self.enemies.length; i++) {
            var enemy = self.enemies[i];
            for(var j = 0; j < self.playerBullets.length; j++) {
                var bullet = self.playerBullets[j];

                var collisionPoint = bulletCollides(bullet, enemy.ship.entity);
                if(collisionPoint) {
                    if(bullet.weapon.projectileExplosionFunction) {
                        bullet.weapon.projectileExplosionFunction(collisionPoint);
                    }
                    var destroyed = enemy.ship.damage(bullet.weapon.damage);

                    if(destroyed) {
                        enemy.ship.entity.remove = true;
                        self.enemies.splice(i, 1);
                        i--;

                        self.score += 100;

                    }
                    bullet.entity.remove = true;
                    self.playerBullets.splice(j, 1);
                    break;
                }
            }

            if(entityCollides(enemy.ship.entity, self.player.ship.entity)) {
                gameOver();
            }
        }
    }

    var createAndAddEnemy = function() {
        var enemy = createEnemy([canvas.width, Math.random() * (canvas.height - 39)])
        self.enemies.push(enemy);
    }
    //createAndAddEnemy = once(createAndAddEnemy);
}

function Renderer(canvas, ctx) {
    var entities = [];

    function removeInactiveEntities() {
        entities = entities.filter(function(e) {
            return !e.remove && !e.sprite.done;
        });
    }

    function updateSprites(dt) {
        entities.forEach(function (entity) {
            entity.sprite.update(dt);
        });
    }

    function renderEntities(entities) {
        entities.forEach(renderEntity);
    }

    function renderEntity(entity) {
        ctx.save();
        ctx.translate(entity.pos[0], entity.pos[1]);
        entity.sprite.render(ctx);
        ctx.restore();
    }

    function renderBackground() {
        ctx.fillStyle = terrainPattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    this.render = function(dt) {
        renderBackground();

        updateSprites(dt);
        removeInactiveEntities();
        renderEntities(entities);
    }

    this.addEntity = function(entity) {
        entities.push(entity);
    }

    this.reset = function() {
        entities.length = 0;
    }
}

var bulletSpeed = 500;
var enemySpeed = 50;

function createEnemy(pos) {
    /*
    debug("Enemy created at:" + pos);
    //var enemySpeed = [-50, -10];
    var enemySpeed = 50;
    var enemy_update_func = function(dt, entity) {
        //new_pos = add2d(old_pos, mul2d(enemySpeed, dt));
        direction_to_player = normalize(sub2d(playerEntity.pos, entity.pos));
        new_pos = add2d(entity.pos, mul2d(direction_to_player, enemySpeed * dt));
        return new_pos;
    }
    return new Entity(pos, new Sprite('resources/sprites.png', [0, 78],
                                      [80, 39], 6, [0, 1, 2, 3, 2, 1]),
                                      enemy_update_func
            );
    */
    var behaviour = randomInt(1) ? goStraightBehaviour : followPlayerBehaviour;
    var enemy = new Enemy(pos, behaviour);
    engine.renderer.addEntity(enemy.ship.entity);
    return enemy;
}
function createBullet(pos) {
    var bullet_update_func = function(dt, entity) {
        return add2d(entity.pos, mul2d([bulletSpeed, 0], dt));
    }
    return new Entity(pos, new Sprite('resources/sprites.png', [0, 39], [18, 8]),
            bullet_update_func);
}
function createFastBullet(pos) {
    var bullet_update_func = function(dt, entity) {
        return add2d(entity.pos, mul2d([100000, 0], dt));
    }
    return new Entity(pos, new Sprite('resources/sprites.png', [0, 39], [18, 8]),
            bullet_update_func);
}
function createLaser(start_pos, end_pos) {
    var bullet_update_func = function(dt, entity) {
        return add2d(entity.pos, mul2d([100000, 0], dt));
    };
    var hit_func = function(hit_location, hit_entity) {
        //make an explosion
        createExplosion(hit_location);
        //hit_entity.damage(100);

        //draw a laser
        explosions.push({
            pos: start_pos,
            sprite: new RepeatedSprite('resources/laser.png',
                [hit_location[0] - start_pos[0], 6], 'repeat')
        });
    };

    var laser = new Entity(start_pos, new Sprite('resources/sprites.png', [0, 39], [18, 8]),
            bullet_update_func);
    laser.hit_function = hit_func;
    return laser;
}

var up = {};
var down = {};
var backtime = 500;
var accel = 1;
function createMissile(direction, pos) {
    var backvel = [-50, direction == up ? -50 : 50];
    var forvel = [500, 0];
    var foracc = [2000, 0];
    var missile_update_func = function(dt, entity) {
        var elapsed = Date.now() - entity.creation_time;
        if(elapsed < backtime) {
            return add2d(entity.pos, mul2d(backvel, dt));
        }
        return add2d(add2d(entity.pos, mul2d(entity.velocity, dt)),
                     mul2d(foracc, Math.pow(dt, 2)));
    }
    return new Entity(pos, new Sprite('resources/sprites.png', [0, 39], [18, 8]),
            missile_update_func);
}

function createPlayer(pos, renderer) {
    var playerShip;
    playerEntity = new Entity(pos, new Sprite('resources/sprites.png', [0, 0],
                                         [39, 39], 16, [0, 1]));

    renderer.addEntity(playerEntity);
    playerShip = new Ship(playerEntity);
    playerShip.addWeaponAtIndex(new MachineGun(), 0);
    playerShip.addWeaponAtIndex(new MachineGun(), 1);

    return {ship: playerShip, update: function(dt) {
        var playerSpeed = 200;
        new_pos = this.ship.entity.pos;
        if(input.isDown('DOWN') || input.isDown('s')) {
            new_pos[1] += playerSpeed * dt;
        }
        if(input.isDown('UP') || input.isDown('w')) {
            new_pos[1] -= playerSpeed * dt;
        }
        if(input.isDown('LEFT') || input.isDown('a')) {
            new_pos[0] -= playerSpeed * dt;
        }
        if(input.isDown('RIGHT') || input.isDown('d')) {
            new_pos[0] += playerSpeed * dt;
        }

        if(input.isDown('SPACE')) {
            playerShip.fireAllWeapons();
        }
        this.ship.entity.pos = new_pos;
    }};
}



function updateEntities(dt) {
    playerEntity.update(dt);

    // Update bullets
    for(var i = 0; i < bullets.length; i++) {
        if(!bullets[i].update(dt)) {
            bullets.splice(i, 1);
            i--;
        }
    }

    // Update enemies
    for(var i = 0; i < enemies.length; i++) {
        //Remove if offscreen
        if(!enemies[i].ship.entity.update(dt)) {
            enemies.splice(i, 1);
            i--;
        }
    }

    // Update explosions
    for(var i = 0; i < explosions.length; i++) {
        explosions[i].sprite.update(dt);

        // Remove if animation is done
        if(explosions[i].sprite.done) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

function entityBorders(entity) {
    var borders = [];
    borders.push([entity.pos, add2d(entity.pos, [entity.sprite.size[0], 0])]); //top
    borders.push([entity.pos, add2d(entity.pos, [0, entity.sprite.size[1]])]); //left
    borders.push([add2d(entity.pos, [entity.sprite.size[0], 0]),
                  add2d(entity.pos, entity.sprite.size)]); //right
    borders.push([add2d(entity.pos, [0, entity.sprite.size[1]]),
                  add2d(entity.pos, entity.sprite.size)]); //bottom
    return borders;
}
function bulletCollides(bullet, other) {
    // returns collision point or false
    var bulletSegment = [bullet.entity.old_pos, bullet.entity.pos];
    var closest = {point:null, distance:Infinity}
    var borders = entityBorders(other);
    for(var i = 0; i < borders.length; i++) {
        var collision_point = segmentIntersection(bulletSegment, borders[i]);
        if(collision_point) {
            var dist = distance(bullet.entity.old_pos, collision_point);
            if(dist < closest.distance) {
                closest.distance = dist;
                closest.point = collision_point;
            }
        }
    }
    if(closest.point) {
        return closest.point;
    } else {
        return false;
    }
}

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 || b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

function entityCollides(e1, e2) {
    return boxCollides(e1.pos, e1.sprite.size, e2.pos, e2.sprite.size);
}

function createExplosion(pos) {
    explosions.push({
        pos: pos,
        sprite: new Sprite('resources/sprites.png',
                           [0, 117], [39, 39], 16,
                           [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                           null, true)
    });
}


function enforcePlayerBounds() {
    boundEntityWithin(playerEntity, [0, 0], [canvas.width, canvas.height]);
}

function boundEntityWithin(entity, bounds_low, bounds_high) {
    if(entity.pos[0] < bounds_low[0]) {
        entity.pos[0] = bounds_low[0];
    } else if(entity.pos[0] + entity.sprite.size[0] > bounds_high[0]) {
        entity.pos[0] = bounds_high[0] - entity.sprite.size[0];
    }
    if(entity.pos[1] < bounds_low[1]) {
        entity.pos[1] = bounds_low[1];
    } else if(entity.pos[1] + entity.sprite.size[1] > bounds_high[1]) {
        entity.pos[1] = bounds_high[1] - entity.sprite.size[1];
    }
}

function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

