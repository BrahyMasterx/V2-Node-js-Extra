const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");

app.get("/", (req, res) => {
  res.send("hello world")

});

app.get("/status", (req, res) => {
  let cmdStr = "ps -ef";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>command line execution error：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>Command line execution result：\n" + stdout + "</pre>");
    }
  });
});

app.get("/start", (req, res) => {
  let cmdStr = "./web.js -c ./config.yaml >/dev/null 2>&1 &";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("command line execution error：" + err);
    } else {
      res.send("Command line execution result：Start successfully!");
    }
  });
});

app.get("/info", (req, res) => {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("command line execution error：" + err);
    } else {
      res.send(
        "Command line execution result：\n" + "Linux System:" + stdout + "\nRAM:" + os.totalmem() / 1000 / 1000 + "MB"
      );
    }
  });
});

app.use(
  "/api",
  createProxyMiddleware({
    target: "http://127.0.0.1:8080/",
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      // remove from request/api
      "^/api": "/assets",
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {
      console.log("-->  ", req.method, req.baseUrl, "->", proxyReq.host + proxyReq.path
      );
    },
  })
);

/* keepalive  begin */
function keepalive() {
  // 1.request home page，stay awake
  let glitch_app_url = "https://cherry-even-delivery.glitch.me";
  exec("curl " + glitch_app_url, function (err, stdout, stderr) {
    if (err) {
      console.log("keep alive-request home page-command line execution error：" + err);
    } else {
      console.log("keep alive-request home page-Command line executed successfully，response message:" + stdout);
    }
  });

  // 2.request server process status list，If the web is not running，call up
  exec("curl " + glitch_app_url + "/status", function (err, stdout, stderr) {
    if (!err) {
      if (stdout.indexOf("./web.js -c ./config.json") != -1) {
        console.log("web is running");
      } else {
        //web is not running，call from the command line
        exec(
          "chmod +x ./web.js && ./web.js -c ./config.json >/dev/null 2>&1 &",
          function (err, stdout, stderr) {
            if (err) {
              console.log("keep alive-call up the web-command line execution error：" + err);
            } else {
              console.log("keep alive-call up the web-Command line executed successfully!");
            }
          }
        );
      }
    } else console.log("keep alive-request server process table-command line execution error: " + err);
  });
}
setInterval(keepalive, 30 * 1000);
/* keepalive  end */

function startWeb() {
  let startWebCMD =
    "chmod +x ./web.js && ./web.js -c ./config.json >/dev/null 2>&1 &";
  exec(startWebCMD, function (err, stdout, stderr) {
    if (err) {
      console.log("Starting web.js - failed:" + err);
    } else {
      console.log("start web.js - success!");
    }
  });
}

/* init  begin */
exec("tar -zxvf src.tar.gz", function (err, stdout, stderr) {
  if (err) {
    console.log("Initialization - unpacking resource file src.tar.gz - failed:" + err);
  } else {
    console.log("Initialization - decompression resource file src.tar.gz - success!");
    startWeb();
  }
});
/* init  end */

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
