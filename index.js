const http = require('http');
const url = require('url');
const ip = require('ip');


let IPServerList = [];

const REQ_SUCCESS = "success";
const REQ_FAILED = "failed";
const REQ_ERROR = "error";

const sendResponseForInitRequest = (hostname) => {
  const options = {
    hostname: hostname,
    port: 8080,
    path: '/dispatcher-response-init-request',
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`sended response to: ${hostname}`);
    });
  });

  req.on('error', (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();
}

http.createServer(function (req, res) {
  const requestUrl = req.url;
  const urlObject = url.parse(requestUrl, true);
  const pathName = urlObject.pathname;

  const hostname = req.socket.remoteAddress;

  const query = urlObject.query;

  console.log(hostname);

  res.writeHead(200, { 'Content-Type': 'text/plain' });

  switch (pathName) {
    case "/init-server": {
      const _hostname = hostname;
      console.log(_hostname);
      IPServerList.push(_hostname);
      res.end(REQ_SUCCESS);
      break;
    }
    case "/get-all-ip": {
      console.log("GET ALL IP");
      res.end(JSON.stringify(IPServerList));
      break;
    }
    default: {
      res.end("100");
      break;
    }
  }
}).listen(8888);