function randomInt(min, max) {
    if(typeof(max) === 'undefined') {
        max = min;
        min = 0;
    }
    return min + Math.floor(Math.random() * max);
}

function randomIndex(list) {
    return randomInt(list.length);
}

function debug(message) {
    if(DEBUG) {
        console.log.apply(console, arguments);
    }
}

function error(message) {
    if(DEBUG) {
        console.log.apply(console, arguments);
        console.trace();
    }
    else throw "Error";
}

function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
}
