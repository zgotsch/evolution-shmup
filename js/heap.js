(function() {
    function swap(arr, l, r) {
        var temp = arr[l];
        arr[l] = arr[r];
        arr[r] = temp;
    }

    function heapify(heap, i, comparator, score) {
        var right = (i + 1) * 2;
        var left = right - 1;
        var best = i;
        if(left < heap.length && comparator(score(heap[left]), score(heap[best]))) {
            best = left;
        }
        if(right < heap.length && comparator(score(heap[right]), score(heap[best]))) {
            best = right;
        }
        if(best != i) {
            swap(heap, i, best);
            heapify(heap, best, comparator, score);
        }
    }

    function bubbleUp(heap, i, comparator, score) {
        if(i == 0) { return; }
        var parent = Math.floor((i + 1) / 2) - 1;
        if(!comparator(score(heap[parent]), score(heap[i]))) {
            swap(heap, i, parent);
            bubbleUp(heap, parent, comparator, score);
        }
    }

    function minComparator(a, b) {
        return a < b;
    }
    function maxComparator(a, b) {
        return a > b;
    }

    function defaultScoreFunction(x) {
        return x;
    }

    function Heap(comparator, arr, scoreFunction) {
        if(typeof(comparator) === 'undefined') {
            comparator = maxComparator;
        }
        if(typeof(arr) === 'undefined') {
            arr = [];
        }
        if(typeof(scoreFunction) === 'undefined') {
            scoreFunction = defaultScoreFunction;
        }

        this.comparator = comparator;
        this.scoreFunction = scoreFunction;
        this.heap = arr.slice(0);

        if(this.heap.length > 1) {
            for(var i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
                heapify(this.heap, i, this.comparator);
            }
        }
    }

    Heap.prototype.pop = function() {
        var val = this.heap.shift();
        heapify(this.heap, 0, this.comparator, this.scoreFunction);
        return val;
    };

    Heap.prototype.peek = function() {
        return this.heap[0];
    }

    Heap.prototype.push = function(val) {
        this.heap.push(val);
        bubbleUp(this.heap, this.heap.length - 1, this.comparator, this.scoreFunction);
    };

    Heap.prototype.size = function() {
        return this.heap.length;
    };

    var makeMinHeap = function(arr, scoreFunction) {
        return new Heap(minComparator, arr, scoreFunction);
    };
    var makeMaxHeap = function(arr, scoreFunction) {
        return new Heap(maxComparator, arr, scoreFunction);
    };

    window.Heap = {
        makeMinHeap: makeMinHeap,
        makeMaxHeap: makeMaxHeap
    };
})();
