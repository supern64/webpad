var client;

function connect() {
  try {
    client = new WSClient("ws://" + app.serverAddress + ":8222")
  } catch(e) {
    alertC("Connection Failed: " + e)
    return
  }
  client.on("open", (evt) => {
    app.isConnected = true
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

var app = new Vue({
  el: "#app",
  data: {
    isConnected: false,
    serverAddress: "",
    alertSent: false,
    alertMessage: "",
    commands: [],
    popupData: "",
    commandVars: [],
    commandCtx: ""
  },
  methods: {connect, executeCommand, handleArgForm}
})

function alertC(message) {
  app.alertSent = true;
  app.alertMessage = message;
}
function alertN() {
  app.alertSent = false;
  app.alertMessage = "";
}
