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
const numberOfPoints = 300;
const dataFlow = [[], [], []];
const dataPressure = [[], []];
// const times = [];
const dataToSend = {
  field: "",
  value: "",
  field_bis: "",
  value_bis: "",
  active: "value",
};

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
];

for (var j = 0; j <= numberOfPoints; j++) {
  dataFlow[0][j] = j;
  dataPressure[0][j] = j;
  // times[j] = 0;
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
      // times,
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
      // times,
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
      // times,
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

const getPortsList = (callback) => {
  var portsList = [];

  SerialPort.list().then((ports) => {
    ports.forEach((port) => {
      portsList.push(port.path);
    });
    callback(portsList);
  });
};

let portAlberto, portFer, parserRead, parserWrite;
let values = {
  marcha: 1,
  ie_ins: 1,
  ie_esp: 1,
  parada_ins: 0.2,
  emb: 15,
  v_emb: 420,
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
    // const selectPortAlberto = document.getElementById("serial_ports1");
    // const selectPortFer = document.getElementById("serial_ports2");
    const info_panel = document.getElementById("info_panel");

    // selectPortAlberto.innerHTML += ` <option value=""></option>`;
    // ports.forEach((p) => {
    //   selectPortAlberto.innerHTML += ` <option value="${p}">${p}</option>`;
    // });

    // selectPortAlberto.onchange = (e) => {
    portAlberto = new SerialPort("/dev/ttyUSB0", { baudRate });
    parserRead = new Readline();
    portAlberto.pipe(parserRead);
    // if (portFer && parserWrite) {
    //   setup_panel.style.display = "none";
    //   info_panel.style.display = "flex";
    // }
    initRead(portAlberto, parserRead);
    // };

    // selectPortFer.innerHTML += ` <option value=""></option>`;
    // ports.forEach((p) => {
    //   selectPortFer.innerHTML += ` <option value="${p}">${p}</option>`;
    // });

    // selectPortFer.onchange = (e) => {
    portFer = new SerialPort("/dev/ttyACM0", { baudRate });
    parserWrite = new Readline();
    portFer.pipe(parserWrite);

    // if (portAlberto && parserRead) {
    // setup_panel.style.display = "none";
    info_panel.style.display = "flex";
    // }

    initWrite(portFer, parserWrite);
    // };
  });
};

// ------------------------------ Arduino Alberto

function initRead(portAlberto, parserRead) {
  writer.pipe(fs.createWriteStream(`out-${Date.now()}.csv`));

  // ***** info inputs ***** //

  inputsShow = {
    peep: document.getElementById("peep"),
    p_max: document.getElementById("p_max"),
    v_ins: document.getElementById("v_ins"),
    v_esp: document.getElementById("v_esp"),
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
    // times[i] = (msg.time / 1000).toFixed(1);

    newDataPressure[1][i] = msg.pressure;
    newDataPressure[1][i + 1] = null;
    i++;

    if (i > numberOfPoints) {
      i = 0;
    }

    if (i % 3 === 0) {
      flow.setData(newDataFlow);
      pressure.setData(newDataPressure);
      inputsShow.fi_o2.innerHTML = Number(msg.fi_o2).toFixed(0);
    }
    if (t0) {
      ins_acc +=
        ((ins_v0 + Number(msg.flow_ins)) / 2) * (Number(msg.time) - t0);
      ex_acc += ((ex_v0 + Number(msg.flow_ex)) / 2) * (Number(msg.time) - t0);
    }
    const index = i > 0 ? i - 1 : numberOfPoints - 1;
    const newPressure = Number(newDataPressure[1][index]);
    peep = peep === undefined || peep > newPressure ? newPressure : peep;
    p_max =
      p_max === undefined || p_max < newPressure ? Number(newPressure) : p_max;
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
      if (process.env.WRITE_CSV !== "false") writer.write(data);
    }
  });
}

// ------------------------------ Arduino Fer

function initWrite(portFer, parserWrite) {
  // ***** info inputs ***** //

  inputs = {
    v_ins: document.getElementById("v_ins"),
    v_esp: document.getElementById("v_esp"),
    ie: document.getElementById("ie"),
    emb: document.getElementById("emb"),
    parada_ins: document.getElementById("parada_ins"),
    fi_o2_a_min: document.getElementById("fi_o2_a_min"),
    fi_o2_a_max: document.getElementById("fi_o2_a_max"),
    v_a_min: document.getElementById("v_a_min"),
    v_a_max: document.getElementById("v_a_max"),
    p_a_min: document.getElementById("p_a_min"),
    p_a_max: document.getElementById("p_a_max"),
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
    value: document.getElementById("num_box"),
    bis: document.getElementById("bis"),
    field_name_bis: document.getElementById("field_name_bis"),
    value_bis: document.getElementById("num_box_bis"),
    keypad: document.getElementById("keypad"),
    send: document.getElementById("send"),
    delete: document.getElementById("delete"),
    keys: document.querySelectorAll("#keypad .key"),
  };

  keyboard.keypad.onclick = (e) => {
    if (e.target === keyboard.keypad) {
      keyboard.keypad.style.display = "none";
      keyboard.bis.style.display = "none";
      dataToSend.field_bis = "";
    }
  };

  // ***** ----------- ***** //

  // ***** Update data ***** //

  if (!dataToSend.field) {
    keyboard.keypad.style.display = "none";
    keyboard.bis.style.display = "none";
    dataToSend.field_bis = "";
  }

  keyboard.value.onchange = (e) => {
    dataToSend.value = e.currentTarget.value;
  };
  keyboard.value_bis.onchange = (e) => {
    dataToSend.value_bis = e.currentTarget.value;
  };

  keyboard.value.onfocus = (e) => {
    dataToSend.active = "value";
  };
  keyboard.value_bis.onfocus = (e) => {
    dataToSend.active = "value_bis";
  };

  Object.keys(inputs).forEach((key) => {
    inputs[key].onclick = (e) => {
      switch (e.currentTarget.id) {
        case "ie":
          dataToSend.field = "ie_ins";
          dataToSend.field_bis = "ie_esp";
          keyboard.bis.style.display = "flex";
          break;
        case "v_ins":
        case "v_esp":
          dataToSend.field = "v_emb";
          break;
        default:
          dataToSend.field = e.currentTarget.id;
      }
      dataToSend.value = "";
      dataToSend.value_bis = "";
      keyboard.field_name.innerHTML = dataToSend.field;
      keyboard.value.value = dataToSend.value;
      keyboard.field_name_bis.innerHTML = dataToSend.field_bis;
      keyboard.value_bis.value = dataToSend.value_bis;
      if (keyboard.keypad.style.display == "none") {
        keyboard.keypad.style.display = "flex";
      }
    };
  });

  Object.keys(buttons).forEach((b) => {
    buttons[b].onclick = (e) => {
      values[e.currentTarget.dataset.key] = e.currentTarget.dataset.value;
      portFer.write(`<${valuesToSend()}>\n`);
    };
  });

  keyboard.keys.forEach((k) => {
    k.onclick = (e) => {
      dataToSend[dataToSend.active] += e.currentTarget.innerHTML;
      keyboard[dataToSend.active].value = dataToSend[dataToSend.active];
    };
  });

  keyboard.keys.forEach((k) => {
    k.onclick = (e) => {
      dataToSend[dataToSend.active] += e.currentTarget.innerHTML;
      keyboard[dataToSend.active].value = dataToSend[dataToSend.active];
    };
  });

  keyboard.delete.onclick = (e) => {
    dataToSend[dataToSend.active] = dataToSend.value.slice(0, -1);
    keyboard[dataToSend.active].value = dataToSend[dataToSend.active];
  };

  keyboard.send.onclick = (e) => {
    if (dataAcceptedFer.includes(dataToSend.field)) {
      values[dataToSend.field] = dataToSend.value;
      if (dataToSend.field_bis) {
        values[dataToSend.field_bis] = dataToSend.value_bis;
      }
      console.log("-----------> W Fer", valuesToSend(), dataToSend);
      portFer.write(`<${valuesToSend()}>\n`);
    } else if (dataAcceptedAlberto.includes(dataToSend.field)) {
      console.log("-----------> W Alberto", dataToSend.field, dataToSend.value);
      portAlberto.write(`${dataToSend.field},${dataToSend.value}\n`);
    }
    keyboard.keypad.style.display = "none";
    keyboard.bis.style.display = "none";
    dataToSend.field_bis = "";
  };

  parserWrite.on("data", (line) => {
    if (line.startsWith("<")) {
      const data = line.slice(1, -2).split(",");
      const [marcha, ie, parada_ins, emb, v_emb] = data;
      updateValues({
        marcha,
        ie,
        parada_ins,
        emb,
        v_emb,
      });
      inputsShow.v_ins.innerHTML = (ins_acc / 60).toFixed(0);
      inputsShow.v_esp.innerHTML = (ex_acc / 60).toFixed(0);
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
  Object.keys(msg).forEach((k) => {
    values[k] = msg[k];
    inputs.ie.innerHTML = (Number(msg.ie) * 100).toFixed(0);
    inputs.parada_ins.innerHTML = Number(msg.parada_ins).toFixed(1);
    inputs.emb.innerHTML = Number(msg.emb).toFixed(0);
  });
}

function valuesToSend() {
  const { marcha, ie_ins, ie_esp, parada_ins, emb, v_emb } = values;
  return [marcha, ie_ins, ie_esp, parada_ins, emb, v_emb];
}
