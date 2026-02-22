
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as cp from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';

// Mock factories need to be hoisted and return the mock structure
vi.mock('node:child_process', () => {
    return {
        spawn: vi.fn(),
        exec: vi.fn(),
        execSync: vi.fn(),
    };
});

vi.mock('node:fs', () => {
    const mockFs = {
        realpathSync: vi.fn((p) => p),
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => ''),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        resolve: vi.fn(),
        promises: {
            readFile: vi.fn(),
        },
        constants: {},
    };
    return {
        ...mockFs,
        default: mockFs,
    };
});

vi.mock('node:os', () => {
    const mockOs = {
        platform: vi.fn(() => 'linux'),
        tmpdir: vi.fn(() => '/tmp'),
        homedir: vi.fn(() => '/home/user'),
        userInfo: vi.fn(),
        release: vi.fn(() => '1.0.0'),
        type: vi.fn(() => 'Linux'),
    };
    return {
        ...mockOs,
        default: mockOs,
    };
});

vi.mock('@google/gemini-cli-core', () => ({
  Config: class {},
}));

// Import subject under test AFTER mocks
import { start_sandbox } from './sandbox.js';

describe('sandbox security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    process.env.GEMINI_SANDBOX_PROXY_COMMAND = 'echo proxy';

    // Setup default mock behaviors (redundant if factory provides defaults, but good for clarity)
    vi.mocked(os.platform).mockReturnValue('linux');
    vi.mocked(os.tmpdir).mockReturnValue('/tmp');
    vi.mocked(os.homedir).mockReturnValue('/home/user');

    vi.mocked(fs.realpathSync).mockImplementation((p) => p.toString());
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');
    // @ts-ignore
    vi.mocked(fs.resolve).mockImplementation((...args) => args.join('/'));

    // Mock exec for curl check
    // @ts-ignore
    vi.mocked(cp.exec).mockImplementation(((cmd: string, options: any, cb: any) => {
        if (typeof options === 'function') {
            cb = options;
            options = {};
        }
        // Succeed immediately
        if (cb) cb(null, 'ok', '');
        return {
            unref: vi.fn(),
            on: vi.fn(),
        } as any;
    }) as any);

    vi.mocked(cp.execSync).mockReturnValue('mock-output');

    // Mock process.exit to prevent crashing test runner
    // @ts-ignore
    vi.spyOn(process, 'exit').mockImplementation((code) => {
        console.log(`process.exit(${code}) called`);
        throw new Error(`process.exit(${code}) called`);
    });

    // Mock spawn process logic
    const baseMockProcess = {
        on: vi.fn(),
        stdout: {
            on: vi.fn().mockImplementation((event, cb) => {
                 if (event === 'data') cb('image-id');
                 return baseMockProcess.stdout;
            }),
            removeListener: vi.fn(),
        },
        stderr: {
            on: vi.fn(),
            removeListener: vi.fn(),
        },
        pid: 123,
        kill: vi.fn(),
        connected: false,
        disconnect: vi.fn(),
        ref: vi.fn(),
        unref: vi.fn(),
    };

    // Correctly type the mock implementation to handle overloading
    vi.mocked(cp.spawn).mockImplementation((cmd, args, opts) => {
        // Handle the case where args might be passed as readonly string[]
        // or where options is the second argument
        let argumentsList: string[] = [];
        let options: any = {};

        if (Array.isArray(args)) {
            argumentsList = args as string[];
            options = opts || {};
        } else if (typeof args === 'object' && args !== null) {
            options = args;
        }

        const cmdStr = String(cmd);
        const argsStr = JSON.stringify(argumentsList);

        // Proxy command uses --name gemini-cli-sandbox-proxy
        const isProxy = cmdStr.includes('--name gemini-cli-sandbox-proxy') ||
                        argsStr.includes('gemini-cli-sandbox-proxy');

        const isSandbox = !isProxy && cmdStr === 'docker' && argsStr.includes('run');

        const mockP = { ...baseMockProcess };
        mockP.on = vi.fn();

        // Need to recreate stdout object to allow chaining for specific instances
        mockP.stdout = {
            on: vi.fn().mockImplementation((event, cb) => {
                 if (event === 'data') cb('image-id');
                 return mockP.stdout;
            }),
            removeListener: vi.fn()
        };

        if (isProxy) {
            mockP.on.mockImplementation((event, cb) => {
                 return mockP;
            });
            mockP.pid = 999;
        } else if (isSandbox) {
             mockP.on.mockImplementation((event, cb) => {
                if (event === 'close') {
                    // Use setImmediate to allow test to await process
                    setImmediate(() => cb(0, null));
                }
                return mockP;
            });
             mockP.pid = 456;
        } else {
             // Image checks etc should exit
             mockP.on.mockImplementation((event, cb) => {
                if (event === 'close') {
                    setImmediate(() => cb(0, null));
                }
                return mockP;
            });
             mockP.pid = 123;
        }

        return mockP as any;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('prevents command injection by using array arguments and shell: false', async () => {
    const config = {
      command: 'docker',
      image: 'test-image',
    };

    try {
      await start_sandbox(config as any, [], {} as any);
    } catch (e) {
      // Ignore errors from process.exit mock
    }

    const spawnCalls = vi.mocked(cp.spawn).mock.calls;

    // Check for the secure call
    const secureCall = spawnCalls.find(call => {
        const cmd = call[0];
        const args = call[1];
        const options = call[2];

        // Ensure we are looking at the proxy container start command
        if (cmd !== 'docker' || !Array.isArray(args)) return false;

        const isProxy = args.includes('--name') &&
                        args.includes('gemini-cli-sandbox-proxy');

        if (!isProxy) return false;

        // CRITICAL CHECK: shell must NOT be true
        const isShellTrue = (options as any)?.shell === true;
        return !isShellTrue;
    });

    expect(secureCall).toBeDefined();

    // Verify args are correct
    const args = secureCall![1] as string[];
    expect(args).toContain('run');

    // Verify process.cwd() is passed properly
    const cwdArgIndex = args.findIndex(arg => arg === '-v');
    // It might be -v or --volume
    if (cwdArgIndex > -1) {
        const volumeArg = args[cwdArgIndex+1];
        // Just check that it contains the cwd path
        expect(volumeArg).toContain(process.cwd());
    }
  });

  it('correctly handles user flags and proxy arguments', async () => {
    process.env.SANDBOX_SET_UID_GID = 'true';
    const config = {
      command: 'docker',
      image: 'test-image',
    };

    // We need to mock id -u and id -g for userFlag construction
    // @ts-ignore
    vi.mocked(cp.execSync).mockImplementation((cmd) => {
        if (String(cmd).includes('id -u')) return '1000';
        if (String(cmd).includes('id -g')) return '1000';
        return 'mock-output';
    });

    try {
      await start_sandbox(config as any, [], {} as any);
    } catch (e) {
       // Ignore exit mock
    }

    const spawnCalls = vi.mocked(cp.spawn).mock.calls;

    // Check for proxy call
    const proxyCall = spawnCalls.find(call => {
        const cmd = call[0];
        const args = call[1];
        if (cmd === 'docker' && Array.isArray(args)) {
             return args.includes('gemini-cli-sandbox-proxy');
        }
        return false;
    });

    expect(proxyCall).toBeDefined();
    const args = proxyCall![1] as string[];

    // Verify user flag is present
    expect(args).toContain('--user');
    expect(args).toContain('1000:1000');

    // Verify proxy command args are present (from GEMINI_SANDBOX_PROXY_COMMAND='echo proxy')
    expect(args).toContain('echo');
    expect(args).toContain('proxy');
  });
});
