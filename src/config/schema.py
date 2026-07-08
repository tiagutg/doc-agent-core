from pydantic import BaseModel
from typing import List, Optional

class AnaliseArquivoJSON(BaseModel):
    file: str
    role: str  # controller, service, entity, utility, etc.
    summary: str
    responsibilities: List[str]
    business_rules: List[str]
    dependencies: List[str]
    database_entities: List[str]
    external_integrations: List[str]
    api_endpoints: List[str]
    security: List[str]
    errors: List[str]
    observations: List[str]