import concurrent.futures
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from loguru import logger
from app.models.schema import Task
from app.services.workers.executor import execute_worker_task

class TaskExecutor(ABC):
    @abstractmethod
    def execute_tasks(self, tasks: List[Task], db: Session, execution_id: str) -> List[Dict[str, Any]]:
        """
        Abstract task executor interface isolating concurrency execution strategy from Orchestrator.
        """
        pass

class ParallelTaskExecutor(TaskExecutor):
    """
    Concrete implementation executing independent tasks concurrently via ThreadPoolExecutor with thread-isolated DB sessions.
    """
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers

    def execute_tasks(self, tasks: List[Task], db: Session, execution_id: str) -> List[Dict[str, Any]]:
        if not tasks:
            return []

        logger.info(f"ParallelTaskExecutor running {len(tasks)} tasks for execution_id={execution_id}")
        completed_outputs = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(tasks), self.max_workers)) as executor:
            futures = {executor.submit(execute_worker_task, task.id): task for task in tasks}
            for future in concurrent.futures.as_completed(futures):
                try:
                    out_dict = future.result()
                    if out_dict:
                        completed_outputs.append(out_dict)
                except Exception as e:
                    task_item = futures[future]
                    logger.error(f"TaskExecutor task {task_item.id} failed: {e}")

        return completed_outputs

# Default TaskExecutor instance
task_executor: TaskExecutor = ParallelTaskExecutor(max_workers=4)
