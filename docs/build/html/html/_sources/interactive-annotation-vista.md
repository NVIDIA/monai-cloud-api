# Interactive Annotation with VISTA

This guide delves deep into the process of annotation and continuous learning using NVIDIA MONAI Cloud APIs. Accurate annotations are crucial as the foundation of medical imaging, and the continuous refinement of models ensures the best outcomes over time. We will guide you through the steps and considerations involved in this process.

## Introduction

Annotation and Continuous Learning are pivotal features of NVIDIA MONAI Cloud APIs, designed to streamline the refinement of datasets and enhance model performance progressively. This section introduces the concepts of setting up and optimizing annotation and continuous learning tasks for your projects, highlighting their importance in improving the accuracy and efficiency of medical image analysis.

## Dataset and Experiment Setup

Creating a dataset and an experiment is the first step in the annotation workflow. Using the realtime_infer parameter during experiment creation ensures the experiment is immediately ready for annotation and continuous learning tasks. This section explains how to set up your dataset and experiments correctly, ensuring a smooth start to your annotation workflow.

### Authentication

Before interacting with the APIs, authentication is required to secure access and manage user sessions. The following Python code demonstrates how to authenticate against the NVIDIA MONAI Cloud API service, retrieve a user token, and set up the necessary headers for subsequent API requests. This step is crucial for establishing a secure connection and ensuring that your API requests are authenticated.

```python
import json
import requests
import os

# API Endpoint and Credentials
host_url = "https://api.monai.ngc.nvidia.com"
ngc_api_key = os.environ.get('MONAI_API_KEY')

# Authenticate and retrieve user ID and token
data = json.dumps({"ngc_api_key": ngc_api_key})
response = requests.post(f"{host_url}/api/v1/login", data=data)
assert response.status_code == 201, "Login failed with status code: {}".format(response.status_code)
user_details = response.json()
user_id, token = user_details["user_id"], user_details["token"]

# Headers for subsequent API requests
headers = {"Authorization": f"Bearer {token}"}
```

### Dataset Creation
Creating a dataset is the first step in the annotation process. This section demonstrates how to define a dataset within the NVIDIA MONAI Cloud APIs, specifying its type, format, and the DICOMWeb server credentials. This setup is essential for storing and accessing your medical imaging data.

```python
# DICOMWeb Server
dicom_web_endpoint = "<DICOMWeb address>" # For example "http://127.0.0.1:8042/dicom-web".
dicom_client_id = "<DICOMWeb user ID>"    # If Authentication is enabled, then provide username
dicom_client_secret = "<DICOMWeb secret>" # If Authentication is enabled, then provide password

data = {
    "name": "mydataset",
    "description": "a demo dataset",
    "type": "semantic_segmentation",
    "format": "monai",
    "client_url": f"{dicom_web_endpoint}",
    "client_id": f"{dicom_client_id}",
    "client_secret": f"{dicom_client_secret}",
}

endpoint = f"{base_url}/datasets"
response = requests.post(endpoint, json=data, headers=headers)
assert response.status_code == 201, f"Create dataset failed, got {response.json()}."
res = response.json()
dataset_id = res["id"]
print("Dataset creation succeeded with dataset ID: ", dataset_id)

```

### Creating an Experiment

This section covers the creation of an experiment, which is necessary for setting up the environment for annotation and continuous learning. It includes selecting the appropriate model architecture and configuring the experiment with datasets for training, evaluation, and inference.

```python
endpoint = f"{base_url}/experiments"
response = requests.get(endpoint, headers=headers)
assert response.status_code == 200, f"List Base Experiment failed, got {response.json()}."
res = response.json()

# VISTA-3D
ptm_vista = [p for p in res if p["network_arch"] == "monai_vista3d" and not len(p["base_experiment"])][0]["id"]
print(f"Base Experiment ID for VISTA Experiment: {ptm_vista}")

data = {
"name": "my_vista",
"description": "based on vista",
"network_arch": "monai_vista3d",
"base_experiment": [ ptm_vista ],
"inference_dataset": dataset_id,
"eval_dataset": dataset_id,
"train_datasets": [ dataset_id ],
"realtime_infer": True, # Auto loads MONAI bundle and enables real-time inference
"model_params": {
    "labels": {
            "1": "liver",
            "2": "kidney",
            "3": "spleen",
            "4": "pancreas",
            "5": "right kidney"
    }
}
}

endpoint = f"{base_url}/experiments"
response = requests.post(endpoint, json=data, headers=headers)
assert response.status_code == 201, f"Create experiment failed, got {response.json()}."
res = response.json()
experiment_id = res["id"]
model_network = res["network_arch"]
print("Experiment creation succeeded with experiment ID:", experiment_id)

```
## Continual Learning and Inference

### Configure the Continous Learning Job

Continuous learning forms the foundation of maintaining the accuracy and relevance of our models over time. As new data is annotated, the model can adapt and refine its performance. However, to initiate this process effectively, certain parameters must be defined to guide the system on how and when to refine the model.

This job initiates the fine-tuning of the model with new labeled samples after receiving several notifications. A finely tuned model enhances annotation efficiency and can yield improved annotation results.

Note: If you prefer to solely annotate data without engaging in the continuous learning process, you can choose to skip this step. You will still be able to utilize the annotation tools and workflows outlined in the upcoming sections independently.

Parameter Details:

- round_size: Specifies the number of new annotations required to trigger a new round of fine-tuning for the model.
- stop_criteria: Criteria determining when the continuous learning job should terminate.
- max_rounds: Sets the maximum number of rounds the job should run.
- key_metric: (Optional) If specified, the job will continue running until the designated evaluation metric reaches the specified value.
- train_spec: Overrides specific parameters in the model for this particular training. If you have an MLflow server configured, you can include its parameters under tracking to enable logging metrics with MLflow.

```python
train_spec = {
    "epochs": 2,
    "val_interval": 1,
}

data = {
    "action": "annotation",
    "specs": {
        "round_size": 1,  # Notify at least 2 different image_ids
        "stop_criteria": {
            "max_rounds": 2,
            "key_metric": 0.9,
        },
        "train_spec": train_spec,
    }
}

endpoint = f"{base_url}/experiments/{experiment_id}/jobs"
response = requests.post(endpoint, json=data, headers=headers)

assert response.status_code == 201, f"Run job failed, got {response.json()}."
cl_job_id = response.json()
print("Job creation succeeded with job ID: ", cl_job_id)
```

### Continual Learning Status
Monitoring the status of the continuous learning job is essential for understanding its progress and determining when interventions might be necessary. This section provides a method for querying the job status, helping you stay informed about the ongoing learning process.

```python
status = "Pending"
while status != "Running":
    endpoint = f"{base_url}/experiments/{experiment_id}/jobs/{cl_job_id}"
    response = requests.get(endpoint, headers=headers)

    assert response.status_code == 200, f"Failed to get job status, got {response.json()}."
    status = response.json()["status"]
    print("Continuous Learning/Annotation Job status: ", status)
    time.sleep(1)

```

### Run Inference
This section explains how to run inference with the VISTA-3D model, which supports 118 classes. Start by using the /nextimage API to retrieve the next image in line for annotation. After obtaining the image, trigger an inference job by providing the image and the necessary inference parameters. This step allows you to apply the model's wide range of classes to your dataset for analysis and classification purposes.

```python
    # get an inference image id with nextimage api
    data = {
        "action": "nextimage"
    }
    endpoint = f"{base_url}/datasets/{dataset_id}/jobs"
    response = requests.post(endpoint, json=data, headers=headers)

    assert response.status_code == 201, f"Recommend image failed, got {response.json()}."
    res = response.json()
    inference_image_id = res["image"]
    print(f"Recommended Image to annotate: {inference_image_id}")
    print(json.dumps(res, indent=2))

    data = {
        "action": "inference",
        "specs": {
            "image": inference_image_id,
            "bundle_params": {
                "label_prompt": list(range(1, 118))  # inference all 117 classes
            },
        }
    }

    endpoint = f"{base_url}/experiments/{experiment_id}/jobs"
    response = requests.post(endpoint, json=data, headers=headers)
    assert response.status_code == 201, f"Run inference failed, got {response.json()}."
    print("Inference Successful.  Label is returned")
    print(response.headers)
```

### Notify API
Once you've successfully annotated the image and saved it back to the DICOMWeb server, you can indicate that it's ready for use in continual learning. Trigger the notify API with the image ID to notify the system that the image is available for training.

```python
    # After uploading a DICOM Seg into DICOM Web
    endpoint = f"{base_url}/datasets/{dataset_id}/jobs"
    label_id = "<series_id_1>"
    data = {
        "action": "notify",
        "specs": {
            "added": {
                "image": inference_image_id,
                "label": label_id,
            },
            "updated": [],
            "removed": [],
        }
    }

    response = requests.post(endpoint, json=data, headers=headers)
    if response.status_code == 201:
        print("Notified.")
    else:
        print(response.json())
        print(response)
```


### Repeat
Continue the process for all images in your dataset. With each iteration, not only do you expand your annotated dataset, but you also contribute to the model's learning, leading to more accurate annotations in future iterations. The more you repeat this process, the more your model will learn and improve, allowing it to better identify and classify different types of images.

## Cleaning Up Your Continuous Learning

As your model continues to learn and improve over time, there may come a point where you need to pause or stop the ongoing Continuous Learning (CL) job. This could be due to a number of reasons, such as satisfactory model performance, resource constraints, or the need to make adjustments to the learning process.

### Stopping a Continuous Learning Job¶
As your model refines itself over time using continuous learning, there might come a point where you need to halt the ongoing CL job. Whether you're satisfied with the model's performance or have other reasons, here's how you can stop the CL job:

```python
# Manually stop the CL job. No need to execute this cell if the job has reached the stop criteria.
endpoint = f"{base_url}/experiments/{experiment_id}/jobs/{cl_job_id}"
response = requests.get(endpoint, headers=headers)
if response.json()["status"] != "Done":
    endpoint = f"{base_url}/experiments/{experiment_id}/jobs/{cl_job_id}:cancel"
    response = requests.post(endpoint, headers=headers)
    assert response.status_code == 200, f"cancel job failed, got {response.json()}."
```

### Stopping Real-time inference
When the experiment is created with `realtime_infer` as `True`, it will reserve one GPU to process the inference requests.

After we have finished the inference process, we would like to release the GPU resource for other tasks.

To achieve this, we can switch the `realtime_infer` from `True` to `False`.

Note: this step is irreversible, which means you can't set the `realtime_infer` from `False` to `True`. To bootstrap another inference, you will have to create another experiment.

```python
    data = {
        "realtime_infer": False,
    }

    endpoint = f"{base_url}/experiments/{experiment_id}"
    response = requests.patch(endpoint, json=data, headers=headers)
    assert response.status_code == 200, f"stop job failed, got {response.json()}."
```