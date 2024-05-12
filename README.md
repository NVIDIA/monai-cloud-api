# Introduction to NVIDIA MONAI Cloud APIs

The NVIDIA MONAI Cloud APIs offer a comprehensive suite of tools designed to enhance workflows in medical imaging through interactive annotation, training, and inference. Here's an overview of their key features and how to get started:

## What are NVIDIA MONAI Cloud APIs?

NVIDIA MONAI Cloud APIs is an NVIDIA-managed solution, focusing on making the medical imaging lifecycle easier with service integration from annotation, to training, to inference. With a foundation in the [MONAI ecosystem](https://monai.io/), these APIs offer a seamless interface to researchers and data scientists aiming to deploy, manage, and refine AI models in medical imaging applications.

## Key Features

1. **Interactive AI Annotation**: 
   - Utilizes the VISTA-3D foundation model.
   - Supports interactive AI annotation, enabling ongoing improvement of AI models through user feedback and new data integration.

2. **Auto3DSeg**:
   - Focuses on automating the process of 3D segmentation model creation.
   - Implements best practices to deliver state-of-the-art segmentation performance

3. **VISTA-3D Model**:
   - A robust foundation model, trained on 132 classes encompassing various organs and tumors.
   - The model's training and validation involved CT images from over 4,000 patients, ensuring its high accuracy and reliability for medical image analysis.

4. **VISTA-2D Model**:
   - VISTA-2D is a cutting-edge model specifically designed for cell image segmentation.
   - Built on the flexible Meta SAM architecture and adapted for cell imaging, VISTA-2D outperforms the current leading model, Cellpose 2.0. It can be fine-tuned on customer-specific data to deliver unparalleled accuracy in segmenting cells and employs a more generalized approach that adapts more easily to different cell types.

5. **MAISI Model**
   - The Synthetic Data Generation Model is an advanced generative AI model that creates high-quality 3D CT images with or without anatomical annotations.
   - It generates high-resolution images (512 × 512 × 512) with a voxel size of 1.0 × 1.0 × 1.0 mm³ and supports up to 132 anatomical classes, including organs and tumors.
   - This model excels in data augmentation, creating realistic medical imaging data to supplement limited datasets due to privacy concerns or rare conditions.


### How to Get Started

To begin using the NVIDIA MONAI Cloud APIs, you can sign up for early access by filling out this survey: [NVIDIA MONAI Cloud API Early Access](https://developer.nvidia.com/nvidia-monai-cloud-api-early-access-program/join). 
