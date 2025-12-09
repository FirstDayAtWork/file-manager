import process from "process";

const regex = /(?<=--)\w+(?=\=)/;

export const parseArgs = () => {
  const array = process.argv.slice(2);

  if (array.length === 0) return { username: "Anonymous" };

  return array.reduce((a, b) => {
    if (regex.test(b)) {
      const key = regex.exec(b)[0];
      const value = b.replace(/^--\w+=/, "").trim();
      a[key] = value || "Anonymous";
      return a;
    }
  }, {});
};
