var http = require('http');
var fs = require('fs');

//process.argv.forEach((val, index) => {
//    console.log(`${index}: ${val}`);
//
//});

const numChunks = 40;
const chunkSize = 1024; //1048576;

//const urlStr = "http://dist.pravala.com/coding/multiGet-example.zip";
const urlStr = "http://www.textfiles.com/rpg/bagofwonder.txt";
const outputFile = "test"

var fd;
fs.open(outputFile, "w", (err, fd0) => {
    if (err) console.error(err);
    fd = fd0;
    console.log("Opened file for writing");
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
                //console.log(`Writing data at offset ${offset}`);

                // TODO make sure fd is set.

                // Using sync here to avoid writing to the file in multiple places simulatiously
                fs.writeSync(fd, data, offset);
            });
        } else if (res.statusCode === 416) {
            excessChunks++;
        } else {
            console.log(`Got unexpected status: ${res.statusCode}`);
        }
        process.stdout.write(`Downloaded ${successChunks + excessChunks}/${numChunks} chunks \r`);
    }).on('error', (e) => {
          console.log(`Got error: ${e.message}`);
    });
}

for (var i = 0; i < numChunks; i++) {
    requestPart(i);
}

function exitHandler() {
    process.stdout.write('\n');
    console.log(`File writen. There were ${excessChunks} excess chunks.`);
    fs.closeSync(fd);

}

process.on('exit', exitHandler);

