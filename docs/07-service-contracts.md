# Service Contracts

# Purpose

This document defines the business contracts exposed by FOS-AI.

A Service Contract specifies:

- Business capability
- Business action
- Required inputs
- Returned outputs
- Published events
- Authorization requirements
- Validation rules

The transport mechanism (REST, Server Actions, AI, Mobile, etc.) is intentionally excluded.

A Service Contract represents a business operation, not an HTTP endpoint.

---

# Contract Structure

Each contract defines:

Capability

↓

Business Action

↓

Inputs

↓

Business Rules

↓

Outputs

↓

Published Events

↓

Errors

---

# Authentication Capability

## Create Account

Purpose

Create a new user account.

Input

- Name
- Email
- Password

Output

- User
- Session

Events

- UserRegistered

Errors

- EmailAlreadyExists
- InvalidPassword

---

## Login

Input

- Email
- Password

Output

- Session

Events

- UserLoggedIn

---

# Financial Profile Capability

## Update Financial Profile

Input

- Income
- Expenses
- Savings
- Debt
- Emergency Fund
- Investment Experience
- Country
- Currency

Output

Updated Financial Profile

Events

FinancialProfileUpdated

---

# Risk Assessment Capability

## Submit Assessment

Input

Questionnaire Responses

Output

Risk Score

Risk Category

Recommendations

Events

RiskAssessmentCompleted

FinancialStateChanged (optional)

---

# Roadmap Capability

## Generate Roadmap

Input

Financial Profile

Risk Profile

Goals

Output

Roadmap

Events

RoadmapGenerated

---

## Refresh Roadmap

Input

Updated Financial Data

Output

Updated Roadmap

Events

RoadmapUpdated

---

# Portfolio Capability

## Add Investment

Input

Ticker

Quantity

Purchase Price

Purchase Date

Output

Updated Portfolio

Events

InvestmentAdded

PortfolioUpdated

JourneyUpdated

FinancialHealthCalculated

AchievementUnlocked (optional)

---

## Remove Investment

...

---

## Update Investment

...

---

## Analyze Portfolio

Output

Diversification

Risk Exposure

Recommendations

Portfolio Score

Events

PortfolioAnalyzed

---

# Financial Calculator Capability

## Calculate ROI

Input

Principal

Rate

Duration

Output

ROI

Final Value

Profit

Events

CalculationCompleted

---

## Calculate Compound Interest

...

---

## Calculate Retirement

...

---

# Investment Research Capability

## Analyze Investment

Input

Asset Symbol

Output

Business Summary

Risk Summary

Recommendation

Investment Horizon

Confidence Level

Events

InvestmentAnalyzed

---

## Compare Investments

...

---

# AI Coaching Capability

## Process User Message

Input

Conversation

User Context

Message

Output

Streaming AI Response

Events

ConversationUpdated

ToolExecuted

ConversationSummarized (optional)

---

# Learning Capability

## Complete Lesson

Input

Lesson ID

Output

Updated Progress

Events

LessonCompleted

AchievementUnlocked (optional)

---

# Scam Detection Capability

## Analyze Opportunity

Input

Message

Email

Website

Document

Output

Risk Score

Red Flags

Recommendation

Events

ScamAnalysisCompleted

---

# Financial Health Capability

## Calculate Financial Health

Output

Financial Health Score

Strengths

Weaknesses

Recommendations

Events

FinancialHealthCalculated

---

# Notification Capability

## Create Notification

Input

Notification Type

Payload

Output

Notification

Events

NotificationCreated

---

# Common Response Format

Every service returns:

Success

Data

Metadata

Warnings

Errors (if applicable)

---

# Validation

Every service validates:

Authentication

Authorization

Input Schema

Business Rules

Capability Permissions

Subscription Access

---

# Authorization

Every contract defines:

Public

Authenticated

Premium

Admin

System

---

# Error Contract

Errors should be structured.

Categories include:

Validation

Authentication

Authorization

Business Rule

Infrastructure

AI Provider

Unknown

---

# Versioning

Service Contracts evolve using semantic versioning.

Breaking changes require a new contract version.

---

# Design Philosophy

Business operations define the platform.

Transport protocols are implementation details.

Every interface, whether AI, web, mobile, or future APIs, should consume the same underlying service contracts.