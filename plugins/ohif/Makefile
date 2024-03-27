TAG=latest
IMAGE=monai-service-ohif
CONTAINER_NAME=$(IMAGE):$(TAG)

SHELL := /bin/bash

.PHONY: dev

dev: prepare
	@echo "Building OHIF + Monai Service Plugin (local development)..."
	cd Viewers/extensions; ln -s ../../extensions/monai-service monai-service
	cd Viewers/modes; ln -s ../../modes/monai-service monai-service
	cd Viewers; sed -i 's/--max_old_space_size=4096/--max_old_space_size=8192/' ./platform/app/package.json

	@echo "Do patches..."
	cp patches/Viewers/extensions/cornerstone-dicom-seg/src/panels/PanelSegmentation.tsx Viewers/extensions/cornerstone-dicom-seg/src/panels/PanelSegmentation.tsx\
	cp patches/Viewers/extensions/cornerstone-dicom-seg/src/commandsModule.ts Viewers/extensions/cornerstone-dicom-seg/src/commandsModule.ts
	cp patches/Viewers/extensions/default/src/Actions/createReportAsync.tsx Viewers/extensions/default/src/Actions/createReportAsync.tsx

	cd Viewers; yarn config set workspaces-experimental true
	cd Viewers; yarn install
	cd Viewers; yarn run cli list
	cd Viewers; QUICK_BUILD=true APP_CONFIG=config/monai_service.js yarn run build


docker: prepare
	@echo "Building Docking..."
	cp -r extensions/monai-service Viewers/extensions/
	cp -r modes/monai-service Viewers/modes

	docker build --network=host -t $(CONTAINER_NAME) -f dockerfile .

prepare: pull-all
	@echo "Preparing OHIF + MONAI Service Plugin..."
	@cd config; source .env; envsubst '$$NGINX_WWW_ROOT, $$DICOM_WEB_URI, $$MONAI_SERVICE_URI, $$DICOM_WEB_AUTH, $$MONAI_SERVICE_API_KEY' < nginx.conf.template > nginx.conf
	@cd config; source .env; envsubst '$$MONAI_SERVICE_USER_ID, $$MONAI_SERVICE_DATASET_ID' < monai_service.js.template > monai_service.js

	cd Viewers; git apply ../extensions.patch
	cp config/monai_service.js Viewers/platform/app/public/config/

pull-all: init
	@echo "Pull All Submodules..."
	@git pull --recurse-submodules

update-all:
	@echo "Update All Submodules for latest commit..."
	@git submodule update --remote

init: clean
	@echo "Init Submodules..."
	@git submodule update --init --recursive
	@cd Viewers; git checkout -- .

clean:
	@echo "Clean Submodules..."
	@rm -rf dist logs Viewers/*
	@rm -rf */monai-service/node_modules
	@rm -rf config/monai_service.js config/nginx.conf

nginx:
	mkdir -p logs
	cp -f config/monai_service.js Viewers/platform/app/dist/app-config.js
	nginx -p `pwd` -c config/nginx.conf -e logs/error.log
