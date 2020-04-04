const numberOfPoints = 200;
const sampling = 30;
const dataVolume = [[], []];
const dataPressure = [[], []];
const dataToSend = {
  field: "",
  value: "",
};

const dataAccepted = [
  "ie_ins",
  "ie_es",
  "embolado",
  "halt",
  "volume_min",
  "volume_max",
  "pressure_min",
  "pressure_max",
];

for (var j = 0; j <= numberOfPoints; j++) {
  dataVolume[0][j] = j;
  dataPressure[0][j] = j;
}

const optsVolume = {
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
      label: "volume",
      stroke: "red",
      fill: "rgba(255,0,0,0.1)",
    },
  ],
  axes: [
    {},
    {
      space: 10,
      show: true,
      label: "Volume",
      labelSize: 30,
      labelFont: "bold 12px Arial",
      font: "8px Arial",
      gap: 5,
      size: 50,
      stroke: "red",
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
    {},
    {
      scale: 0.01,
      side: 0.01,
      label: "pressure",
      stroke: "blue",
      fill: "rgba(0,0,255,0.1)",
    },
  ],
  axes: [
    {},
    {
      space: 10,
      show: true,
      label: "Pressure",
      labelSize: 30,
      labelFont: "bold 12px Arial",
      font: "8px Arial",
      gap: 5,
      size: 50,
      stroke: "blue",
    },
  ],
};

window.onload = () => {
  // ***** info inputs ***** //

  const inputsShow = {
    time: document.getElementById("time"),
    volumeCicle: document.getElementById("volume"),
  };

  const inputs = {
    ie_ins: document.getElementById("ie_ins"),
    ie_es: document.getElementById("ie_es"),
    embolado: document.getElementById("embolado"),
    halt: document.getElementById("halt"),
    volume_min: document.getElementById("volume_min"),
    volume_max: document.getElementById("volume_max"),
    pressure_min: document.getElementById("pressure_min"),
    pressure_max: document.getElementById("pressure_max"),
  };

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

  // ***** ----------- ***** //

  const socket = io();
  // ***** Draw the charts ***** //

  const newDataVolume = [...dataVolume];
  const newDataPressure = [...dataPressure];

  const volume = new uPlot(
    optsVolume,
    dataVolume,
    document.getElementById("volumeChart")
  );
  const pressure = new uPlot(
    optsPressure,
    dataPressure,
    document.getElementById("pressureChart")
  );

  let i = 0;
  socket.on("data", (msg) => {
    newDataVolume[1][i] = msg.volume;
    newDataVolume[1][i + 1] = null;
    newDataPressure[1][i] = msg.pressure;
    newDataPressure[1][i + 1] = null;
    i++;

    if (i > numberOfPoints) {
      i = 0;
    }

    if (i % 10 === 0) {
      const pointCicle = (1000 / sampling) * (1 / msg.frequency);
      inputsShow.volumeCicle.value = (
        [
          ...newDataVolume[1].slice(i > pointCicle ? i - pointCicle : 0, i + 1),
          ...(i < pointCicle
            ? newDataVolume[1].slice(
                newDataVolume[1].length - pointCicle + i - 1,
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
      volume.setData(newDataVolume);
      pressure.setData(newDataPressure);
    }
  });

  // ***** ----------- ***** //

  // ***** Update data ***** //

  if (!dataToSend.field) {
    keyboard.keypad.style.display = "none";
  }

  Object.keys(inputs).forEach((key) => {
    inputs[key].onchange = (e) => {
      dataToSend.field = e.currentTarget.id;
      dataToSend.value = e.currentTarget.value;
      keyboard.field_name.innerHTML = dataToSend.field;
      keyboard.num_box.innerHTML = dataToSend.value;
      socket.emit("data", `${key},${e.currentTarget.value}\n`);
    };
    inputs[key].onfocus = (e) => {
      dataToSend.field = e.currentTarget.id;
      dataToSend.value = e.currentTarget.value;
      keyboard.field_name.innerHTML = dataToSend.field;
      keyboard.num_box.innerHTML = dataToSend.value;
      if (keyboard.keypad.style.display == "none") {
        keyboard.keypad.style.display = "flex";
      }
    };
  });
  keyboard.keys.forEach((k) => {
    k.onclick = (e) => {
      dataToSend.value += e.currentTarget.innerHTML;
      keyboard.num_box.innerHTML = dataToSend.value;
    };
  });

  keyboard.keys.forEach((k) => {
    k.onclick = (e) => {
      console.log("------>", e.currentTarget);
      dataToSend.value += e.currentTarget.innerHTML;
      keyboard.num_box.innerHTML = dataToSend.value;
    };
  });

  keyboard.delete.onclick = (e) => {
    dataToSend.value = dataToSend.value.slice(0, -1);
    keyboard.num_box.innerHTML = dataToSend.value;
  };

  keyboard.send.onclick = (e) => {
    if (dataAccepted.includes(dataToSend.field)) {
      socket.emit("data", `${dataToSend.field},${dataToSend.value}\n`);
    }
  };

  socket.on("value", (msg) => {
    console.log("------>", msg);
    if (msg.key === dataToSend.field) {
      dataToSend.value = msg.value;
      keyboard.num_box.innerHTML = dataToSend.value;
    }
    inputs[msg.key].value = msg.value;
  });

  // ***** ----------- ***** //
};
