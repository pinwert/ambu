export default function info(values) {
  const inputs = {
    v_ins: document.getElementById("v_ins"),
    v_esp: document.getElementById("v_esp"),
    ie_ins: document.getElementById("ie_ins"),
    ie_esp: document.getElementById("ie_esp"),
    emb: document.getElementById("emb"),
    parada_ins: document.getElementById("parada_ins"),
    fi_o2_a_min: document.getElementById("fi_o2_a_min"),
    fi_o2_a_max: document.getElementById("fi_o2_a_max"),
    v_a_min: document.getElementById("v_a_min"),
    v_a_max: document.getElementById("v_a_max"),
    p_a_min: document.getElementById("p_a_min"),
    p_a_max: document.getElementById("p_a_max"),
  };

  const inputsShow = {
    peep: document.getElementById("peep"),
    p_max: document.getElementById("p_max"),
    v_ins: document.getElementById("v_ins"),
    v_esp: document.getElementById("v_esp"),
    fi_o2: document.getElementById("fi_o2"),
  };

  // ***** ----------- ***** //

  // ***** default values ***** //
  Object.keys(values).forEach((k) => {
    if (inputs[k]) inputs[k].innerHTML = values[k];
  });

  return { inputs, inputsShow };
}