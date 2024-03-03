The NVIDIA MONAI Cloud APIs offer a comprehensive suite of tools designed to enhance workflows in medical imaging through interactive annotation, training, and inference. Here's an overview of their key features and how to get started:

## Key Features


1. **Interactive AI Annotation**: 
   - Utilizes the VISTA-3D foundation model.
   - Supports interactive AI annotation, enabling ongoing improvement of AI models through user feedback and new data integration.

2. **Auto3DSeg**:
   - Focuses on automating the process of 3D segmentation model creation.
   - Implements best practices to deliver state-of-the-art segmentation performance

3. **VISTA-3D Model**:
   - A robust foundation model, trained on 117 classes encompassing various organs and tumors.
   - The model's training and validation involved CT images from over 4,000 patients, ensuring its high accuracy and reliability for medical image analysis.

4. OHIF Plugin and Overviews:
   - [Getting Started with OHIF Plugin](#getting-started-with-ohif-plugin)
   - [Setup Customized OHIF ](https://github.com/NVIDIA/monai-cloud-api/tree/main/plugins/ohif)
   - [OHIF Applications and UI Demo](#basic-ohif-instruction)
   - [Notebook: Annotation and OHIF Overview](https://github.com/NVIDIA/monai-cloud-api/blob/main/notebooks/Annotation%20and%20Continuous%20Learning%20Overview.ipynb)


## How to Get Started

To begin using the NVIDIA MONAI Cloud APIs, you can sign up for early access by filling out this survey: [NVIDIA MONAI Cloud API Early Access](https://developer.nvidia.com/nvidia-monai-cloud-api-early-access-program/join). 

## Getting Started with OHIF Plugin

MONAI Service provide ready-to-use playgroundw with API server and applications for users. 
If you are going to build and custimize OHIF viewer and MONAI Service plugin. Please refer to the [setup page](https://github.com/NVIDIA/monai-cloud-api/tree/main/plugins/ohif)


### Basic OHIF Instruction


#### 1. **Study List**
Open OHIF viewer, the index page is a study list. The subjects listed are prepared in dicom-web storage. 

![study list](docs/doc_imgs/studyList.png)

#### 2. **Select Subject** 

Click any subject you would like to annotate. 
The dropdwon panel will show several options. Select the `MONAI Service` 
to load the NVIDIA MONAI Cloud API plugin.

![Select an image](docs/doc_imgs/selectanimage.png)

If you're using the API directly, you can use the `nextimage` endpoint.

#### 3. **Selected MONAI Service Plugin**

Click the MONAI Service plugin button on the right panel after the tri-planer views are up. 
The MONAI Service planel will show on the right, the plugin will automatically connect
to the running MONAI Service server and to load executed models and created datasets. 
![allclass](docs/doc_imgs/viewerpage.jpg)



#### 4. **Run Inferencing Using Selected Method**

Below is a VISTA model application example demo:
VISTA model support multiple AI inference strategies.  
1. **Segment All Classes**: Predict all trained anatomy targets in the VISTA model. 
2. **Using Class Prompts**: Select and predict one or multiple anatomies with VISTA model.
3. **Using Point Prompts**: Place control point and edit the anatomy with click prompts. 

Once you've picked your preferred method, run the inference to get an initial annotation.

![allclass](docs/doc_imgs/annotation.png)

#### 5. **Annotate / Refine Annotations use side panel **

With the initial mask in place, you might notice areas that require manual tweaking. 
Use the provided annotation tools to:

- Refine boundaries
- Add or remove regions

This step ensures that your annotations are as accurate as possible.

**Steps**
1. Click the Segmentation button.
2. Select a class of segmentation that needs to be updated.
3. Select a segmentation tool.
4. Update the segmentation with this tool.

![Annotate](docs/doc_imgs/annotate.png)

#### 6. **Save and Notify the Server**

Once you're satisfied with your annotations, the first step is to save the annotated image, ensuring that your work is captured. This will write back the image using the DICOMWeb protocal back to your datastore.

![Save Label](docs/doc_imgs/savelabel.png)

Next, notify the server that an image has been annotated. This step is crucial for continuous learning. The system will take note of the new annotations and after the indicated number of annotated images it will use them to improve the model over time.

![Notify](docs/doc_imgs/notify.png)

The associated API call run when you click the `Notify Server` button is below:

#### 7. **Next Image**
After finishing the current image, click next image button to load the next selected image using
active learning.
![study list](docs/doc_imgs/nextimage.png)