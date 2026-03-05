/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFolderTrust } from './useFolderTrust.js';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { FolderTrustChoice } from '../components/FolderTrustDialog.js';

describe('useFolderTrust', () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    process.cwd = vi.fn().mockReturnValue('/test/current/dir');
  });

  afterEach(() => {
    process.cwd = originalCwd;
    vi.restoreAllMocks();
  });

  it('should set isFolderTrustDialogOpen to true when folderTrustFeature is true and path is not trusted', () => {
    const settings = {
      merged: {
        folderTrustFeature: true,
        trustedFolders: undefined,
      },
      setValue: vi.fn(),
    } as unknown as LoadedSettings;

    const { result } = renderHook(() => useFolderTrust(settings));

    expect(result.current.isFolderTrustDialogOpen).toBe(true);
  });

  it('should set isFolderTrustDialogOpen to false when folderTrustFeature is false', () => {
    const settings = {
      merged: {
        folderTrustFeature: false,
        trustedFolders: undefined,
      },
      setValue: vi.fn(),
    } as unknown as LoadedSettings;

    const { result } = renderHook(() => useFolderTrust(settings));

    expect(result.current.isFolderTrustDialogOpen).toBe(false);
  });

  it('should set isFolderTrustDialogOpen to false when path is trusted', () => {
    const settings = {
      merged: {
        folderTrustFeature: true,
        trustedFolders: ['/test/current/dir'],
      },
      setValue: vi.fn(),
    } as unknown as LoadedSettings;

    const { result } = renderHook(() => useFolderTrust(settings));

    expect(result.current.isFolderTrustDialogOpen).toBe(false);
  });

  it('should set isFolderTrustDialogOpen to false when a parent path is trusted', () => {
    const settings = {
      merged: {
        folderTrustFeature: true,
        trustedFolders: ['/test'],
      },
      setValue: vi.fn(),
    } as unknown as LoadedSettings;

    const { result } = renderHook(() => useFolderTrust(settings));

    expect(result.current.isFolderTrustDialogOpen).toBe(false);
  });

  it('should call setValue with current folder and set isFolderTrustDialogOpen to false on handleFolderTrustSelect(TRUST_FOLDER)', () => {
    const settings = {
      merged: {
        folderTrustFeature: true,
        trustedFolders: undefined,
      },
      setValue: vi.fn(),
    } as unknown as LoadedSettings;

    const { result } = renderHook(() => useFolderTrust(settings));

    act(() => {
      result.current.handleFolderTrustSelect(FolderTrustChoice.TRUST_FOLDER);
    });

    expect(settings.setValue).toHaveBeenCalledWith(
      SettingScope.User,
      'trustedFolders',
      ['/test/current/dir'],
    );
    expect(result.current.isFolderTrustDialogOpen).toBe(false);
  });

  it('should call setValue with parent folder and set isFolderTrustDialogOpen to false on handleFolderTrustSelect(TRUST_PARENT)', () => {
    const settings = {
      merged: {
        folderTrustFeature: true,
        trustedFolders: undefined,
      },
      setValue: vi.fn(),
    } as unknown as LoadedSettings;

    const { result } = renderHook(() => useFolderTrust(settings));

    act(() => {
      result.current.handleFolderTrustSelect(FolderTrustChoice.TRUST_PARENT);
    });

    expect(settings.setValue).toHaveBeenCalledWith(
      SettingScope.User,
      'trustedFolders',
      ['/test/current'],
    );
    expect(result.current.isFolderTrustDialogOpen).toBe(false);
  });

  it('should not call setValue but set isFolderTrustDialogOpen to false on handleFolderTrustSelect(DO_NOT_TRUST)', () => {
    const settings = {
      merged: {
        folderTrustFeature: true,
        trustedFolders: undefined,
      },
      setValue: vi.fn(),
    } as unknown as LoadedSettings;

    const { result } = renderHook(() => useFolderTrust(settings));

    act(() => {
      result.current.handleFolderTrustSelect(FolderTrustChoice.DO_NOT_TRUST);
    });

    expect(settings.setValue).not.toHaveBeenCalled();
    expect(result.current.isFolderTrustDialogOpen).toBe(false);
  });
});
