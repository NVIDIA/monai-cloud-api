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
      duration: 4000,
    });
    // const response_0 = await this.client().get_token();
    // console.log(response_0.data)

    const response = await this.client().list_models();
    console.log('list models:', response)

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
      duration: 5000,
    });

    // Cache this series at MONAI Service (This can be moved to when you load the series)
    await this.client().cache_image(this.SeriesInstanceUID);

    const models = response.data.experiments;
    const dataset_id = window.config.datasetId ? window.config.datasetId : window.config.monaiService.datasetId;
    console.log(models)
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

    //   TODO: support continue edits and load from existing label
    const currentSegs = await this.props.servicesManager.services.segmentationService.getSegmentations().length === 0
      ? this.props.servicesManager.services.segmentationService.segmentations
      : this.props.servicesManager.services.segmentationService.getSegmentations();
    let initialSegs;
    // if (currentSegs && currentSegs.length) {
    //   const currentModelId = this.state.currentModel ? this.state.currentModel : models[0].id;
    //   console.log('currentModelId', currentModelId)
    //   currentSegs[0].id = 'monaiservice'
    //   currentSegs[0].segments =  labelsOrdered.map((label, index) => ({
    //     segmentIndex: index + 1,
    //     label: label,
    //     color: this.segmentColor(label),
    //   }))
    //   currentSegs[0].isActive = true
    //   currentSegs[0].activeSegmentIndex = 1
    //   currentSegs[0].label = 'Segmentations'
    //   console.log('currentSegs', currentSegs)
    //   const volumeLoadObject = cache.getVolume('monaiservice');
    //   console.log('volumeLoadObject load', volumeLoadObject)
    //   if (!volumeLoadObject) {
    //     this.props.commandsManager.runCommand('loadSegmentationsForViewport', { currentSegs });
    //   }
    //   await this.loadSegVolume(modelLabelToIdxMap[currentModelId], modelLabelNames[currentModelId])
    //   initialSegs = currentSegs[0].segments;

    // } 

    this.initSegVolume = [{
      id: 'monaiservice',
      label: 'Segmentations',
      segments: labelsOrdered.map((label, index) => ({
        segmentIndex: index + 1,
        label: label,
        color: this.segmentColor(label),
      })),
      isActive: true,
      activeSegmentIndex: 1,
    }];
    initialSegs = this.initSegVolume[0].segments;
    console.log("hey 1 !!!!!!!!!!!!!", initialSegs)
    const volumeLoadObject = cache.getVolume('monaiservice');

    console.log('volumeLoadObject', volumeLoadObject)
    if (!volumeLoadObject) {
      this.props.commandsManager.runCommand('loadSegmentationsForViewport', { segmentations: this.initSegVolume });
    }

    console.log('volumeLoadObject 2', volumeLoadObject)

    // const datasets = await this.client().list_datasets();
    const info = {
      models: filtered,
      // datasets: datasets.data,
      modelLabelToIdxMap: modelLabelToIdxMap,
      modelIdxToLabelMap: modelIdxToLabelMap,
      modelLabelNames: modelLabelNames,
      modelLabelIndices: modelLabelIndices,
      initialSegs: initialSegs,
    };

    console.log(info);
    this.setState({ info: info });
  };

  loadSegVolume = async (modelLabelToIdxMap, labels) => {
    console.log('Load segmentation volume ....');

    console.info(labels);

    const labelNames = {};
    const currentSegsInfo = currentSegmentsInfo(this.props.servicesManager.services.segmentationService);

    console.log('segmentation service', this.props.servicesManager.services.segmentationService)


    console.log('In currentSegsInfo', currentSegsInfo)
    const modelToSegMapping = {};
    modelToSegMapping[0] = 0;

    for (const label of labels) {
      const s = currentSegsInfo.info[label];
      if (!s) {
        for (let i = 1; i <= 255; i++) {
          if (!currentSegsInfo.indices.has(i)) {
            labelNames[label] = i;
            currentSegsInfo.indices.add(i);
            break;
          }
        }
      } else {
        labelNames[label] = s.segmentIndex;
      }

      const seg_idx = labelNames[label];
      const model_idx = modelLabelToIdxMap[label];
      modelToSegMapping[model_idx] = 0xFF & seg_idx;
    }

    console.log('Index Remap', labels, modelToSegMapping);

    // Todo: rename volumeId
    const volumeLoadObject = cache.getVolume('monaiservice');

    if (volumeLoadObject) {
      const { scalarData } = volumeLoadObject;

      // Model Idx to Segment Idx conversion (merge for multiple models with different label idx for the same name)
      for (var i = 0; i < scalarData.length; i++) {
        const midx = scalarData[i];
        const sidx = modelToSegMapping[midx];
        if (midx && sidx) {
          scalarData[i] = sidx;
        }
      }

      scalarData.set(scalarData);
      triggerEvent(eventTarget, Enums.Events.SEGMENTATION_DATA_MODIFIED, { segmentationId: 'monaiservice' });
      console.debug('updated the segmentation\'s scalar data');
    }
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

  parseResponse = (response) => {
    const buffer = response.data;
    const contentType = response.headers['content-type'];

    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
    const boundary = boundaryMatch ? boundaryMatch[1] : null;

    const text = new TextDecoder().decode(buffer);
    const parts = text
      .split(`--${boundary}`)
      .filter((part) => part.trim() !== '');

    const nrrdPart = parts.find((part) =>
      part.includes('Content-Disposition: form-data')
    );

    // Extract NRRD data
    const binaryData = nrrdPart.split('\r\n\r\n')[1];
    const binaryDataEnd = binaryData.lastIndexOf('\r\n');

    const nrrdArrayBuffer = new Uint8Array(
      binaryData
        .slice(0, binaryDataEnd)
        .split('')
        .map((c) => c.charCodeAt(0))
    ).buffer;
    console.log(nrrdArrayBuffer)
    return { nrrddata: nrrdArrayBuffer};
  };

  updateView = async (response, model_id, labels, override = false) => {
    console.log('Update View....');

    const { nrrddata } = this.parseResponse(response);
    const ret = SegmentationReader.parseNrrdData(nrrddata);

    if (!ret) {
      throw new Error('Failed to parse NRRD data');
    }

    console.info('These are the predicted labels');

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
    const convertedData = new Uint8Array(ret.image);
    // const uniqueValues = new Set(convertedData);
    // const uniqueArray = Array.from(uniqueValues);
    // console.log(uniqueArray);
    const volumeLoadObject = cache.getVolume('monaiservice');

    // Model Idx to Segment Idx conversion (merge for multiple models with different label idx for the same name)
    for (var i = 0; i < convertedData.length; i++) {
      const midx = convertedData[i];
      const sidx = modelToSegMapping[midx];
      if (midx && sidx) {
        convertedData[i] = sidx;
      }
      // Additional condition to set value to 0 if it's 253
    }

    if (volumeLoadObject) {
      const { scalarData } = volumeLoadObject;

      if (override === true) {
        const scalarDataRecover = new Uint8Array(window.ScalarDataBuffer.length);
        scalarDataRecover.set(window.ScalarDataBuffer);

        // get unique values to determin which organs to update, keep rest

        const startCopyIndex = convertedData.length - scalarData.length
        const decodeData = convertedData.subarray(startCopyIndex, startCopyIndex + scalarData.length)
        const updateTargets = new Set(decodeData);

        for (let i = 0; i < decodeData.length; i++) {
          if (decodeData[i] !== 253 && updateTargets.has(scalarDataRecover[i])) {
            scalarDataRecover[i] = decodeData[i];
          }
        }

        scalarData.set(scalarDataRecover);
      } else {

        
        const startCopyIndex = convertedData.length - scalarData.length
        const decodeData = convertedData.subarray(startCopyIndex, startCopyIndex + scalarData.length)

        for (let i = 0; i < decodeData.length; i++) {
          if (decodeData[i] === 253) {
            decodeData[i] = 0;
          }
        }
        // const setArray = convertedData.subarray(startCopyIndex, startCopyIndex + scalarData.length)
        // const uniqueValues = new Set(setArray);
        // const uniqueArray = Array.from(uniqueValues);
        // console.log(uniqueArray);

        scalarData.set(decodeData);

      }

      triggerEvent(eventTarget, Enums.Events.SEGMENTATION_DATA_MODIFIED, { segmentationId: 'monaiservice' });
      console.debug('updated the segmentation\'s scalar data');
    } else {
      // TODO:: Remap Index here as well...
      console.log('Not In Cache....');
      // const segmentations = [{
      //   id: 'monaiservice',
      //   label: 'Segmentations',
      //   segments: Object.entries(labelNames).map(([k, v]) => ({
      //     segmentIndex: v,
      //     label: k,
      //     color: this.segmentColor(k),
      //   })),
      //   isActive: true,
      //   activeSegmentIndex: 1,
      //   scalarData: convertedData,
      //   FrameOfReferenceUID: this.FrameOfReferenceUID,
      // }];
      console.log(this.initSegVolume)
      this.props.commandsManager.runCommand('loadSegmentationsForViewport', { segmentations: this.initSegVolume });
      triggerEvent(eventTarget, Enums.Events.SEGMENTATION_DATA_MODIFIED, { segmentationId: 'monaiservice' });
    }
  };

  async componentDidMount() {
    console.log('Component Mounted... Connect to MONAI Server...');
    await this.onInfo();
  }

  render() {
    return (
      <div className='monaiServicePanel'>
        <br style={{ margin: '3px'}} />
        <hr className='separator' />
        <p className='subtitle'>MONAI Service Ver. 0.0.7-beta6</p>
        <div className='tabs scrollbar' id='style-3'>
          <ActiveLearning
            ref={this.actions['activelearning']}
            tabIndex={1}
            servicesManager={this.props.servicesManager}
            commandsManager={this.props.commandsManager}
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
