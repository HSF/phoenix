const fs = require('fs');
const { exec } = require('child_process');

if (!fs.existsSync('package.json')) {
  console.log('Unable to run script.\nUse `npm run gen-api-docs` from directory containing package.json.');
  process.exit(1);
}

// Constants
const DOCS_NAME = 'Phoenix API Docs';

// Run from project directory containing package.json
const COMPODOC_GEN = 'compodoc -p src/compodoc.conf.json -n \"' + DOCS_NAME + '\" -d ../../docs/api-docs';

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
    './docs/api-docs/index.html',
    '<p.*logo-text.svg.*p>',
    ''
  );

  // Replace all text with logo
  replaceInFile(
    './docs/api-docs/js/menu-wc.js',
    DOCS_NAME,
    '<img data-src="images/logo-text.svg" class="img-responsive" data-type="compodoc-logo">'
  );

  // Copy icon and logo to API docs folder
  exec(
    'cp ./src/favicon.ico ./docs/api-docs/images/favicon.ico',
    (err) => {
      if (err) console.log(err);
      else {
        console.log('Copied favicon.ico');
      }
    }
  );
  exec(
    'cp ./src/assets/images/logo-text.svg ./docs/api-docs/images/logo-text.svg',
    (err) => {
      if (err) console.log(err);
      else {
        console.log('Copied logo-text.svg');
      }
    }
  );
});

// HELPER FUNCTIONS

// Replace in a single file
function replaceInFile(filePath, toReplace, replaceWith) {
  fs.readFile(filePath, 'utf-8', (err, fileData) => {
    if (err) console.log('Error reading file %s', filePath);
    else {
      const replaceData = fileData.replace(new RegExp(toReplace, 'g'), replaceWith);
      fs.writeFile(filePath, replaceData, 'utf-8', (err) => {
        if (err) console.log('Could not write to file ' + filePath);
        else {
          console.log('Successfully replaced in file %s', filePath);
        }
      });
    }
  });
}
