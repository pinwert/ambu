const numberOfPoints = 400;
const sampling = 10;
const dataFlow = [[], [], []];
const dataPressure = [[], []];
const times = [];
const dataToSend = {
  field: "",
  value: "",
};

const dataAccepted = [
  "arranque",
  "ie_ins",
  "ie_ex",
  "embolado",
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
  width: window.innerWidth * 0.8 - 40,
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
  width: window.innerWidth * 0.8 - 40,
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

window.onload = () => {
  // ***** info inputs ***** //

  const inputsShow = {
    pressure: document.getElementById("pressure"),
    flow_ins: document.getElementById("flow_ins"),
    flow_ex: document.getElementById("flow_ex"),
    time: document.getElementById("time"),
    volume_cicle_ins: document.getElementById("volume_ins"),
    volume_cicle_ex: document.getElementById("volume_ex"),
  };

  const inputs = {
    ie_ins: document.getElementById("ie_ins"),
    ie_ex: document.getElementById("ie_ex"),
    embolado: document.getElementById("embolado"),
    volume_emb: document.getElementById("volume_emb"),
    halt: document.getElementById("halt"),
    volume_min: document.getElementById("volume_min"),
    volume_max: document.getElementById("volume_max"),
    pressure_min: document.getElementById("pressure_min"),
    pressure_max: document.getElementById("pressure_max"),
  };
  const buttons = {
    start: document.getElementById("start"),
    stop: document.getElementById("stop"),
  };

  // ***** ----------- ***** //

  // ***** default values ***** //
  inputs.ie_ins.value = 1;
  inputs.ie_ex.value = 2;
  inputs.embolado.value = 20;
  inputs.volume_emb.value = 0;
  inputs.halt.value = 0;
  inputs.volume_min.value = 0;
  inputs.volume_max.value = 0;
  inputs.pressure_min.value = 0;
  inputs.pressure_max.value = 0;

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

  const socket = io();
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
  socket.on("data", (msg) => {
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
      const pointCicle = (1000 / sampling) * (1 / msg.frequency);
      inputsShow.volume_cicle_ins.value = (
        [
          ...newDataFlow[1].slice(i > pointCicle ? i - pointCicle : 0, i + 1),
          ...(i < pointCicle
            ? newDataFlow[1].slice(
                newDataFlow[1].length - pointCicle + i - 1,
                numberOfPoints
              )
            : []),
        ].reduce((a, b) => (Number(b) ? a + Number(b) : a), 0) * pointCicle
      ).toFixed(2);

      inputsShow.volume_cicle_ex.value = (
        [
          ...newDataFlow[2].slice(i > pointCicle ? i - pointCicle : 0, i + 1),
          ...(i < pointCicle
            ? newDataFlow[2].slice(
                newDataFlow[2].length - pointCicle + i - 1,
                numberOfPoints
              )
            : []),
        ].reduce((a, b) => (Number(b) ? a + Number(b) : a), 0) * pointCicle
      ).toFixed(2);

      const s = msg.time / 1000;
      const min = Math.floor((s / 60) << 0);
      const sec = Math.floor(s % 60);
      inputsShow.time.value = min + ":" + sec;
    }

    if (i % 3 === 0) {
      flow.setData(newDataFlow);
      pressure.setData(newDataPressure);
      inputsShow.pressure.value = newDataPressure[1][i - 1];
      inputsShow.flow_ins.value = newDataFlow[1][i - 1];
      inputsShow.flow_ex.value = newDataFlow[2][i - 1];
    }
  });

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
      socket.emit("data", `${key},${e.currentTarget.value}\n`);
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
      console.log("......", e.currentTarget.dataset);
      socket.emit("data", `${e.currentTarget.dataset.data}\n`);
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
      socket.emit("data", `${dataToSend.field},${dataToSend.value}\n`);
      keyboard.keypad.style.display = "none";
    }
  };

  socket.on("value", (msg) => {
    console.log("------>", msg);
    if (msg.key === dataToSend.field) {
      dataToSend.value = msg.value;
      keyboard.num_box.value = dataToSend.value;
    }
    inputs[msg.key].value = msg.value;
  });

  // ***** ----------- ***** //
};
