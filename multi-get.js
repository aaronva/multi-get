var http = require('http');
var fs = require('fs');

function invalidUsage() {
    process.stdout.write("Usage: node mutli-get.js <url>\n");
    process.exit();
}

const numChunks = 40;
const chunkSize = 1024; //1048576;

//const urlStr = "http://dist.pravala.com/coding/multiGet-example.zip";
//const urlStr = "http://www.textfiles.com/rpg/bagofwonder.txt";

const urlStr = process.argv[2];
const outputFile = "test"


if (!urlStr || urlStr === "--help" || urlStr === "-h")
    invalidUsage();

var fd;
fs.open(outputFile, "w", (err, fd0) => {
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
        if (res.statusCode === 206) {
            successChunks++;
            var data = "";

            res.on('data', (chunk) => {
                data += chunk;
            });
    
            res.on('end', () => {
                // TODO make sure fd is set.

                // Using sync here to avoid writing to the file in multiple places simulatiously
                fs.writeSync(fd, data, offset);
            });
        } else if (res.statusCode === 416) {
            excessChunks++;
        } else {
            process.stdout.write(`Got unexpected status: ${res.statusCode}\n`);
        }
        process.stdout.write(`Downloaded ${successChunks + excessChunks}/${numChunks} chunks \r`);
    }).on('error', (e) => {
        process.stdout.write(`Got error: ${e.message}\n`);
    });
}

for (var i = 0; i < numChunks; i++) {
    requestPart(i);
}

function exitHandler() {
    process.stdout.write('\n');
    process.stdout.write(`File writen. There were ${excessChunks} excess chunks.\n`);
    
    if (fd)
        fs.closeSync(fd);
}

process.on('exit', exitHandler);
