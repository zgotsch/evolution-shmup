function getEntityCenter(entity) {
    return [entity.pos[0] + entity.sprites[0].size[0] / 2,
            entity.pos[1] + entity.sprites[0].size[1] / 2];
}

function isEntityOffscreen(entity) {
    return entity.pos[1] < 0 || entity.pos[1] > canvas.height ||
           entity.pos[0] < 0 || entity.pos[0] > canvas.width;
}

function Entity(pos, sprites, update_function) {
    this.pos = pos;
    this.old_pos = pos;
    this.velocity = null;

    this.sprites = sprites;

    this.update_function = update_function;
    this.state = {};

    this.creation_time = Date.now();
}
Entity.prototype.update = function(dt) {
    //returns false if the entity is offscreen, else returns turn
    if(isEntityOffscreen(this)) {
        return false;
    }

    this.old_pos = this.pos;
    this.pos = this.update_function(dt, this);
    this.velocity = mul2d(sub2d(this.pos, this.old_pos), 1/dt);

    this.sprites.forEach(function(sprite) {
        sprite.update(dt);
    });
    return true;
};
Entity.prototype.render = function(ctx) {
    ctx.save();
    ctx.translate(this.pos[0], this.pos[1]);
    this.sprites.forEach(function(sprite) {
        sprite.render(ctx);
    });
    ctx.restore();
};
