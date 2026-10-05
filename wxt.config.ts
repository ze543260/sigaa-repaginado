import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser }) => ({
    name: 'SIGAA Repaginado',
    description: 'Projeto pessoal e não oficial: uma interface nova para o SIGAA da UNIFEI.',
    web_accessible_resources: [
      { resources: ['fonts/*.woff2'], matches: ['*://sigaa.unifei.edu.br/*', '*://sigadmin.unifei.edu.br/*'] },
    ],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'sigaa-v2@extensao',
          strict_min_version: '142.0',
          data_collection_permissions: { required: ['none'] },
        },
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
  }),
});
