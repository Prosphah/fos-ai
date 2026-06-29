# Event Architecture

# Purpose

The Event Architecture defines how independent domains and capabilities communicate within FOS-AI.

Rather than allowing domains to directly call one another, the platform communicates primarily through domain events.

This creates a loosely coupled architecture where capabilities evolve independently while remaining synchronized.

The event architecture is implemented as an in-process event bus for the MVP.

Future versions may replace the implementation with distributed messaging without changing business logic.

---

# Philosophy

Events describe something that has already happened.

Examples:

- Investment Added
- Goal Completed
- Roadmap Generated
- Risk Assessment Completed

Events are facts.

They cannot be cancelled.

They cannot be modified.

They only describe completed business actions.

---

# Event Flow

Business Action

↓

Domain Event

↓

Event Bus

↓

Interested Listeners

↓

Business Reactions

---

Example

User adds investment.

↓

InvestmentAdded event

↓

Portfolio updates allocation.

↓

Journey records milestone.

↓

Achievements checks unlocks.

↓

Financial Health recalculates score.

↓

Notifications send congratulations.

↓

Dashboard refreshes widgets.

↓

AI receives updated context.

No capability directly calls another.

---

# Event Bus

The Event Bus is responsible for:

- Publishing events
- Registering listeners
- Dispatching events
- Logging events
- Preventing circular execution

The Event Bus contains no business logic.

---

# Event Lifecycle

Business Service

↓

Creates Event

↓

Publishes Event

↓

Listeners Execute

↓

Optional New Events

---

# Event Naming

Events should always use past tense.

Examples

UserRegistered

GoalCreated

GoalCompleted

InvestmentAdded

InvestmentRemoved

PortfolioUpdated

RiskAssessmentCompleted

RoadmapGenerated

RoadmapUpdated

FinancialHealthCalculated

LessonCompleted

ConversationSummarized

AchievementUnlocked

NotificationSent

---

# Event Categories

## User Events

UserRegistered

UserUpdated

SubscriptionChanged

AccountDeleted

---

## Financial Events

InvestmentAdded

InvestmentUpdated

InvestmentRemoved

PortfolioUpdated

FinancialHealthCalculated

EmergencyFundCompleted

---

## Roadmap Events

RoadmapGenerated

MilestoneCompleted

StageCompleted

NextStageUnlocked

---

## Education Events

LessonStarted

LessonCompleted

QuizCompleted

KnowledgeLevelUpdated

---

## AI Events

ConversationStarted

ConversationSummarized

AIResponseGenerated

ToolExecuted

CapabilityInvoked

---

## Achievement Events

AchievementUnlocked

JourneyUpdated

StreakUpdated

---

# Event Listeners

Each capability may subscribe to events.

Example

InvestmentAdded

Listeners

Portfolio

Journey

Achievements

Financial Health

Notifications

Dashboard

Analytics

AI Context

---

# Event Ordering

Listeners should remain independent.

No listener should depend on another listener executing first.

Each listener receives the same event.

---

# Event Failures

One listener failing should never stop other listeners.

Failures should be logged.

Retry policies may be introduced in future versions.

---

# Event History

The MVP does not persist every event permanently.

Events exist only for application communication.

Historical business information belongs inside domains such as:

- Journey
- Conversation
- Portfolio
- Financial Health

Future enterprise versions may introduce full event sourcing.

---

# Design Principles

Events should:

- represent completed business actions
- remain immutable
- contain only required information
- avoid business logic
- be easily understood

---

# MVP Scope

The MVP uses an in-process event bus.

No external messaging infrastructure is required.

This keeps implementation simple while preserving architectural flexibility.

---

# Future Evolution

Potential future improvements include:

- distributed messaging
- asynchronous processing
- background workers
- workflow orchestration
- audit event streams

These enhancements should not require changes to existing domain logic.