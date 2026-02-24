
from gradio_client import Client
import time

def test_space():
    print("Attempting to connect to Hugging Face Space...")
    
    # List of candidate public spaces (ungated)
    CANDIDATES = [
        "v2ray/Llama-3-70B-Instruct",
        "ysharma/Explore_Llama-3-70B",
        "huggingface-projects/llama-2-13b-chat",
        "mosaicml/mpt-30b-chat"
    ]
    
    for space_id in CANDIDATES:
        print(f"\n--- Trying {space_id} ---")
        try:
            client = Client(space_id)
            print("Client connected!")
            
            print("Sending 'Hello'...")
            start = time.time()
            
            # Note: API endpoints vary. This is a best-effort probe.
            # Many chat spaces use /chat or /predict
            try:
                result = client.predict(
                        message="Hello! Are you online?",
                        api_name="/chat"
                )
            except:
                # Fallback api name
                result = client.predict(
                        "Hello! Are you online?",
                        api_name="/predict"
                )
            
            print(f"Response received in {time.time() - start:.2f}s")
            print(f"Content: {result}")
            print(f"SUCCESS with {space_id}")
            return True
            
        except Exception as e:
            print(f"Failed with {space_id}: {e}")
            continue

    print("All candidates failed.")
    return False

if __name__ == "__main__":
    test_space()
