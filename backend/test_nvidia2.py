import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def main():
    aclient = AsyncOpenAI(
        api_key=os.getenv("NVIDIA_API_KEY"),
        base_url="https://integrate.api.nvidia.com/v1",
    )
    
    # Test 1: No stream, no JSON object
    try:
        completion = await aclient.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role":"user","content":"Respond with a JSON object saying hello."}],
        )
        print("Test 1 (No Stream):", getattr(completion.choices[0].message, 'content', 'None')[:100])
    except Exception as e:
        print("Test 1 Error:", e)

    # Test 2: Stream
    try:
        completion = await aclient.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role":"user","content":"Say hello"}],
            stream=True
        )
        text = ""
        async for chunk in completion:
            text += chunk.choices[0].delta.content or chunk.choices[0].delta.reasoning_content or ""
        print("Test 2 (Stream):", text[:100])
    except Exception as e:
        print("Test 2 Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
