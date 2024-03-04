# Customize VISTA-3D

## Overview

## Base VISTA-3D

MONAI Bundle: We're using the VISTA-3D bundle as an example. Choose the one fitting your application.
Dataset Setup: All data is under one dataset ID for this demo. Adjust as per your data structure.
Pretrained Weights: Opt for a pretrained model to enhance performance.
Real-time Inference: For real-time inference during annotation jobs or auto segmentation, set realtime_infer to True and provide an inference_dataset; otherwise, set it to False. In this example, we're setting it to False as we aren't initiating an annotation job..

```python
data = {
  "name": "monai_vista",
  "description": "Based on vista",
  "network_arch": "monai_vista3d",
  "type": "medical",
  "base_experiment": [ ptm_vista ],
  "inference_dataset": dataset_id,
  "eval_dataset": dataset_id,
  "train_datasets": [ dataset_id ],
  "realtime_infer": False,
}

endpoint = f"{base_url}/experiments"
response = requests.post(endpoint, json=data, headers=headers)
assert response.status_code == 201, f"Create experiment failed, got {response.json()}."
res = response.json()
experiment_id = res["id"]
model_network = res["network_arch"]
print("Experiment creation succeeded with experiment ID:", experiment_id)
print("---------------------------------\n")
print(json.dumps(res, indent=2))
```


## Customize VISTA-3D Experiment
The VISTA-3D model provides a comprehensive set of 117 classes. However, there might be scenarios where you need a subset of these classes or want to introduce new ones. Customizing is made easy with the MONAI Cloud APIs:

## Selecting a Subset of Classes
If you're interested in specific classes such as liver, kidney, and spleen, you can choose them without using the entire set by modifying the data object to add a model_params key, along with the labels you want included from the base 117 classes.

```python
data = {
  "name": "my_vista_3_organ",
  "description": "based on vista",
  "network_arch": "monai_vista3d",
  "base_experiment": [ ptm_vista ],
  "inference_dataset": dataset_id,
  "eval_dataset": dataset_id,
  "train_datasets": [ dataset_id ],
  "realtime_infer": True,
  "model_params":{
      "labels":{
          "1": "liver",
          "2": "kidney",
          "3": "spleen"
      }
  }
}
```

## Adding Custom Classes
If you have specific classes not present in the base VISTA-3D model, you can easily add them. This customization allows developers to tailor the experiment to their specific needs, ensuring that only relevant classes are present, while also offering the flexibility to introduce new classes as needed.

```python
data = {
  "model_params":{
      "labels":{
          "1": "liver",
          "2": "kidney",
          "118": "myorgan" # add customized class
      }
  }
}
```