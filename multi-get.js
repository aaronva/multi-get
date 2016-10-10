var http = require('http');
var fs = require('fs');

const urlStr = process.argv[2];
const outputFile = process.argv[3] || "out";

const numChunks = process.argv[4] || 4;
const chunkSize = process.argv[5] || 1048576;

var successChunks = 0;
var excessChunks = 0;

var fd;

// Verify url was given correctly
if (!urlStr || urlStr === "--help" || urlStr === "-h")
    invalidUsageHandler();

// Verify numeric inputs are valid
if (isNaN(numChunks) || numChunks <= 0 || numChunks >= 1000 || isNaN(chunkSize) || chunkSize <= 0 || )
    invalidUsageHandler();

const url = require('url').parse(urlStr);

fs.open(outputFile, "w", (err, fd0) => {
    // TODO consider very unlikely edge case where this doesn't load in time
    if (err) process.stderr.write(err + '\n');
    fd = fd0;
    process.stdout.write("Opened file for writing\n");
});

for (var i = 0; i < numChunks; i++) {
    requestPart(i);
}

process.on('exit', exitHandler);

function requestPart (i, delay) {
    var offset = i * chunkSize;
    var last = (i + 1) * chunkSize - 1;

    http.get({
        hostname: url.hostname,
        path: url.path,
        headers: {
            'Range':`bytes=${offset}-${last}`
        }
    }, (res) => {
        if (res.statusCode === 206) { // "Partial Content" status code
            successChunks++;
            process.stdout.write(`Downloaded ${successChunks + excessChunks}/${numChunks} chunks \r`);

            var data = new Buffer(chunkSize);
            var innerChunkOffset = 0;

            res.on('data', (chunk) => {
                // Using sync here to avoid writing to multiple positions at the same time.
                fs.writeSync(fd, chunk, 0, chunk.length, offset + innerChunkOffset);
                innerChunkOffset += chunk.length; 
            });
        } else if (res.statusCode === 416) { // "Requested Range Not Satisfiable" Status Code
            excessChunks++;
            process.stdout.write(`Downloaded ${successChunks + excessChunks}/${numChunks} chunks \r`);
        } else {
            process.stdout.write(`Got unexpected status: ${res.statusCode}\n`);
        }
    }).on('error', (e) => {
        process.stdout.write(`Got error: ${e.message}\n`);
    });
}

function invalidUsageHandler() {
    process.stdout.write("Usage: node mutli-get.js <url> [filename=out] [num=4] [size=1048576]\n");
    process.stdout.write("num and size must be positive non-zero integers\n");
    process.stdout.write("To avoid sending too many requests to the server, num must be below 1000\n");
    process.exit();
}

function exitHandler() {
    process.stdout.write(`\nThere were ${excessChunks} excess chunks.\n`);
    
    if (fd)
        fs.closeSync(fd);
}
