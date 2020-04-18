const fs = require("fs");
const csvWriter = require("csv-write-stream");
const headersData = ["time", "pressure", "flow_ins", "flow_ex", "fi_o2"];
const headersHistory = ["peep", "p_max", "v_ins", "v_esp"];
const hash = Date.now();
const writerData = csvWriter({
  separator: ",",
  newline: "\n",
  headers: headersData,
  sendHeaders: true,
});
const writerHistory = csvWriter({
  separator: ",",
  newline: "\n",
  headers: headersHistory,
  sendHeaders: true,
});

writerData.pipe(fs.createWriteStream(`out-${hash}.csv`));
writerHistory.pipe(fs.createWriteStream(`out-his-${hash}.csv`));

export default {
  writerData,
  writerHistory,
};
