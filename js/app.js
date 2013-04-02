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
        'resources/terrain.png'
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
//{
//    position: [0, 0],
//    sprite: new Sprite('resources/sprites.png', [0, 0],
//                       [39, 39], 16, [0, 1])
//};

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

function Entity(pos, sprite, update_function) {
    this.pos = pos;
    this.sprite = sprite;
    this.update_function = update_function;
}
Entity.prototype.update = function(dt) {
    //returns false if the entity is offscreen, else returns turn
    if(isEntityOffscreen(this)) {
        return false;
    }

    this.pos = this.update_function(dt, this.pos);
    this.sprite.update(dt);
    return true;
};

function createEnemy(pos) {
    console.log("Enemy created at:" + pos);
    //var enemySpeed = [-50, -10];
    var enemySpeed = 50;
    var enemy_update_func = function(dt, old_pos) {
        //new_pos = add2d(old_pos, mul2d(enemySpeed, dt));
        direction_to_player = normalize(sub2d(player.pos, old_pos));
        new_pos = add2d(old_pos, mul2d(direction_to_player, enemySpeed * dt));
        return new_pos;
    }
    return new Entity(pos, new Sprite('resources/sprites.png', [0, 78],
                                      [80, 39], 6, [0, 1, 2, 3, 2, 1]),
                                      enemy_update_func
            );
}

function createPlayer() {
    var FIRE_DELAY = 100;
    return new Entity([0, 0], new Sprite('resources/sprites.png', [0, 0],
                                         [39, 39], 16, [0, 1]),
        function(dt, old_pos) {
            new_pos = old_pos;
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

                bullets.push({ pos: bullet_position,
                               dir: 'forward',
                               sprite: new Sprite('resources/sprites.png', [0, 39], [18, 8]) });
                bullets.push({ pos: add2d(bullet_position, [0, -5]),
                               dir: 'forward',
                               sprite: new Sprite('resources/sprites.png', [0, 39], [18, 8]) });
                bullets.push({ pos: add2d(bullet_position, [0, 5]),
                               dir: 'forward',
                               sprite: new Sprite('resources/sprites.png', [0, 39], [18, 8]) });

                lastFire = Date.now();
            }
            return new_pos;
        }
    );
}

var once = true;
function update(dt) {
    gameTime += dt;

    updateEntities(dt);

    if(once && Math.random() < 1 - Math.pow(.993, gameTime)) {
        enemies.push(createEnemy([canvas.width, Math.random() * (canvas.height - 39)]));
        once = false;
    }

    checkCollisions();
    scoreEl.innerHTML = score;
}

function getEntityCenter(entity) {
    return [entity.pos[0] + entity.sprite.size[0] / 2,
            entity.pos[1] + entity.sprite.size[1] / 2];
}

function magnatude(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}
function normalize(v) {
    vmag = magnatude(v);
    return [v[0] / vmag, v[1] / vmag];
}
function add2d(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
}
function sub2d(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1]];
}
function mul2d(v, s) {
    return [v[0] * s, v[1] * s];
}

function isEntityOffscreen(entity) {
    return entity.pos[1] < 0 || entity.pos[1] > canvas.height ||
           entity.pos[0] < 0 || entity.pos[0] > canvas.width;
}

function updateEntities(dt) {
    player.update(dt);

    // Update bullets
    for(var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];

        switch(bullet.dir) {
            default:
                bullet.pos[0] += bulletSpeed * dt;
        }

        // Remove bullet if offScreen
        if(isEntityOffscreen(bullet)) {
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

function checkCollisions() {
    checkPlayerBounds();

    // Check enemy collisions and bullets
    for(var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        for(var j = 0; j < bullets.length; j++) {
            var bullet = bullets[j];

            if(entityCollides(bullet, enemy)) {
                enemies.splice(i, 1);
                i--;

                score += 100;

                explosions.push({
                    pos: bullet.pos,
                    sprite: new Sprite('resources/sprites.png',
                                       [0, 117], [39, 39], 16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null, true)
                });

                bullets.splice(j, 1);
                break;
            }
        }

        if(entityCollides(enemy, player)) {
            gameOver();
        }
    }
}

function checkPlayerBounds() {
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    } else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }
    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    } else if(player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
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

    player.pos = [50, canvas.height / 2];
}
