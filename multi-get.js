//const urlStr = "http://dist.pravala.com/coding/multiGet-example.zip";
//const urlStr = "http://www.textfiles.com/rpg/bagofwonder.txt";

var http = require('http');
var fs = require('fs');

function invalidUsage() {
    process.stdout.write("Usage: node mutli-get.js <url> [filename=out] [number=4] [size=1048576]\n");
    process.exit();
}

const urlStr = process.argv[2];
const outputFile = process.argv[3] || "out";

const numChunks = process.argv[4] || 4;
const chunkSize = process.argv[5] || 1048576;

if (!urlStr || urlStr === "--help" || urlStr === "-h")
    invalidUsage();

var fd;
fs.open(outputFile, "w", (err, fd0) => {
    // TODO consider very unlikely edge case where this doesn't load in time
    if (err) process.stderr.write(err + '\n');
    fd = fd0;
    process.stdout.write("Opened file for writing\n");
});

const url = require('url').parse(urlStr);

var excessChunks = 0;
var successChunks = 0;

function requestPart (i) {
    var offset = i * chunkSize;
    var last = (i + 1) * chunkSize - 1;
    http.get({
        hostname: url.hostname,
        path: url.path,
        headers: {
            'Range':`bytes=${offset}-${last}`
        }
    }, (res) => {
        if (res.statusCode === 206) { // Partial content status code
            successChunks++;
            process.stdout.write(`Downloaded ${successChunks + excessChunks}/${numChunks} chunks \r`);
            var data = new Buffer(chunkSize);
            var innerChunkOffset = 0;

            res.on('data', (chunk) => {
                // Using sync here to avoid writing to multiple positions at the same time.
                fs.writeSync(fd, chunk, 0, chunk.length, offset + innerChunkOffset);
                innerChunkOffset += chunk.length; 
            });
        } else if (res.statusCode === 416) {
            excessChunks++;
            process.stdout.write(`Downloaded ${successChunks + excessChunks}/${numChunks} chunks \r`);
        } else {
            process.stdout.write(`Got unexpected status: ${res.statusCode}\n`);
        }
    }).on('error', (e) => {
        process.stdout.write(`Got error: ${e.message}\n`);
    });
}

for (var i = 0; i < numChunks; i++) {
    requestPart(i);
}

function exitHandler() {
    process.stdout.write('\n');
    process.stdout.write(`There were ${excessChunks} excess chunks.\n`);
    
    if (fd)
        fs.closeSync(fd);
}

process.on('exit', exitHandler);
