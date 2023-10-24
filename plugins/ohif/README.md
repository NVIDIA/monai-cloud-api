

## MONAI Service Plugin for OHIF V3 Viewer


### Requirements
- [NodeJS](https://nodejs.org/en) 18x/20x
  - Follow Instructions: https://github.com/nodesource/distributions#installation-instructions
- `sudo sh requirements.sh` (installs yarn and nginx)

### Development setup
```
make dev
```

#### Run as Yarn (Continous Devlopment)
```bash
cd Viewers

# Update MONAI Service configs (Host, UserId, Dataset etc..) 
vim extensions/src/monai-service/config.json

# Run Yarn with Orthanc as Proxy
yarn run dev:orthanc
```

#### Run as NGINX
```bash
# Update Variables
vim config/.env

# Run nginx
make run
```

### Docker Build
```
make docker
```

To run docker pass the required Environment Variables
```
HOST_IP=`hostname -I | cut -d' ' -f1`
NGC_API_KEY=<API_KEY>

docker run --rm -ti -p 3000:3000 \
  -e DICOM_WEB_URI=http://${HOST_IP}:8042/ \
  -e MONAI_SERVICE_URI=http://${HOST_IP}:8008/api/v1/ \
  -e MONAI_SERVICE_USER_ID=9967f4fc-5a63-11ee-8c99-0242ac120002 \
  -e MONAI_SERVICE_DATASET_ID=77793b86-71b8-4b55-a53c-de9af4fc7ec5 \
  -e DICOM_WEB_AUTH="Basic `echo -n 'user:passwd' | base64`" \
  -e MONAI_SERVICE_AUTH="Bearer `curl -s https://authn.nvidia.com/token -H "Authorization: ApiKey ${NGC_API_KEY}" | jq '.token' | tr -d '"'`" \
  monai-service-ohif:latest
```

Visit: http://localhost:3000/  to access OHIF with MONAI Service plugin enabled.

### Installing Orthanc (DICOMWeb)

#### Ubuntu 20.x

```bash
# Install Orthanc and DICOMweb plugin
sudo apt-get install orthanc orthanc-dicomweb -y

# Install Plastimatch
sudo apt-get install plastimatch -y
```

However, you must upgrade to the latest version by following the steps mentioned on the [Orthanc Installation Guide](https://book.orthanc-server.com/users/debian-packages.html#replacing-the-package-from-the-service-by-the-lsb-binaries)

```bash
sudo service orthanc stop
sudo wget https://lsb.orthanc-server.com/orthanc/1.9.7/Orthanc --output-document /usr/sbin/Orthanc
sudo rm -f /usr/share/orthanc/plugins/*.so

sudo wget https://lsb.orthanc-server.com/orthanc/1.9.7/libServeFolders.so --output-document /usr/share/orthanc/plugins/libServeFolders.so
sudo wget https://lsb.orthanc-server.com/orthanc/1.9.7/libModalityWorklists.so --output-document /usr/share/orthanc/plugins/libModalityWorklists.so
sudo wget https://lsb.orthanc-server.com/plugin-dicom-web/1.6/libOrthancDicomWeb.so --output-document /usr/share/orthanc/plugins/libOrthancDicomWeb.so

sudo service orthanc restart
```
