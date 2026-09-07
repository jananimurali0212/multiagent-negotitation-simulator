from typing import Any, Dict, List
from pydantic import BaseModel, ConfigDict, Field, model_serializer


class ScenarioResponse(BaseModel):
    id: str
    title: str
    category: str
    description: str
    agent_count: int
    estimated_duration: str
    objective: str
    negotiable_dimensions: List[Dict[str, Any]] = Field(default_factory=list)
    default_agents_data: List[Dict[str, Any]] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_serializer(mode='wrap')
    def serialize_model(self, handler):
        data = handler(self)
        # Include camelCase aliases alongside snake_case fields
        data["agentCount"] = self.agent_count
        data["estimatedDuration"] = self.estimated_duration
        data["defaultAgents"] = self.default_agents_data
        data["negotiableDimensions"] = self.negotiable_dimensions
        return data
