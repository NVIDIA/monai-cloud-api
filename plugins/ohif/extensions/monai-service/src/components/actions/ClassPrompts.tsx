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

export default class ClassPrompts extends BaseTab {
  modelSelector: any;

  constructor(props) {
    super(props);

    this.modelSelector = React.createRef();
    this.state = {
      currentModel: null,
      selectedOrgans: {},
    };
  }

  onSelectModel = model => {
    console.log('Selecting  (Class/Vista) Interaction Model...');
    console.log(model);

    this.setState({
      currentModel: model,
      selectedOrgans: this.getModelOrgans(model),
    });
  };

  getModels() {
    const models = [];
    const { info } = this.props;
    for (var i = 0; i < info.models.length; i++) {
      const model = info.models[i];
      const { network_arch } = model;
      if (network_arch === 'monai_vista3d')
        models.push(model);
    }
    return models;
  }

  getModelOrgans(model_id) {
    const selectedOrgans = {};
    const models = this.getModels();
    for (var i = 0; i < models.length; i++) {
      const model = models[i];
      if (model_id && model_id === model.id) {
        const labels = model['model_params']['labels'];
        if (labels) {
          for (const key in labels) {
            selectedOrgans[labels[key]] = false;
          }
        }
      }
    }
    return selectedOrgans;
  }

  onChangeOrgans = (k, evt) => {
    const selectedOrgans = this.state.selectedOrgans;
    selectedOrgans[k] = !!evt.target.checked;
    this.setState({ selectedOrgans: selectedOrgans });
  };

  onRunInference = async () => {
    const { info, viewConstants } = this.props;
    const seriesInstanceUID = viewConstants.SeriesInstanceUID;
    const models = this.getModels();
    const model_id = this.state.currentModel ? this.state.currentModel : models[0].id;
    console.log('Using Model: ', model_id);

    const label_names = [];
    const label_classes = [];
    for (const label in this.state.selectedOrgans) {
      if (!this.state.selectedOrgans[label]) {
        continue;
      }
      const idx = info.modelLabelToIdxMap[model_id][label];
      if (idx) {
        label_names.push(label);
        label_classes.push(idx);
      } else {
        console.log('Ignoring this class as it\'s not defined part of the model', label);
      }
    }

    const params = {
      'label_prompt': label_classes,
    };
    console.log(params);

    const nid = this.notification.show({
      title: 'MONAI Service',
      message: 'Running Class Based Inference...',
      type: 'info',
      duration: 2000,
    });

    const response = await this.props.client().inference(model_id, seriesInstanceUID, params);
    console.log(response.data)

    hideNotification(nid, this.notification);
    if (response.status >= 400) {
      this.notification.show({
        title: 'MONAI Service',
        message: 'Failed to Run Class Based Inference',
        type: 'error',
        duration: 6000,
      });
      console.log(response.data)
      return;
    }

    this.notification.show({
      title: 'MONAI Service',
      message: 'Run Class Based Inference - Successful',
      type: 'success',
      duration: 4000,
    });

    this.props.updateView(response, model_id, label_names);

  };


  segColorToRgb(s) {
    const c = s ? s.color : [0, 0, 0];
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  updateOrganSelection = (label_classes) => {
    const {selectedOrgans } = this.state;

    const models = this.getModels();
    const model_id = this.state.currentModel ? this.state.currentModel : models[0].id;

    // Reset Previous selection
    for (const name in selectedOrgans)
      selectedOrgans[name] = false;

    for (const cls_name of label_classes) {

      const idx = this.props.info.modelLabelToIdxMap[model_id][cls_name];
      if (idx)
        selectedOrgans[cls_name] = true;
    }

    this.setState({ selectedOrgans: selectedOrgans });
  };

  // TODO:: Select By label name instead of hard-coded indices
  onOrgansClickBtn = async () => {
    const selected_organs_indx = [
      "liver", "bladder", "colon", "dudenum", "esphagus", "gallbladder", 
      "spleen", "pancreas", "right kidney", "right adrenal gland", "left adrenal gland",
      "stomach", "left kidney", "bladder", "prostate or uterus", "rectum", "small bowel"
    ]
    this.updateOrganSelection(selected_organs_indx);
  };
  onVascularClickBtn = async () => {
    const selected_organs_indx = [
      "aorta", "inferior vena cava", "portal vein and splenic vein", "hepatic vessel",
      "pulmonary artery", "left iliac artery", "right iliac artery", "left iliac vena", "right iliac vena"
    ]                                                                              
    this.updateOrganSelection(selected_organs_indx);
  };
  onBonesClickBtn = async () => {
    const selected_organs_indx = [
      "vertebrae l5","vertebrae l4","vertebrae l3","vertebrae l2","vertebrae l1",
      "vertebrae t12","vertebrae t11","vertebrae t10","vertebrae t9","vertebrae t8","vertebrae t7",
      "vertebrae t6","vertebrae t5","vertebrae t4","vertebrae t3","vertebrae t2","vertebrae t1",
      "vertebrae c7","vertebrae c6","vertebrae c5","vertebrae c4","vertebrae c3","vertebrae c2",
      "vertebrae c1", "left rib 1","left rib 2","left rib 3","left rib 4","left rib 5","left rib 6",
      "left rib 7","left rib 8","left rib 9","left rib 10","left rib 11","left rib 12","right rib 1",
      "right rib 2","right rib 3","right rib 4","right rib 5","right rib 6","right rib 7","right rib 8",
      "right rib 9","right rib 10","right rib 11","right rib 12","left humerus","right humerus", "left scapula",
      "right scapula", "left clavicula", "right clavicula", "left femur", "right femur", "left hip", "right hip",
      "sacrum"
    ]
    this.updateOrganSelection(selected_organs_indx);
  };

  onLungsClickBtn = async () => {
    const selected_organs_indx = [
      "left lung upper lobe", "left lung lower lobe", "right lung upper lobe", "right lung middle lobe", 
      "right lung lower lobe", "trachea", "heart", "heart myocardium", "left heart atrium", "left heart ventricle", "right heart atrium",
      "right heart ventricle"
    ] 
    this.updateOrganSelection(selected_organs_indx);
  };
  onMusclesClickBtn = async () => {
    const selected_organs_indx = [
      "left gluteus maximus", "right gluteus maximus", "left gluteus medius", "right gluteus medius", "left gluteus minimus",
      "right gluteus minimus", "left autochthon", "right autochthon", "left iliopsoas", "left iliopsoas"
    ]
    this.updateOrganSelection(selected_organs_indx);
  };


  render() {
    const models = this.getModels();
    const display = models.length > 0 ? 'block' : 'none';
    const segInfo = this.segmentInfo();
    console.log(segInfo)
    if (Object.keys(this.state.selectedOrgans).length == 0 && models.length > 0) {
      this.state.selectedOrgans = this.getModelOrgans(models[0].id);
    }

    return (
      <div className='tab' style={{ 'display': display }}>
        <input
          type='radio'
          name='rd'
          id={this.tabId}
          className='tab-switch'
          value='segmentation'
          onClick={this.onSelectActionTab}
        />
        <label htmlFor={this.tabId} className='tab-label'>
          Class Prompts
        </label>
        <div className='tab-content'>
          <ModelSelector
            ref={this.modelSelector}
            name='segmentation'
            title='Segmentation VISTA'
            models={models}
            currentModel={this.state.currentModel}
            onClick={this.onRunInference}
            onSelectModel={this.onSelectModel}
            usage={
              <p style={{ fontSize: 'smaller' }}>
                <strong>Quick Prompts</strong> - Choose structures
              </p>
            }
          />
          <button
            className='tmpActionButton'
            onClick={this.onOrgansClickBtn}
            title={'Organs'}
            style={{ 'backgroundColor': '#00a4d9', 'marginRight': '2px' }}
          >
            Organs
          </button>

          <button
            className='tmpActionButton'
            onClick={this.onLungsClickBtn}
            title={'Lung'}
            style={{ 'backgroundColor': '#00a4d9' }}
          >
            Lung/Heart
          </button>
          <button
            className='tmpActionButton'
            onClick={this.onVascularClickBtn}
            title={'Vascular'}
            style={{ 'backgroundColor': '#00a4d9', 'marginRight': '2px' }}
          >
            Vascular
          </button>
          <button
            className='tmpActionButton'
            onClick={this.onBonesClickBtn}
            title={'Bones'}
            style={{ 'backgroundColor': '#00a4d9', 'marginRight': '2px' }}
          >
            Bones
          </button>


          <button
            className='tmpActionButton'
            onClick={this.onMusclesClickBtn}
            title={'Muscles'}
            style={{ 'backgroundColor': '#00a4d9', 'marginRight': '2px', 'marginTop': '2px' }}
          >
            Muscles
          </button>


          <br />
          <br />
          <p style={{ fontSize: 'smaller' }}>
            Select anatomies and click the "Run"
          </p>
          <br />

          <div className='optionsTableContainer'>
            <div className='bodyTableContainer'>
              <table className='optionsTable'>
                <tbody>
                {Object.entries(this.state.selectedOrgans).map(([k, v]) => (
                  <tr key={k}>
                    <td>
                      <input
                        type='checkbox'
                        checked={v}
                        onChange={e => this.onChangeOrgans(k, e)}
                      />
                    </td>
                    <td>
                      <span className='segColor' style={{ 'backgroundColor': this.segColorToRgb(segInfo[k]) }} />
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
