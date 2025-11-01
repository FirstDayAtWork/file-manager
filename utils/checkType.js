export const checkType = (dirent) => {
  if (dirent.isFile()) return 'file';
  if (dirent.isDirectory()) return 'directory';
  if (dirent.isSymbolicLink()) return 'symlink';
  if (dirent.isSocket()) return 'socket';
  return 'Unknown type';
};