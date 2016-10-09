var http = require('http');
var fs = require('fs');

//process.argv.forEach((val, index) => {
//    console.log(`${index}: ${val}`);
//
//});

const numChunk = 4;
const chunkSize = 1048576;

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

function requestPart (i) {
    var offset = i * chunkSize;
    var last = (i + 1) * chunkSize - 1;
    http.get({
        hostname: url.hostname,
        path: url.path,
        headers: {
            'Range':`bytes=${start}-${end}`
        }
    }, (res) => {
        if (res.statusCode === 206) {
            var data = "";

            res.on('data', (chunk) => {
                console.log(`Reading chunk from offset ${offset}`);
                data += chunk;
            });
    
            res.on('end', () => {
                console.log(`Writing data at offset ${offset}`);

                // TODO make sure fd is set.

                // Using sync here to avoid writing to the file in multiple places simulatiously
                fs.writeSync(fd, data, offset);
            });
        } else {
            console.log(`Got unexpected status: ${res.statusCode}`);
        }
    }).on('error', (e) => {
          console.log(`Got error: ${e.message}`);
    });
}

for (var i = 0; i < numChunk; i++) {
    requestPart(i);
}

function exitHandler() {
    fs.closeSync(fd);   
};

process.on('exit', exitHandler);
