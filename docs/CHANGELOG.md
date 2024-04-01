# CHANGELOG

## [Unreleased]
### New Features

- Vista2D (TBD)

- Generative AI (TBD)

- Batch Inference (TBD)

### API changes

- Change of Base URL for all endpoints
    - `https://api.monai.ngc.nvidia.com/api/v1/orgs/iasixjqzw1hj` replaces `https://api.monai.ngc.nvidia.com/api/v1/users/{user_id}`.
    - This change is to support the new organization-based API access control.
- Change of experiment storage mechanism
    - Experiments are now stored in the organization's storage bucket.
    - This change is to support the new organization-based API access control.
    - When the user creates an experiment to run training/inference, they need to add the following parameter to the request body:
        - `cloud_type`: `cloud storage type` (e.g., `aws`, `azure`)
        - `cloud_file_type`: `folder`,  # If the file is tar.gz key in "file"
        - `cloud_specific_details`: `{"cloud_bucket_name": <Bucket link to pull the file from>, "account_name": <access_id>, "access_key": <access_secret>}`
- Add a log retrieval mechanism
    - Logs are now stored in the organization's storage bucket.
    - When the user wants to retrieve the log after the job training starts, they can use:
        - `https://api.monai.ngc.nvidia.com/api/v1/orgs/iasixjqzw1hj/experiments/{experiment_id}/jobs/{job_id}/logs`
- Removing job downloading mechanism
    - The job downloading mechanism is removed from the API.
    - The user can find the job artifacts in the organization's storage bucket.

### Notes
- Under the change of organization-based API access control, the users will find datasets visible only to the organization they belong to, and find experiments and jobs visible created by themselves.
