import { compile, convertPath } from '@effector/router-paths';

const { build: buildFilePath } = compile('/files/:path*');
const filePath = buildFilePath({ path: ['docs', 'api'] });
const routePath = convertPath('/users/:id', 'express');

if (filePath !== routePath) {
  void filePath;
}
