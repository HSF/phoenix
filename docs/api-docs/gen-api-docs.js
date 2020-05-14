const fs = require('fs');
const { exec } = require('child_process');

if (!fs.existsSync('package.json')) {
    console.log('Unable to run script.\nUse `npm run-script gen-api-docs` from directory containing package.json.');
    process.exit(1);
}

// Constants
const DOCS_NAME = 'Phoenix API Docs';
const REPLACE_DIRS = [
    './',
    'components/',
    'injectables/',
    'interfaces/',
    'modules/',
    'pipes/'
];
const TO_REPLACE = [
    ['class\=\"navbar-brand\"\>' + DOCS_NAME,
    'class="navbar-brand"><img src="{backtrace}src/assets/images/logo-text.svg" alt="Phoenix Logo" class="img-responsive">']
    ,
    ['\.\/src\/',
    '{backtrace}src/']
];

// Run from project directory containing package.json
const COMPODOC_GEN = "compodoc -p src/tsconfig.app.json -n \"" + DOCS_NAME + "\" -d api-docs";

console.log('Running command: %s', COMPODOC_GEN);

// Run command for generating docs using compodoc
exec(COMPODOC_GEN, (err, stdout, stderr) => {
    if (err) {
        console.log('Unable to run exec command:\n%s', err);
        process.exit(1);
    }
    console.log('%s', stdout);
    console.log(stderr);

    // Replace text of files in each directory
    REPLACE_DIRS.forEach((dir) => {
        console.log('Replacing logo in directory: %s', dir);

        const backtrace = dir === './' ? '../' : '../../';
        TO_REPLACE[0][1] = TO_REPLACE[0][1].replace(/{backtrace}/g, backtrace);
        TO_REPLACE[1][1] = TO_REPLACE[1][1].replace(/{backtrace}/g, backtrace);
        replaceInDir(dir, TO_REPLACE);
    });
});

// Replaces text of files in a given directory
function replaceInDir(dir, toReplace) {
    fs.readdir(dir, (err, files) => {
        if (err) console.log('Could not read directory %s', dir);
        else {
            files
                .filter((filename) => filename.endsWith('.html'))
                .forEach((filename) => {
                    fs.readFile(dir + filename, 'utf-8', (err, fileData) => {
                        if (err) console.log('Could not read file ' + filename + ' in directory %s', dir);
                        else {
                            let replacedFileData;
                            toReplace.forEach((replaceArr) => {
                                replacedFileData = fileData.replace(new RegExp(replaceArr[0], 'g'), replaceArr[1]);
                            });
                            fs.writeFile(dir + filename,
                                replacedFileData,
                                'utf-8',
                                (err) => {
                                    if (err) console.log('Could not read file ' + filename + ' in directory %s', dir);
                                }
                            );
                        }
                    });
                });
        }
    });
}