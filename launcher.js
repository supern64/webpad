// WebPad launcher

const inquirer = require("inquirer")
const lowdb = require("lowdb")
const fs = require("fs")
const FileSync = require('lowdb/adapters/FileSync')

const package = require("./package.json")
const db = lowdb(new FileSync("database.json"))

let initialSetupComplete = false;
let initialSettings;

db.defaults({addonStorage: {}})

if (!fs.existsSync("settings.json")) {
	initialSettings = {port: 8222, password: null}
	fs.writeFileSync("settings.json", JSON.stringify(initialSettings))
} else {
	initialSetupComplete = true;
}

console.log("WebPad Launcher v" + package.version + "\n")

function main() {
	inquirer.prompt([{
		name: 'action',
		message: "What would you like to do?",
		type: "list",
		choices: [{name: "Launch WebPad Server", value: "launch"}, new inquirer.Separator(), {name: "Exit", value: "exit"}]
	}]).then(answers => {
		switch(answers.action) {
			case 'launch':
				require('./index.js')
				break
			case 'exit':
				process.exit()
				break
		}
	})
}

if (initialSetupComplete === false) {
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
	console.log("It seems you haven't set up WebPad yet. Please answer these questions.")
	inquirer.prompt(initQuestions).then(answers => {
		initialSettings.port = answers.port
		initialSettings.password = (answers.password === '' || answers.password == null) ? null : answers.password
		fs.writeFileSync("settings.json", JSON.stringify(initialSettings))

		console.log("\nInitial setup complete!")
		main()
	})
} else { main() }
