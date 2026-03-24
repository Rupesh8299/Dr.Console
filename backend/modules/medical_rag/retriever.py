from config import settings
from database.supabase_client import supabase

# Vercel-friendly Embedding Fallback (No PyTorch required)
# We try to use the local HuggingFace embeddings if installed (local dev),
# but safely fall back to the HuggingFace Inference API when running on Vercel.
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    def get_embedding(text):
        return embedder.embed_query(text)
except ImportError:
    import requests
    def get_embedding(text):
        api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
        # Optional: Use a token if rate restricted, but usually works for basic queries.
        headers = {} 
        response = requests.post(api_url, headers=headers, json={"inputs": [text], "options":{"wait_for_model":True}})
        if response.status_code == 200:
            res = response.json()
            # The API returns a list of lists: [[0.1, 0.2, ...]]
            if isinstance(res, list) and len(res) > 0 and isinstance(res[0], list):
                return res[0]
            elif isinstance(res, list) and len(res) > 0 and isinstance(res[0], float):
                return res
        print(f"HuggingFace API Fallback Error: {response.text}")
        return []

async def search_medical_docs(query: str, limit: int = 3):
    """
    Semantically searches the 'medical_docs' table in Supabase.
    """
    try:
        # 1. Generate Embedding for the query
        query_embedding = get_embedding(query)
        
        # 2. Call Supabase RPC function (Vector Search)
        response = supabase.rpc(
            "match_medical_docs",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.5, # Minimum similarity
                "match_count": limit
            }
        ).execute()
        
        return response.data
        
    except Exception as e:
        print(f"RAG Search Error: {e}")
        return []

def format_docs_for_context(docs):
    """
    Formats the retrieved documents into a string context for the LLM.
    """
    if not docs:
        return ""
        
    formatted = "\n[Medical Database Context]\n"
    for doc in docs:
        formatted += f"- ({doc['metadata'].get('topic', 'General')}) {doc['content']}\n"
    
    return formatted
