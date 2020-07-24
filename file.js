// WebPad File API Module
// serverInit, setConfig and readConfig are meant to be used by the server.

const lowdb = require("lowdb")
const FileSync = require('lowdb/adapters/FileSync')
const fs = require("fs")

const db = lowdb(new FileSync("database.json"))

let addonData = db.get("addonStorage")

let addonManifest = []
let clientInitialized = false

let context = {}

function serverInit() {
	let folders = fs.readdirSync("./addons")
	folders = folders.map(f => {return "./addons/" + f})
	folders = folders.filter(f => {return fs.existsSync(f) && fs.lstatSync(f).isDirectory();})

	for (i of folders) {
		try {
			var manifest = fs.readFileSync(i + "/manifest.json")
			manifest = JSON.parse(manifest)
		} catch(e) {
			console.log("[ADDONS] Addon at " + i + " cannot be read: Manifest file not found or has invalid JSON.")
			continue
		}
		if (!manifest.name || !manifest.version || !manifest.main) {
			console.log("[ADDONS] Addon at " + i + " cannot be read: Required properties (name, version, main) not found in manifest file.")
			continue
		}
		let addon = addonData.find({name: addonName}).value()
		let enabled = true
		if (addon === null) {
			addonData.push({name: manifest.name, enabled: true, config: {}, data: {}})
		} else {
			enabled = addon.enabled
		}
		addonManifest.push({name: manifest.name, version: manifest.version, main: manifest.main, description: (null || manifest.description), filePath: i, enabled, configs: (manifest.configs ? manifest.configs : {})})
	}
	addonData.write()
	return addonManifest
}

function addonInit() {
	let manifest = fs.readFileSync(__dirname + "/manifest.json")
	manifest = JSON.parse(manifest)
	context.name = manifest.name
	let addon = addonData.find({name: manifest.name})
	context.addon = addon
	clientInitialized = true
}

function readStoredData() {
	if (clientInitialized === false) { throw new Error("Please run addonInit() first.")}
	return context.addon.value().data
}

function readStoredConfig() {
	if (clientInitialized === false) { throw new Error("Please run addonInit() first.")}
	return context.addon.value().config
}

function setConfig(addonName, data) {
	let addon = addonData.find({name: addonName})
	addon.config = data
	addon.write()
}

function readConfig(addonName) {
	let addon = addonData.find({name: addonName}).value()
	return addon.config
}