
from langgraph.graph import StateGraph, END
from langgraph_coordinator.state import AgentState
from modules.thinking_brain.deep_reasoning import process_chat
from modules.image_analysis.vision_agent import VisionAgent
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import json

from modules.medical_rag.retriever import search_medical_docs, format_docs_for_context

# --- Node Definitions ---

async def reasoning_node(state: AgentState):
    """
    The 'Thinking Brain' node. 
    It takes the current state (messages), sends them to the LLM (Gemini/Groq),
    and returns the updated state with the AI's response.
    """
    messages = state['messages']
    user_profile = state.get('user_profile', {})
    
    # Extract the latest user message
    last_message = messages[-1]
    message_content = last_message.content
    
    # Extract media if present in the message styling (simplified for now)
    # Ideally, we pass media objects in the state or separate field.
    # For now, we assume text-based reasoning with context injection.
    
    context_instruction = ""
    
    # 1. User Profile Context
    if user_profile:
        context_instruction += (
            f"\n[User Profile]\n"
            f"Name: {user_profile.get('full_name', 'Unknown')}\n"
            f"History: {user_profile.get('medical_history', 'None')}\n"
        )

    # 2. RAG Retrieval (Medical Knowledge)
    # Search for relevant medical docs based on the user's message
    rag_docs = await search_medical_docs(query=message_content, limit=3)
    if rag_docs:
        rag_context = format_docs_for_context(rag_docs)
        context_instruction += f"\n{rag_context}\n"
        print(f"RAG: Retrieved {len(rag_docs)} documents.")

    # Call the Deep Reasoning Module (which handles Gemini/HF fallback)
    # We adapt the module's signature to fit the node pattern
    response_data = await process_chat(
        session_id=state.get('session_id', 'unknown'),
        messages=messages, # Pass full history
        context_instruction=context_instruction
    )
    
    # Create the AI Message object
    ai_msg = AIMessage(content=response_data['response'])
    
    return {
        "messages": [ai_msg],
        "is_emergency": response_data.get('is_emergency', False),
        "needs_medical_memory_update": response_data.get('medical_summary_update')
    }

# --- Graph Construction ---

def build_graph():
    """Builds and compiles the LangGraph."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("thinking_brain", reasoning_node)

    # Set Entry Point
    workflow.set_entry_point("thinking_brain")

    # Add Edges (Simple linear flow for now: Start -> Thinking -> End)
    # In future: Start -> Router -> [Thinking, Rag, etc]
    workflow.add_edge("thinking_brain", END)

    # Compile
    app = workflow.compile()
    return app

# Singleton instance
graph_app = build_graph()
