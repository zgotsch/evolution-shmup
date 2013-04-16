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
