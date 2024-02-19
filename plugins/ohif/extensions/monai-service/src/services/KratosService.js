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

export default class KratosServiceClient {
  constructor() {
    if (!window.config.monaiService) {
      window.config.monaiService = {
        server: config['MONAI_SERVICE_API_ENDPOINT'],
        userId: config['MONAI_SERVICE_USER_ID'],
        datasetId: config['MONAI_SERVICE_DATASET_ID'],
        SSAToken: config['Kratos_SSA_TOKEN']
      }
    }

    this.api_endpoint = window.config.monaiService.server;
    this.user_id = window.config.monaiService.userId;
    this.dataset_id = window.config.datasetId ? window.config.datasetId : window.config.monaiService.datasetId;
    this.SSAToken = window.config.SSAToken;
    this.base_url = `${this.api_endpoint}/users/${this.user_id}`;
    this.cloudEvents_JSON = this._init_config_file()
    console.log('this base url', this.base_url)
  }

  _init_config_file() {    
    const kratos_config = {
      "specversion": "1.0",     
      "id": "fe5302cf-1887-48a9-8e6e-117d366a7344",  
      "time": "2022-06-01T12:30:00.123456Z",          
      "source": "service_zone-name_machine-uuid",   
      "type": "some-event-type",                    
      "subject": "some-event-subject",             
      "data": {                           
        "StringField1": "abc",
        "StringField2": "def",
        "IntegerField3": 1,
        "FloatField4": 3.3,
        "NestedField5": {
          "NestedStringField1": "xyz",
          "NestedIntegerField2": 2
        },
        "StringField6": "ghi",
        "IPField7": "10.1.2.3",
        "TimestampField8": "2022-06-01T12:30:00.123Z"
      }
    }

    return kratos_config
  }


  async fetch_SSA_token(clientId, clientSecret) {
    const credentials = `${clientId}:${clientSecret}`;
    const base64Credentials = Buffer.from(credentials).toString('base64')

    const url = 'https://hvgfdxorrc6-em5mhrg7o3lr5skadstwarphmyuy4lg.ssa.nvidia.com/token';
    const postData = 'grant_type=client_credentials&scope=telemetry-write';

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Credentials}`
        },
        body: postData
    };

    fetch(url, options)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
  }

  async send_telemetry(eventData) {
    const url = 'https://prod.analytics.nvidiagrid.net/api/v2/topic/your-kratos-collector-id';

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/cloudevents+json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
    };

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        console.log('Response:', responseData);
    } catch (error) {
        console.error('Error:', error);
    }
  }

  async update_telemetry(telemetryFile) {
    const url = 'https://prod.analytics.nvidiagrid.net/api/v2/topic/your-kratos-collector-id';

    function writeToFileSync() {
      this._ignore_event_config = true;
      fs.writeFileSync(this._datastore_config_path, JSON.stringify(this._datastore, (key, value) => key === "base_path" ? undefined : value, 2));
      this._config_ts = fs.statSync(this._datastore_config_path).mtime;
      console.log("+++ Telemetry is updated...");
    }
    writeToFileSync.call(this);
  }

  async status() {
    const url = 'https://prod.analytics.nvidiagrid.net/api/v2/topic/your-kratos-collector-id';
    const dict = {}
    return {
      "completed":{}
    }
  }

  api_get(url) {
    console.debug('GET:: ' + url);
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
    if (this.accessToken) {
      axios.defaults.headers.common['Authorization'] = this.accessToken;
    }

    console.debug('POST:: ' + url);
    return axios.post(url, body, {
      responseType: responseType,
      headers: {
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
