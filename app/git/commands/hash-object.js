const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");

class HashObjectCommand {
  constructor(flag, filePath) {
    this.flag = flag;
    this.filePath = filePath;
  }

  execute() {
    const filePath = path.resolve(this.filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Can't open '${this.filePath}' for reading: No such file or directory`
      );
    }

    let fileContents = fs.readFileSync(filePath, "utf8");
    fileContents = fileContents.replace(/\r\n/g, "\n");
    const fileBuffer = Buffer.from(fileContents, "utf8");

    const fileLength = fileBuffer.length;

    const header = Buffer.from(`blob ${fileLength}\0`, "utf8");
    const blob = Buffer.concat([header, fileBuffer]);
    const hash = crypto.createHash("sha1").update(blob).digest("hex");

    if (this.flag && this.flag === "-w") {
      const folder = hash.slice(0, 2);
      const file = hash.slice(2);
      const completeFolderPath = path.join(
        process.cwd(),
        ".git",
        "objects",
        folder
      );

      if (!fs.existsSync(completeFolderPath)) {
        fs.mkdirSync(completeFolderPath, { recursive: true });
      }

      const compressedData = zlib.deflateSync(blob);
      const completeFilePath = path.join(completeFolderPath, file);

      fs.writeFileSync(completeFilePath, compressedData);
    }

    process.stdout.write(hash + "\n");
  }
}

module.exports = HashObjectCommand;
