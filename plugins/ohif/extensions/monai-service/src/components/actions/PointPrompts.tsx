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

import React from 'react';
import './PointPrompts.css';
import ModelSelector from '../ModelSelector';
import BaseTab from './BaseTab';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { hideNotification } from '../../utils/GenericUtils';
import { cache } from '@cornerstonejs/core';

export default class PointPrompts extends BaseTab {
  modelSelector: any;

  constructor(props) {
    super(props);

    this.modelSelector = React.createRef();
    this.state = {
      currentModel: null,
      currentLabel: null,
      clickPoints: new Map(),
      availableOrgans: {},
    };
  }

  onSelectModel = (model) => {
    console.log('Selecting  (Point) Interaction Model...');
    const currentLabel = null;
    const clickPoints = new Map();
    this.setState({
      currentModel: model,
      currentLabel: currentLabel,
      clickPoints: clickPoints,
      availableOrgans: this.getModelOrgans(model),
    });

    this.clearAllPoints();
  };

  onEnterActionTab = () => {
    this.props.commandsManager.runCommand('setToolActive', {
      toolName: 'ProbeMONAIService',
    });
    this.onSelectModel(this.state.currentModel);
    window.current_point_class = null;
    console.info('Here we activate the probe');
  };

  onLeaveActionTab = () => {
    this.onChangeLabel(null);
    this.props.commandsManager.runCommand('setToolDisable', {
      toolName: 'ProbeMONAIService',
    });

    console.info('Here we deactivate the probe');
  };

  onRunInference = async () => {
    const nid = this.notification.show({
      title: 'MONAI Service',
      message: 'Running Point Based Inference...',
      type: 'info',
      duration: 4000,
    });


    const manager = cornerstoneTools.annotation.state.getAnnotationManager();
    const annotations = manager.saveAnnotations(null, 'ProbeMONAIService');

    const { currentLabel, clickPoints } = this.state;
    console.log('click points', clickPoints)
    console.log('in inference annotations:', annotations)

    // Check if clickPoints is null or empty
    if (!annotations || Object.keys(annotations).length === 0) {
      // Send notification for empty or null clickPoints
      hideNotification(nid, this.notification);

      this.notification.show({
        title: 'Notification',
        message: 'Error: clickPoints is empty or null',
        type: 'error',
        duration: 6000,
      });

      // Prohibit further actions (return or throw an error, depending on your logic)
      // Example of returning from the function:
      return;
    }

    clickPoints[currentLabel] = annotations;

    if (currentLabel === 'background') {
      this.notification.show({
        title: 'MONAI Service',
        message: 'Please click an anatomy for point click editing other than background',
        type: 'error',
        duration: 10000,
      });
      return;
    }

    const { info, viewConstants } = this.props;

    let seriesInstanceUID = viewConstants.SeriesInstanceUID;

    const { displaySetService } = this.props.servicesManager.services;
    const activeDisplaySets = displaySetService.activeDisplaySets
    for (const item of activeDisplaySets){
      if (item.Modality === "CT"){
        seriesInstanceUID = item.SeriesInstanceUID;
      }
    }
    console.log('seriesInstanceUID:', seriesInstanceUID)

    const models = info.models;
    let selectedModel = 0;
    for (const model of models) {
      if (!this.state.currentModel || model.id == this.state.currentModel)
        break;
      selectedModel++;
    }

    const model = models.length > 0 ? models[selectedModel] : null;
    if (!model) {
      console.log('Something went error..');
      return;
    }

    console.log('Using model', model);
    const model_id = model.id;
    let label_names = [];

    const { cornerstoneViewportService } = this.props.servicesManager.services;
    const viewPort = cornerstoneViewportService.viewportsById.get('mpr-axial');
    const { worldToIndex } = viewPort.viewportData.data[0].volume.imageData;

    // console.log(seriesInstanceUID);
    // console.log(viewPort);

    const points = {};
    for (const label in clickPoints) {
      // console.log(clickPoints[label]);
      for (const uid in clickPoints[label]) {
        const annotations = clickPoints[label][uid]['ProbeMONAIService'];
        console.log(annotations);
        points[label] = [];
        for (const annotation of annotations) {
          const pt = annotation.data.handles.points[0];
          points[label].push(worldToIndex(pt).map(Math.round));
        }
      }
      label_names.push(label);
    }

    const params = {};

    if (model['network_arch'] === 'monai_vista3d') {
      console.log(points)
      params['points'] = points[currentLabel];

      params['point_labels'] = new Array(params['points'].length).fill(1);

      if (points['background'] && points['background'].length > 0) {
        for (let i = 0; i < points['background'].length; i++) {
          params['point_labels'].push(0);
        }
        params['points'] = params['points'].concat(points['background']);
      }

      params['label_prompt'] = [info.modelLabelToIdxMap[model_id][currentLabel]];

      label_names = [currentLabel];
    } else {
      params['background'] = [];
      for (const label in points) {
        params[label] = points[label];
      }
    }

    const response = await this.props.client().inference(model_id, seriesInstanceUID, params);
    console.log(response.data)

    hideNotification(nid, this.notification);
    if (response.status >= 400) {
      this.notification.show({
        title: 'MONAI Service',
        message: 'Failed to Run Point Prompts',
        type: 'error',
        duration: 6000,
      });
      console.log(response.data)
      return;
    }

    this.notification.show({
      title: 'MONAI Service',
      message: 'Run Point Prompts - Successful',
      type: 'success',
      duration: 4000,
    });

    const segVolumeObject = cache.getVolume('1');
    const currentSegArray = new Uint8Array(segVolumeObject.scalarData.length);

    currentSegArray.set(segVolumeObject.scalarData);
    window.ScalarDataBuffer = currentSegArray;

    this.props.updateView(response, model_id, label_names, true);
  };

  initPoints = () => {
    const label = this.state.currentLabel;
    if (!label) {
      console.log('Current Label is Null (No need to init)');
      return;
    }
    console.log('In init points:', label)
    const { toolGroupService, viewportGridService } = this.props.servicesManager.services;
    const { viewports, activeViewportId } = viewportGridService.getState();
    const viewport = viewports.get(activeViewportId);
    const { viewportOptions } = viewport;
    const toolGroupId = viewportOptions.toolGroupId;

    const colorMap = this.segmentInfo();
    const customColor = this.segColorToRgb(colorMap[label]);
    toolGroupService.setToolConfiguration(toolGroupId, 'ProbeMONAIService', {
      customColor: customColor,
    });

    const annotations = this.state.clickPoints[label];
    if (annotations) {
      const manager = cornerstoneTools.annotation.state.getAnnotationManager();
      manager.restoreAnnotations(annotations, null, 'ProbeMONAIService');
    }
  };

  clearPoints = () => {
    cornerstoneTools.annotation.state.getAnnotationManager().removeAllAnnotations();
    this.props.servicesManager.services.cornerstoneViewportService.getRenderingEngine().render();
  };

  clearAllPoints = () => {
    const clickPoints = new Map();
    this.setState({ clickPoints: clickPoints });
    this.clearPoints();
  };

  segColorToRgb(s) {
    const c = s ? s.color : [0, 0, 0];
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  onChangeLabel = name => {
    console.log(name, this.state.currentLabel);
    if (name === this.state.currentLabel) {
      console.log('Both new and prev are same');
      return;
    }
    const prev = this.state.currentLabel;

    if (prev !== 'Background' && name !== 'Background'){
      this.clearPoints();
    }

    const clickPoints = this.state.clickPoints;
    if (prev) {
      const manager = cornerstoneTools.annotation.state.getAnnotationManager();
      const annotations = manager.saveAnnotations(null, 'ProbeMONAIService');
      console.log('Saving Prev annotations...', annotations);
      this.state.clickPoints[prev] = annotations;
    }

    this.state.currentLabel = name;
    window.current_point_class = name;
    this.setState({ currentLabel: name, clickPoints: clickPoints });
    this.initPoints();
  };

  getModels() {
    const models = [];
    const { info } = this.props;
    for (var i = 0; i < info.models.length; i++) {
      const model = info.models[i];
      const { network_arch } = model;
      if (network_arch === 'monai_vista3d' || network_arch === 'monai_annotation')
        models.push(model);
    }
    return models;
  }

  getModelOrgans(model_id) {
    const availableOrgans = {};
    const models = this.getModels();
    for (var i = 0; i < models.length; i++) {
      const model = models[i];
      if (model_id && model_id === model.id) {
        const labels = model['model_params']['labels'];
        if (labels) {
          for (const key in labels) {
            availableOrgans[labels[key]] = parseInt(key);
          }
        }
      }
    }
    return availableOrgans;
  }

  render() {
    const models = this.getModels();
    const display = models.length > 0 ? 'block' : 'none';
    const segInfo = this.segmentInfo();
    if (Object.keys(this.state.availableOrgans).length == 0 && models.length > 0) {
      this.state.availableOrgans = this.getModelOrgans(models[0].id);
    }

    return (
      <div className='tab' style={{ 'display': display }}>
        <input
          type='radio'
          name='rd'
          id={this.tabId}
          className='tab-switch'
          value='pointprompts'
          onClick={this.onSelectActionTab}
        />
        <label htmlFor={this.tabId} className='tab-label'>
          Point Prompts
        </label>
        <div className='tab-content'>
          <ModelSelector
            ref={this.modelSelector}
            name='pointprompts'
            title='PointPrompts'
            models={models}
            currentModel={this.state.currentModel}
            onClick={this.onRunInference}
            onSelectModel={this.onSelectModel}
            usage={
              <div style={{ fontSize: 'smaller' }}>
                <p style={{ fontWeight: 'bold' }}>Select an anatomy before placing click points.</p>
                <u>
                  <a style={{ color: 'red', cursor: 'pointer' }} onClick={() => this.clearPoints()}>Clear Points</a>
                </u> | <u>
                <a style={{ color: 'red', cursor: 'pointer' }} onClick={() => this.clearAllPoints()}>Clear All Points</a></u>
              </div>
            }
          />
          <div className='optionsTableContainer'>
            <hr />
            <p>Available Organ(s):</p>
            <hr />
            <div className='bodyTableContainer'>
              <table className='optionsTable'>
                <tbody>
                <tr
                  key="background"
                  className='clickable-row'
                  style={{ 'backgroundColor': this.state.currentLabel === 'background' ? 'darkred' : 'transparent' }}
                  onClick={() => this.onChangeLabel('background')}>
                  <td>
                    {/* Content for the "background" entry */}
                    <span
                      className='segColor'
                      style={{ 'backgroundColor': this.segColorToRgb(segInfo['background']) }}
                      />
                  </td>
                  <td>Background</td>
                </tr>
                {Object.entries(this.state.availableOrgans).map(([k, v]) => (
                  <tr key={k} className='clickable-row'
                      style={{ 'backgroundColor': this.state.currentLabel === k ? 'darkblue' : 'transparent', 'cursor': 'pointer', }}
                      onClick={() => this.onChangeLabel(k)}>
                    <td>
                      <span
                        className='segColor'
                        style={{ 'backgroundColor': this.segColorToRgb(segInfo[k]) }}
                      />
                    </td>
                    <td>{k}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
