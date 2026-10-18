---
name: Claude Inference
description: Use this to write code to call Claude using the Anthropic Python SDK
---

# Calling Claude via the Anthropic SDK

These instructions allow you to write code to call Claude directly using the Anthropic Python SDK.

## Setup

The ANTHROPIC_API_KEY must be set in the .env file and loaded in as an environment variable.

The uv project must include anthropic and pydantic.
`uv add anthropic pydantic`

## Code snippets

Use code like these examples in order to call Claude.

### Imports and constants

```python
import anthropic
MODEL = "claude-sonnet-4-20250514"
client = anthropic.Anthropic()
```

### Code to call Claude for a text response

```python
response = client.messages.create(
    model=MODEL,
    max_tokens=1024,
    messages=messages,
)
result = response.content[0].text
```

### Code to call Claude for a Structured Outputs response

```python
response = client.messages.create(
    model=MODEL,
    max_tokens=1024,
    messages=messages,
    response_format={
        "type": "json",
    },
    system="Respond only with valid JSON matching this schema: " + MyBaseModelSubclass.model_json_schema().__str__(),
)
import json
result = json.loads(response.content[0].text)
result_as_object = MyBaseModelSubclass.model_validate(result)
```
