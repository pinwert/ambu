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
    "fi_o2",
  ],
  sendHeaders: true,
});
const numberOfPoints = 150;
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
  "emb",
  "volume_emb",
  "halt",
  "volume_min",
  "volume_max",
  "pressure_min",
  "pressure_max",
];

for (var j = 0; j <= numberOfPoints; j++) {
  dataFlow[0][j] = j;
  dataPressure[0][j] = j;
  times[j] = 0;
}

const optsFlow = {
  width: window.innerWidth * 0.66 - 40,
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
      label: "Volumen",
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
  width: window.innerWidth * 0.66 - 40,
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
      label: "Presión",
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
let values = {
  marcha: 1,
  ie_ins: 1,
  ie_ex: 1,
  halt: 0.2,
  emb: 15,
  volume_emb: 50,
  volume_min: 0,
  volume_max: 0,
  pressure_min: 0,
  pressure_max: 0,
  FI_O2: 0,
};

let inputs = {};
let inputsShow = {};

let t0 = 0,
  ins_v0 = 0,
  ins_acc = 0,
  ex_v0 = 0,
  ex_acc = 0,
  peep,
  p_max;

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
    peep: document.getElementById("peep"),
    p_max: document.getElementById("p_max"),
    v_ins: document.getElementById("v_ins"),
    v_esp: document.getElementById("v_esp"),
    ie: document.getElementById("ie"),
    emb: document.getElementById("emb"),
    parada_ins: document.getElementById("parada_ins"),
    fi_o2: document.getElementById("fi_o2"),
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

    if (i % 3 === 0) {
      flow.setData(newDataFlow);
      pressure.setData(newDataPressure);
      const index = i > 0 ? i - 1 : numberOfPoints - 1;
      peep =
        peep === undefined || peep > newDataPressure[1][index]
          ? newDataPressure[1][index]
          : peep;
      p_max =
        peep === undefined || peep < newDataPressure[1][index]
          ? newDataPressure[1][index]
          : peep;
      inputsShow.ie.innerHTML = Number(msg.ie).toFixed(0);
      inputsShow.fi_o2.innerHTML = Number(msg.fi_o2).toFixed(0);
    }
    if (t0) {
      ins_acc +=
        ((ins_v0 + Number(msg.flow_ins)) / 2) * (Number(msg.time) - t0);
      ex_acc += ((ex_v0 + Number(msg.flow_ex)) / 2) * (Number(msg.time) - t0);
      peep = msg.p;
    }
    ins_v0 = Number(msg.flow_ins);
    ex_v0 = Number(msg.flow_ex);
    t0 = Number(msg.time);
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
        fi_o2,
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
        fi_o2,
      });
      console.log("---------> Read", line);
      if (process.env.WRITE_CSV !== "false") writer.write(data);
    }
  });
}

function initWrite(portWrite, parserWrite) {
  // ***** info inputs ***** //

  inputs = {
    ie: document.getElementById("ie"),
    emb: document.getElementById("emb"),
    parada_ins: document.getElementById("parada_ins"),
    fi_o2: document.getElementById("fi_o2"),
  };

  const buttons = {
    start: document.getElementById("start"),
    stop: document.getElementById("stop"),
  };

  // ***** ----------- ***** //

  // ***** default values ***** //
  Object.keys(values).forEach((k) => {
    if (inputs[k]) inputs[k].innerHTML = values[k];
  });
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

      values[key] = e.currentTarget.value;
      portWrite.write(`<${valuesToSend()}>\n`);
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
    if (line.startsWith("<")) {
      const data = line.slice(1, -2).split(",");
      console.log("---------> Write", line);
      const [marcha, ie, parada_ins, emb, v_emb] = data;
      updateValues({
        marcha,
        ie,
        parada_ins,
        emb,
        v_emb,
      });
      inputsShow.v_ins.innerHTML = ins_acc.toFixed(0);
      inputsShow.v_esp.innerHTML = ex_acc.toFixed(0);
      if (peep !== undefined) inputsShow.peep.innerHTML = peep.toFixed(1);
      if (p_max !== undefined) inputsShow.p_max.innerHTML = p_max.toFixed(1);
      ins_acc = 0;
      ex_acc = 0;
      peep = undefined;
      p_max = undefined;
      console.log("---------> Write", line);
    }
  });
  // ***** ----------- ***** //
}

function updateValues(msg) {
  Object.keys(values).forEach((k) => {
    values[k] = msg[k];
    if (inputs[k]) inputs[k].value = msg[k];
  });
}

function valuesToSend() {
  const { marcha, ie_ins, ie_esp, parada_ins, emb, v_emb } = values;
  return [marcha, ie_ins, ie_esp, parada_ins, emb, v_emb];
}
