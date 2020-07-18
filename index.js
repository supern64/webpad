// WebPad Server

// import stuff and init websocket
const WebSocket = require("ws");
const commands = require("./commands.js")
const wss = new WebSocket.Server({host: "0.0.0.0", port: 8222});

//set up server to receive and parse message
console.log("WebPad Server is running on port 8222")
wss.on("connection", function connection(ws) {
	ws.send(JSON.stringify({messageType: "handshake"}))
	ws.on("message", function incoming(message) {
		parseMessage(message, ws);
	});
});

function parseMessage(message, ws) {
	// for invalid JSON
	try {
		message = JSON.parse(message)
	} catch(e) {
		ws.send(JSON.stringify({messageType: "error", message: "INVALID_JSON"}))
		return
	}
	console.log(message)
	// message types
	switch(message.messageType) {
		case "error":
			console.log("Client reported an error to the server: " + message.message)
			break
		case "command":
			if (!message.command) {
				ws.send(JSON.stringify({messageType: "error", message: "NO_COMMAND_SPECIFIED"}))
			} else {
				executeCommand(ws, message.command, message.arguments)
			}
			break
		case "fetch": 
			ws.send(JSON.stringify({messageType: "success", commands: commands.commands.map((r) => { return {name: r.name, friendlyName: r.friendlyName, description: r.description, arguments: r.arguments}})}))
			break
		default:
			ws.send(JSON.stringify({messageType: "error", message: "MESSAGE_TYPE_INVALID"}))
			break
	}
}

function executeCommand(ws, command, arguments) {
	// if command exists
	let res;
	if (!commands.commandList.includes(command)) {
		ws.send(JSON.stringify({messageType: "error", message: "COMMAND_DOES_NOT_EXIST"}))
		return
	}
	executedCommand = commands.commands.find((r) => { return r.name === command})
	// if there are args
	if (executedCommand.arguments) {
		// check if required args are there
		if (!arguments) {
			arguments = {}
		}
		for (i of executedCommand.arguments.map((r) => {return r.name})) {
			if (!Object.keys(arguments).includes(i) && executedCommand.arguments.find((r) => { return r.name === i}).required) {
				ws.send(JSON.stringify({messageType: "error", message: "REQUIRED_ARGUMENT_MISSING", context: i}))
				return
			}
		}
		// execute command
		res = executedCommand.function(arguments)
	} else {
		res = executedCommand.function()
	}
	// return the result if it exists, otherwise, determine success status using true and false flag from res
	if (res === true) {
		ws.send(JSON.stringify({messageType: "success", context: executedCommand.name}))
	} else if (res === false) {
		ws.send(JSON.stringify({messageType: "error", message: "COMMAND_ERROR", context: executedCommand.name}))
	} else {
		ws.send(JSON.stringify({messageType: "undetermined", context: executedCommand.name, result: res}))
	}
}