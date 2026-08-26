"""
DAS CRM Windows Application - CRM Data Models
Pydantic models for type-safe data validation and serialization.
Matches backend NestJS DTOs and iOS/macOS models.
"""

from enum import Enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    MANAGER = "manager"
    SALES_REP = "sales_rep"
    VIEWER = "viewer"


class User(BaseModel):
    """User account model."""
    id: str
    name: str
    email: str
    role: UserRole
    avatar_url: Optional[str] = None
    organization_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        use_enum_values = True


class LeadStatus(str, Enum):
    """Lead lifecycle status."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    WON = "won"
    LOST = "lost"


class Lead(BaseModel):
    """Sales lead model."""
    id: Optional[str] = None
    title: str
    contact_name: str
    email: str
    phone: str
    company_name: str
    value: float
    status: LeadStatus = LeadStatus.NEW
    source: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        use_enum_values = True


class DealStage(str, Enum):
    """Deal pipeline stages."""
    PROSPECTING = "prospecting"
    DEMO_SCHEDULED = "demo_scheduled"
    NEGOTIATION = "negotiation"
    CONTRACT_SENT = "contract_sent"
    WON = "won"
    LOST = "lost"


class Deal(BaseModel):
    """Sales deal model."""
    id: Optional[str] = None
    title: str
    company_name: str
    amount: float
    stage: DealStage = DealStage.PROSPECTING
    probability: int = 0  # 0-100
    expected_close_date: datetime
    owner_name: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        use_enum_values = True


class Contact(BaseModel):
    """Customer contact model."""
    id: Optional[str] = None
    name: str
    email: str
    phone: str
    company: str
    title: str
    tags: List[str] = []
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ProductItem(BaseModel):
    """Product catalog item."""
    id: Optional[str] = None
    sku: str
    name: str
    description: Optional[str] = None
    unit_price: float
    stock_quantity: int
    category: str
    created_at: datetime = Field(default_factory=datetime.now)


class QuotationStatus(str, Enum):
    """Quotation/invoice status."""
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    PAID = "paid"
    EXPIRED = "expired"


class Quotation(BaseModel):
    """Quotation/invoice model."""
    id: Optional[str] = None
    quote_number: str
    client_name: str
    items: List[Dict[str, Any]] = []
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    status: QuotationStatus = QuotationStatus.DRAFT
    issue_date: datetime = Field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    
    class Config:
        use_enum_values = True


class AnalyticsMetric(BaseModel):
    """Analytics metric model."""
    metric_name: str
    value: float
    unit: str
    period: str  # "daily", "monthly", "quarterly"
    change_percent: float = 0.0
    updated_at: datetime = Field(default_factory=datetime.now)


class BulkImportJob(BaseModel):
    """Bulk CSV import job tracking."""
    id: Optional[str] = None
    filename: str
    entity_type: str  # "leads", "contacts", etc.
    total_rows: int
    processed_rows: int
    successful_rows: int
    failed_rows: int
    status: str  # "pending", "processing", "completed", "failed"
    error_messages: List[str] = []
    created_at: datetime = Field(default_factory=datetime.now)


class AuditLogItem(BaseModel):
    """Security audit log entry."""
    id: Optional[str] = None
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    ip_address: Optional[str] = None


class Task(BaseModel):
    """Task/follow-up model."""
    id: Optional[str] = None
    title: str
    description: Optional[str] = None
    assigned_to: str
    due_date: Optional[datetime] = None
    status: str  # "open", "completed", "overdue"
    priority: str  # "low", "medium", "high"
    created_at: datetime = Field(default_factory=datetime.now)


class AttendanceRecord(BaseModel):
    """HR attendance log."""
    id: Optional[str] = None
    employee_id: str
    employee_name: str
    check_in: datetime
    check_out: Optional[datetime] = None
    date: str  # YYYY-MM-DD


class Automation(BaseModel):
    """Workflow automation configuration."""
    id: Optional[str] = None
    name: str
    trigger: str  # e.g., "lead_created", "deal_won"
    actions: List[Dict[str, Any]] = []
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.now)


class Communication(BaseModel):
    """WhatsApp/communication record."""
    id: Optional[str] = None
    contact_id: str
    contact_name: str
    message_type: str  # "whatsapp", "sms", "email"
    content: str
    direction: str  # "inbound", "outbound"
    status: str  # "sent", "delivered", "read", "failed"
    timestamp: datetime = Field(default_factory=datetime.now)
