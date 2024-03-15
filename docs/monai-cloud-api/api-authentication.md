# Authentication

Welcome to the guide on obtaining and managing your credentials for NVIDIA MONAI Cloud APIs. Proper authentication is vital to ensure security and personalized access to the APIs. Let's dive in.

## Introduction
To ensure a secure experience and maintain data privacy, NVIDIA MONAI Cloud APIs require authentication. This tutorial will guide you through the process of generating and managing these API credentials.

## Generating Your API Credentials

1. Accessing the Credentials Dashboard:
- Navigate to NVIDIA NGC.
- Login
- Click on your User dropdown in the top-right
- Click on 'Setup'

2. Requesting New Credentials:
- Click on 'Get API Key'
- Click on the 'Generate New Key'
- After confirmation, you'll receive your API key.

3. Storing Your Credentials:
- It's crucial to store this API key securely.
- We recommend copying the key and storing it in a secure password manager or an encrypted file.

Additional resources for configuration:

- https://docs.nvidia.com/ngc/gpu-cloud/ngc-user-guide/index.html
- https://ngc.nvidia.com/setup
- https://www.youtube.com/watch?v=yBNt4qSnn0k

## Testing Your API Credentials
To ensure a seamless experience with NVIDIA MONAI Cloud APIs, it's crucial to validate that your credentials are correctly set up. Let's test them.

- Replace Placeholders: In the code block below, replace the placeholder (<Your NGC API Key>) with your actual value.
- Run the Code: After executing the code, if everything is set up correctly, it will print a success statement.

```python
import json
import requests
import os
     
# API Endpoint and Credentials
host_url = "https://api.monai.ngc.nvidia.com"
ngc_api_key = os.environ.get('MONAI_API_KEY')

# NGC UID 
data = json.dumps({"ngc_api_key": ngc_api_key})
response = requests.post(f"{host_url}/api/v1/login", data=data)
assert response.status_code == 201, f"Login failed, got status code: {response.status_code}."
assert "user_id" in response.json().keys(), "user_id is not in response."
user_id = response.json()["user_id"]
print("User ID",user_id)
assert "token" in response.json().keys(), "token is not in response."
token = response.json()["token"]
print("JWT",token)

# Construct the URL and Headers
base_url = f"{host_url}/api/v1/users/{user_id}"
print("API Calls will be forwarded to",base_url)

headers = {"Authorization": f"Bearer {token}"}
```

## Refreshing Your Credentials
In some cases, you might need to refresh or renew your API credentials. Here's how:

1. Navigate to the same 'Credentials' section on the dashboard.
2. Click the Generate a new key button.
3. Confirm any prompts. A new key will replace the old one, rendering the old key inactive.

**Note**: If you refresh your credentials, any application using the old key will no longer work and will need to be updated with the new key.

## Securing Your Credentials

1. Avoid Hardcoding in Scripts: Never hardcode your API keys directly in your scripts or applications.
2. Use Environment Variables: A safer approach is to store your API key as an environment variable and then access it in your script.
3. Limited Sharing: Only share your credentials with trusted individuals or teams.

```python
import os

# Example to fetch the API key from environment variables
API_KEY = os.environ.get('MONAI_API_KEY')

if API_KEY is None:
    print("API_KEY is not set. Ensure the MONAI_API_KEY environment variable is correctly configured.")
```

## Troubleshooting Common Issues
- Key Expiry: If you're facing authentication issues, check the validity of your API key. It might have expired.
- Invalid Key Format: Ensure that the key hasn't been truncated or modified.

## Conclusion
You're now equipped with the knowledge to generate, manage, and secure your credentials for the NVIDIA MONAI Cloud APIs. As a next step, you can dive into setting up your dataset, initializing models, or any other task you wish to pursue with the APIs.