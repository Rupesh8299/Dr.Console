
from config import settings
from database.supabase_client import supabase
from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Initialize Embedder (Must match loader.py)
embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

async def search_medical_docs(query: str, limit: int = 3):
    """
    Semantically searches the 'medical_docs' table in Supabase.
    """
    try:
        # 1. Generate Embedding for the query
        query_embedding = embedder.embed_query(query)
        
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
