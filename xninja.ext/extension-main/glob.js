const fs = require("fs").promises;
const { glob } = require("glob");

async function replaceInFile(fileName) {
  const fileContent = await fs.readFile(fileName, "utf8");
  const updatedContent = fileContent.replace(/\/_next\//g, "/next/");
  await fs.writeFile(fileName, updatedContent, "utf8");
}

async function renameAndReplace() {
  // Rename _next directory to next
  await fs.rename("./out/_next", "./out/next");

  // Find all HTML, CSS, and JS files
  const files = await glob("./out/**/*.{html,css,js}");

  // Replace all instances of /_next/ with /next/ in each file
  await Promise.all(files.map(replaceInFile));
}

renameAndReplace().catch(console.error);
