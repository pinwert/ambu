const numberOfPoints = 400;
const sampling = 10;
const labels=[];
const dataToSend = {
  field: "",
  value: "",
};

const chartColors = {
  red: "rgb(255, 99, 132, 1)",
  orange: "rgb(255, 159, 64, 1)",
  yellow: "rgb(255, 205, 86, 1)",
  green: "rgb(75, 192, 192, 1)",
  blue: "rgb(54, 162, 235, 1)",
  purple: "rgb(153, 102, 255, 1)",
  grey: "rgb(201, 203, 207, 1)"
};

const dataAccepted = [
  "ie_ins",
  "ie_ex",
  "embolado",
  "halt",
  "volume_min",
  "volume_max",
  "pressure_min",
  "pressure_max",
];


for (var j = 0; j <= numberOfPoints; j++) {
  labels[j] = j;
}
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0
  },
  hover: {
    animationDuration: 0
  },
  responsiveAnimationDuration: 0,
  elements: {
    point: {
      radius: 0
    },
    line: {
      tension: 0 // disables bezier curves
    }
  },
  ticks: {
    maxRotation: 0
  }
};
const configPressure = {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Pressure",
        backgroundColor: chartColors.blue,
        fill: true,
        data: Array(numberOfPoints).fill(null)
      }
    ]
  },
  options: chartOptions
};

const  configFlow = {
  type: 'scatter',
  data: {
    labels,
    datasets: [{
      label: 'Flow_ins / Flow_ex',
      backgroundColor: (chartColors.red).replace('1)', '0.2)'),
      borderColor: chartColors.red,
      pointBackgroundColor: chartColors.red,
      showLine: true,
      data: []
    }]
  },
  options: chartOptions
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

  const ctx1 = document.getElementById("canvasPressure").getContext("2d");
  const pressure = new Chart(ctx1, configPressure);
  const ctx2 = document.getElementById("canvasFlow").getContext("2d");
  const flow = new Chart(ctx2, configFlow);
  
  const data_pressure = configPressure.data.datasets[0].data;
  let data_flow = configFlow.data.datasets[0].data;

  let i = 0;
  socket.on("data", (msg) => {
    data_pressure[i] = msg.pressure;
    data_pressure[i + 1] = null;
    data_flow[i] = {x: msg.flow_ins, y: msg.flow_ex};
    data_flow[i + 1] = null;

    i++;

    if (i > numberOfPoints) {
      i = 0;
    }

    if (i % 10 === 0) {
      const pointCicle = (1000 / sampling) * (1 / msg.frequency);
      const volume = (
        [
          ...[...data_flow].slice(i > pointCicle ? i - pointCicle : 0, i + 1),
          ...(i < pointCicle
            ? [...data_flow].slice(
              data_flow.length - pointCicle + i - 1,
                numberOfPoints
              )
            : []),
        ].reduce((a, b) => (b && Number(b.x) && Number(b.y) ? {ins: a.ins + Number(b.x), ex: a.ex + Number(b.y)} : a), {ins:0,ex:0})
      );
      console.log(',,..-,-.,-,.,-,-.',volume);
      inputsShow.volume_cicle_ins.value = (volume.ins * pointCicle).toFixed(2);
      inputsShow.volume_cicle_ex.value = (volume.ex * pointCicle).toFixed(2);

      const s = msg.time / 1000;
      const min = Math.floor((s / 60) << 0);
      const sec = Math.floor(s % 60);
      inputsShow.time.value = min + ":" + sec;
    }

    if (i % 3 === 0) {
      flow.update();
      pressure.update();
      inputsShow.pressure.value = data_pressure[i ? i - 1: data_flow.length-1];
      inputsShow.flow_ins.value = data_flow[i ? i - 1: data_flow.length-1].x;
      inputsShow.flow_ex.value = data_flow[i ? i - 1: data_flow.length-1].y;
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
