# Requirements for doing Real-Time Inference with Custom Bundles

## Basic requirements

Bundle should follow [MONAI Bundle Specification](https://docs.monai.io/en/latest/mb_specification.html)

## Necessary files

- `configs/metadata.json`
- `configs/logging.conf`
- `configs/inference.json` (or using `.yml`, `.yaml`)

## Necessary components

- `"evaluator"` (with `run()` function)
- `"dataset"` (with `data` argument)

## Library requirements

Only `monai_version==1.3.0` and `torch==1.13.1` are supported. For any other required libraries, please ensure that their versions are compatible with the `monai` and `torch` versions. Please include your library names and versions within `optional_packages_version` in `configs/metadata.json`, and they should be able to be installed by `pip`.

## Bundle Examples

- classification bundle example: https://github.com/Project-MONAI/model-zoo/tree/dev/models/endoscopic_inbody_classification
- detection bundle example: https://github.com/Project-MONAI/model-zoo/tree/dev/models/lung_nodule_ct_detection
- segmentation bundle example: https://github.com/Project-MONAI/model-zoo/tree/dev/models/spleen_ct_segmentation

## Notebook Example

Please check the notebook [Perform Real-time Inference with a Custom MONAI Bundle.ipynb](../../notebooks/Perform%20Real-time%20Inference%20with%20a%20Custom%20MONAI%20Bundle.ipynb) for details
