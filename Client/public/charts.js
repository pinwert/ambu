const dataFlow = [[], [], []];
const dataPressure = [[], []];
const dataHis = [[0], [], [], [], [], [], []];

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
      label: "Volumen ins",
      stroke: "red",
      fill: "rgba(237, 125, 49,0.3)",
    },
    {
      label: "Volumen esp",
      stroke: "green",
      fill: "rgba(112, 143, 71,0.3)",
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

const optsHis = {
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
      label: "V ins",
      stroke: "red",
      scale: "a",
    },
    {
      label: "V esp",
      stroke: "green",
      scale: "a",
    },
    {
      label: "peep",
      stroke: "blue",
      scale: "b",
    },
    {
      label: "p_max",
      stroke: "aqua",
      scale: "b",
    },
    {
      label: "ie",
      stroke: "yellowgreen",
      scale: "c",
    },
    {
      label: "emb",
      stroke: "burlywood",
      scale: "d",
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
      stroke: "red",
      scale: "a",
    },
    {
      side: 1,
      space: 10,
      show: true,
      label: "Presión",
      font: "8px Arial",
      gap: 5,
      size: 50,
      stroke: "blue",
      scale: "b",
      grid: { show: false },
    },
    {
      side: 1,
      space: 10,
      show: true,
      label: "Ie",
      font: "8px Arial",
      gap: 5,
      size: 50,
      stroke: "yellowgreen",
      scale: "c",
      grid: { show: false },
    },
    {
      side: 1,
      space: 10,
      show: true,
      label: "Emboladas",
      font: "8px Arial",
      gap: 5,
      size: 50,
      stroke: "burlywood",
      scale: "d",
      grid: { show: false },
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
      fill: "rgba(68, 114, 196,0.3)",
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
export default function charts(numberOfPoints, sampling) {
  for (var j = 0; j <= numberOfPoints; j++) {
    dataFlow[0][j] = j;
    dataPressure[0][j] = j;
  }
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
  const history = new uPlot(
    optsHis,
    dataHis,
    document.getElementById("hisChart")
  );

  function updateFlowPressure(msg, i) {
    dataFlow[1][i] = msg.flow_ins;
    dataFlow[2][i] = msg.flow_ex;
    dataFlow[1][i + 1] = null;
    dataFlow[2][i + 1] = null;
    dataPressure[1][i] = msg.pressure;
    dataPressure[1][i + 1] = null;
    if (i % sampling === 0) {
      flow.setData(dataFlow);
      pressure.setData(dataPressure);
    }
  }

  function updateHistory(msg, i) {
    dataHis[0][i] = i;
    dataHis[1][i] = Number(msg.v_ins);
    dataHis[1][i + 1] = null;
    dataHis[2][i] = Number(msg.v_esp);
    dataHis[2][i + 1] = null;
    dataHis[3][i] = msg.peep;
    dataHis[3][i + 1] = null;
    dataHis[4][i] = msg.p_max;
    dataHis[4][i + 1] = null;
    history.setData(dataHis);
  }
  return { updateFlowPressure, updateHistory };
}
