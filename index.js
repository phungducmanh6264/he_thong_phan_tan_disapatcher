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

// Hàm này gọi 1s 1 lần để cập nhật lại trạng thái các server quá 1s mà không gửi request đến dispatcher thì
// mặc định server đó đã chết, set trạng thái của server trên dispathcer là 0.
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
    // ip của server gửi request
    const hostname = req.socket.remoteAddress.replace("::ffff:", "");
    const query = urlObject.query;

    res.writeHead(200, { "Content-Type": "text/plain" });

    switch (pathName) {
      // Khi nhập IP trên fe và nhấn button thì server bên đó sẽ thực hiện test connect nếu thành công thì nó gửi thêm init server
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
      // Server call khi test connect thành công
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
      // front end gọi server lấy thông tin all IP 1s 1 lần, server gọi đến đây
      case "/get-all-ip": {
        const _hostname = hostname;
        const _status = query.status;
        const _now = Date.now();
        // set lại thời gian cuối server gửi request đến dispatcher
        for (let i = 0; i < IPServerList.length; i++) {
          if (IPServerList[i].hostname == _hostname) {
            IPServerList[i].time = _now;
            IPServerList[i].status = parseInt(_status);
            break;
          }
        }
        // gửi all ip về cho server
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
