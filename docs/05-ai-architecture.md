# AI Architecture

# Purpose

The AI Architecture defines how intelligence operates within FOS-AI.

Rather than treating the Large Language Model (LLM) as the application, FOS-AI treats AI as an operating layer responsible for coordinating reasoning across the platform.

The AI Operating Layer connects users, capabilities, tools, business rules, and contextual knowledge into a unified conversational experience.

The LLM is responsible for reasoning.

The platform is responsible for everything else.

---

# AI Philosophy

FOS-AI follows one fundamental principle:

> Intelligence without context is guessing.

Every response should be generated from structured context rather than relying on model memory.

The objective is consistency, personalization, explainability, and trust.

---

# Design Principles

## 1. Context Engineering over Prompt Engineering

Prompts are only one component.

The quality of an AI response depends primarily on the quality of the context assembled before inference.

Every request should provide only the information necessary for the current task.

---

## 2. Deterministic Before Generative

Business logic belongs in software.

Reasoning belongs in AI.

Examples of deterministic operations:

- ROI calculations
- Compound interest
- Portfolio performance
- Financial health scoring
- Risk score calculation
- Roadmap generation rules
- Goal progress
- Investment allocations

The AI receives outputs from these systems and explains them.

---

## 3. AI Never Owns Data

Persistent data always belongs to business domains.

The AI may read data.

It may summarize data.

It may explain data.

It never becomes the source of truth.

---

## 4. Capabilities First

The AI does not know application internals.

It discovers capabilities through the Capability Registry.

Capabilities expose tools.

Tools expose actions.

The AI selects tools rather than generating answers from memory whenever possible.

---

# AI Operating Layer

The AI Operating Layer acts as the intelligence kernel of FOS-AI.
The AI Operating Layer selects models, not providers.

Responsibilities include:

- Intent Detection
- Capability Discovery
- Tool Selection
- Context Assembly
- Prompt Construction
- Model Selection
- Provider Routing
- Streaming Responses
- Response Validation
- Conversation Summarization
- Cost Monitoring
- Telemetry

---

# AI Request Lifecycle

User Message

↓

Authentication

↓

Conversation Retrieval

↓

Intent Detection

↓

Capability Discovery

↓

Tool Selection

↓

Tool Execution

↓

Context Assembly

↓

Prompt Construction

↓

Model Selection

↓

Inference

↓

Validation

↓

Streaming Response

↓

Conversation Storage

↓

Optional Event Publication

---

# Intent Detection

Every message is first classified.

Possible intents include:

- Ask Question
- Analyze Investment
- Explain Concept
- Calculate
- Review Portfolio
- Update Profile
- Generate Roadmap
- Assess Risk
- Learn
- Detect Scam

Multiple intents may exist in a single request.

---

# Capability Discovery

The AI never hardcodes available functionality.

Instead it queries the Capability Registry.

Each capability advertises:

- id
- name
- description
- supported intents
- available tools
- permissions
- premium status
- required context

Capabilities may be enabled or disabled without modifying AI logic.

---

# Tool Architecture

A Tool performs one deterministic action.

Examples:

ROI Calculator

Analyze Stock

Compare Investments

Generate Roadmap

Calculate Retirement

Detect Scam

Portfolio Diversification

Financial Health Evaluation

Each tool exposes:

- description
- input schema
- output schema
- execution function
- validation rules

The AI never directly accesses services.

It invokes tools.

---

# Context Engineering

Context is assembled dynamically.

The AI receives only the information required for the current task.

Possible context sources include:

System Identity

Capability Context

Financial Profile

Current Financial State

Risk Profile

Roadmap

Journey

Portfolio Summary

Goals

Recent Conversations

Market Intelligence

Tool Results

User Preferences

Subscription Features

Current User Message

Context should remain minimal while preserving accuracy.

---

# Prompt Structure

Every request follows a structured format.

1. System Identity

Defines the role and behavior of FOS-AI.

---

2. Capability Instructions

Specific guidance provided by the active capability.

---

3. User Context

Relevant financial information.

---

4. Tool Results

Structured outputs from deterministic services.

---

5. Conversation Summary

Recent conversational context.

---

6. Current Request

The user's latest message.

---

# AI Memory Architecture

Memory exists at three levels.

Level 1

Conversation Context

Current messages.

Lifetime:

Current session.

---

Level 2

Conversation Summary

Compressed history of previous conversations.

Lifetime:

Long term.

---

Level 3

Business Memory

Stored in domains.

Examples:

Risk Profile

Goals

Journey

Roadmap

Portfolio

Financial Preferences

Knowledge Level

The AI should prefer Business Memory over conversational memory whenever possible.

---

# Model Selection Strategy

Google Gemini API (Primary MVP Provider)

↓

Provider Abstraction Layer

↓

Future Providers
    • OpenRouter
    • Self-hosted vLLM
    • Ollama (Development)
    • Enterprise Providers

---

# Provider Abstraction

FOS-AI must never depend directly on a specific LLM provider.

All AI communication passes through a Provider Abstraction Layer.

Business domains, capabilities, services, and tools interact only with the AI Operating Layer.

The AI Operating Layer selects the appropriate provider.

User
  ↓
AI Operating Layer
  ↓
Model Selection Layer
  ↓
Vercel AI SDK (ai)
  ↓
Configured Provider (@ai-sdk/google in MVP)
  ↓
Gemini API

# Model Selection Layer

The AI Operating Layer is responsible for selecting the appropriate model based on:

- Task complexity
- Context size
- Latency requirements
- Cost sensitivity

This selection is internal to the AI Operating Layer.

The system does not route between providers directly.

Instead, it selects a model configuration that is passed to the Vercel AI SDK.

---

# Provider Abstraction (Updated)

The Vercel AI SDK serves as the provider abstraction layer.

It handles:

- API communication
- Streaming
- Tool calling
- Provider-specific differences

The application does not implement a separate provider router.

Provider selection is delegated to SDK configuration.

---

# Response Validation

Every AI response should pass validation before reaching the user.

Validation includes:

Policy compliance

Financial disclaimer rules

Formatting

Unsupported claims

Hallucination detection (future)

Tool consistency

---

# Streaming

Responses should stream incrementally.

Benefits:

Faster perceived performance

Improved user experience

Lower abandonment

Streaming begins immediately after inference starts.

---

# Cost Optimization

The AI Operating Layer should minimize unnecessary inference.

Strategies include:

Reuse deterministic tools.

Avoid duplicate context.

Summarize long conversations.

Cache repeated market information.

Use smaller models where appropriate.

Escalate to larger models only when necessary.

Track token usage.

Track cost per capability.

Track cost per user.

---

# Model Routing

Different tasks require different levels of reasoning.

The AI Operating Layer should select models based on task complexity rather than using a single model for all requests.

Examples:

Simple Tasks

- Financial definitions
- Calculator explanations
- General education

Preferred Model:

Gemini 2.5 Flash

---

Moderate Tasks

- Investment comparison
- Portfolio discussion
- Roadmap explanations

Preferred Model:

Gemini 3.1 Flash Lite

---

Complex Tasks (Future)

- Multi-step financial planning
- Long-context analysis
- Advanced investment reasoning

Preferred Models:

Higher-capability Gemini models or other premium providers as appropriate.

The routing strategy should remain configurable and independent of business logic.

# Failure Strategy

If inference fails:

Retry provider.

Fallback to secondary model.

If unavailable:

Return graceful error.

Never expose provider errors directly to users.

---

# AI Safety

FOS-AI should never:

Guarantee investment returns.

Predict future prices with certainty.

Encourage reckless investing.

Invent financial information.

Ignore user risk profiles.

Contradict deterministic calculations.

The AI should encourage:

Diversification.

Long-term thinking.

Education.

Risk awareness.

Independent decision making.

---

# Explainability

Recommendations should explain:

Why

Potential benefits

Potential risks

Who the recommendation suits

Expected time horizon

The objective is informed decision making rather than blind obedience.

---

# Observability

Track:

Model used

Provider

Latency

Tokens

Cost

Capability invoked

Tools executed

Failures

Fallbacks

User satisfaction (future)

---

# AI Evolution Strategy

## Stage 1 - MVP

Primary Provider:

Google Gemini API

Objectives:

- Validate product-market fit
- Minimize infrastructure cost
- Rapid iteration

---

## Stage 2 - Multi-Provider (Future)

Introduce additional providers via the Vercel AI SDK:

- OpenAI
- Anthropic
- OpenRouter (optional)
- Self-hosted models (vLLM)

This is treated as a configuration-level expansion, not a core architectural change.

The AI Operating Layer remains provider-agnostic.
---

## Stage 3 - AI Provider Interface (Conceptual)

The application does not implement its own provider abstraction layer.

Instead, it relies on the Vercel AI SDK to standardize provider interactions.

This section exists to document expected capabilities of any underlying provider:

- Chat completion
- Streaming
- Tool calling
- Structured output support

The implementation responsibility belongs to the AI SDK, not the application.
---

## Stage 4 - Specialized Intelligence

Introduce domain-specific financial models.

Potential capabilities:

- Fine-tuned financial assistants
- Portfolio reasoning
- Personalized recommendation models
- Internal retrieval systems

---

## Stage 5 - Intelligent Financial Platform

The AI Operating Layer dynamically selects providers based on:

- Capability
- Latency
- Cost
- Context size
- Privacy requirements
- Model strengths

Provider selection becomes automatic and transparent to users.

---

# AI Provider Interface

Every provider must implement a common interface.

Core operations include:

- Chat Completion
- Streaming Responses
- Structured Output
- Function / Tool Calling
- Embeddings (Future)

The remainder of the platform should remain unaware of which provider is executing inference.

This enables provider replacement without affecting capabilities or business services.

# Design Philosophy

The AI Operating Layer exists to amplify the capabilities of FOS-AI, not replace them.

Its role is to coordinate intelligence across the platform while ensuring that every response is grounded in structured context, deterministic computation, and the user's long-term financial journey.

The ultimate measure of success is not how intelligent the AI appears, but how effectively it helps users make better financial decisions.