# War Rooms Y - Testing Guide

## Test Suite Overview

This project uses a comprehensive testing strategy with three complementary approaches:

### 1. Storybook - Component Documentation & Visual Testing
- **Location**: `.storybook/`, `packages/**/*.stories.tsx`
- **Purpose**: Component development, documentation, and visual regression testing
- **Run**: `npm run storybook`
- **Build**: `npm run build-storybook`

**Example Stories**:
- `Login.stories.tsx` - Login component variations
- `ChatRoom.stories.tsx` - Chat room with mock data

**Integration**: Ready for Chromatic visual regression testing

### 2. Jest - Unit & Integration Tests
- **Location**: `packages/**/(__tests__|*.test.ts|*.spec.ts)`
- **Purpose**: Business logic, state management, utility functions
- **Run**: `npm test`
- **Coverage**: `npm run test:coverage`

**Example Tests**:
- `packages/state/src/__tests__/messages.test.ts` - Message state management tests

**Configuration**:
- Uses `ts-jest` for TypeScript support
- `jsdom` environment for React components
- Coverage thresholds: 70% (branches, functions, lines, statements)

### 3. Playwright - End-to-End Tests
- **Location**: `e2e/`
- **Purpose**: Full user workflows, integration testing
- **Run**: `npm run test:e2e`
- **UI Mode**: `npm run test:e2e -- --ui`

**Example Tests**:
- `e2e/login.spec.ts` - Login flow testing
- `e2e/chat.spec.ts` - Chat functionality testing

**Configuration**:
- Automatically starts dev server
- Uses Chromium by default
- Generates HTML report

## Running Tests

### All Tests
```bash
npm test              # Run Jest unit tests
npm run test:e2e      # Run Playwright e2e tests
npm run storybook     # Start Storybook dev server
```

### Watch Mode
```bash
npm run test:watch    # Jest watch mode for development
```

### Coverage
```bash
npm run test:coverage # Generate coverage report
```

## Writing Tests

### Unit Tests (Jest)
```typescript
// packages/mypackage/src/__tests__/mymodule.test.ts
import { myFunction } from '../mymodule';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Storybook Stories
```typescript
// packages/chat-ui/src/components/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

### E2E Tests (Playwright)
```typescript
// e2e/feature.spec.ts
import { test, expect } from '@playwright/test';

test('should perform action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Expected text')).toBeVisible();
});
```

## CI/CD Integration

### Future: GitHub Actions
```yaml
- Run Jest unit tests on PR
- Run Playwright e2e tests on PR
- Build Storybook and deploy to GitHub Pages
- Run Chromatic visual regression tests
```

## Best Practices

1. **Unit Tests**: Focus on business logic, pure functions, state management
2. **Storybook**: Document component variations, edge cases, loading states
3. **E2E Tests**: Cover critical user journeys, happy paths, error states
4. **Coverage**: Maintain 70%+ code coverage for production code
5. **Mock Data**: Use realistic fixtures from `packages/backend-mock/src/fixtures.ts`

## Debugging

### Jest
```bash
npm test -- --watch              # Watch mode
npm test -- path/to/test.ts      # Run specific test
npm test -- --verbose            # Verbose output
```

### Playwright
```bash
npm run test:e2e -- --ui         # UI mode (recommended)
npm run test:e2e -- --debug      # Debug mode
npm run test:e2e -- --headed     # Show browser
```

### Storybook
```bash
npm run storybook                # Auto-reloads on changes
```

## Mock Backend

All tests use the mock backend from `@war-rooms/backend-mock`:
- Simulates XMPP protocol
- Uses localStorage for persistence
- Pre-seeded with realistic data
- Configurable latency for testing loading states

See `packages/backend-mock/src/fixtures.ts` for available mock data.
