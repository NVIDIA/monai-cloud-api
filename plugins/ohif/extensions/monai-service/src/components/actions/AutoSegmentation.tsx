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
import ModelSelector from '../ModelSelector';
import BaseTab from './BaseTab';
import { hideNotification } from '../../utils/GenericUtils';

export default class AutoSegmentation extends BaseTab {
  modelSelector: any;

  constructor(props) {
    super(props);

    this.modelSelector = React.createRef();
    this.state = {
      currentModel: null,
    };
  }

  onSelectModel = model => {
    console.log('Selecting  Auto Segmentation Model...');
    console.log(model);
    this.setState({ currentModel: model });
  };

  onSegmentation = async () => {
    const nid = this.notification.show({
      title: 'MONAI Service',
      message: 'Running Auto-Segmentation...',
      type: 'info',
      duration: 7000,
    });

    const { info, viewConstants } = this.props;
    const seriesInstanceUID = viewConstants.SeriesInstanceUID;

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
    const label_names = info.modelLabelNames[model_id];
    const label_classes = info.modelLabelIndices[model_id];

    const params = {};
    if (model['network_arch'] === 'monai_vista3d') {
      //perserve substructures and remove general components in everything inference
      const bodyComponents = ["kidney", "lung", "bone", "lung tumor", "uterus", "postcava"];
      const exclusionValues = bodyComponents.map(cls_name => this.props.info.modelLabelToIdxMap[model_id][cls_name]);
      const filteredLabelClasses = label_classes.filter(value => !exclusionValues.includes(value));
      
      params['label_prompt'] = filteredLabelClasses;
    }

    console.log(params);
    const response = await this.props.client().inference(model_id, seriesInstanceUID, params);
    console.log(response)

    hideNotification(nid, this.notification);
    if (response.status >= 400) {
      this.notification.show({
        title: 'MONAI Service',
        message: 'Failed to Run Segmentation',
        type: 'error',
        duration: 6000,
      });
      return;
    }

    this.notification.show({
      title: 'MONAI Service',
      message: 'Run Segmentation - Successful',
      type: 'success',
      duration: 4000,
    });

    this.props.updateView(response, model_id, label_names);
  };

  render() {
    const { info } = this.props;
    const models = info.models;

    return (
      <div className='tab'>
        <input
          type='radio'
          name='rd'
          id={this.tabId}
          className='tab-switch'
          value='segmentation'
          onClick={this.onSelectActionTab}
          defaultChecked
        />
        <label htmlFor={this.tabId} className='tab-label'>
          Auto-Segmentation
        </label>
        <div className='tab-content'>
          <ModelSelector
            ref={this.modelSelector}
            name='segmentation'
            title='Segmentation'
            models={models}
            currentModel={this.state.currentModel}
            onClick={this.onSegmentation}
            onSelectModel={this.onSelectModel}
            usage={
              <p style={{ fontSize: 'smaller' }}>
                Experience fully automated segmentation for <b>everything</b> from the pre-trained
                model.
              </p>
            }
          />
        </div>
      </div>
    );
  }
}
