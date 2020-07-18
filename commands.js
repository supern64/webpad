// WebPad Server Commands

function say(arguments) {
	console.log(arguments.message)
	return true
}

function helloWorld() {
	console.log("Hello World")
	return true
}

const commands = [
	{
		name: "say",
		friendlyName: "Say Anything",
		description: "Say something on the console",
		function: say,
		arguments: [{name: "message", friendlyName: "Message", required: true}]
	},
	{
		name: "helloWorld",
		friendlyName: "Say Hello World",
		description: "Hello World!",
		function: helloWorld
	}
]

const commandList = ["say", "helloWorld"]

module.exports = {commands, commandList}