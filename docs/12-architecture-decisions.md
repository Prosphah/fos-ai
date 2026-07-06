# ADR-001

Title: AI performs reasoning only.

Decision: All financial calculations are deterministic.

Reason: Mathematical accuracy.

Status: Accepted.

# ADR-002

Title: Capability-Based Architecture

Decision: The platform is organized around capabilities rather than pages.

Reason: Supports long-term scalability.

Status: Accepted.

# ADR-003

Title: Provider Abstraction

Decision: Application code never communicates directly with OpenRouter.

Reason: Supports future self-hosting.

Status: Accepted.

# ADR-004

Title: AI Provider Independence

Decision:

    The platform must not depend directly on a single AI provider.
    All inference passes through a provider abstraction.
    Google Gemini API is the default provider during the MVP because it offers excellent capability with minimal cost.
    Additional providers can be introduced without changing business logic.

Status: Accepted.