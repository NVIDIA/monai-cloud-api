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
    this.accessToken = "eyJraWQiOiJFUkNPOklCWFY6TjY2SDpOUEgyOjNMRlQ6SENVVToyRkFTOkJJTkw6WkxKRDpNWk9ZOkRVN0o6TVlVWSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJ2cjdoNWY3cmllbTgyNjBmaWk2YTVkbDNjMSIsImF1ZCI6Im5nYyIsImFjY2VzcyI6W10sImlzcyI6ImF1dGhuLm52aWRpYS5jb20iLCJvcHRpb25zIjpbXSwiZXhwIjoxNzEwMzgzNzI0LCJpYXQiOjE3MTAzODMxMjQsImp0aSI6IjllMzU1MDc3LWY5ZDAtNGNiYi05ZjcxLTBhYTE1NDY5MTcwOSJ9.ivqgm-Ob2vuDsVVY3SRtUAbgBOnfffK8Q6afP8Io9lANjsGiDvZEgcumv7t-xPmsL4m4LSI5vEMParjpls5S3wjOIztyOEDnTyxSFTAYrv3QKg2TPhFKg7uHi197l6UsA2qCxs5Fd-Qysv07lEs3gKqnE80H9m90WCx5ZLR__Tgtf9yOk8CWL5tKsHFcX9_ra9GnnUTkhqzXlb57E335B87nHGXcQu0h-cVtTsur-xVcTTgtH_iQhzIdlfr6xv-zqyEKcPo1UMScB9dNdABzUiAhlkuBYdS06-GvV-oNeh_uZ4ZGY-0nyR2OorrccUQQsRGsOWE7M0MX6dbYmniFfwkiDQHSsfTl8AhuV_Iic8kbDqEm24aoXGTQB0dlhI8MNmZ4sR2L0BBuJA1SsQUGJ_vrC4vH_Okg6qAI3iEXMdl01jquH0jEMySdESpORJ6gN2lOuWJGfyrlvK0NbvlW8WaQl7IrV7csqqaRfPuRyop_NidFub7e0iwgN4p6HxJ0JhguXWOboL2dDGZuAuNpZ8nz68KdGkmO9iYHiqhMuJ54ZzVJtX0Z4DXq8JVNdAY-RKB65QIfpv5lZ6gtKBvscHDMfracv-uTjoDuSNVglwtKPtoU98X-7Fs99kVJHpiAJNZmkndYfKvV7z5YWIzDAY-_SbH5WadaT3v-T-Ouk4Y"
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
      'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : undefined,
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
        'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : undefined,
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
