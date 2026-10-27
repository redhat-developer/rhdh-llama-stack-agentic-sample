"""Live pagination probe: proves the truncation bug and the fix against a
running OGX server. Creates a throwaway vector store with 25 files,
compares single-page read vs paginated helper, deletes the store."""

import os
import tempfile

from ogx_client import OgxClient
from ogx_client.models import (
    OpenAIAttachFileRequest,
    OpenAICreateVectorStoreRequestWithExtraBody,
)

from src.utils import list_all_vector_store_files

client = OgxClient(base_url="http://localhost:8321")

vs = client.vector_stores.create(
    open_ai_create_vector_store_request_with_extra_body=(
        OpenAICreateVectorStoreRequestWithExtraBody(name="pagination-probe")
    )
)
print(f"probe store: {vs.id}")
try:
    file_ids = []
    for i in range(25):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", delete=False
        ) as f:
            f.write(f"pagination probe file {i}")
            path = f.name
        uploaded = client.files.create(file=path, purpose="assistants")
        os.unlink(path)
        file_ids.append(uploaded.id)

    for fid in file_ids:
        client.vector_stores_files.create(
            vector_store_id=vs.id,
            open_ai_attach_file_request=OpenAIAttachFileRequest(file_id=fid),
        )

    broken = len(
        client.vector_stores_files.list(vector_store_id=vs.id).data
    )
    fixed = len(list_all_vector_store_files(client, vs.id))
    print(f"single page (old behavior): {broken}")
    print(f"paginated (new behavior):  {fixed}")

    if fixed == 25 and broken < 25:
        print("PASS: truncation reproduced and fix verified")
    elif fixed == 25 and broken == 25:
        print("AMBIGUOUS: server returned all files in one page (page size > 25?)")
    else:
        print(f"FAIL: expected 25, got paginated={fixed} single={broken}")
finally:
    client.vector_stores.delete(vector_store_id=vs.id)
    print("probe store deleted")
