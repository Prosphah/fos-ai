# System Architecture

# Overview

FOS-AI is designed as a modular, AI-native financial operating system.

Rather than treating AI as the application itself, the Large Language Model (LLM) serves as one component within a broader ecosystem of deterministic business logic, financial tools, structured data, and intelligent orchestration.

The system follows a layered architecture where every layer has a clearly defined responsibility.

---

# High-Level Architecture

                    User
                      │
                      ▼
           Next.js PWA (Frontend)
                      │
                      ▼
       Server Actions / API Routes
                      │
                      ▼
            Business Service Layer
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
 Rule Engine    Financial Tools   AI Operating Layer
        │             │              │
        └─────────────┼──────────────┘
                      ▼
                 Supabase
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
 Authentication   Database     Storage

                      │
                      ▼
               External Services

        • OpenRouter
        • Market Data APIs
        • Email Provider
        • Analytics

---

# Architectural Principles

## 1. AI is a Service

The AI is never responsible for:

- calculations
- financial formulas
- business rules
- data persistence
- authentication
- authorization

Its responsibilities include:

- reasoning
- explanation
- summarization
- education
- personalization
- conversation

---

## 2. Code Before AI

If software can reliably perform a task,
software performs the task.

Examples

ROI

↓

Financial Engine

NOT AI

Compound Interest

↓

Financial Engine

NOT AI

Portfolio Returns

↓

Financial Engine

NOT AI

The AI receives calculated outputs and explains them.

---

## 3. Single Source of Truth

Every important piece of information exists once.

Examples

Risk Profile

Stored in Database

Roadmap

Stored in Database

Investment Holdings

Stored in Database

Goals

Stored in Database

The AI never invents these values.

---

## 4. Capability-Based Design

The system is organized around capabilities rather than pages.

Capabilities include:

Authentication

Financial Profile

Risk Assessment

Roadmap

Financial Calculators

Investment Research

Portfolio Analysis

Education

AI Coaching

Notifications

Every capability can be reused by multiple interfaces.

---

# Technology Stack

Frontend

Next.js

TypeScript

Tailwind CSS

shadcn/ui

PWA

Backend

Next.js Server Actions

Route Handlers

Database

Supabase PostgreSQL

Authentication

Supabase Auth

Storage

Supabase Storage

Deployment

Vercel

Caching

Redis (Future)

AI

OpenRouter

Future

Self-hosted Model

---

# Application Layers

## Layer 1

Presentation Layer

Responsibilities

- UI
- Forms
- Charts
- User Interaction
- PWA Features

No business logic.

---

## Layer 2

API Layer

Responsibilities

- Receive requests
- Validate input
- Authenticate users
- Call services
- Return responses

No financial calculations.

---

## Layer 3

Business Services

This is the heart of the application.

Each capability owns its own service.

Examples

ProfileService

RoadmapService

PortfolioService

RiskService

CalculatorService

EducationService

NotificationService

InvestmentService

AIService

---

## Layer 4

Rule Engine

Contains deterministic decision logic.

Examples

IF emergency fund = 0

Recommend emergency savings first.

IF debt interest > expected investment return

Recommend paying debt.

IF aggressive investment requested by conservative investor

Warn user.

The AI receives these conclusions.

The AI does not create them.

---

## Layer 5

Financial Engine

Contains every financial formula.

Examples

ROI

Compound Interest

Retirement

Inflation

Goal Planning

Loan Repayment

Emergency Fund

Future

Monte Carlo Simulation

Every calculation is deterministic.

---

## Layer 6

AI Operating Layer

The AI Operating Layer coordinates every interaction with the LLM.

Responsibilities

Load user profile.

Load roadmap.

Load risk profile.

Load relevant conversation history.

Load tool outputs.

Construct prompt.

Choose AI provider.

Send request.

Receive response.

Return response.

No page communicates directly with OpenRouter.

Everything passes through the AI Operating Layer.

---

# AI Operating Layer

Responsibilities

Intent Detection
Capability Discovery
Tool Selection
Context Assembly
Prompt Construction
AI Provider Selection
Response Validation
Streaming
Logging
Cost Tracking

# AI Architecture

User Question

↓

Intent Detection

↓

Capability Selection

↓

Required Tool Execution

↓

Prompt Assembly

↓

LLM

↓

Response Validation

↓

Streaming Response

---

Example

User

"If I invest ₦500,000..."

↓

Calculator Engine

↓

Result

↓

Prompt

↓

LLM explains

---

Example

"Analyze Apple"

↓

Investment Capability

↓

Market Data API

↓

Business Summary

↓

Prompt

↓

LLM

↓

Simple Explanation

---

# AI Provider Abstraction

The application communicates with an interface.

NOT directly with OpenRouter.

Example

AIProvider

↓

OpenRouterProvider

Future

↓

LocalProvider

Future

↓

ClaudeProvider

Future

↓

GeminiProvider

Switching providers should require changing configuration, not application logic.

---

# Prompt Architecture

Every AI request contains:

System Prompt

Capability Prompt

User Financial Context

Relevant Roadmap

Risk Profile

Conversation Memory

Tool Results

User Message

Each section is assembled automatically.

---

# Conversation Memory

Memory has three levels.

Level 1

Current Conversation

Level 2

Recent Conversations

Level 3

Persistent Financial Memory

Examples

Risk Profile

Goals

Preferences

Investment Style

Knowledge Level

Only relevant memory should be injected into prompts.

---

# Capability Registry

The Capability Registry acts as the application's service discovery mechanism.

Every capability registers itself during application startup.

Each registration includes:

- capability id
- name
- description
- available tools
- permissions
- routes
- AI instructions
- supported intents

The registry enables:

- plug-and-play capabilities
- AI tool discovery
- feature toggles
- premium capability gating
- independent testing

---

# Capability Structure

Every capability should contain:

Capability

↓

Routes

↓

UI Components

↓

Business Services

↓

AI Tools

↓

Business Rules

↓

Database Access

---

# Capability Communication

Capabilities never communicate directly.

Instead

Capability

↓

Service Layer

↓

Shared Database

↓

Another Capability

Example

Risk Assessment

updates

Risk Profile

Roadmap Capability

reads

Risk Profile

Portfolio Capability

reads

Risk Profile

AI Capability

reads

Risk Profile

This prevents tight coupling.

---

# External Services

OpenRouter

Purpose

LLM Access

Market Data Provider

Purpose

Investment Research

Email Provider

Purpose

Verification

Password Reset

Notifications

Analytics

Purpose

Product Improvement

---

# Security Architecture

Every request follows:

User

↓

Authentication

↓

Authorization

↓

Validation

↓

Business Rules

↓

Database

↓

Response

Never trust client input.

Every sensitive operation is performed server-side.

---

# Error Handling

Every service returns structured errors.

Example

Validation Error

Authentication Error

Authorization Error

AI Provider Error

Market Data Error

Database Error

Unknown Error

The UI never displays raw system errors.

---

# Logging

The system should log:

Errors

AI Calls

Tool Calls

Performance

Authentication Events

Security Events

Future

Cost Per AI Request

---

# Scalability

The architecture should support:

Additional AI providers.

Additional financial capabilities.

Multiple countries.

Additional asset classes.

Enterprise customers.

Advisor dashboards.

API access.

Without major architectural redesign.

---

# Design Philosophy

FOS-AI is not a chatbot with financial features.

FOS-AI is a financial operating system whose primary interface happens to be AI.

Every architectural decision should reinforce that philosophy.