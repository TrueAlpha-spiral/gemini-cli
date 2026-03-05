/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import * as path from 'path';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { FolderTrustChoice } from '../components/FolderTrustDialog.js';

export const useFolderTrust = (settings: LoadedSettings) => {
  const currentPath = process.cwd();
  const trustedFolders = settings.merged.trustedFolders || [];

  // Check if current path or any of its parents are in the trusted folders list
  const isTrusted = trustedFolders.some((trustedPath) => {
    // Exact match
    if (currentPath === trustedPath) return true;

    // Ensure it's a true subdirectory to prevent prefix matching vulnerabilities
    // (e.g., matching /home/user/project against /home/user/project-malicious)
    const trustedWithSep = trustedPath.endsWith(path.sep)
      ? trustedPath
      : `${trustedPath}${path.sep}`;

    return currentPath.startsWith(trustedWithSep);
  });

  const [isFolderTrustDialogOpen, setIsFolderTrustDialogOpen] = useState(
    !!settings.merged.folderTrustFeature && !isTrusted
  );

  const handleFolderTrustSelect = useCallback(
    (choice: FolderTrustChoice) => {
      const currentTrustedFolders = settings.merged.trustedFolders || [];
      let newTrustedPath = '';

      if (choice === FolderTrustChoice.TRUST_FOLDER) {
        newTrustedPath = process.cwd();
      } else if (choice === FolderTrustChoice.TRUST_PARENT) {
        newTrustedPath = path.dirname(process.cwd());
      }

      if (newTrustedPath && !currentTrustedFolders.includes(newTrustedPath)) {
        settings.setValue(SettingScope.User, 'trustedFolders', [
          ...currentTrustedFolders,
          newTrustedPath,
        ]);
      }
      setIsFolderTrustDialogOpen(false);
    },
    [settings],
  );

  return {
    isFolderTrustDialogOpen,
    handleFolderTrustSelect,
  };
};
