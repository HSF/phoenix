const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

if (!fs.existsSync('package.json')) {
  console.log(
    'Unable to run script.\nUse `yarn gen-api-docs` from directory containing package.json.'
  );
  process.exit(1);
}

// IMPORTANT: The directory for exec commands is `./packages/phoenix-event-display` and for Node.js functions is `./packages/phoenix-event-display/scripts`

// Constants
const DOCS_NAME = 'Phoenix API Docs';

// Run from project directory containing package.json
const COMPODOC_GEN =
  'yarn compodoc -p configs/compodoc.conf.json -n "' +
  DOCS_NAME +
  '" -d ../../docs/api-docs' +
  ' --customLogo ../phoenix-ng/projects/phoenix-app/src/assets/images/logo-text.svg' +
  ' --customFavicon ../phoenix-ng/projects/phoenix-app/src/favicon.ico';

console.log('Running command: %s', COMPODOC_GEN);

// Run command for generating docs using compodoc
exec(COMPODOC_GEN, (err, stdout, stderr) => {
  if (err) {
    console.log('Unable to run exec command:\n%s', err);
    process.exit(1);
  }
  console.log('%s', stdout);
  console.log(stderr);

  // Remove logo from generated README in API docs index.html
  replaceInFile(
    path.resolve(__dirname, '../../../docs/api-docs/index.html'),
    '<p.*logo-text.svg.*p>',
    ''
  );
});

// HELPER FUNCTIONS

// Replace in a single file
function replaceInFile(filePath, toReplace, replaceWith) {
  fs.readFile(filePath, 'utf-8', (err, fileData) => {
    if (err) console.log('Error reading file %s', filePath);
    else {
      const replaceData = fileData.replace(
        new RegExp(toReplace, 'g'),
        replaceWith
      );
      fs.writeFile(filePath, replaceData, 'utf-8', (err) => {
        if (err) console.log('Could not write to file ' + filePath);
        else {
          console.log('Successfully replaced in file %s', filePath);
        }
      });
    }
  });
}
