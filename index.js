const http = require("http");
const url = require("url");
const ip = require("ip");

let IPServerList = [];

const REQ_SUCCESS = "success";

const sendResponseForInitRequest = (hostname) => {
  const options = {
    hostname: hostname,
    port: 8080,
    path: "/dispatcher-response-init-request",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log(`sended response to: ${hostname}`);
    });
  });

  req.on("error", (error) => {
    console.error(`Error: ${error.message}`);
  });

  req.end();
};

let lock = false;

setInterval(() => {
  if (lock) return;
  const _now = Date.now();

  for (let i = 0; i < IPServerList.length; i++) {
    if (_now - IPServerList[i].time > 1000) {
      IPServerList[i].status = 0;
    }
  }
}, 1000);

http
  .createServer(function (req, res) {
    const requestUrl = req.url;
    const urlObject = url.parse(requestUrl, true);
    const pathName = urlObject.pathname;

    const hostname = req.socket.remoteAddress.replace("::ffff:", "");

    const query = urlObject.query;

    res.writeHead(200, { "Content-Type": "text/plain" });

    switch (pathName) {
      case "/test-connect": {
        if (!lock) {
          const _hostname = hostname;
          console.log(`Test connect from: ${_hostname}`);
          const _now = Date.now();
          for (let i = 0; i < IPServerList.length; i++) {
            if (IPServerList[i].hostname == _hostname) {
              IPServerList[i].time = _now;
              if (IPServerList[i].status != 2) IPServerList[i].status = 1;
              break;
            }
          }
        }
        res.end("success");
        break;
      }
      case "/init-server": {
        const _hostname = hostname;
        let _chuaCo = true;
        const _now = Date.now();
        for (let i = 0; i < IPServerList.length; i++) {
          const _element = IPServerList[i].hostname;
          if (_element === _hostname) {
            _chuaCo = false;
            break;
          }
        }
        if (_chuaCo) {
          IPServerList.push({
            hostname: _hostname,
            status: 1,
            time: _now,
          });
        }
        res.end(REQ_SUCCESS);
        break;
      }
      case "/get-all-ip": {
        const _hostname = hostname;
        const _status = query.status;
        const _now = Date.now();

        for (let i = 0; i < IPServerList.length; i++) {
          if (IPServerList[i].hostname == _hostname) {
            IPServerList[i].time = _now;
            IPServerList[i].status = parseInt(_status);
            break;
          }
        }
        const _data = JSON.stringify(IPServerList);
        res.end(_data);
        break;
      }
      default: {
        res.end("100");
        break;
      }
    }
  })
  .listen(8888);
