const fs = require("fs");
const path = require("path");

const GitClient = require("./git/client");

const {
  CatFileCommand,
  HashObjectCommand,
  LSTreeCommand,
  WriteTreeCommand,
  CommitTreeCommand,
} = require("./git/commands");
const gitClient = new GitClient();

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const command = process.argv[2];
switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    handleCatFileCommand();
    break;
  case "hash-object":
    handleHashObjectCommand();
    break;
  case "ls-tree":
    handleLsTreeCommand();
    break;
  case "write-tree":
    handleWriteTreeCommand();
    break;
  case "commit-tree":
    handleCommitTreeCommand();
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(
    path.join(process.cwd(), ".git", "HEAD"),
    "ref: refs/heads/main\n"
  );
  console.log("Initialized git directory");
}

function handleCatFileCommand() {
  const flag = process.argv[3];
  const commitSHA = process.argv[4];

  const command = new CatFileCommand(flag, commitSHA);
  gitClient.run(command);
}

function handleHashObjectCommand() {
  // Retrieve flag and filePath
  let flag = process.argv[3];
  let filePath = process.argv[4];

  // Check if the flag starts with "-" indicating it's a flag
  if (flag && !flag.startsWith("-")) {
    // If the first argument isn't a flag, consider it as a filePath, and flag is null
    filePath = flag;
    flag = null;
  }

  // Create and run the HashObjectCommand
  const command = new HashObjectCommand(flag, filePath);
  gitClient.run(command);
}

function handleLsTreeCommand() {
  let flag = process.argv[3];
  let sha = process.argv[4];

  if (!sha && flag === "--name-only") return;

  if (!sha) {
    sha = flag;
    flag = null;
  }

  const command = new LSTreeCommand(flag, sha); // Ensure this is the correct class name
  gitClient.run(command);
}

function handleWriteTreeCommand() {
  const command = new WriteTreeCommand();
  gitClient.run(command);
}

function handleCommitTreeCommand() {
  const tree = process.argv[3];
  const commitSHA = process.argv[5];
  const commitMessage = process.argv[7];

  const command = new CommitTreeCommand(tree, commitSHA, commitMessage);
  gitClient.run(command);
}
