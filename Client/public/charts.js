const numberOfPoints = 200;
const sampling = 30;
const dataVolume = [[], []];
const dataPressure = [[], []];

for (var j = 0; j <= numberOfPoints; j++) {
  dataVolume[0][j] = j;
  dataPressure[0][j] = j;
}

const optsVolume = {
  width: window.innerWidth * 0.8 - 40,
  height: window.innerHeight * 0.4 - 40,
  title: "Volume",
  scales: {
    x: {
      time: false
    }
  },
  series: [
    {},
    {
      label: "volume",
      stroke: "red",
      fill: "rgba(255,0,0,0.1)"
    }
  ]
};

const optsPressure = {
  width: window.innerWidth * 0.8 - 40,
  height: window.innerHeight * 0.4 - 40,
  title: "Pressure",
  scales: {
    x: {
      time: false
    }
  },
  series: [
    {},
    {
      label: "pressure",
      stroke: "blue",
      fill: "rgba(0,0,255,0.1)"
    }
  ]
};

window.onload = function() {
  const time = document.getElementById("time");
  const volumeCicle = document.getElementById("volume");
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
  const socket = io();
  let i = 0;
  socket.on("data", function(msg) {
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
      volumeCicle.innerHTML = (
        [
          ...newDataVolume[1].slice(i > pointCicle ? i - pointCicle : 0, i + 1),
          ...(i < pointCicle
            ? newDataVolume[1].slice(
                newDataVolume[1].length - pointCicle + i - 1,
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
      volume.setData(newDataVolume);
      pressure.setData(newDataPressure);
    }
  });
};
