const express = require("express");
const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const fs = require("fs");
const csvWriter = require("csv-write-stream");
const writer = csvWriter({
  separator: ",",
  newline: "\n",
  headers: ["pressure", "volume", "time", "ie", "frequency"],
  sendHeaders: true
});
const portS = new SerialPort(process.env.SERIAL_PORT, { baudRate: 9600 });

const parser = new Readline();
portS.pipe(parser);

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

function sendMessage(io) {
  parser.on("data", line => {
    const data = line.split(",");
    const [volume, pressure, time, ie, frequency] = data;
    io.clients().emit("data", { volume, pressure, time, ie, frequency });
    writer.write(data);
  });
}

let ioSet;
io.on("connection", function(socket) {
  if (!ioSet) {
    writer.pipe(fs.createWriteStream("out.csv"));
    sendMessage(io);
    ioSet = true;
  }
});

http.listen(port, function() {
  console.log("listening on *:" + port);
});
