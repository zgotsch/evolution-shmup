function Sprite(url, pos, size, speed, frames, dir, once) {
    this.pos = pos;
    this.size = size;
    this.speed = typeof speed === 'number' ? speed : 0;
    this.frames = frames;
    this._index = 0;
    this.url = url;
    this.dir = dir || 'horizontal';
    this.once = once;
}
Sprite.prototype.update = function(dt) {
    this._index += this.speed * dt;
};

Sprite.prototype.render = function(ctx) {
    var frame;

    if(this.speed > 0) {
        var max = this.frames.length;
        var idx = Math.floor(this._index);
        frame = this.frames[idx % max];

        if (this.once && idx >= max) {
            this.done = true;
            return;
        }
    } else {
        frame = 0;
    }

    var spritePosition = this.pos.slice(); //copy pos
    var xySwitch = this.dir === 'vertical' ? 1 : 0;
    spritePosition[xySwitch] += frame * this.size[xySwitch];

    ctx.drawImage(resources.get(this.url),
                  spritePosition[0], spritePosition[1],
                  this.size[0], this.size[1],
                  0, 0,
                  this.size[0], this.size[1]);
};

function RepeatedSprite(url, size, repeat_type) {
    this.url = url;
    this.size = size;
    this.repeat_type = repeat_type;
    this.done = false;
}
RepeatedSprite.prototype.update = function() {
    this.done = true;
};
RepeatedSprite.prototype.render = function(ctx) {
    var laser_pattern = ctx.createPattern(resources.get(this.url), this.repeat_type);
    ctx.fillStyle = laser_pattern;
    ctx.fillRect(0, 0, this.size[0], this.size[1]);
};
