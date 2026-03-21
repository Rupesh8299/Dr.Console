
from typing import TypedDict, Annotated, List, Union
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # 'messages' will store the entire conversation history (User, AI, System)
    # add_messages is a reducer that appends new messages to the list
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Metadata about the user (Name, Age, Medical History)
    user_profile: dict
    
    # Session ID for DB tracking
    session_id: str
    
    # Flags for flow control
    triage_level: str
    needs_medical_memory_update: str | None
    
    # RAG sources retrieved for the last response (surfaced to frontend)
    rag_sources: list
