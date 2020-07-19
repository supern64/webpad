# WebPad

WebPad is a program for controlling your computer via other devices to perform certain actions.  
Define your commands in commands.js, and start writing anything!  
Client at [http://webpadclient.glitch.me](http://webpadclient.glitch.me).  
The client source code will be included here as well in the client folder.  

## Setting it up

1. Install Node.js from [nodejs.org](https://nodejs.org/en/).  
2. Open the command prompt in the folder you downloaded and type `npm install` to install the dependencies, then run `npm start`.  
3. Go to the client link (or open the file up on your browser) and connect to the server with the IP Address. (No need to include the header and the port.) After that, you'll be able to see the actions you've set up in your code and use them as well.  
4. Whenever you want to start it again, you do not need to do `npm install`, only `npm start`.

## Writing Custom Commands

Commands are defined seperate of the main server's files. They are located in commands.js.  
Writing custom commands for this program, is just like writing regular functions, but with extra steps.  
First off, you'll need to define the metadata for the function for the program to call it correctly.  
This involves putting information in the "commands" array. Properties used are:  
- name: The internal command name used by the program. [REQUIRED]
- friendlyName: The name that the user sees on the client. [REQUIRED]
- description: The description of the command, user only sees when hovering over it.
- function: The Javascript function assigned to this command. [REQUIRED]
- arguments: The list of arguments that are going to be used. Properties used for the arguments are:
  - name: The internal argument name. [REQUIRED]
  - friendlyName: The name that the user sees. [REQUIRED]
  - required: A boolean indicating if the field is required.  
  
After that, you can start writing your function. The only 2 quirks you need to know are...
- Arguments are passed **as one object, not seperately** and uses the internal name for the key.
- The return value matters. If a function returns false, it is considered unsuccessful and will display an error. If it returns true, it will be considered successful, and if it returns anything else, that return value will be displayed on the client.
