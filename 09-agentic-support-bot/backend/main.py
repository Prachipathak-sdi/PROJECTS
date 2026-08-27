import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from tools import lookup_order, process_refund, escalate_to_human, TOOLS_SCHEMA

load_dotenv()

app = FastAPI(
    title="MVP 09 - Autonomous Customer Support Agent",
    description="Agentic Tool Calling & Autonomous Decision-Making Support Assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatReq(BaseModel):
    messages: list[ChatMessage]

@app.get("/")
def health():
    return {
        "status": "ok",
        "mvp": "09-agentic-support-bot",
        "api_key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@app.post("/api/agent/chat")
def run_agent_chat(payload: ChatReq):
    api_key = os.getenv("OPENAI_API_KEY")
    
    formatted_messages = [m.model_dump() for m in payload.messages]
    tool_calls_log = []

    if api_key and not api_key.startswith("sk-your-"):
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            # Initial call to LLM with available tools
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an autonomous enterprise customer support AI agent. You have access to database tools to lookup orders, process refunds, and escalate tickets. Use tools whenever necessary before answering."}
                ] + formatted_messages,
                tools=TOOLS_SCHEMA,
                tool_choice="auto"
            )
            
            msg = response.choices[0].message

            # Check if LLM requested tool execution
            if msg.tool_calls:
                # Add assistant's tool call intent to conversation
                formatted_messages.append(msg)
                
                for tool_call in msg.tool_calls:
                    fn_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)
                    
                    tool_result = {}
                    if fn_name == "lookup_order":
                        tool_result = lookup_order(args.get("order_id"))
                    elif fn_name == "process_refund":
                        tool_result = process_refund(args.get("order_id"), args.get("reason"))
                    elif fn_name == "escalate_to_human":
                        tool_result = escalate_to_human(args.get("order_id"), args.get("note"))
                    
                    tool_calls_log.append({
                        "tool_name": fn_name,
                        "arguments": args,
                        "result": tool_result
                    })
                    
                    # Feed tool execution result back to LLM
                    formatted_messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": fn_name,
                        "content": json.dumps(tool_result)
                    })
                
                # Second completion call for final user answer
                second_resp = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=formatted_messages
                )
                final_text = second_resp.choices[0].message.content
                
                return {
                    "answer": final_text,
                    "tool_calls": tool_calls_log,
                    "mock": False
                }
            else:
                return {
                    "answer": msg.content,
                    "tool_calls": [],
                    "mock": False
                }
        except Exception:
            pass

    # Autonomous Demo Execution Loop (Mock Mode for offline verification)
    user_msg = formatted_messages[-1]["content"] if formatted_messages else ""
    
    # Check if user mentioned order ID
    if "ORD-1002" in user_msg.upper():
        t_res = lookup_order("ORD-1002")
        tool_calls_log.append({"tool_name": "lookup_order", "arguments": {"order_id": "ORD-1002"}, "result": t_res})
        answer = f"I've looked up order **ORD-1002** ({t_res['item_name']}). It is currently **{t_res['status']}** with tracking number `{t_res['tracking_number']}`. Estimated delivery date is **{t_res['estimated_delivery']}**."
    elif "ORD-1001" in user_msg.upper() and ("REFUND" in user_msg.upper() or "RETURN" in user_msg.upper()):
        t_res = lookup_order("ORD-1001")
        tool_calls_log.append({"tool_name": "lookup_order", "arguments": {"order_id": "ORD-1001"}, "result": t_res})
        
        ref_res = process_refund("ORD-1001", "Customer requested return via support agent")
        tool_calls_log.append({"tool_name": "process_refund", "arguments": {"order_id": "ORD-1001", "reason": "Customer return request"}, "result": ref_res})
        
        answer = f"I have verified your order **ORD-1001** ({t_res['item_name']}) and successfully processed a full refund of **{ref_res['refund_amount']}**. A confirmation email has been dispatched to {t_res['customer_name']}."
    else:
        # Default lookup demo
        t_res = lookup_order("ORD-1001")
        tool_calls_log.append({"tool_name": "lookup_order", "arguments": {"order_id": "ORD-1001"}, "result": t_res})
        answer = f"I retrieved order **ORD-1001** for **{t_res['customer_name']}**. Status: **{t_res['status']}** (${t_res['amount']}). How can I assist you further with this order?"

    return {
        "answer": answer,
        "tool_calls": tool_calls_log,
        "mock": True
    }
