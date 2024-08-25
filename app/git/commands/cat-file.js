const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

class CatFileCommand {
  constructor(flag, commitSHA) {
    this.flag = flag;
    this.commitSHA = commitSHA;
  }

  execute() {
    const flag = this.flag;
    const commitSHA = this.commitSHA;

    switch (flag) {
      case "-p":
        const folder = commitSHA.slice(0, 2);
        const file = commitSHA.slice(2);

        const completePath = path.join(".git", "objects", folder, file);

        if (!fs.existsSync(completePath)) {
          console.log(`File not found: ${completePath}`);
          return;
        }

        try {
          const fileContents = fs.readFileSync(completePath);
          const outputBuffer = zlib.inflateSync(fileContents);

          const output = outputBuffer.toString().split("\x00")[1];
          process.stdout.write(output);
        } catch (err) {
          console.error(`Error reading or decompressing file: ${err.message}`);
        }

        break;

      default:
        console.log(`Unknown flag: ${flag}`);
    }
  }
}

module.exports = CatFileCommand;
