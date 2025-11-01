import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { pipeline } from 'stream/promises';
import os from 'node:os';
import { parseArgs } from './utils/parseArgs.js';
import { checkType } from './utils/checkType.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


;(() => {
  let currentPath = os.homedir();
  const args = parseArgs();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`Welcome to the File Manager, \x1b[34m${args.username ?? ''}\x1b[0m!`);
  console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);

  rl.on('line', async (answer) => {
    answer = answer.trim();
    if (answer === '.exit') {
        console.log(`\nThank you for using File Manager, \x1b[34m${args.username}\x1b[0m!, goodbye!`);
        rl.close();
    }

    if (answer === 'up') {
      currentPath = (/^\w:\\{1}(?!\s+|\S+)/.test(currentPath) || /^\/(?!\s+|\S+)/.test(currentPath)) ? currentPath : path.dirname(currentPath);

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (answer === 'ls') {
       try {
          const currentDir = await fs.readdir(currentPath, { withFileTypes: true });
          const array = currentDir.reduce((a, b) => {
            const object = {
              name: b.name.slice(0, 20),
              type: checkType(b)
            }
            return [...a, object];
          }, []);

          console.table(array);
       } catch (error) {
          console.log(`\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${currentPath}\x1b[0m`)
       }
      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^cd\s+\w+/.test(answer)) {
       const value = answer.replace(/^cd\s+/, '');
       const testPath = path.join(currentPath, value);

       try {
         await fs.access(testPath);
         currentPath = testPath;
       } catch (error) {
         console.log(`\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${testPath}\x1b[0m`)
       }
       
       console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^cat\s+\w+/.test(answer)) {
       const value = answer.replace(/^cat\s+/, '');
       const testPath = path.join(currentPath, value);

       try {
         const file = await fs.open(testPath);
         const stream = file.createReadStream();

         await pipeline(stream, process.stdout, { end: false })
         console.log('\n' + 'Success')
         
       } catch (error) {
         console.log(`\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${testPath}\x1b[0m`, error)
       }
       
       console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }
  })
  
  rl.on('SIGINT', () => {
    console.log(`\nThank you for using File Manager, \x1b[34m${args.username}\x1b[0m!, goodbye!`);
    rl.close();
  })
})();