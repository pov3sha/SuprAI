import json
import time
import redis
from loguru import logger
from app.core.config import settings

class EventPublisher:
    def __init__(self):
        try:
            self.redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.warning(f"Redis stream init warning: {e}")
            self.redis_client = None

    def publish_event(self, conversation_id: str, event_type: str, payload: dict):
        event_data = {
            "conversation_id": conversation_id,
            "event_type": event_type,
            "timestamp": time.time(),
            "payload": json.dumps(payload)
        }
        
        logger.info(f"[EVENT] {event_type} for conv {conversation_id}")
        
        if self.redis_client:
            try:
                self.redis_client.xadd(f"suprai:stream:{conversation_id}", event_data, maxlen=1000)
            except Exception as e:
                logger.error(f"Failed to publish Redis event: {e}")

event_publisher = EventPublisher()
