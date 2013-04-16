function magnitude(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}
function normalize(v) {
    vmag = magnitude(v);
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
function distance(v1, v2) {
    return Math.sqrt(Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2));
}

function crossProductMagnitude(a, b) {
    return a[0] * b[1] - a[1] * b[0];
}

function segmentIntersection(seg_a, seg_b) {
    // returns null if no intersection
    // otherwise returns a point

    var start_a = seg_a[0];
    var end_a = seg_a[1];
    var start_b = seg_b[0];
    var end_b = seg_b[1];

    //renamed variables to match http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect

    var p = start_a;
    var q = start_b;
    var s = sub2d(end_b, start_b);
    var r = sub2d(end_a, start_a);

    var denom = crossProductMagnitude(r, s);
    var q_minus_p = sub2d(q, p);

    if(denom == 0) {
        // lines are parallel
        if(crossProductMagnitude(q_minus_p, r) == 0) {
            // lines are colinear
            return q;
        } else {
            return null;
        }
    }

    var t = crossProductMagnitude(q_minus_p, s) / denom;
    var u = crossProductMagnitude(q_minus_p, r) / denom;

    if(t >= 0 && t <= 1 &&
       u >= 0 && u <= 1) {
           return add2d(p, mul2d(r, t));
    } else {
        return null;
    }
}
