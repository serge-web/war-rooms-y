/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../packages/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/**/*.stories.mdx',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
      propFilter: () => true,
    },
  },
};

export default config;
