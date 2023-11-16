/*
Copyright (c) 2021-2022, NVIDIA CORPORATION.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './MonaiServicePanel.css';
import ActiveLearning from './actions/ActiveLearning';
import AutoSegmentation from './actions/AutoSegmentation';
import PointPrompts from './actions/PointPrompts';
import ClassPrompts from './actions/ClassPrompts';
import MonaiServiceClient from '../services/MonaiServiceClient';
import { hideNotification, getLabelColor } from '../utils/GenericUtils';
import { Enums } from '@cornerstonejs/tools';
import { cache, triggerEvent, eventTarget } from '@cornerstonejs/core';
import SegmentationReader from '../utils/SegmentationReader';
import { currentSegmentsInfo } from '../utils/SegUtils';

export default class MonaiServicePanel extends Component {
  static propTypes = {
    commandsManager: PropTypes.any,
    servicesManager: PropTypes.any,
    extensionManager: PropTypes.any,
  };

  notification: any;
  settings: any;
  state: { info: {}; action: {}; };
  actions: {
    activelearning: any;
    segmentation: any;
    pointprompts: any;
    classprompts: any;
  };
  props: any;
  SeriesInstanceUID: any;
  StudyInstanceUID: any;
  FrameOfReferenceUID: any;
  displaySetInstanceUID: any;

  constructor(props) {
    super(props);

    const { uiNotificationService, displaySetService } = props.servicesManager.services;

    this.SeriesInstanceUID = displaySetService.activeDisplaySets[0].SeriesInstanceUID;
    this.StudyInstanceUID = displaySetService.activeDisplaySets[0].StudyInstanceUID;
    this.notification = uiNotificationService;
    this.actions = {
      activelearning: React.createRef(),
      segmentation: React.createRef(),
      pointprompts: React.createRef(),
      classprompts: React.createRef(),
    };

    this.state = {
      info: { models: [], datasets: [] },
      action: {},
    };

    // Todo: fix this hack
    setTimeout(() => {
      const displaySet = displaySetService.activeDisplaySets[0];
      this.SeriesInstanceUID = displaySet.SeriesInstanceUID;
      this.StudyInstanceUID = displaySet.StudyInstanceUID;
      this.FrameOfReferenceUID = displaySet.instances[0].FrameOfReferenceUID;
      this.displaySetInstanceUID = displaySet.displaySetInstanceUID;

      const activeDisplaySets = displaySetService.activeDisplaySets
      for (const item of activeDisplaySets){
        if (item.Modality === "CT"){
          this.SeriesInstanceUID = item.SeriesInstanceUID;
          this.StudyInstanceUID = item.StudyInstanceUID;
          this.FrameOfReferenceUID = item.instances[0].FrameOfReferenceUID;
          this.displaySetInstanceUID = item.displaySetInstanceUID;
        }
      }
    }, 1000);
  }

  client = () => {
    const c = new MonaiServiceClient();
    const { userAuthenticationService } = this.props.servicesManager.services;
    const authHeaders = userAuthenticationService.getAuthorizationHeader();
    if (authHeaders && authHeaders.Authorization) {
      c.accessToken = authHeaders.Authorization;
    }
    return c;
  };


  segmentColor(label) {
    const color = getLabelColor(label);
    const rgbColor = [];
    for (let key in color) {
      rgbColor.push(color[key]);
    }
    rgbColor.push(255);
    return rgbColor;
  }

  onInfo = async () => {
    const nid = this.notification.show({
      title: 'MONAI Service',
      message: 'Connecting to MONAI Service',
      type: 'info',
      duration: 2000,
    });

    const response = await this.client().list_models();
    console.log(response.data)

    hideNotification(nid, this.notification);
    if (response.status !== 200) {
      this.notification.show({
        title: 'MONAI Service',
        message: 'Failed to Connect to MONAI Service Server',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    this.notification.show({
      title: 'MONAI Service',
      message: 'Connected to MONAI Service Server - Successful',
      type: 'success',
      duration: 2000,
    });

    // Cache this series at MONAI Service (This can be moved to when you load the series)
    await this.client().cache_image(this.SeriesInstanceUID);

    const models = response.data;
    // const filtered = [];
    // for (const model of models) {
    //   const { network_arch, inference_dataset } = model;
    //   if (network_arch === 'monai_vista3d' || network_arch === 'monai_annotation' || network_arch === 'monai_segmentation') {
    //     if (inference_dataset === this.dataset_id) {
    //       filtered.push(model);
    //     }
    //   }
    // }
    const dataset_id = window.config.datasetId ? window.config.datasetId : window.config.monaiService.datasetId;
    const filtered = models.filter((model) => (
      ['monai_vista3d', 'monai_annotation', 'monai_segmentation'].includes(model.network_arch) &&
      model.inference_dataset === dataset_id
    ));

    console.log(filtered)

    const all_labels = [];
    const modelLabelToIdxMap = {};
    const modelIdxToLabelMap = {};
    const modelLabelNames = {};
    const modelLabelIndices = {};
    for (const model of filtered) {
      const model_id = model.id;
      const labels = model['model_params']['labels'];

      modelLabelToIdxMap[model_id] = {};
      modelIdxToLabelMap[model_id] = {};
      for (const idx in labels) {
        const name = labels[idx];
        all_labels.push(name);
        modelLabelToIdxMap[model_id][name] = parseInt(idx);
        modelIdxToLabelMap[model_id][parseInt(idx)] = name;
      }
      modelLabelNames[model_id] = [...Object.keys(modelLabelToIdxMap[model_id])].sort();
      modelLabelIndices[model_id] = [...Object.keys(modelIdxToLabelMap[model_id])].sort().map(Number);
    }



    const labelsOrdered = [...new Set(all_labels)].sort();
    const segmentations = [{
      id: '1',
      label: 'Segmentations',
      segments: labelsOrdered.map((label, index) => ({
        segmentIndex: index + 1,
        label: label,
        color: this.segmentColor(label),
      })),
      isActive: true,
      activeSegmentIndex: 1,
    }];
    const initialSegs = segmentations[0].segments;
    const volumeLoadObject = cache.getVolume('1');
    console.log(volumeLoadObject)
    if (!volumeLoadObject) {
      this.props.commandsManager.runCommand('loadSegmentationsForViewport', { segmentations });
    }

    const datasets = await this.client().list_datasets();
    const info = {
      models: filtered,
      datasets: datasets.data,
      modelLabelToIdxMap: modelLabelToIdxMap,
      modelIdxToLabelMap: modelIdxToLabelMap,
      modelLabelNames: modelLabelNames,
      modelLabelIndices: modelLabelIndices,
      initialSegs: initialSegs,
    };

    console.log(info);
    this.setState({ info: info });
  };

  onSelectActionTab = (name) => {
    for (const action of Object.keys(this.actions)) {
      if (this.state.action === action) {
        if (this.actions[action].current)
          this.actions[action].current.onLeaveActionTab();
      }
    }

    for (const action of Object.keys(this.actions)) {
      if (name === action) {
        if (this.actions[action].current)
          this.actions[action].current.onEnterActionTab();
      }
    }
    this.setState({ action: name });
  };

  updateView = async (response, model_id, labels, override = false) => {
    console.log('Update View....');
    const ret = SegmentationReader.parseNrrdData(response.data);
    if (!ret) {
      throw new Error('Failed to parse NRRD data');
    }

    console.info('These are the predicted labels');
    console.info(labels);

    const labelNames = {};
    const currentSegs = currentSegmentsInfo(this.props.servicesManager.services.segmentationService);
    const modelToSegMapping = {};
    modelToSegMapping[0] = 0;

    for (const label of labels) {
      const s = currentSegs.info[label];
      if (!s) {
        for (let i = 1; i <= 255; i++) {
          if (!currentSegs.indices.has(i)) {
            labelNames[label] = i;
            currentSegs.indices.add(i);
            break;
          }
        }
      } else {
        labelNames[label] = s.segmentIndex;
      }

      const seg_idx = labelNames[label];
      const model_idx = this.state.info.modelLabelToIdxMap[model_id][label];
      modelToSegMapping[model_idx] = 0xFF & seg_idx;
    }

    console.log('Index Remap', labels, modelToSegMapping);
    const data = new Uint16Array(ret.image);

    // Todo: rename volumeId
    const volumeLoadObject = cache.getVolume('1');
    if (volumeLoadObject) {
      const { scalarData } = volumeLoadObject;
      const convertedData = new Uint8Array(data.length * 2); // Each uint16 requires 2 bytes
      for (let i = 0; i < data.length; i++) {
        const uint16Value = data[i];
        convertedData[i * 2] = uint16Value & 0xFF; // Low byte
        convertedData[i * 2 + 1] = (uint16Value >> 8) & 0xFF; // High byte
      }

      // Model Idx to Segment Idx conversion (merge for multiple models with different label idx for the same name)
      for (var i = 0; i < convertedData.length; i++) {
        const midx = convertedData[i];
        const sidx = modelToSegMapping[midx];
        if (midx && sidx) {
          convertedData[i] = sidx;
        }
      }

      if (override === true) {
        const scalarDataRecover = new Uint8Array(window.ScalarDataBuffer.length);
        scalarDataRecover.set(window.ScalarDataBuffer);

        // get unique values to determin which organs to update, keep rest
        const updateTargets = new Set(convertedData);

        for (let i = 0; i < convertedData.length; i++) {
          if (convertedData[i] !== 255 && updateTargets.has(scalarDataRecover[i])) {
            scalarDataRecover[i] = convertedData[i];
          }
        }

        scalarData.set(scalarDataRecover);
      } else {
        scalarData.set(convertedData);
      }

      triggerEvent(eventTarget, Enums.Events.SEGMENTATION_DATA_MODIFIED, { segmentationId: '1' });
      console.debug('updated the segmentation\'s scalar data');
    } else {
      // TODO:: Remap Index here as well...
      console.log('Not In Cache....');
      const segmentations = [{
        id: '1',
        label: 'Segmentations',
        segments: Object.entries(labelNames).map(([k, v]) => ({
          segmentIndex: v,
          label: k,
          color: this.segmentColor(k),
        })),
        isActive: true,
        activeSegmentIndex: 1,
        scalarData: data,
        FrameOfReferenceUID: this.FrameOfReferenceUID,
      }];

      this.props.commandsManager.runCommand('loadSegmentationsForDisplaySet', {
        displaySetInstanceUID: this.displaySetInstanceUID,
        segmentations,
      });
    }
  };

  async componentDidMount() {
    console.log('Component Mounted... Connect to MONAI Server...');
    await this.onInfo();
  }

  render() {
    return (
      <div className='monaiServicePanel'>
        <br style={{ margin: '3px' }} />
        <hr className='separator' />
        <p className='subtitle'>MONAI Service Ver. 0.2.0 7e7a181</p>
        <div className='tabs scrollbar' id='style-3'>
          <ActiveLearning
            ref={this.actions['activelearning']}
            tabIndex={1}
            servicesManager={this.props.servicesManager}
            info={this.state.info}
            viewConstants={{
              SeriesInstanceUID: this.SeriesInstanceUID,
              StudyInstanceUID: this.StudyInstanceUID,
            }}
            client={this.client}
            notification={this.notification}
            onSelectActionTab={this.onSelectActionTab}
          />
          <AutoSegmentation
            ref={this.actions['segmentation']}
            tabIndex={2}
            servicesManager={this.props.servicesManager}
            commandsManager={this.props.commandsManager}
            info={this.state.info}
            viewConstants={{
              SeriesInstanceUID: this.SeriesInstanceUID,
              StudyInstanceUID: this.StudyInstanceUID,
            }}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
          />
          <PointPrompts
            ref={this.actions['pointprompts']}
            tabIndex={3}
            servicesManager={this.props.servicesManager}
            commandsManager={this.props.commandsManager}
            info={this.state.info}
            viewConstants={{
              SeriesInstanceUID: this.SeriesInstanceUID,
              StudyInstanceUID: this.StudyInstanceUID,
            }}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
          />
          <ClassPrompts
            ref={this.actions['classprompts']}
            tabIndex={4}
            servicesManager={this.props.servicesManager}
            commandsManager={this.props.commandsManager}
            info={this.state.info}
            viewConstants={{
              SeriesInstanceUID: this.SeriesInstanceUID,
              StudyInstanceUID: this.StudyInstanceUID,
            }}
            client={this.client}
            notification={this.notification}
            updateView={this.updateView}
            onSelectActionTab={this.onSelectActionTab}
          />
        </div>
      </div>
    );
  }
}
