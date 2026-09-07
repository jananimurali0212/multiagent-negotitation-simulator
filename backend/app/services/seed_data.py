import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.scenario import Scenario

logger = logging.getLogger("backend.seed_data")

PRESET_SCENARIOS_DATA = [
    {
        "id": "vendor-pricing",
        "title": "Vendor Pricing Negotiation",
        "category": "Business",
        "description": "Negotiate the annual licensing cost and support terms for a customer relationship management (CRM) software suite. The vendor wants high volume commitment, whereas the buyer seeks flexible monthly payments.",
        "agent_count": 2,
        "estimated_duration": "10 mins",
        "objective": "Agree on licensing fees per user, support tier level, and payment terms.",
        "negotiable_dimensions": [
            {"dimension": "price", "label": "User Licensing Price", "required": True},
            {"dimension": "paymentTerms", "label": "Payment Terms", "required": False},
            {"dimension": "delivery", "label": "Implementation & Go-Live Timeline", "required": False},
            {"dimension": "warranty", "label": "Support Tier Level", "required": False},
        ],
        "default_agents_data": [
            {
                "agent_template_id": "seller-crm",
                "name": "Vendor Agent",
                "role": "Vendor Agent",
                "avatar": "VA",
                "personality": "Aggressive",
                "experience": "Medium",
                "negotiation_parameters": {
                    "targetPrice": "$65/user/month",
                    "minPrice": "$55/user/month",
                    "paymentTerms": "Net-30",
                    "warrantySupport": "Gold Support Package"
                },
                "goals": [
                    {"text": "Close contract at $65/user/month minimum", "priority": "High"},
                    {"text": "Commit customer to a 3-year term duration", "priority": "High"},
                    {"text": "Include mandatory premium deployment fee", "priority": "Medium"}
                ],
                "constraints": [
                    {"label": "Minimum user count", "value": "150 seats minimum"},
                    {"label": "Standard pricing sheet", "value": "$80/user list price"}
                ]
            },
            {
                "agent_template_id": "buyer-crm",
                "name": "Buyer Agent",
                "role": "Buyer Agent",
                "avatar": "BA",
                "personality": "Collaborative",
                "experience": "High",
                "negotiation_parameters": {
                    "targetPrice": "$45/user/month",
                    "maxBudget": "$120,000 / year",
                    "paymentTerms": "Net-45",
                    "deliveryRequirement": "Within 30 days"
                },
                "goals": [
                    {"text": "Secure licensing fee below $45/user/month", "priority": "High"},
                    {"text": "Obtain Gold support package at no extra cost", "priority": "Medium"},
                    {"text": "Secure Net-45 payment terms", "priority": "Low"}
                ],
                "constraints": [
                    {"label": "Maximum budget cap", "value": "$120,000 / year"},
                    {"label": "Go-live timeline", "value": "Within 30 days"}
                ]
            }
        ]
    },
    {
        "id": "job-offer",
        "title": "Job Offer Negotiation",
        "category": "HR",
        "description": "A recruitment manager is hiring a Senior Software Engineer. The candidate has multiple offers and wants higher equity and remote options, while the recruiter has strict salary grade caps.",
        "agent_count": 2,
        "estimated_duration": "5 mins",
        "objective": "Agree on base salary, stock options grant, and weekly remote work days schedule.",
        "negotiable_dimensions": [
            {"dimension": "salary", "label": "Base Salary", "required": True},
            {"dimension": "equity", "label": "Equity / Stock Options", "required": False},
            {"dimension": "remoteDays", "label": "Remote Work Schedule", "required": False},
        ],
        "default_agents_data": [
            {
                "agent_template_id": "recruiter-hr",
                "name": "Recruiter Agent",
                "role": "Recruiter Agent",
                "avatar": "RA",
                "personality": "Risk-Averse",
                "experience": "High",
                "negotiation_parameters": {
                    "targetSalary": "$155,000",
                    "maxSalary": "$170,000",
                    "equityBoundary": "15,000 shares max",
                    "workArrangement": "3 days in office"
                },
                "goals": [
                    {"text": "Keep base salary under $160,000", "priority": "High"},
                    {"text": "Limit stock options to 10,000 units", "priority": "Medium"},
                    {"text": "Establish minimum 3 days in office weekly", "priority": "High"}
                ],
                "constraints": [
                    {"label": "Internal grade cap", "value": "$170,000 absolute limit"},
                    {"label": "Option signing pool", "value": "15,000 shares max"}
                ]
            },
            {
                "agent_template_id": "candidate-hr",
                "name": "Candidate Agent",
                "role": "Candidate Agent",
                "avatar": "CA",
                "personality": "Collaborative",
                "experience": "High",
                "negotiation_parameters": {
                    "targetSalary": "$175,000",
                    "minSalary": "$165,000",
                    "equityExpectation": "20,000 shares",
                    "remotePreference": "4 days remote"
                },
                "goals": [
                    {"text": "Secure target base salary of $175,000", "priority": "High"},
                    {"text": "Obtain at least 4 remote days per week", "priority": "High"},
                    {"text": "Negotiate 20,000 stock option grant", "priority": "Medium"}
                ],
                "constraints": [
                    {"label": "Competing offer floor", "value": "$165,000 package"},
                    {"label": "Commute limitation", "value": "Max 1 day in office"}
                ]
            }
        ]
    },
    {
        "id": "budget-allocation",
        "title": "Project Budget Allocation",
        "category": "Finance",
        "description": "Department leads compete for fixed Q3 innovation budget allocations across Marketing, Engineering, and Operations divisions.",
        "agent_count": 3,
        "estimated_duration": "15 mins",
        "objective": "Reach consensus on total $500,000 capital distribution across three key business initiatives.",
        "negotiable_dimensions": [
            {"dimension": "marketingAllocation", "label": "Marketing Budget Allocation", "required": True},
            {"dimension": "engineeringAllocation", "label": "Engineering Budget Allocation", "required": True},
            {"dimension": "allocation", "label": "Operations Budget Allocation", "required": True},
        ],
        "default_agents_data": [
            {
                "agent_template_id": "dept-head",
                "name": "Department Head Agent",
                "role": "Department Head Agent",
                "avatar": "DH",
                "personality": "Collaborative",
                "experience": "Low",
                "negotiation_parameters": {
                    "targetAllocation": "$180,000",
                    "minAllocation": "$130,000"
                },
                "goals": [
                    {"text": "Fund Q3 global user acquisition campaign ($180k)", "priority": "High"},
                    {"text": "Co-sponsor engineering feature release launch", "priority": "Medium"},
                    {"text": "Establish flexible milestone-based funding", "priority": "Low"}
                ],
                "constraints": [
                    {"label": "Campaign commit floor", "value": "$130,000 minimum"},
                    {"label": "Agency contract", "value": "Non-cancelable retainers"}
                ]
            },
            {
                "agent_template_id": "pm-lead",
                "name": "Project Manager Agent",
                "role": "Project Manager Agent",
                "avatar": "PM",
                "personality": "Aggressive",
                "experience": "Medium",
                "negotiation_parameters": {
                    "targetAllocation": "$250,000",
                    "minAllocation": "$200,000"
                },
                "goals": [
                    {"text": "Secure $250,000 for core platform re-architecture", "priority": "High"},
                    {"text": "Protect engineering headcount expansion", "priority": "High"},
                    {"text": "Minimize budget divert to legacy maintenance", "priority": "Low"}
                ],
                "constraints": [
                    {"label": "Minimum viable tech budget", "value": "$200,000 floor"},
                    {"label": "Security compliance", "value": "Non-negotiable upgrade"}
                ]
            },
            {
                "agent_template_id": "finance-mgr",
                "name": "Finance Manager Agent",
                "role": "Finance Manager Agent",
                "avatar": "FM",
                "personality": "Risk-Averse",
                "experience": "High",
                "negotiation_parameters": {
                    "maxAllocation": "$500,000 total pool",
                    "targetAllocation": "Balanced 40/40/20 distribution"
                },
                "goals": [
                    {"text": "Keep total budget allocation strictly under $500k", "priority": "High"},
                    {"text": "Maintain 15% emergency reserve buffer", "priority": "High"},
                    {"text": "Ensure ROI metrics attached to all allocations", "priority": "Medium"}
                ],
                "constraints": [
                    {"label": "Total Pool Ceiling", "value": "$500,000 absolute cap"},
                    {"label": "Audit requirement", "value": "Detailed quarterly reporting"}
                ]
            }
        ]
    }
]


async def seed_scenarios(db: AsyncSession) -> None:
    """Seed or update the 3 pre-built enterprise scenarios into the database with fixed agent names."""
    for data in PRESET_SCENARIOS_DATA:
        result = await db.execute(select(Scenario).where(Scenario.id == data["id"]))
        existing = result.scalar_one_or_none()
        if not existing:
            scenario = Scenario(
                id=data["id"],
                title=data["title"],
                category=data["category"],
                description=data["description"],
                agent_count=data["agent_count"],
                estimated_duration=data["estimated_duration"],
                objective=data["objective"],
                negotiable_dimensions=data["negotiable_dimensions"],
                default_agents_data=data["default_agents_data"],
            )
            db.add(scenario)
            logger.info(f"Seeded scenario: {data['id']}")
        else:
            existing.title = data["title"]
            existing.description = data["description"]
            existing.objective = data["objective"]
            existing.default_agents_data = data["default_agents_data"]
            logger.info(f"Updated scenario default agents: {data['id']}")
    await db.commit()
