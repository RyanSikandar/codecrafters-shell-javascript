const { exit, chdir } = require("process");
const readline = require("readline");
const fs = require("fs");
const { execFileSync } = require("child_process");

//We are creating an interface for the user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

const home = process.env.HOME;

//using prompt to display the prompt message
rl.prompt();

//Special Characters 
const specialCharacters = ['\\', '"', "$","\n"];

//Function to handle Echo command
function handleEcho(input) {
  //contains the input
  let args = [];
  //Contains the current word 
  let currentArg = '';

  let inSingleQuotes = false;

  let inDoubleQuotes = false;

  for (let i = 0; i < input.length; i++) {
    //Handling each character in the input
    const char = input[i];

    if (char === '"' && !inSingleQuotes) {

      inDoubleQuotes = !inDoubleQuotes;

    } else if (char === "'" && !inDoubleQuotes) {

      inSingleQuotes = !inSingleQuotes;

    } else if (char === ' ' && !inSingleQuotes && !inDoubleQuotes) {
      //If we approach the end of word we treat it as a space
      if (currentArg.length > 0) {
        args.push(currentArg);

        currentArg = '';

      }

    } else {
      //For quoted backslashes
      if (char === '\\' && (inSingleQuotes || inDoubleQuotes)) {
        if (inDoubleQuotes && specialCharacters.includes(input[i + 1])) {
          currentArg += input[i + 1];
          i++;
        }
        else if (input[i + 1] === '\\') {
          currentArg += '\\';
          i++;
        }
        else {
          currentArg += char;
        }

      }
      //For unquoted backslashes
      else if (char === '\\' && !(inSingleQuotes || inDoubleQuotes)) {
       //Preserve the literal value of the next character
        currentArg += input[i + 1];
        i++;
      }
      else {
        //If the character is not a space or single or double quote, we add it to the current words
        currentArg += char;
      }}

    }

    //If the current word is not empty, we add it to the args array

    if (currentArg.length > 0) {

      args.push(currentArg);

    }

    let cmd = args[0];

    //Remove the first word from the array
    args.shift();

    console.log(args.join(' '));
  }

  //Function to change the directory
  function changeDirectory(path) {
    try {
      if (path === `~`) {
        chdir(home);
      }
      else { chdir(path); }

    } catch (err) {
      console.error(`cd: ${path}: No such file or directory`);
    }
  }

  //Function to execute the executable file (eg: ls, cat, etc)
  function executeFile(input) {
    const [command, ...args] = input.match(/'[^']*'|"[^"]*"|\S+/g)?.map(arg => arg.replace(/^['"]|['"]$/g, '')) || [];

    const path = process.env.PATH.split(":");
    let valid = false;

    if (command === "cd") {
      changeDirectory(args[0]);
      return;
    }

    path.forEach((path) => {
      const commandPath = path + "/" + command;
      if (!valid && fs.existsSync(commandPath) && fs.statSync(commandPath).isFile()) {
        valid = true;
        try {
          execFileSync(command, args, { encoding: 'utf-8', stdio: 'inherit' });
        } catch (err) {
          console.error(`Error executing ${command}:`, err.message);
        }
      }
    });
    if (!valid) {
      console.log(`${command}: command not found`);
    }
  }


  //Function to find the path of the executable file in the PATH
  const findPath = (type) => {
    const paths = process.env.PATH.split(":");
    let found = false;
    paths.forEach((path) => {
      const commandPath = path + "/" + type;
      if (!found && fs.existsSync(commandPath)) {
        console.log(`${type} is ${commandPath}`);
        found = true;
      }
    });
    if (!found) {
      console.log(`${type}: not found`);
    }
  }

  //Function to check the type of the command and print the result
  const types = ['echo', 'exit', 'type', 'pwd', 'cd'];
  const checkType = (input) => {
    const type = input.split(" ")[1];
    if (types.includes(type)) {
      console.log(`${type} is a shell builtin`);
      rl.prompt();
    } else {
      findPath(type);
      rl.prompt();
    }
  }

  //using the on method to listen for the line event
  rl.on("line", (input) => {
    if (input.startsWith("type")) {
      checkType(input);
    }
    else if (input.startsWith("pwd")) {
      //Prints the current working directory for the process
      console.log(process.cwd());
      rl.prompt();
    }
    else if (input.startsWith("exit")) {
      //If the input starts with exit, the program will exit
      exit(0)

    }
    //Implementing the Echo command
    else if (input.includes("echo")) {
      //The echo command will print the input without the echo    
      handleEcho(input);
      rl.prompt();
    }
    else {
      //Executes the file input that we have given the shell. Detects if it is a wrong input as well.
      executeFile(input);
      rl.prompt();
    }
  })
