# Initialize Qdrant client (need change depending on setup)
        # client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        # collection_name = f"module_{module_id}"

        # try:
        #     # Get all documents from the module's collection
        #     documents = client.scroll(
        #         collection_name=collection_name,
        #     )[0]

        #     # Format documents for frontend
        #     formatted_docs = [{
        #         'id': str(doc.id),
        #         'name': doc.payload.get('filename'),
        #     } for doc in documents]

        # except Exception as e:
        #     print(f"Error fetching from Qdrant: {str(e)}")
        #     formatted_docs = []