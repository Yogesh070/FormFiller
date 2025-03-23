/**
 * Jest test setup for E2E testing
 */

// Increase the timeout for E2E tests
jest.setTimeout(30000);

// Mock chrome API if needed in test environment
if (typeof chrome === 'undefined') {
  (global as any).chrome = {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn()
      },
      getURL: jest.fn((path) => `chrome-extension://mock-extension-id/${path}`)
    },
    storage: {
      sync: {
        get: jest.fn(),
        set: jest.fn()
      }
    },
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn()
    },
    action: {
      onClicked: {
        addListener: jest.fn()
      }
    },
    contextMenus: {
      create: jest.fn(),
      onClicked: {
        addListener: jest.fn()
      }
    }
  };
}