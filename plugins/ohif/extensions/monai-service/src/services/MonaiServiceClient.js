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

import axios from 'axios';
import config from '../config.json';
import { cache } from '@cornerstonejs/core';

export default class MonaiServiceClient {
  constructor() {
    if (!window.config.monaiService) {
      window.config.monaiService = {
        server: config['MONAI_SERVICE_API_ENDPOINT'],
        userId: config['MONAI_SERVICE_USER_ID'],
        datasetId: config['MONAI_SERVICE_DATASET_ID'],
        accessToken: config['MONAI_SERVICE_ACCESS_TOKEN']
      }
    }

    this.api_endpoint = window.config.monaiService.server;
    this.user_id = window.config.monaiService.userId;
    this.dataset_id = window.config.datasetId ? window.config.datasetId : window.config.monaiService.datasetId;
    this.accessToken = window.config.accessToken;

    this.base_url = `${this.api_endpoint}/user/${this.user_id}`;
  }

  async list_models() {
    const url = `${this.base_url}/model?user_only=true`;
    return await this.api_get(url);
  }

  async list_datasets() {
    const url = `${this.base_url}/dataset`;
    return await this.api_get(url);
  }

  async cache_image(seriesInstanceUID) {
    const url = `${this.base_url}/dataset/${this.dataset_id}/job/cacheimage`;
    const data = {
      'image': seriesInstanceUID,
    };
    return await this.api_post(url, data);
  }

  async next_image() {
    console.log('load next series');
    const url = `${this.base_url}/dataset/${this.dataset_id}/job/nextimage`;
    const data = {};
    return await this.api_post(url, data);
  }
  
  async notify(data) {
    console.log('load next series');
    const url = `${this.base_url}/dataset/${this.dataset_id}/job/notify`;
    return await this.api_post(url, data);
  }

  async inference(model_id, seriesInstanceUID, params = {}, result_extension = '.nrrd') {
    const url = `${this.base_url}/model/${model_id}/job/inference`;
    const data = {
      'image': seriesInstanceUID,
      'bundle_params': params,
    };
    console.log(data);
    // cache the current annotation in case of recovery loop
    const segVolumeObject = cache.getVolume('1');
    const currentSegArray = new Uint8Array(segVolumeObject.scalarData.length);
    currentSegArray.set(segVolumeObject.scalarData);
    window.ScalarDataBuffer = currentSegArray;

    return await this.api_post(url, data, 'arraybuffer');
  }

  api_get(url) {
    console.debug('GET:: ' + url);
    if (this.accessToken) {
      axios.defaults.headers.common['Authorization'] = this.accessToken;
    }

    return axios.get(url)
      .then(function(response) {
        console.debug(response);
        return response;
      })
      .catch(function(error) {
        return error;
      })
      .finally(function() {
      });
  }

  api_post(url, body, responseType = 'json') {
    if (this.accessToken) {
      axios.defaults.headers.common['Authorization'] = this.accessToken;
    }

    console.debug('POST:: ' + url);
    return axios.post(url, body, {
      responseType: responseType,
      headers: {
        accept: ['application/json', 'multipart/form-data'],
      },
    }).then(function(response) {
      console.debug(response);
      return response;
    }).catch(function(error) {
      return error;
    }).finally(function() {
    });
  }
}
