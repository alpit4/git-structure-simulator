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
    const headerEndIndex = output.indexOf("\0") + 1;
    const bodyBuffer = outputBuffer.slice(headerEndIndex);

    let index = 0;
    while (index < bodyBuffer.length) {
      // Read mode (up to the first space)
      let modeEnd = bodyBuffer.indexOf(0x20, index);
      let mode = bodyBuffer.slice(index, modeEnd).toString();
      index = modeEnd + 1;

      // Read name (up to the null byte)
      let nameEnd = bodyBuffer.indexOf(0x00, index);
      let name = bodyBuffer.slice(index, nameEnd).toString();
      index = nameEnd + 1;

      // Read the SHA (20 bytes binary data)
      let shaBinary = bodyBuffer.slice(index, index + 20);
      index += 20;

      if (mode && name) {
        console.log(name.trim());
      } else {
        console.log("Empty or invalid name found");
      }
    }
  }
}

module.exports = LSTreeCommand;
