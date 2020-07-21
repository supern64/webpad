var client;

function connect(address) {
  try {
    if (typeof address == "object") { address = null }
    client = new WSClient("ws://" + (address || app.serverAddress) + ":8222")
  } catch(e) {
    alertC("Connection Failed: " + e)
    return
  }
  client.on("open", (evt) => {
    setStorage("lastConnected", app.serverAddress)
    app.currentMenu = "control"
    alertN()
    client.send(JSON.stringify({messageType: "fetch"}))
  })
  client.on("message", (message, evt) => {
    message = JSON.parse(message)
    switch(message.messageType) {
      case "success":
        if (Object.keys(message).includes("commands")) { // came from a 'fetch' command
          app.commands = message.commands
        }
        return
      case "undetermined":
        app.popupData = message.result
        $("#commandReturn").modal('show')
        return
      case "error":
        alertC("The server reported an error: " + message.message)
        return
      case "handshake":
        return
      default:
        client.send(JSON.stringify({messageType: "error", message: "MESSAGE_TYPE_INVALID"}))
        break
    }
  })
  client.on("close", (code, res, evt)=> {
    app.isConnected = false
    alertC("Connection Closed: " + res)
  })
}

function disconnect() {
  client.close(1000)
  setStorage("lastConnected", "")
  setTimeout(() => {alertN()}, 200)
  app.currentMenu = "connect"
}

function executeCommand(evt) {
  var button = evt.target
  var command = button.getAttribute("data-boundto")
  command = app.commands.find(r => r.name === command)
  app.commandCtx = command
  if (command.arguments) {
    app.commandVars = command.arguments
    var form = document.getElementById("argumentSelectionForm")
    form.addEventListener("submit", (evt) => {
      evt.preventDefault()
      handleArgForm(evt)
    })
    alertN()
    $('#varSelect').on('hide.bs.modal', function () { alertN() })
    $("#varSelect").modal("show")
  } else {
    client.send(JSON.stringify({messageType: "command", command: command.name}))
  }
}

function handleArgForm(evt) {
  alertN()
  var form = document.getElementById("argumentSelectionForm")
  var mappedArgs = {}
  var command = app.commandCtx
  var args = command.arguments
  for (var i of form.elements) {
    if (i.getAttribute("required") === "required" && i.value.replace(" ", "").length === 0) {
      alertC("Please type in your " + args.find((r) => { return r.name === i.getAttribute("data-boundto")}).friendlyName)
      return
    }
    mappedArgs[i.getAttribute("data-boundto")] = i.value
  }
  client.send(JSON.stringify({messageType: "command", command: command.name, arguments: mappedArgs}))
  alertN()
  $("#varSelect").modal("hide")
}

var ceil = Math.ceil;

Object.defineProperty(Array.prototype, 'chunk', {value: function(n) {
    return Array(ceil(this.length/n)).fill().map((_,i) => this.slice(i*n,i*n+n));
}});

var app = new Vue({
  el: "#app",
  data: {
    currentMenu: "connect",
    serverAddress: "",
    alertSent: false,
    alertMessage: "",
    commands: [],
    popupData: "",
    commandVars: [],
    commandCtx: ""
  },
  methods: {connect, disconnect, executeCommand, handleArgForm}
})

if (readStorage("lastConnected")) {
  connect(readStorage("lastConnected"))
  app.serverAddress = readStorage("lastConnected")
}

function alertC(message) {
  app.alertSent = true;
  app.alertMessage = message;
}
function alertN() {
  app.alertSent = false;
  app.alertMessage = "";
}

function readStorage(property) {
  var data = localStorage.getItem("webpad")
  if (data === null) {
    localStorage.setItem("webpad", "{}")
    data = "{}"
  }
  data = JSON.parse(data)
  return data[property]
}
function setStorage(property, value) {
  var data = localStorage.getItem("webpad")
  if (data === null) {
    localStorage.setItem("webpad", "{}")
    data = "{}"
  }
  data = JSON.parse(data)
  data[property] = value
  localStorage.setItem("webpad", JSON.stringify(data))
  return true
}