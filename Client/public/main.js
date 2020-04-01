const numberOfPoints = 200;
const sampling = 30;
const labels = [];
const chartColors = {
  red: "rgb(255, 99, 132)",
  orange: "rgb(255, 159, 64)",
  yellow: "rgb(255, 205, 86)",
  green: "rgb(75, 192, 192)",
  blue: "rgb(54, 162, 235)",
  purple: "rgb(153, 102, 255)",
  grey: "rgb(201, 203, 207)"
};
for (var j = 0; j <= numberOfPoints; j++) {
  labels[j] = j;
}
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  title: {
    display: true
  },
  animation: {
    duration: 0
  },
  hover: {
    animationDuration: 0
  },
  responsiveAnimationDuration: 0,
  elements: {
    point: {
      radius: 0 // disables bezier curves
    },
    line: {
      tension: 0 // disables bezier curves
    }
  },
  ticks: {
    maxRotation: 0
  }
};
const configVolume = {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Volume",
        backgroundColor: chartColors.red,
        data: Array(numberOfPoints).fill(null),
        fill: true
      }
    ]
  },
  options: chartOptions
};
configVolume.options.title.text = "Volume";
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
configPressure.options.title.text = "Pressure";

window.onload = function() {
  const ctx1 = document.getElementById("canvas1").getContext("2d");
  const volume = new Chart(ctx1, configVolume);
  const ctx2 = document.getElementById("canvas2").getContext("2d");
  const time = document.getElementById("time");
  const volumeCicle = document.getElementById("volume");
  const pressure = new Chart(ctx2, configPressure);
  const socket = io();
  let i = 0;
  const dataVolume = configVolume.data.datasets[0].data;
  const dataPressure = configPressure.data.datasets[0].data;
  socket.on("data", function(msg) {
    dataVolume[i] = msg.volume;
    dataVolume[i + 1] = null;
    dataPressure[i] = msg.pressure;
    dataPressure[i + 1] = null;
    i++;

    if (i > numberOfPoints) {
      i = 0;
    }

    if (i % 10 === 0) {
      const pointCicle = (1000 / sampling) * (1 / msg.frequency);
      volumeCicle.innerHTML = (
        [
          ...dataVolume.slice(i > pointCicle ? i - pointCicle : 0, i + 1),
          ...(i < pointCicle
            ? dataVolume.slice(
                dataVolume.length - pointCicle + i - 1,
                numberOfPoints
              )
            : [])
        ].reduce((a, b) => (Number(b) ? a + Number(b) : a), 0) * pointCicle
      ).toFixed(2);

      const s = msg.time / 1000;
      const min = Math.floor((s / 60) << 0);
      const sec = Math.floor(s % 60);
      time.innerHTML = min + ":" + sec;
    }

    if (i % 3 === 0) {
      volume.update();
      pressure.update();
    }
  });
};
