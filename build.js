import { build } from 'esbuild';

['content', 'background', 'popup'].forEach(name =>
  build({
    entryPoints: [`src/${name}.ts`],
    bundle: true,
    outfile: `dist/${name}.bundle.js`,
    sourcemap: true,
    minify: true,
    platform: 'browser'
  }).catch(() => process.exit(1))
); 