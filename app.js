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
         console.log(`\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${testPath}\x1b[0m`)
       }
       
       console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    
    if (/^add\s+\w+/.test(answer)) {
       const value = answer.replace(/^add\s+/, '');
       const testPath = path.join(currentPath, value);

       try {
          await fs.access(testPath);
          console.log(`File \x1b[31m${value}\x1b[0m already exist`)
       } catch (error) {
          try {
            await fs.open(testPath, 'w');
            console.log('\n' + `File ${value} created`);
          } catch (error) {
            console.log(`\x1b[31mOperation failed\x1b[0m!, can't create file \x1b[31m${value}\x1b[0m`)
          }
       }
       
       console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^mkdir\s+\w+/.test(answer)) {
       const value = answer.replace(/^mkdir\s+/, '');
       const testPath = path.join(currentPath, value);

       try {
          await fs.access(testPath);
          console.log(`Directory \x1b[31m${value}\x1b[0m already exist`)
       } catch (error) {
          try {
            await fs.mkdir(testPath);
            console.log('\n' + `Directory ${value} created`);
          } catch (error) {
            console.log(`\x1b[31mOperation failed\x1b[0m!, can't create folder \x1b[31m${value}\x1b[0m`)
          }
       }
       
       console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^rn\s+\w+/.test(answer)) {
      if (/(?<=rn)(\s+\w+\.\w+\s*){2}$/.test(answer)) {
        const value = answer.match(/(?<=\s+)\w+\.\w+(?=\s*)/g);
        const oldPath = path.join(currentPath, value[0]);
        const newPath = path.join(currentPath, value[1]);
  
        try {
           await fs.access(oldPath);
           await fs.rename(oldPath, newPath);
           console.log('\n' + `File ${value[0]} renamed to ${value[1]}`);
        } catch (error) {
            console.log(`\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`);
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^copy\s+\w+/.test(answer)) {
      if (/(?<=copy)(\s+\w+\.\w+\s*){2}$/.test(answer)) {
        const value = answer.match(/(?<=\s+)\w+\.\w+(?=\s*)/g);
        const oldPath = path.join(currentPath, value[0]);
        const newPath = path.join(currentPath, value[1]);
  
        try {
            const file = await fs.open(oldPath);
            const stream = file.createReadStream();
            const newFile = await fs.open(newPath, 'wx');
            const newStream = newFile.createWriteStream();
            await pipeline(stream, newStream);
            console.log('\n' + `File ${value[0]} copied to ${value[1]}`);
        } catch (error) {
            console.log(`\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`);
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^mv\s+\w+/.test(answer)) {
      if (/(?<=mv)(\s+\w+\.\w+\s*){2}$/.test(answer)) {
        const value = answer.match(/(?<=\s+)\w+\.\w+(?=\s*)/g);
        const oldPath = path.join(currentPath, value[0]);
        const newPath = path.join(currentPath, value[1]);
  
        try {
            const file = await fs.open(oldPath);
            const stream = file.createReadStream();
            const newFile = await fs.open(newPath, 'wx');
            const newStream = newFile.createWriteStream();
            await pipeline(stream, newStream);
            await fs.rm(oldPath);
            console.log('\n' + `File ${value[0]} moved to ${value[1]}`);
        } catch (error) {
            console.log(`\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`);
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^rm\s+\w+/.test(answer)) {
      if (/(?<=rm)(\s+\w+\.\w+\s*)$/.test(answer)) {
        const value = answer.match(/(?<=\s+)\w+\.\w+(?=\s*)/g);
        const filePath = path.join(currentPath, value[0]);
  
        try {
            await fs.access(filePath);
            await fs.rm(filePath);
            console.log('\n' + `File ${value[0]} removed`);
        } catch (error) {
            console.log(`\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`);
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }
  })

  
  rl.on('SIGINT', () => {
    console.log(`\nThank you for using File Manager, \x1b[34m${args.username}\x1b[0m!, goodbye!`);
    rl.close();
  })
})();