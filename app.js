import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { pipeline } from "stream/promises";
import os from "node:os";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { parseArgs } from "./utils/parseArgs.js";
import { checkType } from "./utils/checkType.js";
import { commands } from "./utils/commands.js";

(() => {
  let currentPath = os.homedir();
  const args = parseArgs();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(
    `Welcome to the File Manager, \x1b[34m${args.username ?? ""}\x1b[0m!`
  );
  console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);

  rl.setPrompt("Wanna see commands? y/n\n");
  rl.prompt();

  rl.on("line", async (answer) => {
    answer = answer.trim();

    if (answer === "y") {
      console.table(commands);
      rl.setPrompt("");
    }

    if (answer === "n") {
      rl.setPrompt("");
    }

    if (answer === ".exit") {
      console.log(
        `\nThank you for using File Manager, \x1b[34m${args.username}\x1b[0m!, goodbye!`
      );
      rl.close();
    }

    if (answer === "up") {
      currentPath =
        /^\w:\\{1}(?!\s+|\S+)/.test(currentPath) ||
        /^\/(?!\s+|\S+)/.test(currentPath)
          ? currentPath
          : path.dirname(currentPath);

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (answer === "ls") {
      try {
        const currentDir = await fs.readdir(currentPath, {
          withFileTypes: true,
        });
        const array = currentDir
          .reduce((a, b) => {
            const object = {
              name: b.name.slice(0, 20),
              type: checkType(b),
            };
            return [...a, object];
          }, [])
          .sort((a, b) =>
            a.type.toLowerCase().localeCompare(b.type.toLowerCase())
          );

        console.table(array);
      } catch (error) {
        console.log(
          `\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${currentPath}\x1b[0m`
        );
      }
      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^cd\s+\w+/.test(answer)) {
      const value = answer.replace(/^cd\s+/, "");
      const testPath = path.join(currentPath, value);

      try {
        await fs.access(testPath);
        currentPath = testPath;
      } catch (error) {
        console.log(
          `\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${testPath}\x1b[0m`
        );
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^cat\s+\w+/.test(answer)) {
      const value = answer.replace(/^cat\s+/, "");
      const testPath = path.join(currentPath, value);

      try {
        const file = await fs.open(testPath);
        const stream = file.createReadStream();

        await pipeline(stream, process.stdout, { end: false });
        console.log("\n" + "Success");
      } catch (error) {
        console.log(
          `\x1b[31mOperation failed\x1b[0m!, can't access \x1b[31m${testPath}\x1b[0m`
        );
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^add\s+\w+/.test(answer)) {
      const value = answer.replace(/^add\s+/, "");
      const testPath = path.join(currentPath, value);

      try {
        await fs.access(testPath);
        console.log(`File \x1b[31m${value}\x1b[0m already exist`);
      } catch (error) {
        try {
          await fs.open(testPath, "w");
          console.log("\n" + `File ${value} created`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, can't create file \x1b[31m${value}\x1b[0m`
          );
        }
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^mkdir\s+\w+/.test(answer)) {
      const value = answer.replace(/^mkdir\s+/, "");
      const testPath = path.join(currentPath, value);

      try {
        await fs.access(testPath);
        console.log(`Directory \x1b[31m${value}\x1b[0m already exist`);
      } catch (error) {
        try {
          await fs.mkdir(testPath);
          console.log("\n" + `Directory ${value} created`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, can't create folder \x1b[31m${value}\x1b[0m`
          );
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
          console.log("\n" + `File ${value[0]} renamed to ${value[1]}`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`
          );
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
          const newFile = await fs.open(newPath, "wx");
          const newStream = newFile.createWriteStream();
          await pipeline(stream, newStream);
          console.log("\n" + `File ${value[0]} copied to ${value[1]}`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`
          );
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
          const newFile = await fs.open(newPath, "wx");
          const newStream = newFile.createWriteStream();
          await pipeline(stream, newStream);
          await fs.rm(oldPath);
          console.log("\n" + `File ${value[0]} moved to ${value[1]}`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`
          );
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
          console.log("\n" + `File ${value[0]} removed`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`
          );
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^os\s+--EOL\s*/.test(answer)) {
      console.log("\n" + JSON.stringify(os.EOL));
      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^os\s+--cpus\s*/.test(answer)) {
      console.log(os.cpus());
      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^os\s+--homedir\s*/.test(answer)) {
      console.log(`\n\x1b[32m${os.homedir()}\x1b[0m`);
      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^os\s+--username\s*/.test(answer)) {
      console.log(`\n\x1b[32m${os.userInfo().username}\x1b[0m`);
      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^os\s+--architecture\s*/.test(answer)) {
      console.log(`\n\x1b[32m${os.arch()}\x1b[0m`);
      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^hash\s+\w+/.test(answer)) {
      if (/(?<=hash)(\s+\w+\.\w+\s*)$/.test(answer)) {
        const value = answer.match(/(?<=\s+)\w+\.\w+(?=\s*)/);
        const filePath = path.join(currentPath, value[0]);

        try {
          const file = await fs.open(filePath);
          const hash = createHash("sha256");
          const stream = file.createReadStream();

          stream.on("data", (chunk) => {
            hash.update(chunk);
          });

          stream.on("end", () => {
            console.log(`\n\x1b[32m${hash.digest("hex")}\x1b[0m`);
          });
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`
          );
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^compress\s+\w+/.test(answer)) {
      if (/(?<=compress)(\s+\w+\.\w+\s*)$/.test(answer)) {
        const value = answer.match(/(?<=\s+)\w+\.\w+(?=\s*)/);
        const filePath = path.join(currentPath, value[0]);
        const newPath = path.join(currentPath, `${value[0]}.br`);

        try {
          const file = await fs.open(filePath);
          const streamRead = file.createReadStream();
          const fileNew = await fs.open(newPath, "w+");
          const streamWrite = fileNew.createWriteStream();
          const br = zlib.createBrotliCompress();

          await pipeline(streamRead, br, streamWrite);
          await fs.rm(filePath);
          console.log(`\nCompress ${filePath} to ${newPath}`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`
          );
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }

    if (/^decompress\s+\w+/.test(answer)) {
      if (/(?<=decompress)(\s+\w+(\.\w+)+\s*)$/.test(answer)) {
        const value = answer.match(/(?<=\s+)\w+(\.\w+)+(?=\s*)/);
        const filePath = path.join(currentPath, value[0]);
        const newPath = path.join(
          currentPath,
          `${value[0].replace(/\.br$/, "")}`
        );

        try {
          const file = await fs.open(filePath);
          const streamRead = file.createReadStream();
          const fileNew = await fs.open(newPath, "w+");
          const streamWrite = fileNew.createWriteStream();
          const br = zlib.createBrotliDecompress();

          await pipeline(streamRead, br, streamWrite);
          await fs.rm(filePath);
          console.log(`\nDecompress ${filePath} to ${newPath}`);
        } catch (error) {
          console.log(
            `\x1b[31mOperation failed\x1b[0m!, file \x1b[31m${value[0]}\x1b[0m not exist`
          );
        }
      } else {
        console.log(`\n\x1b[33mInvalid Input\x1b[0m!`);
      }

      console.log(`\nYou are currently in \x1b[32m${currentPath}\x1b[0m`);
    }
  });

  rl.on("SIGINT", () => {
    console.log(
      `\nThank you for using File Manager, \x1b[34m${args.username}\x1b[0m!, goodbye!`
    );
    rl.close();
  });
})();
