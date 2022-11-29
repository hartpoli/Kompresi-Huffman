/// Constructor
function Node (value = null, frequency = 0) {
    this.value = value;           // any
    this.frequency = frequency;   // number
    this.leftChild = null;        // Node
    this.rightChild = null;       // Node
}

function compareNodes (a, b) {
    if (a.frequency > b.frequency) return -1;
    if (a.frequency < b.frequency) return 1;
    return 0;
}