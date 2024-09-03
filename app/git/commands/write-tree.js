const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");

function writeFileBlob(currentPath) {
  const contents = fs.readFileSync(currentPath);
  const len = contents.length;

  const header = `blob ${len}\0`;
  const blob = Buffer.concat([Buffer.from(header), contents]);

  const hash = crypto.createHash("sha1").update(blob).digest("hex");

  const folder = hash.slice(0, 2); // Use only the first two characters
  const file = hash.slice(2); // Remaining part of the hash

  const completeFolderPath = path.join(
    process.cwd(),
    ".git",
    "objects",
    folder
  );

  // Create the parent folder if it doesn't exist
  if (!fs.existsSync(completeFolderPath)) {
    fs.mkdirSync(completeFolderPath, { recursive: true });
  }

  // Path to write the file
  const filePath = path.join(completeFolderPath, file);

  const compressedData = zlib.deflateSync(blob);
  fs.writeFileSync(filePath, compressedData);

  return hash;
}

class handleWriteTreeCommand {
  constructor() {}

  execute() {
    function recursiveCreateTree(basePath) {
      const dirContents = fs.readdirSync(basePath);
      const result = [];

      for (const dirContent of dirContents) {
        if (dirContent === ".git") continue; // Skip the .git directory itself

        const currentPath = path.join(basePath, dirContent);
        const stat = fs.statSync(currentPath);

        if (stat.isDirectory()) {
          const sha = recursiveCreateTree(currentPath);
          if (sha) {
            result.push({
              mode: "40000", // Mode for directories
              basename: dirContent,
              sha,
            });
          }
        } else if (stat.isFile()) {
          const sha = writeFileBlob(currentPath);
          result.push({
            mode: "100644", // Mode for files
            basename: dirContent,
            sha,
          });
        }
      }

      if (dirContents.length === 0 || result.length === 0) return null;

      const treeData = result.reduce((acc, current) => {
        const { mode, basename, sha } = current;
        return Buffer.concat([
          acc,
          Buffer.from(`${mode} ${basename}\0`), // Correctly format the mode and basename with null terminator
          Buffer.from(sha, "hex"), // Convert SHA to raw binary using 'hex' encoding
        ]);
      }, Buffer.alloc(0));

      const tree = Buffer.concat([
        Buffer.from(`tree ${treeData.length}\0`),
        treeData,
      ]);

      const hash = crypto.createHash("sha1").update(tree).digest("hex");

      const folder = hash.slice(0, 2);
      const file = hash.slice(2);

      const treeFolderPath = path.join(
        process.cwd(),
        ".git",
        "objects",
        folder
      );

      if (!fs.existsSync(treeFolderPath)) {
        fs.mkdirSync(treeFolderPath, { recursive: true });
      }

      const compressed = zlib.deflateSync(tree);
      fs.writeFileSync(path.join(treeFolderPath, file), compressed);

      return hash;
    }

    const sha = recursiveCreateTree(process.cwd());
    process.stdout.write(sha); // Write the SHA-1 hash to stdout
  }
}

module.exports = handleWriteTreeCommand;
