# MONAI Cloud API Notebook Collection

Welcome to the MONAI Cloud API Notebook Collection. This directory contains a series of Jupyter notebooks and resources designed to help you understand and utilize MONAI Cloud APIs for medical imaging tasks.

## To Get Started

To make the most of NVIDIA MONAI Cloud APIs, we've laid out a pathway depending on where you're at in your journey. Here's a step-by-step approach to get you started:

### 1. Get Your Credentials
Your first step is to secure credentials that allow you to interact with the APIs. This is pivotal as it ensures a secure, personalized experience.

- [Generating and Managing Your Credentials](./Generating%20and%20Managing%20Your%20Credentials.ipynb)

### 2. Set Up Dataset and Model
Once you have your credentials, it's time to dive into the heart of the system. This step involves preparing your medical datasets and choosing the right model for your specific needs.

- [Dataset Creation and Experiment Selection](./Dataset%20Creation%20and%20Experiment%20Selection.ipynb)
- [Perform Real-time Inference](./Perform%20Real-time%20Inference.ipynb)

### 3. Generate Synthetic Medical Images
Next, we'll learn how to generate synthetic medical images using the MAISI tool.
Before running the notebook, ensure you have a cloud storage bucket to store the generated images.

- [Medical Image Generation with MAISI](./Medical%20Image%20Generation%20with%20MAISI.ipynb)


### 4. Training and Inferencing with a Provided Network
Discover how to train a segmentation model using MONAI VISTA segmentation bundles to assist annotation.

- [Training a MONAI Segmentation Bundle](./Training%20a%20MONAI%20Segmentation%20Bundle.ipynb)


## Advanced Topics

### Training a Custom Bundle
Dive into the process of training a custom MONAI bundle for specialized tasks

- [Training a Custom MONAI Bundle](./Training%20a%20Custom%20MONAI%20Bundle.ipynb)


### Working with MONAI Auto3DSeg using MONAI Cloud API
Learn about working with MONAI Auto3DSeg, a tool for automated 3D segmentation, through MONAI Cloud API.

- [Working with MONAI Auto3DSeg using MONAI Cloud API](./Working%20with%20MONAI%20Auto3DSeg%20using%20MONAI%20Cloud%20API.ipynb)


### Annotation and Continual Learning Jobs
With your data and model in place, harness the power of NVIDIA MONAI Cloud APIs to kickstart the annotation process. This section delves deep into the functionalities that drive continual learning.

- [Annotation and Continual Learning Overview](./Annotation%20and%20Continual%20Learning%20Overview.ipynb)

### OHIF Viewer and Plugin Setup
Visualization is key in medical imaging. Learn how to integrate the OHIF Viewer with NVIDIA MONAI Cloud APIs for an interactive and enriching user experience.

- [OHIF Setup Guide](../plugins/ohif/README.md)

### DICOMWeb Server Setup
If you're handling DICOM data, setting up a DICOMWeb server is a foundational step. This guide will provide a comprehensive overview, ensuring smooth communication between your data storage and the APIs.

- [DICOMWeb Server Configuration](https://www.orthanc-server.com/static.php?page=dicomweb)

## List of Notebooks

- [Generating and Managing Your Credentials.ipynb](Generating%20and%20Managing%20Your%20Credentials.ipynb)
- [Dataset Creation and Experiment Selection.ipynb](Dataset%20Creation%20and%20Experiment%20Selection.ipynb)
- [Perform Real-time Inference.ipynb](./Perform%20Real-time%20Inference.ipynb)
- [Perform Real-time Inference with a Custom MONAI Bundle.ipynb](./Perform%20Real-time%20Inference%20with%20a%20Custom%20MONAI%20Bundle.ipynb)
- [Training a MONAI Segmentation Bundle.ipynb](Training%20a%20MONAI%20Segmentation%20Bundle.ipynb)
- [Training a VISTA2d Bundle.ipynb](Training%20a%20VISTA2d%20Bundle.ipynb)
- [Training a Custom MONAI Bundle.ipynb](Training%20a%20Custom%20MONAI%20Bundle.ipynb)
- [Working with MONAI Auto3DSeg using MONAI Cloud API.ipynb](Working%20with%20MONAI%20Auto3DSeg%20using%20MONAI%20Cloud%20API.ipynb)
- [Medical Image Generation with MAISI.ipynb](Medical%20Image%20Generation%20with%20MAISI.ipynb)
- [Annotation and Continual Learning Overview.ipynb](Annotation%20and%20Continual%20Learning%20Overview.ipynb)


## How to Use
Clone this repository or download the notebooks.
Ensure you have Jupyter Notebook or JupyterLab installed to open .ipynb files.
Follow the instructions in each notebook for a step-by-step guide to using MONAI Cloud APIs.


Thank you for exploring the MONAI Cloud API Notebook Collection. We hope these resources assist you in your journey towards mastering medical imaging tasks using MONAI Cloud APIs.