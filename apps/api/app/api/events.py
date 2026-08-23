import asyncio
import json
import redis.asyncio as aioredis
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from loguru import logger
from app.core.config import settings

router = APIRouter()

@router.get("/conversations/{conversation_id}/events", tags=["Events"])
async def stream_conversation_events(conversation_id: str):
    """
    Server-Sent Events endpoint streaming live activity events for a conversation
    from Redis Stream `suprai:stream:{conversation_id}` directly to the Next.js UI.
    """
    async def event_generator():
        try:
            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            stream_key = f"suprai:stream:{conversation_id}"
            last_id = "0"

            logger.info(f"Subscribed to SSE stream for {conversation_id}")
            
            # Send initial ping event
            yield {
                "event": "connected",
                "data": json.dumps({"status": "connected", "conversation_id": conversation_id})
            }

            while True:
                try:
                    entries = await r.xread({stream_key: last_id}, count=10, block=2000)
                    if entries:
                        for stream_name, messages in entries:
                            for msg_id, data in messages:
                                last_id = msg_id
                                yield {
                                    "event": data.get("event_type", "message"),
                                    "data": json.dumps({
                                        "event_type": data.get("event_type"),
                                        "timestamp": float(data.get("timestamp", 0)),
                                        "payload": json.loads(data.get("payload", "{}"))
                                    })
                                }
                    else:
                        # Heartbeat
                        yield {"event": "ping", "data": "heartbeat"}
                        await asyncio.sleep(1)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Error reading Redis SSE stream: {e}")
                    await asyncio.sleep(1)
            await r.close()
        except Exception as e:
            logger.error(f"SSE connection failed: {e}")
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())
