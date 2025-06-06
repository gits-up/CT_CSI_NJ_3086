const fs = require("fs").promises;
const path = require("path");

async function processFile() {
  const inputFile = path.join(__dirname, "input.txt");
  const outputFile = path.join(__dirname, "output.txt");

  try {
    const data = await fs.readFile(inputFile, "utf8");
    console.log("File Read Successfully:\n", data);

    const transformed = data.toUpperCase();

    await fs.writeFile(outputFile, transformed);
    console.log("File Written Successfully to output.txt");
  } catch (error) {
    console.error("Error during file processing:", error.message);
  }
}

processFile();
