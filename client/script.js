var client;

var apiLevel = "2"
var connClosed = false

function connect(address) {
  connClosed = false
  try {
    if (typeof address == "object") { address = null }
    let addr = (address || app.serverAddress)
    if (!addr.includes(":")) {
      addr = addr + ":8222"
    }
    client = new WSClient("ws://" + addr)
    app.serverAddress = addr
  } catch(e) {
    alertC("Connection Failed: " + e)
    return
  }
  client.on("open", (evt) => {
    setStorage("lastConnected", app.serverAddress)
    alertN()
    client.send(JSON.stringify({messageType: "handshake", apiLevel: apiLevel}))
  })
  client.on("message", (message, evt) => {
    message = JSON.parse(message)
    switch(message.messageType) {
      case "success":
        if (Object.keys(message).includes("commands")) { // came from a 'fetch' command
          app.commands = message.commands
        }
        break
      case "undetermined":
        app.popupData = message.result
        $("#commandReturn").modal('show')
        break
      case "error":
        alertC("The server reported an error: " + message.message)
        break
      case "handshake":
        setTimeout(() => {
          if (connClosed === true) {
            return
          }
          if (message.requiresAuth === true) {
            alertN()
            $("#password").modal("show")
          } else {
            client.send(JSON.stringify({messageType: "fetch"}))
            app.currentMenu = "control"
            setTimeout(() => $("#commands").show(), 200)
          }
        }, 100)
        break
      case "auth":
        if (message.state === true) {
          alertN()
          $("#password").modal("hide")
          client.send(JSON.stringify({messageType: "fetch"}))
          app.currentMenu = "control"
          setTimeout(() => $("#commands").show(), 200)
        } else {
          alertC("Your password is incorrect, please try again.")
        }
        break
      default:
        client.send(JSON.stringify({messageType: "error", message: "MESSAGE_TYPE_INVALID"}))
        break
    }
  })
  client.on("close", (code, res, evt)=> {
    app.currentMenu = "connect"
    connClosed = true
    alertC("Connection Closed: " + res)
  })
}

function disconnect() {
  client.close(1000)
  setStorage("lastConnected", null)
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

function cancelPassForm() {
  client.close(4003)
  setTimeout(() => {alertN()}, 200)
  $("#password").modal("hide")
}

function handlePassForm() {
  var password = app.promptLink
  client.send(JSON.stringify({messageType: "auth", password}))
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
    commandCtx: "",
    promptLink: ""
  },
  methods: {connect, disconnect, executeCommand, handleArgForm, cancelPassForm, handlePassForm}
})

if (readStorage("lastConnected") !== null && readStorage("lastConnected") !== "") {
  connect(readStorage("lastConnected"))
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