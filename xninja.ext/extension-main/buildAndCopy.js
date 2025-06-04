const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Function to run a shell command
function runCommand(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        reject(stderr);
      }
      console.log(`Stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Function to copy file
function copyFile(source, target) {
  const targetFile = target;

  // Create target folder if it doesn't exist
  const targetFolder = path.dirname(target);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  fs.copyFileSync(source, targetFile);
  console.log(`File copied from ${source} to ${target}`);
}

function copyFileOrDirectory(source, target) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    copyDirectory(source, target);
  } else {
    copyFile(source, target);
  }
}

// Function to copy all files from one directory to another
function copyDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filesToCopy = fs.readdirSync(sourceDir);
  filesToCopy.forEach((file) => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    copyFileOrDirectory(sourcePath, targetPath); // Use updated function
  });

  console.log(`All files copied from ${sourceDir} to ${targetDir}`);
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Removed file: ${filePath}`);
  }
}

(async function buildProjects() {
  try {
    console.log("Building game-client...");
    await runCommand("npm run build", { cwd: path.join(__dirname, "../game-client") });

    // Copy single file
    const sourceFile = path.join(__dirname, "../game-client/dist/assets/entry.js");
    const targetFile = path.join(__dirname, "./public/assets/entry.js");
    copyFile(sourceFile, targetFile);

    // Copy all files in images directory
    // const sourceDir = path.join(__dirname, "../game-client/dist/assets/images");
    // const targetDir = path.join(__dirname, "./public/assets/images");
    // copyDirectory(sourceDir, targetDir);

    console.log("Building extension-main...");
    await runCommand("npm run build", { cwd: __dirname });
    console.log("Removing inject-main.dev.js from output...");
    const outputFile = path.join(__dirname, "./out/assets/inject-main.dev.js");
    removeFile(outputFile);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();