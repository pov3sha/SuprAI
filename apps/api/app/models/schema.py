import uuid
import datetime
from sqlalchemy import (
    Column, String, Text, Integer, Float, DateTime, ForeignKey, JSON, Enum as SQLEnum, Table
)
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class TaskStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    PLANNING = "PLANNING"
    ASSIGNED = "ASSIGNED"
    RUNNING = "RUNNING"
    WAITING = "WAITING"
    REVIEW = "REVIEW"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUPPORTED = "SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    UNSUPPORTED = "UNSUPPORTED"
    CONTRADICTED = "CONTRADICTED"

task_dependency_table = Table(
    "task_dependencies",
    Base.metadata,
    Column("task_id", String(36), ForeignKey("tasks.id"), primary_key=True),
    Column("depends_on_task_id", String(36), ForeignKey("tasks.id"), primary_key=True)
)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversations = relationship("Conversation", back_populates="project", cascade="all, delete-orphan")
    files = relationship("FileRecord", back_populates="project", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user' | 'assistant' | 'system'
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False, default=0)
    storage_path = Column(String(255), nullable=False)
    page_count = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="files")
    chunks = relationship("FileChunk", back_populates="file_record", cascade="all, delete-orphan")

    @property
    def size(self):
        return self.size_bytes

    @property
    def storage_key(self):
        return self.storage_path

    @property
    def processing_status(self):
        return self.status

class FileChunk(Base):
    __tablename__ = "file_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = Column(String(36), ForeignKey("files.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    section_title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True)

    file_record = relationship("FileRecord", back_populates="chunks")

class AgentWorker(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)  # 'OpenAI', 'Gemini', 'Ollama'
    model = Column(String(100), nullable=False)
    capabilities = Column(JSON, nullable=False)  # list of str e.g. ["financial_analysis", "reasoning"]
    status = Column(String(50), default="AVAILABLE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assigned_tasks = relationship("Task", back_populates="worker")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    parent_task_id = Column(String(36), ForeignKey("tasks.id"), nullable=True)
    assigned_worker_id = Column(String(36), ForeignKey("agents.id"), nullable=True)
    objective = Column(Text, nullable=False)
    required_capabilities = Column(JSON, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.QUEUED)
    priority = Column(String(20), default="medium")
    output_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    conversation = relationship("Conversation", back_populates="tasks")
    worker = relationship("AgentWorker", back_populates="assigned_tasks")
    evidence_items = relationship("Evidence", back_populates="task", cascade="all, delete-orphan")
    
    dependencies = relationship(
        "Task",
        secondary=task_dependency_table,
        primaryjoin=id == task_dependency_table.c.task_id,
        secondaryjoin=id == task_dependency_table.c.depends_on_task_id,
        backref="dependent_tasks"
    )

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False)
    worker_id = Column(String(36), ForeignKey("agents.id"), nullable=True)
    document_id = Column(String(36), ForeignKey("files.id"), nullable=True)
    page_number = Column(Integer, nullable=True)
    section = Column(String(255), nullable=True)
    excerpt = Column(Text, nullable=False)
    claim = Column(Text, nullable=False)
    evidence_type = Column(String(50), default="DOCUMENT_EXCERPT")
    confidence = Column(Float, default=1.0)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("Task", back_populates="evidence_items")
    worker = relationship("AgentWorker")
    document = relationship("FileRecord")

class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = Column(String(36), nullable=True)
    worker_id = Column(String(36), nullable=True)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
