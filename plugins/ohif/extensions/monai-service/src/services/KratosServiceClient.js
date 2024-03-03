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
      require('dotenv').config();

      this.axios = require('axios');
      this.fs = require('fs');
      this.https = require('https');
      const { exec } = require('child_process');
      this.os = require('os');
      this.path = require('path');
      
      //TODO: set SERVER IP and TELEMETRY Server in NGINX conf
      this.TAO_CERTIFICATES_URL = "https://gitlab-master.nvidia.com/vpraveen/python_wheels/-/raw/main/certs/certificates.tar.gz";
      this.TAO_SERVER_IP = "10.111.60.42";
      this.TAO_TELEMETRY_SERVER = "https://tao-telemetry.nvidia.com:9443/api/v1/telemetry"
      
    }

    console.log('this base url', this.base_url)
  }

  
  urlExists(url) {
      return new Promise((resolve, reject) => {
          https.get(url, { method: 'HEAD' }, (res) => {
              resolve(res.statusCode === 200);
          }).on('error', (err) => {
              resolve(false);
          });
      });
  }
  
  async getCertificates() {
      const certificatesUrl = process.env.TAO_CERTIFICATES_URL || TAO_CERTIFICATES_URL;
      if (!await urlExists(certificatesUrl)) {
          throw new Error("Url for the certificates not found.");
      }
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'certs-'));
      const downloadCommand = `wget ${certificatesUrl} -P ${tmpDir} --quiet`;
      return new Promise((resolve, reject) => {
          exec(downloadCommand, (error, stdout, stderr) => {
              if (error) {
                  reject(new Error("Download certificates.tar.gz failed."));
                  return;
              }
              const tarfilePath = path.join(tmpDir, "certificates.tar.gz");
              resolve(tmpDir);
          });
      });
  }
  
  async sendTelemetryData(network, action, gpuData, numGpus = 1, timeLapsed = null) {
      if (process.env.TELEMETRY_OPT_OUT?.toLowerCase() === "no" || process.env.TELEMETRY_OPT_OUT?.toLowerCase() === "false" || process.env.TELEMETRY_OPT_OUT === "0") {
          const url = this.TAO_TELEMETRY_SERVER;
          const data = {
              version: process.env.TAO_TOOLKIT_VERSION || "4.22.11",
              action: action,
              network: network,
              gpu: gpuData.slice(0, numGpus).map(device => device.name),
              gpu_details: gpuData.slice(0, numGpus)
          };
          if (timeLapsed !== null) {
              data.time_lapsed = timeLapsed;
          }
          try {
              const certificateDir = await getCertificates();
              const cert = ['client-cert.pem', 'client-key.pem'].map(item => path.join(certificateDir, item));
              const verify = path.join(certificateDir, 'ca-cert.pem');
              await axios.post(url, data, {
                  httpsAgent: new https.Agent({
                      cert: fs.readFileSync(cert[0]),
                      key: fs.readFileSync(cert[1]),
                      ca: fs.readFileSync(verify)
                  })
              });
              console.log(`Telemetry data posted: \n${JSON.stringify(data, null, 4)}`);
          } catch (error) {
              console.error(error);
          }
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
