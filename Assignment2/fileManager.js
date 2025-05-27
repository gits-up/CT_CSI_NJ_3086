const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function showMenu() {
  console.log(`
==== FILE MANAGER MENU ====
1. Create File
2. Read File
3. Delete File
4. Exit
  `);
  rl.question("Enter your choice: ", handleChoice);
}

function handleChoice(choice) {
  switch (choice.trim()) {
    case "1":
      rl.question("Enter filename: ", (filename) => {
        rl.question("Enter content: ", (content) => {
          const filePath = path.join(__dirname, filename);
          fs.writeFile(filePath, content, (err) => {
            if (err) console.log("Error creating file.");
            else console.log(`File "${filename}" created.`);
            showMenu();
          });
        });
      });
      break;

    case "2":
      rl.question("Enter filename to read: ", (filename) => {
        const filePath = path.join(__dirname, filename);
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) console.log("Error reading file.");
          else console.log(`\nContent of "${filename}":\n${data}`);
          showMenu();
        });
      });
      break;

    case "3":
      rl.question("Enter filename to delete: ", (filename) => {
        const filePath = path.join(__dirname, filename);
        fs.unlink(filePath, (err) => {
          if (err) console.log("Error deleting file.");
          else console.log(`File "${filename}" deleted.`);
          showMenu();
        });
      });
      break;

    case "4":
      console.log("Exiting...");
      rl.close();
      break;

    default:
      console.log("Invalid choice. Try again.");
      showMenu();
  }
}

showMenu();
