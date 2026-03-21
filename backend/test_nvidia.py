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
    
    completion = await aclient.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role":"user","content":"Respond with a JSON object saying hello."}],
        # response_format={"type": "json_object"}
    )
    
    print("Completion Object:")
    print(completion.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(main())
