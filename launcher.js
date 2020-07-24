// WebPad launcher

const inquirer = require("inquirer")
const lowdb = require("lowdb")
const fs = require("fs")
const FileSync = require('lowdb/adapters/FileSync')

const package = require("./package.json")
const db = lowdb(new FileSync("database.json"))

let initialSetupComplete = false;
let initialSettings;

db.defaults({addonStorage: []}).write()

if (!fs.existsSync("./addons")) {
	fs.mkdirSync("./addons")
}

if (!fs.existsSync("settings.json")) {
	initialSettings = {port: 8222, password: null}
	fs.writeFileSync("settings.json", JSON.stringify(initialSettings))
} else {
	initialSetupComplete = true;
	initialSettings = JSON.parse(fs.readFileSync("settings.json"))
}

const initQuestions = [
	{
		name: 'port',
		message: "What port do you want WebPad to use? (You must also configure this in the client.)",
		type: 'number',
		default: 8222
	},
	{
		name: 'password',
		type: 'password',
		message: "What password do you want to use? (Optional)"
	}
]

function valuePrompt(values, callback) {
	// accepts name, friendlyName, type, default, currentValue
	let choicesArray = []
	let results = {}
	values.forEach(r => {
		results[r.name] = r.currentValue
	})
	for (i of values) {
		choicesArray.push({name: i.friendlyName + ": " + (i.type === "password" ? "*".repeat(i.currentValue.length) : i.currentValue), value: i.name})
	}
	choicesArray.push({name: "Exit", value: "exit"})
	inquirer.prompt([{
		name: "value",
		message: "What would you like to change?",
		type: "list",
		choices: choicesArray
	}]).then(answers => {
		let value = answers.value
		if (value === "exit") {
			if (callback != null) {
				callback(results)
				return
			}
		}
		value = values.find(r => {return r.name === value})
		inquirer.prompt([{
			name: "value",
			message: "Please type your new value for the " + value.friendlyName.toLowerCase() + ":",
			type: value.type,
			default: (value.default ? value.default : value.currentValue)
		}]).then(answers => {
			results[value.name] = answers.value
			value.currentValue = answers.value
			valuePrompt(values, callback)
		})
	})
}
console.log("WebPad Launcher v" + package.version + "\n")

function main() {
	inquirer.prompt([{
		name: 'action',
		message: "What would you like to do?",
		type: "list",
		choices: [{name: "Launch WebPad Server", value: "launch"}, new inquirer.Separator(), {name: "Configure addons", value: "configAddon"}, {name: "Settings", value: "settings"}, {name: "Exit", value: "exit"}]
	}]).then(answers => {
		switch(answers.action) {
			case 'launch':
				require('./index.js')
				break
			case 'configAddon':
				break
			case 'settings':
				valuePrompt([
					{name: "port", friendlyName: "Port", type: "number", currentValue: initialSettings.port},
					{name: "password", friendlyName: "Password", type: "password", currentValue: initialSettings.password}
				], (answers) => {
					initialSettings.port = answers.port
					initialSettings.password = (answers.password === '' || answers.password == null) ? null : answers.password
					fs.writeFileSync("settings.json", JSON.stringify(initialSettings))
					main()
				})
				break
			case 'exit':
				process.exit()
				break
		}
	})
}

if (initialSetupComplete === false) {
	console.log("It seems you haven't set up WebPad yet. Please answer these questions.")
	inquirer.prompt(initQuestions).then(answers => {
		initialSettings.port = answers.port
		initialSettings.password = (answers.password === '' || answers.password == null) ? null : answers.password
		fs.writeFileSync("settings.json", JSON.stringify(initialSettings))

		console.log("\nInitial setup complete!")
		main()
	})
} else { main() }
