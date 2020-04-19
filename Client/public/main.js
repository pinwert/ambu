const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
import charts from "./charts.js";
import csv from "./csv.js";
import infoModule from "./info.js";
import keyboard from "./keyboard.js";

const baudRate = 115200;
const numberOfPoints = 400;
const sampling = 5;

const dataAcceptedFer = [
  "marcha",
  "ie_ins",
  "ie_esp",
  "parada_ins",
  "emb",
  "v_emb",
];

const dataAcceptedAlberto = [
  "fi_o2_a_min",
  "fi_o2_a_max",
  "v_a_min",
  "v_a_max",
  "p_a_min",
  "p_a_max",
  "mute",
  "v_ins",
  "v_esp",
];

let values = {
  marcha: 1,
  ie_ins: 1,
  ie_esp: 1,
  parada_ins: 0.2,
  emb: 15,
  v_emb: 420,
};

let t0 = 0,
  ins_v0 = 0,
  ins_acc = 0,
  ex_v0 = 0,
  ex_acc = 0,
  peep,
  p_max;

window.onload = () => {
  const ch = charts(numberOfPoints, sampling);
  const portAlberto = new SerialPort("/dev/ttyUSB0", { baudRate });
  const parserRead = new Readline();
  portAlberto.pipe(parserRead);

  const portFer = new SerialPort("/dev/ttyACM0", { baudRate });
  const parserWrite = new Readline();
  portFer.pipe(parserWrite);

  // ------------------------------ Arduino Alberto

  let i = 0;

  parserRead.on("data", (line) => {
    const data = line.slice(0, -1).split(",");
    if (Number(data[0]) || Number(data[0]) == 0) {
      const [time, pressure, flow_ins, flow_ex, fi_o2] = data;
      ch.updateFlowPressure(
        {
          time,
          pressure,
          flow_ins,
          flow_ex,
          fi_o2,
        },
        i
      );
      i++;
      info.inputsShow.fi_o2.innerHTML = Number(fi_o2).toFixed(0);
      if (i > numberOfPoints) {
        i = 0;
      }
      if (t0) {
        ins_acc += ((ins_v0 + Number(flow_ins)) / 2) * Number(time);
        ex_acc += ((ex_v0 + Number(flow_ex)) / 2) * Number(time);
      }
      const newPressure = Number(pressure);
      peep = peep === undefined || peep > newPressure ? newPressure : peep;
      p_max =
        p_max === undefined || p_max < newPressure
          ? Number(newPressure)
          : p_max;
      ins_v0 = Number(flow_ins);
      ex_v0 = Number(flow_ex);
      t0 = Number(time);
      csv.writerData.write(data);
    }
  });

  // ------------------------------ Arduino Fer

  let j = 0;

  parserWrite.on("data", (line) => {
    if (line.startsWith("<")) {
      const data = line.slice(1, -2).split(",");
      const [marcha, ie_ins, ie_esp, parada_ins, emb, v_emb] = data;
      if (Number.isNaN(Number(marcha))) return;
      updateValues({
        marcha,
        ie_ins,
        ie_esp,
        parada_ins,
        emb,
        v_emb,
      });
      const v_ins = (ins_acc / 60).toFixed(0);
      const v_esp = (ex_acc / 60).toFixed(0);
      info.inputsShow.v_ins.innerHTML = v_ins;
      info.inputsShow.v_esp.innerHTML = v_esp;
      if (peep !== undefined) info.inputsShow.peep.innerHTML = peep.toFixed(1);
      if (p_max !== undefined)
        info.inputsShow.p_max.innerHTML = p_max.toFixed(1);
      const ie = (ie_ins || 0) / ie_esp;
      ch.updateHistory({ v_ins, v_esp, peep, p_max, ie, emb }, j);
      if (v_ins) sendData({ field: "v_ins", value: v_ins });
      if (v_esp) sendData({ field_bis: "v_esp", value_bis: v_esp });
      j++;

      if (j > numberOfPoints / 4) {
        j = 0;
      }
      csv.writerHistory.write([peep, p_max, v_ins, v_esp, ie, emb]);

      ins_acc = 0;
      ex_acc = 0;
      peep = undefined;
      p_max = undefined;
      console.log("---------> Write", line);
    }
  });

  function updateValues(msg) {
    Object.keys(msg).forEach((k) => {
      values[k] = msg[k];
      info.inputs.ie_ins.innerHTML = Number(msg.ie_ins).toFixed(1);
      info.inputs.ie_esp.innerHTML = Number(msg.ie_esp).toFixed(1);
      info.inputs.parada_ins.innerHTML = Number(msg.parada_ins).toFixed(1);
      info.inputs.emb.innerHTML = Number(msg.emb).toFixed(0);
    });
  }

  const info = infoModule(values);

  keyboard(info.inputs, sendData);

  function sendData(dataToSend) {
    if (dataAcceptedFer.includes(dataToSend.field)) {
      values[dataToSend.field] = dataToSend.value;
      if (dataToSend.field_bis) {
        values[dataToSend.field_bis] = dataToSend.value_bis;
      }
      console.log("-----------> W Fer", valuesToSend());
      portFer.write(`<${valuesToSend()}>\n`);
    } else if (dataAcceptedAlberto.includes(dataToSend.field)) {
      console.log("-----------> W Alberto", dataToSend.field, dataToSend.value);
      portAlberto.write(`${dataToSend.field},${dataToSend.value}\n`);
    }
  }

  function valuesToSend() {
    const { marcha, ie_ins, ie_esp, parada_ins, emb, v_emb } = values;
    return [marcha, ie_ins, ie_esp, parada_ins, emb, v_emb];
  }
};
