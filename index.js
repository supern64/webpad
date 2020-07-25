// WebPad Server

// import stuff and init websocket
const WebSocket = require("ws");
const flatten = require("lodash.flatten")
const file = require("./file.js")

const config = require("./settings.json")
const package = require("./package.json")

// setting up commands
let commands = {commands: [], commandList: []}
const userCommands = require("./commands.js")

commands.commands.push(userCommands.commands)
commands.commandList.push(userCommands.commandList)

const manifest = file.getAddonManifest()
for (i of manifest) {
	if (i.enabled === false) {
		continue
	}
	var addon = require(i.filePath)
	commands.commands.push(addon.commands)
	commands.commandList.push(addon.commandList)
}

commands.commands = flatten(commands.commands)
commands.commandList = flatten(commands.commandList)

const wss = new WebSocket.Server({host: "0.0.0.0", port: config.port});

//set up server to receive and parse message
console.log("WebPad Server " + package.version + " is running on port " + config.port)

wss.on("connection", function connection(ws) {
	console.log("A client connected.")
	if (config.password == null) {
		ws.authorized = true
	} else {
		ws.authorized = false
	}
	ws.handshakeSent = false
	ws.send(JSON.stringify({messageType: "handshake", requiresAuth: !ws.authorized}))
	setTimeout(() => {
		if (ws.handshakeSent === false) {
			ws.close(4001, "No handshake was sent from the client.")
		}
	}, 10000)
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
	// message types
	switch(message.messageType) {
		case "error":
			console.log("Client reported an error to the server: " + message.message)
			break
		case "auth":
			if (ws.authorized === true) {
				ws.send(JSON.stringify({messageType: "error", message: "ALREADY_PASSED_AUTHENTICATION"}))
				return
			}
			if (message.password == null) {
				ws.send(JSON.stringify({messageType: "auth", state: false}))
				return
			}
			if (message.password === config.password) {
				ws.send(JSON.stringify({messageType: "auth", state: true}))
				ws.authorized = true
			} else {
				ws.send(JSON.stringify({messageType: "auth", state: false}))
			}
			break
		case "handshake":
			if (message.apiLevel !== package.apiLevel) {
				ws.close(4000, "WebPad Version is incompatible (API level " + message.apiLevel + " and " + package.apiLevel + ").")
			}
			ws.handshakeSent = true
			break
		case "command":
			if (!ws.authorized) {
				ws.send(JSON.stringify({messageType: "error", message: "AUTHENTICATION_NOT_PASSED"}))
				return
			}
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