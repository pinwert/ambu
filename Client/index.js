const express = require("express");
const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const portS = new SerialPort(process.env.SERIAL_PORT, { baudRate: 9600 });

const parser = new Readline();
portS.pipe(parser);

const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

function sendMessage(io) {
  parser.on("data", line => {
    var [volume, pressure, time, ie, frequency] = line.split(",");
    io.clients().emit("data", { pressure, volume, time, ie, frequency });
    console.log(
      `> ${JSON.stringify({ pressure, volume, time, ie, frequency })}`
    );
  });
}

var ioSet;
io.on("connection", function(socket) {
  if (!ioSet) {
    sendMessage(io);
    ioSet = true;
  }
});

http.listen(port, function() {
  console.log("listening on *:" + port);
});
