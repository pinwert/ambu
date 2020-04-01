var numberOfPoints = 200;
var labels = [];
var chartColors = {
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
var configVolume = {
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
  options: {
    responsive: true,
    maintainAspectRatio: false,
    title: {
      display: true,
      text: "Volume"
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
    sampleSize: 5
  }
};
var configPressure = {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Pressure",
        backgroundColor: chartColors.red,
        fill: true,
        data: Array(numberOfPoints).fill(null)
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    title: {
      display: true,
      text: "Pressure"
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
    sampleSize: 5
  }
};

window.onload = function() {
  var ctx1 = document.getElementById("canvas1").getContext("2d");
  var volume = new Chart(ctx1, configVolume);
  var ctx2 = document.getElementById("canvas2").getContext("2d");
  var time = document.getElementById("time");
  var volumeCicle = document.getElementById("volume");
  var pressure = new Chart(ctx2, configPressure);
  var socket = io();
  var i = 0;
  var dataVolume = configVolume.data.datasets[0].data;
  var dataPressure = configPressure.data.datasets[0].data;
  socket.on("data", function(msg) {
    console.log(msg);
    dataVolume[i] = msg.volume;
    dataVolume[i + 1] = null;
    dataPressure[i] = msg.pressure;
    dataPressure[i + 1] = null;
    time.innerHTML = msg.time;
    i++;
    if (i > numberOfPoints) {
      i = 0;
    }
    volumeCicle.innerHTML = (
      [
        ...dataVolume.slice(i > 131 ? i - 130 : 0, i > 131 ? i + 1 : i),
        ...dataVolume.slice(
          i > 131 ? dataVolume.length : i + 70,
          dataVolume.length
        )
      ].reduce((a, b) => (Number(b) ? a + Number(b) : a), 0) * 120
    ).toFixed(2);

    volume.update();
    pressure.update();
  });
};
