import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
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
    if (answer.trim() === '.exit') {
        console.log(`\nThank you for using File Manager, \x1b[34m${args.username}\x1b[0m!, goodbye!`);
        rl.close();
    }

    if (answer.trim() === 'up') {
      currentPath = (/^\w:\\{1}(?!\s+|\S+)/.test(currentPath) || /^\/(?!\s+|\S+)/.test(currentPath)) ? currentPath : path.dirname(currentPath);

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (answer.trim() === 'ls') {
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

    if (/^cd\s+\w+/.test(answer.trim())) {
       const value = answer.trim().replace(/^cd\s+/, '');
       const testPath = path.join(currentPath, value);

       try {
         await fs.access(testPath);
         currentPath = testPath;
       } catch (error) {
         console.log(`\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${testPath}\x1b[0m`)
       }
       
       console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }
  })
  
  rl.on('SIGINT', () => {
    console.log(`\nThank you for using File Manager, \x1b[34m${args.username}\x1b[0m!, goodbye!`);
    rl.close();
  })
})();