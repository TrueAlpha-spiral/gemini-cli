/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { getInstallationInfo, PackageManager } from './installationInfo.js';
import { updateEventEmitter } from './updateEventEmitter.js';
import { UpdateObject } from '../ui/utils/updateCheck.js';
import { LoadedSettings } from '../config/settings.js';
import EventEmitter from 'node:events';
import { handleAutoUpdate } from './handleAutoUpdate.js';

vi.mock('./installationInfo.js', async () => {
  const actual = await vi.importActual('./installationInfo.js');
  return {
    ...actual,
    getInstallationInfo: vi.fn(),
  };
});

vi.mock('./updateEventEmitter.js', async () => {
  const actual = await vi.importActual('./updateEventEmitter.js');
  return {
    ...actual,
    updateEventEmitter: new EventEmitter(),
  };
});

interface MockChildProcess extends EventEmitter {
  stdin: EventEmitter & {
    write: Mock;
    end: Mock;
  };
  stdout: EventEmitter;
  stderr: EventEmitter;
}

const mockGetInstallationInfo = vi.mocked(getInstallationInfo);

describe('handleAutoUpdate', () => {
  let mockSpawn: Mock;
  let mockUpdateInfo: any;
  let mockSettings: LoadedSettings;
  let mockChildProcess: MockChildProcess;

  beforeEach(() => {
    mockSpawn = vi.fn();
    vi.clearAllMocks();
    mockUpdateInfo = {
      update: {
        latest: '2.0.0',
        current: '1.0.0',
        type: 'major',
        name: '@google/gemini-cli',
      },
      message: 'An update is available!',
    };

    mockSettings = {
      merged: {
        disableAutoUpdate: false,
      },
    } as LoadedSettings;

    mockChildProcess = Object.assign(new EventEmitter(), {
      stdin: Object.assign(new EventEmitter(), {
        write: vi.fn(),
        end: vi.fn(),
      }),
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    }) as MockChildProcess;

    mockSpawn.mockReturnValue(mockChildProcess);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should do nothing if update info is null', () => {
    handleAutoUpdate(null as any, mockSettings, '/root', mockSpawn);
    expect(mockGetInstallationInfo).not.toHaveBeenCalled();
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('should do nothing if update nag is disabled', () => {
    mockSettings.merged.disableUpdateNag = true;
    handleAutoUpdate(mockUpdateInfo, mockSettings, '/root', mockSpawn);
    expect(mockGetInstallationInfo).not.toHaveBeenCalled();
    expect(mockSpawn).not.toHaveBeenCalled();
  });
});
