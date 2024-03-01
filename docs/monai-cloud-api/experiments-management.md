# Experiments Management

Details of Real-Time Inference
- You can use `realtime_infer` to prepare model in GPUs for real-time inference during experiment creation.
- You can use the update endpoint to change `realtime_infer` from `True` to `False` to release the model from using the GPU. Alternatively, deleting the experiment will also release the GPU resource
- MONAI cloud doesn't support changing the value of `realtime_infer` from `False` to `True`, because it has ambuiguity in what pretrained weights should be loaded.
- To bring your own weights for real-time inference, MONAI cloud API provides these options:
    - You can use a custom bundle for real-time inference. For details, please check the notebook [Perform Real-time Inference with a Custom MONAI Bundle.ipynb](../../notebooks/Perform%20Real-time%20Inference%20with%20a%20Custom%20MONAI%20Bundle.ipynb)
    - If the model trained inside a Continual Learning job, you can use the `experiment_id` and `job_id` of the trained job (NOTE: NOT the continual learning job) to create a new real-time infer experiment:
    ```python
    data = {
        "name": "my_vista",
        "description": "based on vista",
        "network_arch": "monai_vista3d",
        "base_experiment": [ "<experiment_id>" ],  # Continual Learning job was submitted under this experiment 
        "inference_dataset": dataset_id,
        "eval_dataset": dataset_id,
        "train_datasets": [ dataset_id ],
        "realtime_infer": True,
        "additional_id_info": "<job_id>"  # The Training Job ID. Not the Continual Learning Job ID.
    }

    endpoint = f"{base_url}/experiments"
    response = requests.post(endpoint, json=data, headers=headers)
    ```




