const dataToSend = {
  field: "",
  value: "",
  field_bis: "",
  value_bis: "",
  active: "value",
};

export default function keyboard(inputs, values, showHistory, send) {
  const k = {
    field_name: document.getElementById("field_name"),
    value: document.getElementById("num_box"),
    bis: document.getElementById("bis"),
    field_name_bis: document.getElementById("field_name_bis"),
    value_bis: document.getElementById("num_box_bis"),
    keypad: document.getElementById("keypad"),
    send: document.getElementById("send"),
    delete: document.getElementById("delete"),
    clear: document.getElementById("clear"),
    keys: document.querySelectorAll("#keypad .key"),
  };

  const buttons = {
    start: document.getElementById("start"),
    stop: document.getElementById("stop"),
    his: document.getElementById("his"),
    mute: document.getElementById("mute"),
  };
  const historico = {
    modal_his: document.getElementById("modal_his"),
  };

  historico.modal_his.onclick = (e) => {
    if (e.target === historico.modal_his) {
      historico.modal_his.style.display = "none";
    }
  };

  historico.modal_his.style.display = "none";

  k.keypad.onclick = (e) => {
    if (e.target === k.keypad) {
      k.keypad.style.display = "none";
      k.bis.style.display = "none";
      dataToSend.field_bis = "";
    }
  };

  if (!dataToSend.field) {
    k.keypad.style.display = "none";
    k.bis.style.display = "none";
    dataToSend.field_bis = "";
  }

  k.value.onchange = (e) => {
    dataToSend.value = e.currentTarget.value;
  };
  k.value_bis.onchange = (e) => {
    dataToSend.value_bis = e.currentTarget.value;
  };

  k.value.onfocus = (e) => {
    dataToSend.active = "value";
    k.value.classList.add("active");
    k.value_bis.classList.remove("active");
  };
  k.value_bis.onfocus = (e) => {
    dataToSend.active = "value_bis";
    k.value_bis.classList.add("active");
    k.value.classList.remove("active");
  };

  Object.keys(inputs).forEach((key) => {
    inputs[key].onclick = (e) => {
      switch (e.currentTarget.id) {
        case "ie":
          dataToSend.field = "ie_ins";
          dataToSend.field_bis = "ie_esp";
          k.bis.style.display = "flex";
          break;
        case "v_ins":
        case "v_esp":
          dataToSend.field = "v_emb";
          dataToSend.value = values.v_emb;
          break;
        case "distension_ins":
        case "distension_esp":
          dataToSend.field = e.currentTarget.id;
          dataToSend.value = values[`${e.currentTarget.id}_time`];
          break;
        default:
          dataToSend.field = e.currentTarget.id;
          dataToSend.value = values[e.currentTarget.id];
      }
      dataToSend.active = "value";
      k.value.classList.add("active");
      k.value_bis.classList.remove("active");
      dataToSend.value_bis = "";
      k.field_name.innerHTML = dataToSend.field;
      k.value.placeholder = dataToSend.value;
      k.value.value = "";
      k.field_name_bis.innerHTML = dataToSend.field_bis;
      k.value_bis.placeholder = dataToSend.value_bis;
      k.value_bis.value = "";
      if (k.keypad.style.display == "none") {
        k.keypad.style.display = "flex";
        k.value.focus();
      }
    };
  });

  k.keys.forEach((p) => {
    p.onclick = (e) => {
      if (k[dataToSend.active].value === "") {
        dataToSend[dataToSend.active] = e.currentTarget.innerHTML;
      } else {
        dataToSend[dataToSend.active] += e.currentTarget.innerHTML;
      }
      k[dataToSend.active].value = dataToSend[dataToSend.active];
      k[dataToSend.active].focus();
    };
  });

  k.delete.onclick = (e) => {
    dataToSend[dataToSend.active] = dataToSend.value.slice(0, -1);
    k[dataToSend.active].value = dataToSend[dataToSend.active];
    k[dataToSend.active].focus();
  };

  k.clear.onclick = (e) => {
    dataToSend[dataToSend.active] = "";
    k[dataToSend.active].value = dataToSend[dataToSend.active];
    k[dataToSend.active].focus();
  };

  k.send.onclick = (e) => {
    send(dataToSend);
    k.keypad.style.display = "none";
    k.bis.style.display = "none";
    dataToSend.field_bis = "";
  };

  Object.keys(buttons).forEach((b) => {
    buttons[b].onclick = (e) => {
      switch (b) {
        case "his":
          historico.modal_his.style.display = "flex";
          showHistory();
          break;
        default:
          dataToSend.field = e.currentTarget.dataset.key;
          dataToSend.value = e.currentTarget.dataset.value;
          if (b === "mute") {
            buttons.mute.dataset.value =
              buttons.mute.dataset.value === "1" ? "0" : "1";
          }
          send(dataToSend);
      }
    };
  });
}
