
import os
import csv
import json
import glob
from langchain_huggingface import HuggingFaceEmbeddings
# from langchain_text_splitters import RecursiveCharacterTextSplitter # Kept for context
from database.supabase_client import supabase
from config import settings

# Configuration
# Using a lightweight local model
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

def get_embeddings():
    # Returns local Hugging Face embeddings (cpu friendly)
    print(f"Loading local embedding model: {EMBEDDING_MODEL}...")
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

def load_medquad_data(data_path: str):
    """
    Loads MedQuAD data (assuming CSV format from Kaggle).
    Expected columns: 'Question', 'Answer', 'Focus' (Topic)
    """
    print(f"Loading MedQuAD from {data_path}...")
    documents = []
    
    # Simple CSV loader
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Construct a single text chunk from the row
                content = f"Question: {row.get('Question', '')}\nAnswer: {row.get('Answer', '')}"
                metadata = {"source": "MedQuAD", "topic": row.get('Focus', 'General')}
                documents.append({"content": content, "metadata": metadata})
    except Exception as e:
        print(f"Error reading {data_path}: {e}")
        return []

    return documents

def chunk_data(documents):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    
    chunked_docs = []
    for doc in documents:
        chunks = text_splitter.split_text(doc['content'])
        for chunk in chunks:
            chunked_docs.append({"content": chunk, "metadata": doc['metadata']})
            
    return chunked_docs

async def embed_and_store(chunks):
    embedder = get_embeddings()
    print(f"Embedding {len(chunks)} chunks...")
    
    batch_size = 20
    i = 0
    while i < len(chunks):
        batch = chunks[i:i+batch_size]
        texts = [c['content'] for c in batch]
        
        try:
            embeddings = embedder.embed_documents(texts)
            
            # Prepare Supabase payload
            records = []
            for j, text in enumerate(texts):
                records.append({
                    "content": text,
                    "metadata": batch[j]['metadata'],
                    "embedding": embeddings[j]
                })
            
            # Insert into 'medical_docs' table
            supabase.table("medical_docs").insert(records).execute()
            print(f"Prepared batch {i//batch_size + 1} ({len(records)} records). (DB Inserted)")
            
            # Success - move to next batch
            i += batch_size
            
            # Gentle pacing
            import time
            time.sleep(2) 
            
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print("Rate Limit Hit (429). Sleeping 60s before RETRYING batch...")
                import time
                time.sleep(60)
                # Do not increment 'i', loop will retry this batch
            else:
                print(f"Error embedding batch: {e}")
                # Skip this batch on non-recoverable error
                i += batch_size

if __name__ == "__main__":
    # Example usage
    data_dir = "data/rag_source"
    csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
    
    all_docs = []
    for f in csv_files:
        all_docs.extend(load_medquad_data(f))
        
    if all_docs:
        chunked = chunk_data(all_docs)
        import asyncio
        asyncio.run(embed_and_store(chunked))
    else:
        print("No data found. Please download Kaggle dataset to 'backend/data/rag_source'.")
