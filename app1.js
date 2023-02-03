const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
const fetch = require("node-fetch");

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
  let cmdStr = "./web -c ./config.yaml >/dev/null 2>&1 &";
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
      "^/api": "/qwe",
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
  let render_app_url = "https://kpoppy.onrender.com";
  request(render_app_url, function (error, response, body) {
    if (!error) {
      console.log("The home page has been successfully issued!");
      console.log("response message:", body);
    } else console.log("wrong request: " + error);
  });

  // 2.request server process status list，If the web is not running，call up
  request(render_app_url + "/status", function (error, response, body) {
    if (!error) {
      if (body.indexOf("./web -c ./config.yaml") != -1) {
        console.log("web is running");
      } else {
        console.log("web is not running,Send a request to call up");
        request(render_app_url + "/start", function (err, resp, body) {
          if (!err) console.log("Successfully invoke the web:" + body);
          else console.log("wrong request:" + err);
        });
      }
    } else console.log("wrong request: " + error);
  });
}
setInterval(keepalive, 9 * 1000);
/* keepalive  end */

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
