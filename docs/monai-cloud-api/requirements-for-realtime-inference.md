# How to Prepare a Custom Bundle for Real-Time Inference

This guide explains the requirements to prepare a custom bundle for real-time inference using MONAI.

## Bundle Requirements

To ensure compatibility, your bundle must adhere to the following requirements:

1. Follow the [MONAI Bundle Specification](https://docs.monai.io/en/latest/mb_specification.html): Your bundle should conform to the structure and components outlined in the MONAI Bundle Specification. This specification defines the necessary files, folders, and configurations required for a bundle to work seamlessly with MONAI's real-time inference pipeline.

2. At a minimum, include these necessary files:

- `configs/metadata.json`
- `configs/logging.conf`
- `configs/inference.json` (or using `.yml`, `.yaml`)

## Required Keys

Implement the following keys in your bundle:

- `bundle_root`
- `output_dir`

## Required Components

Implement the following components in your bundle:

- `"evaluator"` (with `run()` function)
- `"dataset"` (with `data` argument)

## Version Compatibility

Ensure your bundle is compatible with `monai==1.3.0` and `torch==1.13.1`.

## Bundle Examples

To help you understand the structure and components of a MONAI bundle, you can refer to the following bundle examples:

- Classification bundle: https://github.com/Project-MONAI/model-zoo/tree/dev/models/endoscopic_inbody_classification
- Detection bundle: https://github.com/Project-MONAI/model-zoo/tree/dev/models/lung_nodule_ct_detection
- Segmentation bundle: https://github.com/Project-MONAI/model-zoo/tree/dev/models/spleen_ct_segmentation

## Notebook Example

For a detailed, step-by-step walkthrough of using a custom MONAI bundle for real-time inference, refer to the notebook:
[Perform Real-time Inference with a Custom MONAI Bundle.ipynb](../../notebooks/Perform%20Real-time%20Inference%20with%20a%20Custom%20MONAI%20Bundle.ipynb).

In the "Configuring Experiment to Enable the Real-time Inference" section of the example notebook, you'll need to provide the URL to the location of your custom bundle in the bundle_url parameter when creating an experiment. Replace the URL used in the notebook with the URL pointing to your own bundle.
