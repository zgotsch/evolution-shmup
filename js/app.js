var DEBUG = true;

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

var playerSpeed = 200;
var bulletSpeed = 500;
var enemySpeed = 50;

var lastTime;
function gameLoop() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimationFrame(gameLoop);
}

resources.onReady(init);
resources.load([
        'resources/sprites.png',
        'resources/terrain.png',
        'resources/laser.png'
        ]);

function init() {
    terrainPattern = ctx.createPattern(resources.get('resources/terrain.png'), 'repeat');

    document.getElementById('play-again').addEventListener('click', function() {
        reset();
    });

    reset();
    lastTime = Date.now();
    gameLoop(); //start the game loop
}

// Game state
var player = createPlayer();
var playerEntity;

var bullets = [];
var enemies = [];
var explosions = [];

var lastFire = Date.now();
var gameTime;
var isGameOver;
var terrainPattern;

// The score
var score = 0;
var scoreEl = document.getElementById('score');


var isEmpty = function(obj) {
    return Object.keys(obj).length === 0;
}

function createEnemy(pos) {
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

function createPlayer() {
    var playerShip;
    playerEntity = new Entity([0, 0], new Sprite('resources/sprites.png', [0, 0],
                                         [39, 39], 16, [0, 1]),
        function(dt, entity) {
            new_pos = entity.pos;
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

            if(input.isDown('SPACE') && !isGameOver) {
                playerShip.fireAllWeapons();
            }
            return new_pos;
        }
    );
    playerShip = new Ship(playerEntity);
    playerShip.addWeaponAtIndex(new MachineGun(), 0);
    playerShip.addWeaponAtIndex(new MachineGun(), 1);

    return playerShip;
    /*
    return new Entity([0, 0], new Sprite('resources/sprites.png', [0, 0],
                                         [39, 39], 16, [0, 1]),
        function(dt, entity) {
            new_pos = entity.pos;
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

            if(input.isDown('SPACE') && !isGameOver && Date.now() - lastFire > FIRE_DELAY) {
                bullet_position = getEntityCenter(player);

                bullets.push(createMissile(up, bullet_position));
                bullets.push(createMissile(down, bullet_position));
                bullets.push(createLaser(bullet_position));

                lastFire = Date.now();
            }
            return new_pos;
        }
    );
    */
}

function once(fn) {
    var o = true;
    var new_func = function() {
        if(o) {
            o = false;
            return fn.apply(this, arguments);
        }
        return null;
    }
    return new_func;
}

var createAndAddEnemy = function() {
    enemies.push(createEnemy([canvas.width, Math.random() * (canvas.height - 39)]));
}
//createAndAddEnemy = once(createAndAddEnemy);

function update(dt) {
    gameTime += dt;

    updateEntities(dt);

    checkCollisions();

    if(Math.random() < 1 - Math.pow(.993, gameTime)) {
        createAndAddEnemy();
    }

    scoreEl.innerHTML = score;
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
        if(!enemies[i].update(dt)) {
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
    var bulletSegment = [bullet.old_pos, bullet.pos];
    var closest = {point:null, distance:Infinity}
    var borders = entityBorders(other);
    for(var i = 0; i < borders.length; i++) {
        var collision_point = segmentIntersection(bulletSegment, borders[i]);
        if(collision_point) {
            var dist = distance(bullet.old_pos, collision_point);
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

function checkCollisions() {
    enforcePlayerBounds();

    // Check enemy collisions and bullets
    for(var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        for(var j = 0; j < bullets.length; j++) {
            var bullet = bullets[j];

            var collisionPoint = bulletCollides(bullet, enemy);
            if(collisionPoint) {
                if(bullet.hasOwnProperty('hit_function')) {
                    bullet.hit_function(collisionPoint, enemy);
                }
                enemies.splice(i, 1);
                i--;

                score += 100;

                //createExplosion(collisionPoint);

                bullets.splice(j, 1);
                break;
            }
        }

        if(entityCollides(enemy, playerEntity)) {
            gameOver();
        }
    }
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

function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(playerEntity);
    }

    renderEntities(bullets);
    renderEntities(enemies);
    renderEntities(explosions);
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

function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 0;
    score = 0;

    enemies = [];
    bullets = [];

    playerEntity.pos = [50, canvas.height / 2];
}
