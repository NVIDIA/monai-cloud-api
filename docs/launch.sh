#!/bin/bash
DEV_CONT_NAME=sphinx
MONAI_CLOUD_API_IMAGE=monai-cloud-api-docs

build() {
    docker build -f Dockerfile.docs -t ${MONAI_CLOUD_API_IMAGE} .
}

dev() {
    CMD='bash'
    DOCKER_CMD="docker run --network host "
    DOCKER_CMD="${DOCKER_CMD} -v ${PWD}:/docs --workdir /docs "
    DOCKER_CMD="${DOCKER_CMD} -v /etc/passwd:/etc/passwd:ro "
    DOCKER_CMD="${DOCKER_CMD} -v /etc/group:/etc/group:ro "
    DOCKER_CMD="${DOCKER_CMD} -v /etc/shadow:/etc/shadow:ro "
    DOCKER_CMD="${DOCKER_CMD} -u $(id -u):$(id -g) "
    DOCKER_CMD="${DOCKER_CMD} -v ${HOME}/.ssh:${HOME}/.ssh:ro "
    DOCKER_CMD="${DOCKER_CMD} -v ${PWD}/.vscode-server:${HOME}/.vscode-server:rw "
    set -x
    ${DOCKER_CMD} --rm -it --name ${DEV_CONT_NAME} ${MONAI_CLOUD_API_IMAGE} ${CMD}
    set +x
    exit
}


attach() {
    set -x
    DOCKER_CMD="docker exec"
    CONTAINER_ID=$(docker ps | grep ${DEV_CONT_NAME} | cut -d' ' -f1)
    ${DOCKER_CMD} -it ${CONTAINER_ID} /bin/bash
    exit
}

usage () {
                    echo \
"To build, start or attach to MONAI Cloud API Documentation Build Container
Example:
    To build MONAI Cloud API Documentation Build Container
        ./launch.sh build
    To start MONAI Cloud API Documentation Build Container for development
        ./launch.sh dev
"

}

case $1 in
    build | dev | attach)
        $@
        ;;
    *)
        usage
        ;;
esac
