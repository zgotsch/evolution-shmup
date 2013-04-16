function getEntityCenter(entity) {
    return [entity.pos[0] + entity.sprite.size[0] / 2,
            entity.pos[1] + entity.sprite.size[1] / 2];
}

function isEntityOffscreen(entity) {
    return entity.pos[1] < 0 || entity.pos[1] > canvas.height ||
           entity.pos[0] < 0 || entity.pos[0] > canvas.width;
}

function Entity(pos, sprite, update_function) {
    this.pos = pos;
    this.old_pos = pos;
    this.velocity = null;

    this.sprite = sprite;

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
    this.velocity = distance(this.old_pos, this.pos) * dt;

    this.sprite.update(dt);
    return true;
};
