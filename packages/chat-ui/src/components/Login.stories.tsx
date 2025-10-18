import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'jotai';
import { Login } from './Login';
import { BackendProvider } from '../providers/BackendProvider';
import { ThemeProvider } from '../providers/ThemeProvider';

const meta = {
  title: 'Components/Login',
  component: Login,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <Provider>
        <BackendProvider>
          <ThemeProvider>
            <Story />
          </ThemeProvider>
        </BackendProvider>
      </Provider>
    ),
  ],
} satisfies Meta<typeof Login>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const button = canvas.querySelector('button[type="submit"]') as HTMLButtonElement;
    const usernameInput = canvas.querySelector('input[type="text"]') as HTMLInputElement;

    // Clear username to trigger error
    usernameInput.value = '';
    button.click();
  },
};
