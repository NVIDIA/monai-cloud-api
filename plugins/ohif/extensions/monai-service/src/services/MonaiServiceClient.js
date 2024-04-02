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
    this.accessToken = window.config.accessToken ? window.config.accessToken : window.config.monaiService.accessToken;
    console.log(window.config.accessToken)
    console.log(window.config.monaiService.accessToken)
    console.log('init accessToken', this.accessToken)
    this.accessToken = "eyJraWQiOiJFUkNPOklCWFY6TjY2SDpOUEgyOjNMRlQ6SENVVToyRkFTOkJJTkw6WkxKRDpNWk9ZOkRVN0o6TVlVWSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJ2cjdoNWY3cmllbTgyNjBmaWk2YTVkbDNjMSIsImF1ZCI6Im5nYyIsImFjY2VzcyI6W10sImlzcyI6ImF1dGhuLm52aWRpYS5jb20iLCJvcHRpb25zIjpbXSwiZXhwIjoxNzEyMDc2Mjg5LCJpYXQiOjE3MTIwNzU2ODksImp0aSI6ImVlNGZlOThiLTVkOTktNDVhZC1iZDdlLWQ5MGJkNjVkMDcyNSJ9.U68aoiTOFc4_CFL7CSXb4aTp3p4CDMyxvci9llEc8jAMfC5AEVYRbMwKnpxg9LVOfCBS9s6lnmjb9mRB4x4WrBJuzXol9KH-pTzwFbrV6Xp5WhF7eU79N3nMOUBZ9rNjZhfUwelsZh2IRcEkWS6eYvme_MrrnsaQQWop9tzgaH6GFuB-3lPV86u_1EvCBiN7Jj7ge6xO680dRHzAuDh8AxaYHHR-g58K0AeVJnvs2aUWRQIuHSMGJgfUGQS_ikF6SyQRmHHx_sTqNuaDUOig_36PCmx2z42y1rWiMwbDF8O_LkVKsNN1s2eaAR-EcO8RI-SmRHFa-6CeZWhtQ52rwtVpy-padoekEoVrJ7k8vqR_QJcPKfHwT1Pi73NmfYcTigrYdysKtEgWOMXOoiQocWpRl7_QvcY0yMG-ZjSCKZnEbBN09N-JGFsy2r3c_l1Yg04opgUxVII_5T66HDbUbnSTzwvVNC_ocksntOZChctZB1FiylYRg5DWfN0X8cFt0TkLbT7FngvaYzmhSsupZX9KpzDgj6jXOlOLQhVEtBLCzePOb-LWKxVGp1SYHytkfwQC73hL4c1H2zGGti63jEzycORwjgAJTXp5ZJgGRPRUMoiUvc3yNgwLtzSM6ua2cUf36vMXrsOiYwsY0osRi9fSn9XCQsbOqJO8J99YM60"
    // this.base_url = `${this.api_endpoint}/users/${this.user_id}`;
    this.base_url = `${this.api_endpoint}/orgs/iasixjqzw1hj`;

    console.log('this base url', this.base_url)
  }

  async list_models() {
    const url = `${this.base_url}/experiments`;
    console.log("check URL", url)
    return await this.api_get(url);
  }

  async list_datasets() {
    const url = `${this.base_url}/datasets`;
    return await this.api_get(url);
  }

  async cache_image(seriesInstanceUID) {
    console.log(this.dataset_id)
    const url = `${this.base_url}/datasets/${this.dataset_id}/jobs`;
    const specs = {
      "image":seriesInstanceUID,
      "ttl": 60
    }
    const data = {
      'action':'cacheimage',
      'specs': specs
    };
    console.log(seriesInstanceUID)
    return await this.api_post(url, data);
  }

  async next_image() {
    console.log('load next series');
    const url = `${this.base_url}/datasets/${this.dataset_id}/jobs`;
    const data = {
      'action':'nextimage',
    };
    return await this.api_post(url, data);
  }
  
  async notify(specs) {
    console.log('load next series');
    const url = `${this.base_url}/datasets/${this.dataset_id}/jobs`;
    const data = {
      "action": "notify", 
      "specs": specs
    }
    return await this.api_post(url, data);
  }

  async inference(model_id, seriesInstanceUID, params = {}, result_extension = '.nrrd') {
    const url = `${this.base_url}/experiments/${model_id}/jobs`;

    const inference_specs = {
      'image': seriesInstanceUID,
      'bundle_params': params,
    };
    const data = {"action": "inference", "specs": inference_specs}
    console.log('data', data);
    // cache the current annotation in case of recovery loop
    const segVolumeObject = cache.getVolume('monaiservice');
    console.log('segVolumeObject', segVolumeObject)
    if (segVolumeObject && segVolumeObject.hasOwnProperty('scalarData')) {
      // The 'segVolumeObject' exists and has the 'scalarData' property
      const currentSegArray = new Uint8Array(segVolumeObject.scalarData.length);
      currentSegArray.set(segVolumeObject.scalarData);
      window.ScalarDataBuffer = currentSegArray;
    }
    return await this.api_post(url, data, 'arraybuffer');
  }

  api_get(url) {
    console.debug('GET:: ' + url);
    console.log(this.accessToken)
    if (this.accessToken) {
      axios.defaults.headers.common['Authorization'] = this.accessToken;
    }
    
    return axios.get(url,{
      headers: {
      'Authorization': this.accessToken ? `${this.accessToken}` : undefined,
      },
      verify: false
      })
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
    console.log('POST URL', url)
    console.log(this.accessToken)

    if (this.accessToken) {
      axios.defaults.headers.common['Authorization'] = this.accessToken;
    }

    console.debug('POST:: ' + url);
    return axios.post(url, body, {
      responseType: responseType,
      headers: {
        // 'Authorization': this.accessToken ? `${this.accessToken}` : undefined,
        accept: ['application/json', 'multipart/form-data'],
      },
      verify:false
    }).then(function(response) {
      console.debug(response);
      console.log(response)
      return response;
    }).catch(function(error) {
      console.log(error)
      return error;
    }).finally(function() {
    });
  }
}
