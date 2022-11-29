/* UI elements */
const inputView = document.getElementById("input");
const outputView = document.getElementById("output");
const inputSizeView = document.getElementById("input-size");
const outputSizeView = document.getElementById("output-size");
const encodeButton = document.getElementById("encode-button");
const errorDialog = new bootstrap.Modal(document.getElementById('modal'), {});
const tableWrapper = document.getElementById("table-wrapper");
const tableView = document.getElementById("table");

/* Event Listeners */

inputView.addEventListener("keyup", event => {
    let inputString = filterSpaces(event.target.value);
    inputSizeView.textContent = inputString.length;
});

encodeButton.addEventListener("click", () => {
    let inputString = inputView.value;

    /* Memfilter spasi putih dan baris baru */
    /* Filter white spaces and new lines */
    inputString = filterSpaces(inputString);
    
    if (inputString === "") {
        errorDialog.show();
        return;
    }
    
    /* Algoritma Huffman */
    /* Huffman Algorithm */
    let frequencyTable = buildFrequencyTable(inputString);
    let huffmanTree = buildTree(frequencyTable);
    let codeTable = buildCodeTable(huffmanTree);
    let encodedString = encode(inputString, codeTable);

    /* Menampilkan kode yang dihasilkan */
    /* Display the resulting code */
    outputView.textContent = encodedString;
    outputSizeView.textContent = Math.ceil(encodedString.length / 8);

    /* Menampilkan Pohon Huffman */
    /* Display Huffman Tree */
    displayTree(huffmanTree);

    /* Menampilkan kode/data tabel frekuensi */
    /* Display code/frequency table data */
    displayTable(codeTable, frequencyTable);

});

/* Fungsi-Fungsi Util */
/* Util functions */

function displayTree (root = {}) {
    let graph = new dagreD3.graphlib.Graph().setGraph({});

    dfs(root);

    function dfs (node) {
        if (node.leftChild === null && node.rightChild === null) {
            graph.setNode(node.value, { label: node.value, shape: "circle" });
            return node;
        }

        graph.setNode(node.value, { label: "", shape: "circle" });

        if (node.leftChild !== null) {
            let child = dfs(node.leftChild);
            graph.setEdge(node.value, child.value, { label: "0" });
        }

        if (node.rightChild !== null) {
            let child = dfs(node.rightChild);
            graph.setEdge(node.value, child.value, { label: "1" });
        }

        return node;
    }

    let svg = d3.select("svg"),
        inner = svg.select("g");

    // Siapkan dukungan zoom
    // Set up zoom support
    let zoom = d3.zoom().on("zoom", event => inner.attr("transform", event.transform));
    svg.call(zoom);

    // Buat penyaji
    // Create the renderer
    let render = new dagreD3.render();

    // Jalankan penyaji. Inilah yang menarik grafik akhir.
    // Run the renderer. This is what draws the final graph.
    render(inner, graph);

    // Tengahkan grafik
    // Center the graph
    let initialScale = 0.75;
    svg.call(zoom.transform, d3.zoomIdentity.translate((parseInt(svg.style("width")) - graph.graph().width * initialScale) / 2, 20).scale(initialScale));

    svg.attr('height', graph.graph().height * initialScale + 40);
}

function displayTable (codeTable = {}, frequencyTable = {}) {
    let rows = [];
    for (const [char, code] of Object.entries(codeTable)) {
        rows.push({
            char: char,
            freq: frequencyTable[char],
            code: code,
            length: code.length
        });
    }

    /* Mengurutkan baris berdasarkan karakter */
    /* Sort the rows according to the characters */
    rows.sort((a, b) => {
        if (a.length < b.length) return -1;
        if (a.length > b.length) return 1;
        return 0;
    });

    tableView.innerHTML = "";
    rows.forEach(row => {
        let html = `
            <tr>
                <td>${row.char}</td>
                <td>${row.freq}</td>
                <td>${row.code}</td>
                <td>${row.length}</td>
            </tr>
        `;
        tableView.innerHTML += html;
    });
    tableWrapper.style.display = "block";
}

/* Huffman-mengkodekan string yang diberi tabel pencarian kode */
/* Huffman-encodes a string given a code lookup table */
function encode (inputString = "", codeTable = {}) {
    let ans = "";
    let n = inputString.length;
    for (let i = 0; i < n; i++) {
        ans += codeTable[ inputString[i] ];
    }
    return ans;
}


/* Membuat tabel pencarian kode berdasarkan pohon yang diberikan */
/* Constructs a code lookup table based on a given tree */
function buildCodeTable (root = {}) {
    let codeTable = {};
    dfs(root, "");
    function dfs (node, code) {
        if (node.leftChild === null && node.rightChild === null) {
            codeTable[node.value] = code;
            return;
        }

        if (node.leftChild !== null) dfs(node.leftChild, code + "0");
        if (node.rightChild !== null) dfs(node.rightChild, code + "1");
    }
    return codeTable;
}

/* Membuat pohon Huffman berdasarkan tabel frekuensi yang diberikan */
/* Constructs a Huffman tree based on a given frequency table */
function buildTree (table = {}) {
    /* Membangun node pohon dan memasukkannya ke dalam antrian prioritas */
    /* Construct tree nodes and insert them into the priority queue */
    let queue = buckets.PriorityQueue(compareNodes);
    let entries = Object.entries(table);
    for (const [char, freq] of entries) {
        queue.add(new Node(char, freq));
    }
    /*
        Greedily membangun pohon dari bawah ke atas
        dengan terus menghubungkan dua pohon dengan frekuensi minimum
        sampai hanya ada satu pohon di hutan
    */
    /*
        Greedily build the tree bottom-up
        by continuously connecting the two trees with the minimum frequencies
        until there is only a single tree in the forest
    */
    while (queue.size() > 1) {
        let smallerNode = queue.dequeue(),
            biggerNode = queue.dequeue();
        
        let root = new Node(
            biggerNode.value + smallerNode.value,
            smallerNode.frequency + biggerNode.frequency
        );
        root.rightChild = smallerNode;
        root.leftChild = biggerNode;

        queue.enqueue(root);
    }

    let root = queue.peek();
    if (root.leftChild === null && root.rightChild === null) {
        let ans = new Node(root.value, root.frequency);
        ans.leftChild = root;
        return ans;
    }

    return queue.peek();
}

/* Diberi string, mengembalikan objek yang berisi setiap karakter dan frekuensinya */
/* Given a string, returns an object containing every character and its frequency */
function buildFrequencyTable (inputString = "") {
    let table = {};
    let n = inputString.length;
    for (let i = 0; i < n; i++) {
        let char = inputString[i];
        if (!table.hasOwnProperty(char)) table[char] = 0;
        table[char]++;
    }
    return table;
}

/* Memfilter spasi putih dari string yang diberikan */
/* Filters white spaces from a given string */
function filterSpaces (inputString = "") {
    let ans = "";
    let n = inputString.length;
    for (let i = 0; i < n; i++) {
        let char = inputString[i];
        if (char !== " " && char !== "\n") ans += char;
    }
    return ans;
}


