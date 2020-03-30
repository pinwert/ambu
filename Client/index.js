const express = require('express');
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

app.use(express.static('public'));
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  function sendMessage(currentIndex) {
    const val = 0.1 * currentIndex;
    const x1 = Math.sin(val) + 1;
    const x2 = Math.cos(val) + 1;
    console.log("........", currentIndex);
    io.clients().emit("data", {
      pressure: x1,
      volume: x2,
      time: currentIndex,
      ie: x2,
      frequency: currentIndex
    });
    setTimeout(function() {
      sendMessage(++currentIndex);
    }, 40);
  }
  sendMessage(0);
});

http.listen(port, function() {
  console.log("listening on *:" + port);
});
