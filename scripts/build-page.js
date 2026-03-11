import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import process from 'process';

/**
 * Get file content
 * @param  {string} overallPath full file path
 */
function getFileContent(overallPath) {
  // Specifying encoding returns a string, otherwise returns a Buffer
  let content = fs.readFileSync(overallPath, { encoding: 'utf-8' });
  return content;
}

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const pageZipPath = resolveApp('page-zip');

const addFilesToZip = (currentPath, zipFolder) => {
  if (!fs.existsSync(currentPath)) return;
  const files = fs.readdirSync(currentPath);

  files.forEach(file => {
    const filePath = path.join(currentPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const subFolder = zipFolder.folder(file);
      addFilesToZip(filePath, subFolder);
    } else {
      const fileData = fs.readFileSync(filePath);
      zipFolder.file(file, fileData);
    }
  });
};

const createZip = (sourceDir, zipName) => {
  const zip = new JSZip();
  addFilesToZip(sourceDir, zip);
  zip.generateAsync({ type: 'nodebuffer' }).then((content) => {
    fs.writeFile(path.join(pageZipPath, zipName), content, (err) => {
      if (err) {
        console.log(`Create ${zipName} failed`);
        console.log(err);
      } else {
        console.log(`Create ${zipName} successful`);
      }
    });
  });
};

const pageInfoContent = JSON.parse(getFileContent('package.json'));
const baseName = `${pageInfoContent.name}-${pageInfoContent.version}`;

createZip(resolveApp('dist/esm'), `${baseName}-user.zip`);
createZip(resolveApp('dist/admin'), `${baseName}-admin.zip`);
