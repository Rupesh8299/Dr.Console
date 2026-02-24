
import asyncio
from langgraph_coordinator.graph import graph_app
from langchain_core.messages import HumanMessage

async def test_reasoning_node():
    print("Testing LangGraph Reasoning Node...")
    
    # Mock Input State
    initial_state = {
        "messages": [HumanMessage(content="I have a headache and fever.")],
        "user_profile": {"full_name": "Test User", "medical_history": "None"},
        "session_id": "test_session_123",
        "is_emergency": False,
        "needs_medical_memory_update": None
    }
    
    print(f"Input: {initial_state['messages'][0].content}")
    
    # Invoke the graph
    # Note: 'invoke' is synchronous for the graph runner usually, but if nodes are async...
    # LangGraph 'invoke' runs the graph.
    
    result = await graph_app.ainvoke(initial_state)
    
    print("\n--- Result ---")
    last_msg = result['messages'][-1]
    print(f"AI Response: {last_msg.content}")
    print(f"Is Emergency: {result.get('is_emergency')}")

if __name__ == "__main__":
    asyncio.run(test_reasoning_node())
