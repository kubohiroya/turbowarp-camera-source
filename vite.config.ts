import {defineConfig} from 'vite';
import {extensionManifestPlugin} from '@kubohiroya/turbowarp-extension-manifest';
import {turboWarpExtension} from '@kubohiroya/vite-plugin-turbowarp-extension';
import definitions from './src/block-definitions.json' with { type: 'json' };
import {extensionConfig} from './src/config.js';

export default defineConfig({
  plugins: [
    turboWarpExtension({
      id: extensionConfig.id,
      name: extensionConfig.name,
      description: extensionConfig.description,
      author: extensionConfig.author,
      license: extensionConfig.license,
      fileName: `${extensionConfig.slug}.js`
    }),
    extensionManifestPlugin({
      id: extensionConfig.id,
      definitions
    }),
    {
      name: 'stable-generated-region-comments',
      enforce: 'post',
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type === 'chunk') {
            // Editor packages belong to the host GUI, never to standalone camera playback.
            const editorDependency = Object.keys(output.modules).find(id =>
              /(?:^|\/)node_modules\/(?:.*\/)?(?:@kubohiroya\/turbowarp-extension-data-editor|ajv|ajv-formats|yaml|react|react-dom|@rjsf\/[^/]+)(?:\/|$)/u.test(id));
            if (editorDependency) this.error(`Camera runtime includes an editor dependency: ${editorDependency}`);
            output.code = output.code.replace(/^[ \t]*\/\/#(?:end)?region\b[^\r\n]*(?:\r?\n|$)/gmu, '');
          }
        }
      }
    }
  ]
});
