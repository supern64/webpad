// WebPad Server Commands

function say(arguments) {
	console.log(arguments.message)
	return arguments.message
}

const commands = [
	{
		name: "say",
		friendlyName: "Say Anything",
		description: "Say something on the console",
		function: say,
		arguments: [{name: "message", friendlyName: "Message", required: true}]
	}
]

const commandList = commands.map((r) => r.name)

module.exports = {commands, commandList}