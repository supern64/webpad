# WebPad

WebPad is a program for controlling your computer via other devices to perform certain actions.  
Define your commands in commands.js, and start writing anything!  
Client at [http://webpadclient.glitch.me](http://webpadclient.glitch.me).  
The client source code will be included here as well in the client folder.  

## Setting it up

1. Install Node.js from [nodejs.org](https://nodejs.org/en/).  
2. Open the command prompt in the folder you downloaded and type `npm install` to install the dependencies, then run `npm start`.  
3. You will be asked to configure the server. You can set up the port and the password (optional).  
4. You can launch the server by hitting "Enter" on the "Launch WebPad Server" option.  
5. Whenever you want to start it again, you do not need to do `npm install`, only `npm start`. You can go into the "Settings" option as well to reconfigure the options.

## Writing Custom Commands

There are 2 types of custom commands. Addons and user commands.  
Addons are intended to be distributed to others. They support configuration via the server launcher.  
User commands are only intended to be used by the user who wrote it.  
User commands are simpler in terms of writing.  

### General command writing

Writing custom commands for this program is just like writing regular functions, but with extra steps.  
First off, you'll need to define the metadata for the function for the program to call it correctly.  
This involves putting information in the "commands" array and exporting it. Properties used are:  
- name: The internal command name used by the program. [REQUIRED]
- friendlyName: The name that the user sees on the client. [REQUIRED]
- description: The description of the command, user only sees when hovering over it.
- function: The Javascript function assigned to this command. If arguments are defined, it will be called with an argument object with the internal name as the key. [REQUIRED]
- arguments: The list of arguments that are going to be used. Properties used for the arguments are:
  - name: The internal argument name. [REQUIRED]
  - friendlyName: The name that the user sees. [REQUIRED]
  - required: A boolean indicating if the field is required.  
After that, you can start writing your function. The only 2 quirks you need to know are...
- Arguments are passed **as one object, not seperately** and uses the internal name for the key.
- The return value matters. If a function returns false, it is considered unsuccessful and will display an error. If it returns true, it will be considered successful, and if it returns anything else, that return value will be displayed on the client.


### User commands

User commands are written in commands.js. They follow the exact same format as general command writing.

### Addons

Addons support extra features. They still follow the same format as general command writing, but...
- You need to set a `manifest.json` file.
- You'd have to `require("../../file.js")` to access the File API.
- You'd have to run `file.addonInit("YourAddonName")` to set the proper context. This name should be the same as in the manifest file.

#### Manifest file format

The manifest file must be named `manifest.json`. The following are the possible properties.
- name: The addon's name. [REQUIRED]
- version: The version of the addon. [REQUIRED]
- description: The addon's description. Will be shown on the config page.
- main: The entrypoint/main file of the addon which the server will load. [REQUIRED]
- configs: An array of configuration options. Possible options are:
  - name: The internal name of the option. [REQUIRED]
  - friendlyName: The name that the user will see when picking the option. [REQUIRED]
  - type: The inquirer.js type of the prompt. The only ones sure to be compatible are `input`, `number` and `password`. [REQUIRED]
  - default: The default value of the option.

#### File API

These functions are intended to be used by the client. Before using these functions, you must run `file.addonInit("YourAddonName")`.

##### `file.readStoredData()` -> Object

Returns the stored data in the database.

##### `file.writeToData(data)`

Writes data to database.

##### `file.readStoredConfig()` -> Object

Returns the stored configuration with the internal name being the key.


