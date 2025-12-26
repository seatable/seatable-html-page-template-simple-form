const JSZip = require('./jszip.min');
const fs = require('fs');
const path = require('path');
const process = require('process');

// rm -rf page-zip && mkdir page-zip
fs.rmSync('page-zip', { recursive: true, force: true });
fs.mkdirSync('page-zip', { recursive: true });

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

function addFilesToZip(currentPath, zipFolder) {
  const files = fs.readdirSync(currentPath);

  files.forEach(file => {
    const filePath = path.join(currentPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // add subs
      const subFolder = zipFolder.folder(file);
      addFilesToZip(filePath, subFolder);
    } else {
      // add file
      const fileData = fs.readFileSync(filePath);
      zipFolder.file(file, fileData);
    }
  });
}

const buildPath = resolveApp('dist');
const zip = new JSZip();
addFilesToZip(buildPath, zip);

// page info
const pageInfoContent = JSON.parse(getFileContent('info.json'));

zip.generateAsync({ type: 'nodebuffer' }).then(function (content) {
  let zip = `${pageInfoContent.name}-${pageInfoContent.version}.zip`;
  fs.writeFile(pageZipPath + '/' + zip, content, function (err) {
    if (err) {
      console.log('Create' + zip + ' failed');
      console.log(err);
      return;
    }
    console.log('Create' + zip + ' successful');
  });
});
