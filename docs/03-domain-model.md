# Domain Model

# Purpose

The Domain Model defines the business language of FOS-AI.

It describes the core concepts that exist within the Financial Operating System, how they relate to one another, and the responsibilities each domain owns.

The purpose of this document is to model the business, not the database.

Database tables, APIs, services, and user interfaces should all emerge naturally from this model.

---

# Ubiquitous Language

The following terms have precise meanings throughout the system.

Every engineer should use these definitions consistently.

| Term | Definition |
|-------|------------|
| User | A registered member of FOS-AI. |
| Financial Profile | The user's persistent financial identity. |
| Roadmap | A personalized financial plan describing recommended future actions. |
| Journey | The historical record of the user's financial progress. |
| Goal | A measurable financial objective. |
| Portfolio | The user's collection of investments. |
| Investment | A single owned financial asset. |
| Assessment | An evaluation that produces a score or recommendation. |
| Capability | A business capability provided by the operating system. |
| Tool | A specific action exposed by a capability. |
| Milestone | A meaningful achievement on the roadmap or journey. |
| Stage | A high-level phase in the user's financial life. |

---

# Domain Classification

FOS-AI consists of three domain categories.

## Core Domains

These define the unique value of the platform.

- User
- Financial Profile
- Financial Roadmap
- Financial Journey
- Portfolio
- Investment
- Risk Assessment
- Financial Health
- Goal

---

## Supporting Domains

These support the business.

- Education
- Conversation
- Notification
- Market Intelligence
- Scam Analysis

---

## Infrastructure Domains

These support the platform itself.

- Authentication
- AI Provider
- Logging
- Analytics
- Storage
- Monitoring
- Caching

---

# Domain Relationships

User

owns

Financial Profile

↓

Financial Profile

owns

Goals

Portfolio

Roadmap

Journey

Risk Assessment

Financial Health

↓

Portfolio

contains

Investments

↓

Roadmap

contains

Stages

↓

Stages

contain

Milestones

↓

Journey

records

Completed Milestones

↓

Conversation

references

User

Financial Profile

Roadmap

Portfolio

---

# Core Domains

---

# User

## Purpose

Represents an authenticated member of the platform.

## Responsibilities

- Identity
- Authentication
- Preferences
- Subscription
- Account Status

The User should never contain financial logic.

---

# Financial Profile

## Purpose

Represents the user's long-term financial identity.

## Owns

Income

Expenses

Savings

Debt

Emergency Fund

Investment Experience

Knowledge Level

Risk Preference

Preferred Markets

Preferred Asset Types

Country

Currency

The Financial Profile changes infrequently.

It provides context to almost every capability.

---

# Goal

Represents something the user wants to achieve.

Examples

Retirement

House Purchase

Education

Passive Income

Emergency Fund

A Goal owns:

Target Amount

Target Date

Priority

Progress

Status

---

# Portfolio

Represents the user's investments.

Responsibilities

Investment Allocation

Diversification

Performance

Sector Exposure

Asset Allocation

Risk Exposure

Portfolio Health

Portfolio owns Investments.

---

# Investment

Represents one owned asset.

Examples

Apple

Microsoft

ETF

REIT

Mutual Fund

Each Investment contains:

Purchase Price

Current Price

Quantity

Currency

Purchase Date

Asset Type

---

# Risk Assessment

Represents the user's investing personality.

Contains

Assessment Version

Responses

Score

Risk Category

Explanation

Recommendations

A user may complete multiple assessments over time.

Only one is active.

---

# Financial Roadmap

Represents the future.

It answers

"What should I do next?"

Owns

Stages

Recommendations

Milestones

Progress

Next Action

Target Dates

The roadmap evolves.

It is never static.

---

# Financial Journey

Represents the past.

It answers

"What have I accomplished?"

Owns

Timeline

Achievements

Completed Milestones

Historical Assessments

Major Financial Events

Journey exists forever.

It is never regenerated.

---

# Financial Health

Represents the current financial condition.

Calculated from

Savings

Debt

Investments

Goals

Emergency Fund

Portfolio

Roadmap

Produces

Financial Health Score

Strengths

Weaknesses

Recommendations

---

# Conversation

Represents AI interaction.

Owns

Messages

Summaries

Context

Referenced Domains

Conversation should never be treated as memory.

Persistent memory belongs inside business domains.

---

# Education

Represents learning.

Tracks

Completed Lessons

Current Topics

Knowledge Progress

Recommended Lessons

Quiz Results

---

# Market Intelligence

Represents external market information.

Examples

Stock Data

ETF Data

Interest Rates

Inflation

Market News

Market Intelligence never belongs to the User.

It is shared system knowledge.

---

# Scam Analysis

Represents evaluation of suspicious investment opportunities.

Produces

Risk Score

Red Flags

Warning Level

Explanation

Recommended Actions

---

# The Financial State Machine

Every user exists in exactly one primary financial stage.

Possible stages include:

1. Financial Foundation
2. Emergency Fund
3. Debt Optimization
4. First Investments
5. Portfolio Growth
6. Diversification
7. Wealth Acceleration
8. Passive Income
9. Retirement Planning
10. Financial Independence

Capabilities adapt to the user's current stage.

The AI adapts to the user's current stage.

Education adapts to the user's current stage.

Notifications adapt to the user's current stage.

The dashboard adapts to the user's current stage.

---

# Aggregate Roots

Only the following domains act as Aggregate Roots.

User

Financial Profile

Portfolio

Roadmap

Journey

Conversation

All child objects are modified through their parent aggregate.

This maintains consistency.

---

# Domain Events

The platform communicates using events.

Examples

RiskAssessmentCompleted

RoadmapGenerated

GoalCreated

GoalCompleted

InvestmentAdded

PortfolioUpdated

MilestoneCompleted

FinancialHealthCalculated

LessonCompleted

ConversationSummarized

Capabilities respond to events instead of tightly coupling to each other.

---

# Domain Ownership

Each domain owns:

Its own business rules.

Its own services.

Its own validation.

Its own events.

Its own AI tools.

Its own persistence.

No domain directly modifies another domain's data.

Communication occurs through events or shared services.

---

# Design Philosophy

The Domain Model is the heart of FOS-AI.

Every future capability, service, API, screen, database table, AI prompt, and business rule should trace back to one or more domains defined in this document.

If a new feature cannot be expressed using the existing domain language, the domain model should be reviewed before implementation.