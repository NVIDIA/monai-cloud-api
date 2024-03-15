# MONAI Cloud API User Documentation

## Structure

The [contents.md](monai-cloud-api/contents.md) page creates outline for the documentation. The corresponding markdown (`.md`) files are named as `xxxx-xxx-.md` for each related page.

## Developing

The `launch.sh` script will create and launch the container for you:
1. `launch.sh build` to build the Docker container
2. `launch.sh dev` to run the container and execute `bash recompile_html.sh` inside the container. This will regularly recompiles the html

If you don't want to run the `recompile_html.sh` script to use the sphinx-autobuild feature, you can run the following command either inside the container or directly on the workstation: 

```bash
PORT=8080 && python3 -m http.server ${PORT} --directory build/html
```