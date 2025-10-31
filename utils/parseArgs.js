import process from 'process'

export const parseArgs = () => {
  return process.argv.slice(2).reduce((a, b) => {
    const key = (/(?<=--)\w+(?=\=.+)/).exec(b)[0];
    a[key] = b.replace(/^--\w+=/, '');
    return a;
  }, {})
};