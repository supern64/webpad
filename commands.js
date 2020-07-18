// WebPad Server Commands

function say(arguments) {
	console.log(arguments.message)
	return true
}

function helloWorld() {
	console.log("Hello World")
	return "Hello World"
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
	},
	{
		name: "helloWorld2",
		friendlyName: "Say Hello World No.2",
		description: "Hello World 2!",
		function: helloWorld
	}
]

const commandList = commands.map((r) => r.name)

module.exports = {commands, commandList}