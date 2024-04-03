import React from 'react';
import { DicomMetadataStore } from '@ohif/core';

/**
 *
 * @param {*} servicesManager
 */
async function createReportAsync({ servicesManager, getReport, reportType = 'measurement' }) {
  const { displaySetService, uiNotificationService, uiDialogService } = servicesManager.services;
  const loadingDialogId = uiDialogService.create({
    showOverlay: true,
    isDraggable: false,
    centralize: true,
    content: Loading,
  });
  try {
    const naturalizedReport = await getReport();

    // The "Mode" route listens for DicomMetadataStore changes
    // When a new instance is added, it listens and
    // automatically calls makeDisplaySets
    DicomMetadataStore.addInstances([naturalizedReport], true);

    const displaySet = displaySetService.getMostRecentDisplaySet();

    const displaySetInstanceUID = displaySet.displaySetInstanceUID;

    uiNotificationService.show({
      title: 'Create Report',
      message: `${reportType} saved successfully`,
      type: 'success',
    });

    return [displaySetInstanceUID];
  } catch (error) {
    console.log("error:", error)
    if (error instanceof TypeError && error.message.includes("'StudyInstanceUID' of 'instances[0]' as it is undefined")) {
      uiNotificationService.show({
        title: 'Create Report',
        message: `Cancel segmentation export`,
        type: 'error',
      });
    } else {
      uiNotificationService.show({
        title: 'Create Report',
        message: error.message || `Failed to store ${reportType}`,
        type: 'error',
      });
    }
  } finally {
    uiDialogService.dismiss({ id: loadingDialogId });
  }
}

function Loading() {
  return <div className="text-primary-active">Loading...</div>;
}

export default createReportAsync;
