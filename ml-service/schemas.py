from typing import List, Optional

from pydantic import BaseModel, Field


class FormPayload(BaseModel):
    action: Optional[str] = ""
    method: Optional[str] = "GET"


class ScriptPayload(BaseModel):
    src: Optional[str] = ""


class PredictRequest(BaseModel):
    url: str
    domHtml: Optional[str] = None
    forms: List[dict] = Field(default_factory=list)
    scripts: List[dict] = Field(default_factory=list)


class PredictResponse(BaseModel):
    riskScore: int
    verdict: str
    reasons: List[str]
