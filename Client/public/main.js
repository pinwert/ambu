const baudRate = 115200;
const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const fs = require("fs");
const csvWriter = require("csv-write-stream");
const writer = csvWriter({
  separator: ",",
  newline: "\n",
  headers: [
    "pressure",
    "flow_ins",
    "derived_flow_ins",
    "flow_ex",
    "derived_flow_ex",
    "time",
    "ie",
    "frequency",
    "value_o2",
  ],
  sendHeaders: true,
});
const numberOfPoints = 150;
const sampling = 100;
const dataFlow = [[], [], []];
const dataPressure = [[], []];
const times = [];
const dataToSend = {
  field: "",
  value: "",
};

const dataAccepted = [
  "marcha",
  "ie_ins",
  "ie_ex",
  "embolado",
  "volume_emb",
  "halt",
  "volume_min",
  "volume_max",
  "pressure_min",
  "pressure_max",
  "FI_O2",
];

for (var j = 0; j <= numberOfPoints; j++) {
  dataFlow[0][j] = j;
  dataPressure[0][j] = j;
  times[j] = 0;
}

const optsFlow = {
  width: window.innerWidth * 0.7 - 40,
  height: window.innerHeight * 0.5 - 60,
  scales: {
    x: {
      time: false,
    },
  },
  series: [
    {},
    {
      label: "Flow ins",
      stroke: "red",
      fill: "rgba(255,0,0,0.2)",
    },
    {
      label: "Flow ex",
      stroke: "green",
      fill: "rgba(0,255,0,0.2)",
    },
  ],
  axes: [
    {
      times,
    },
    {
      space: 10,
      show: true,
      label: "Flow ins, Flow ex",
      labelSize: 30,
      labelFont: "bold 12px Arial",
      font: "8px Arial",
      gap: 5,
      size: 50,
      stroke: "black",
    },
  ],
};

const optsPressure = {
  width: window.innerWidth * 0.7 - 40,
  height: window.innerHeight * 0.5 - 60,
  scales: {
    x: {
      time: false,
    },
  },
  series: [
    {
      times,
    },
    {
      scale: 0.01,
      side: 0.01,
      label: "pressure",
      stroke: "blue",
      fill: "rgba(0,0,255,0.2)",
    },
  ],
  axes: [
    {
      times,
    },
    {
      space: 10,
      show: true,
      label: "Pressure",
      labelSize: 30,
      labelFont: "bold 12px Arial",
      font: "8px Arial",
      gap: 5,
      size: 50,
      stroke: "black",
    },
  ],
};

// const portS = new SerialPort(process.env.SERIAL_PORT, { baudRate });

const getPortsList = (callback) => {
  var portsList = [];

  SerialPort.list().then((ports) => {
    ports.forEach((port) => {
      portsList.push(port.path);
    });
    callback(portsList);
  });
};

let portRead, portWrite, parserRead, parserWrite;
const values = {
  marcha: 1,
  ie_ins: 1,
  ie_ex: 1,
  halt: 0.2,
  embolado: 15,
  volume_emb: 50,
  volume_min: 0,
  volume_max: 0,
  pressure_min: 0,
  pressure_max: 0,
  FI_O2: 0,
};

let inputs = {};
let inputsShow = {};

let t0, ins_v0, ins_acc, ex_v0, ex_acc;

window.onload = () => {
  getPortsList((ports) => {
    const setup_panel = document.getElementById("setup_panel");
    const selectPortRead = document.getElementById("serial_ports1");
    const selectPortWrite = document.getElementById("serial_ports2");
    const info_panel = document.getElementById("info_panel");

    selectPortRead.innerHTML += ` <option value=""></option>`;
    ports.forEach((p) => {
      selectPortRead.innerHTML += ` <option value="${p}">${p}</option>`;
    });

    selectPortRead.onchange = (e) => {
      portRead = new SerialPort(e.currentTarget.value, { baudRate });
      parserRead = new Readline();
      portRead.pipe(parserRead);
      if (portWrite && parserWrite) {
        setup_panel.style.display = "none";
        info_panel.style.display = "flex";
      }
      initRead(portRead, parserRead);
    };

    selectPortWrite.innerHTML += ` <option value=""></option>`;
    ports.forEach((p) => {
      selectPortWrite.innerHTML += ` <option value="${p}">${p}</option>`;
    });

    selectPortWrite.onchange = (e) => {
      portWrite = new SerialPort(e.currentTarget.value, { baudRate });
      parserWrite = new Readline();
      portWrite.pipe(parserWrite);

      if (portRead && parserRead) {
        setup_panel.style.display = "none";
        info_panel.style.display = "flex";
      }

      initWrite(portWrite, parserWrite);
    };
  });
};

// -------------------------------------------

function initRead(portRead, parserRead) {
  writer.pipe(fs.createWriteStream(`out-${Date.now()}.csv`));

  // ***** info inputs ***** //

  inputsShow = {
    pressure: document.getElementById("pressure"),
    flow_ins: document.getElementById("flow_ins"),
    flow_ex: document.getElementById("flow_ex"),
    time: document.getElementById("time"),
    volume_cicle_ins: document.getElementById("volume_ins"),
    volume_cicle_ex: document.getElementById("volume_ex"),
    value_o2: document.getElementById("value_o2"),
  };

  // ***** ----------- ***** //

  // ***** Draw the charts ***** //

  const newDataFlow = [...dataFlow];
  const newDataPressure = [...dataPressure];

  const flow = new uPlot(
    optsFlow,
    dataFlow,
    document.getElementById("flowChart")
  );
  const pressure = new uPlot(
    optsPressure,
    dataPressure,
    document.getElementById("pressureChart")
  );

  let i = 0;
  const receiveData = (msg) => {
    newDataFlow[1][i] = msg.flow_ins;
    newDataFlow[2][i] = msg.flow_ex;
    newDataFlow[1][i + 1] = null;
    newDataFlow[2][i + 1] = null;
    times[i] = (msg.time / 1000).toFixed(1);

    newDataPressure[1][i] = msg.pressure;
    newDataPressure[1][i + 1] = null;
    i++;

    if (i > numberOfPoints) {
      i = 0;
    }

    if (i % 10 === 0) {
      const s = msg.time / 1000;
      const min = Math.floor((s / 60) << 0);
      const sec = Math.floor(s % 60);
      inputsShow.time.value = min + ":" + sec;
    }

    if (i % 3 === 0) {
      flow.setData(newDataFlow);
      pressure.setData(newDataPressure);
      const index = i > 0 ? i - 1 : numberOfPoints - 1;
      inputsShow.pressure.value = newDataPressure[1][index];
      inputsShow.flow_ins.value = newDataFlow[1][index];
      inputsShow.flow_ex.value = newDataFlow[2][index];
      inputsShow.flow_ex.value = newDataFlow[2][index];
      inputsShow.value_o2.value = msg.value_o2;
    }
    if (t0) {
      ins_acc += ((ins_v0 + msg.flow_ins) / 2) * (msg.time - t0);
      ex_acc += ((ex_v0 + msg.flow_ex) / 2) * (msg.time - t0);
      ins_v0 = msg.flow_ins;
      ex_v0 = msg.flow_ex;
      t0 = msg.time;
    }
  };

  // ***** ----------- ***** //

  parserRead.on("data", (line) => {
    const data = line.slice(0, -1).split(",");
    if (Number(data[0]) || Number(data[0]) == 0) {
      const [
        pressure,
        flow_ins,
        derivada_flow_ins,
        flow_ex,
        derivada_flow_ex,
        time,
        ie,
        frequency,
        value_o2,
      ] = data;
      receiveData({
        pressure,
        flow_ins,
        derivada_flow_ins,
        flow_ex,
        derivada_flow_ex,
        time,
        ie,
        frequency,
        value_o2,
      });
      if (process.env.WRITE_CSV !== "false") writer.write(data);
    }
  });
}

function initWrite(portWrite, parserWrite) {
  // ***** info inputs ***** //

  inputs = {
    ie_ins: document.getElementById("ie_ins"),
    ie_ex: document.getElementById("ie_ex"),
    embolado: document.getElementById("embolado"),
    volume_emb: document.getElementById("volume_emb"),
    halt: document.getElementById("halt"),
    volume_min: document.getElementById("volume_min"),
    volume_max: document.getElementById("volume_max"),
    pressure_min: document.getElementById("pressure_min"),
    pressure_max: document.getElementById("pressure_max"),
    FI_O2: document.getElementById("FI_O2"),
  };
  const buttons = {
    start: document.getElementById("start"),
    stop: document.getElementById("stop"),
  };

  // ***** ----------- ***** //

  // ***** default values ***** //

  // ***** ----------- ***** //
  // ***** keyboard ***** //

  const keyboard = {
    field_name: document.getElementById("field_name"),
    num_box: document.getElementById("num_box"),
    keypad: document.getElementById("keypad"),
    send: document.getElementById("send"),
    delete: document.getElementById("delete"),
    keys: document.querySelectorAll("#keypad .key"),
  };

  keyboard.keypad.onclick = (e) => {
    if (e.target === keyboard.keypad) {
      keyboard.keypad.style.display = "none";
    }
  };

  // ***** ----------- ***** //

  // ***** Update data ***** //

  if (!dataToSend.field) {
    keyboard.keypad.style.display = "none";
  }

  keyboard.num_box.onchange = (e) => {
    dataToSend.value = e.currentTarget.value;
  };

  Object.keys(inputs).forEach((key) => {
    inputs[key].onchange = (e) => {
      dataToSend.field = e.currentTarget.id;
      dataToSend.value = e.currentTarget.value;
      keyboard.field_name.innerHTML = dataToSend.field;
      keyboard.num_box.value = dataToSend.value;
      portS.write(`${key},${e.currentTarget.value}\n`);
    };
    inputs[key].onfocus = (e) => {
      dataToSend.field = e.currentTarget.id;
      dataToSend.value = e.currentTarget.value;
      keyboard.field_name.innerHTML = dataToSend.field;
      keyboard.num_box.value = dataToSend.value;
      if (keyboard.keypad.style.display == "none") {
        keyboard.keypad.style.display = "flex";
      }
    };
  });

  Object.keys(buttons).forEach((b) => {
    buttons[b].onclick = (e) => {
      values[e.currentTarget.dataset.key] = e.currentTarget.dataset.value;
      portWrite.write(`<${valuesToSend()}>\n`);
    };
  });

  keyboard.keys.forEach((k) => {
    k.onclick = (e) => {
      dataToSend.value += e.currentTarget.innerHTML;
      keyboard.num_box.value = dataToSend.value;
    };
  });

  keyboard.keys.forEach((k) => {
    k.onclick = (e) => {
      dataToSend.value += e.currentTarget.innerHTML;
      keyboard.num_box.value = dataToSend.value;
    };
  });

  keyboard.delete.onclick = (e) => {
    dataToSend.value = dataToSend.value.slice(0, -1);
    keyboard.num_box.value = dataToSend.value;
  };

  keyboard.send.onclick = (e) => {
    if (dataAccepted.includes(dataToSend.field)) {
      values[dataToSend.field] = dataToSend.value;
      portWrite.write(`<${valuesToSend()}>\n`);
      keyboard.keypad.style.display = "none";
    }
  };

  parserWrite.on("data", (line) => {
    const data = line.slice(0, -1).split(",");
    if (data[0] === "<") {
      const [marcha, ie_ins, ie_ex, halt, embolado, volume_emb] = data;
      updateValues({
        marcha,
        ie_ins,
        ie_ex,
        halt,
        embolado,
        volume_emb,
      });
      inputsShow.volume_cicle_ins.value = ins_acc.toFixed(2);
      inputsShow.volume_cicle_ex.value = ex_acc.toFixed(2);
      ins_acc = 0;
      ex_acc = 0;
    }
  });
  // ***** ----------- ***** //
}

function updateValues(msg) {
  Object.keys[values].forEach((k) => {
    values[k] = msg[k];
    if (inputs[k]) inputs[k].value = msg[k];
  });
}

function valuesToSend() {
  const { marcha, ie_ins, ie_ex, halt, embolado, volume_emb } = values;
  return [marcha, ie_ins, ie_ex, halt, embolado, volume_emb];
}
