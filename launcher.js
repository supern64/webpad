// WebPad launcher

const inquirer = require("inquirer")
const lowdb = require("lowdb")
const fs = require("fs")
const file = require("./file.js")
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
		var behindText;
		if (i.currentValue == null) {
			behindText = "Value not set"
		} else if (i.type === "password") {
			behindText = "*".repeat(i.currentValue.length)
		} else {
			behindText = i.currentValue
		}
		choicesArray.push({name: i.friendlyName + ": " + behindText, value: i.name})
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

let manifest = file.serverInit()

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
				if (manifest.length === 0) {
					console.log("No addons found!")
					main()
				}
				addonConfigPage()
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

function addonConfigPage() {
	let addonList = []
	manifest.forEach((r) => {
		addonList.push({value: r.name, name: r.name + (r.description ? ": " + r.description : "")})
	})
	addonList.push({value: "exit", name: "Exit"})
	inquirer.prompt([{
		name: 'addonToConfigure',
		message: "Which addon would you like to configure?",
		type: "list",
		choices: addonList
	}]).then(answers => {
		let addon = answers.addonToConfigure
		let addonName = answers.addonToConfigure
		if (addon === "exit") {
			main()
		} else {
			function configurePrompt(addonName) {
				addon = manifest.find((r) => r.name == addonName)
				console.log(addon.name + " " + addon.version + (manifest.description ? ": " + manifest.description : ""))
				console.log("Located at " + addon.filePath)
				let choices = [{value: "toggleEnable", name: (addon.enabled === true ? "Disable" : "Enable") + " this addon"}]
				if (addon.configs != null) {
					choices.push({value: "configureValues", name: "Configure values"})
				}
				choices.push({value: "exit", name: "Exit"})
				inquirer.prompt([{
					name: 'toConfigure',
					message: "What would you like to do?",
					type: "list",
					choices
				}]).then(answers => {
					let toConfigure = answers.toConfigure
					if (toConfigure === "exit") {
						addonConfigPage()
					} else if (toConfigure === "toggleEnable") {
						addon.enabled = !addon.enabled
						file.setEnabled(addon.name, addon.enabled)
						configurePrompt(addonName)
					} else if (toConfigure === "configureValues") {
						let configForm = addon.configs
						let defaultConfigObject;
						let currentValues = file.readConfig(addon.name)
						if (currentValues == null) {
							for (i of configForm) {
								defaultConfigObject[i.name] = (null || i.default)
							}
							file.setConfig(addon.name, defaultConfigObject)
							currentValues = defaultConfigObject
						}
						let promptValues = [] // name friendlyName type default currentValue
						for (i of configForm) {
							promptValues.push({name: i.name, friendlyName: i.friendlyName, type: i.type, default: i.default, currentValue: currentValues[i.name]})
						}
						valuePrompt(promptValues, (answers) => {
							file.setConfig(addon.name, answers)
							configurePrompt(addonName)
						})
					}
				})
			}
			configurePrompt(addonName)
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
