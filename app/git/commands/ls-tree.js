const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

class LSTreeCommand {
  constructor(flag, sha) {
    this.flag = flag;
    this.sha = sha;
  }

  execute() {
    const flag = this.flag;
    const sha = this.sha;

    const folder = sha.slice(0, 2);
    const file = sha.slice(2);

    const folderPath = path.join(process.cwd(), ".git", "objects", folder);
    const filePath = path.join(folderPath, file);

    // Debugging output
    console.log(`Looking for object in: ${filePath}`);

    if (!fs.existsSync(folderPath) || !fs.existsSync(filePath)) {
      throw new Error(`Not a valid object name ${sha}`);
    }

    const fileContent = fs.readFileSync(filePath);
    const outputBuffer = zlib.inflateSync(fileContent);

    // Debugging output
    console.log(`Inflated object data: ${outputBuffer.toString()}`);

    const output = outputBuffer.toString();

    if (output.startsWith("tree")) {
      // Extract the entries
      const entries = output.split("\0").slice(1);

      // Debugging output
      console.log(`Tree entries found: ${entries.length}`);

      entries.forEach((entry) => {
        const [modeAndName, sha] = entry.split(" ");
        if (modeAndName && sha) {
          const name = modeAndName.split("\t")[1]; // Properly split to get name
          if (name) {
            // Check if name exists
            console.log(name.trim());
          } else {
            // Debugging output
            console.log("Empty or invalid name found");
          }
        }
      });
    } else if (output.startsWith("commit")) {
      // If it's a commit object, extract the tree SHA
      const lines = output.split("\n");
      const treeLine = lines.find((line) => line.startsWith("tree"));
      const treeSha = treeLine.split(" ")[1];

      // Debugging output
      console.log(`Tree SHA found: ${treeSha}`);

      // Recursively call ls-tree with the tree SHA
      const treeCommand = new LSTreeCommand(flag, treeSha);
      treeCommand.execute();
    } else {
      throw new Error(`Unsupported object type in ${sha}`);
    }
  }
}

module.exports = LSTreeCommand;
