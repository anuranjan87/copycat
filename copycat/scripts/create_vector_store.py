import os
from openai import OpenAI

api_key = os.environ.get("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not configured.")

client = OpenAI(api_key=api_key)

files = [
    "7winks-prd.md",
    "7winks-system-architecture.md",
    "7wingz-user-manual.md",
]

vector_store = client.vector_stores.create(name="7wingz-docs")
print(f"VECTOR_STORE_ID={vector_store.id}")

for path in files:
    with open(path, "rb") as fh:
        file_obj = client.files.create(file=fh, purpose="assistants")
    client.vector_stores.files.create(
        vector_store_id=vector_store.id,
        file_id=file_obj.id,
    )
    print(f"UPLOADED={path}:{file_obj.id}")
