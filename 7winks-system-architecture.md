# 7winks System Architecture Document

## 1. Executive Summary

This document describes the system architecture implied by the repository for 7winks, a web application that combines website creation, AI-assisted editing, growth analytics, domain research, and a Marketing AI Copilot for user guidance. The platform is architected as a modern full-stack SaaS product using Next.js on the server and client, connected to cloud services for authentication, data storage, media handling, AI inference, and external business integrations.

The architectural pattern is a layered application: a user-facing web experience, authenticated API layer, business logic services, persistence layer, and third-party platform integrations. The design supports a broad operational model where a user can create and edit a website, connect it to their identity, ask AI questions about the site, retrieve performance data, and act on marketing recommendations.

The system should be viewed as a modular platform rather than a single monolithic application. Its main architectural concerns are: secure user identity, fast website publishing/editing, AI-driven user assistance, analytics access, and external integrations with minimal operational risk.

## 2. Product and System Context

The repository reflects a SaaS product for small business owners and growth-focused users. The product experiences span:

- User sign-in and onboarding
- Website template browsing and selection
- Website editing and content generation
- Marketing AI Copilot for marketing analysis and recommendations
- AI-assisted website analysis and recommendations
- Analytics and visitor tracking review
- Enquiry and lead retrieval
- Domain opportunity research
- Billing and subscription enforcement

From an architecture standpoint, these features are implemented as a web app composed of route handlers, server actions, database queries, and external API calls. The application is designed to support dynamic user-specific logic while also exposing generic product functionality.

## 3. Architectural Principles

### 3.1 User-centric modularity
The system is built around individual user websites and user-specific data domains. Business logic should resolve the authenticated user and then bind actions to the correct website, subscription, and data sources.

### 3.2 API-first operations
The app exposes a set of server-side routes for website data, AI requests, domain checks, image queries, and account operations. This isolates external system calls and keeps client code relatively thin.

### 3.3 AI as a strategic layer
AI is not treated as a backend database. Instead, it functions as a reasoning and content generation service that uses tools and website context to produce recommendations, edit pages, analyze performance, and answer marketing questions.

### 3.4 Trust and identity enforcement
Authentication and website ownership mapping are foundational. The system must validate user identity before returning analytics, enquiries, ad account details, or any data from a website associated with a user.

### 3.5 Cloud-native deployment
The stack targets a managed hosting environment, with serverless and edge capabilities for fast request handling and low operational overhead.

## 4. High-Level System Architecture

### 4.1 Layered architecture
The system can be represented in the following layered view:

1. Presentation layer
   - Next.js app router pages
   - Interactive UI for website builder, domains, dashboard, templates, and agent chat
   - Client logic for category selection, editing flow, and user onboarding

2. Application layer
   - Route handlers under app/api
   - Business services for subscriptions, website content, analytics, domains, and AI actions
   - Server-side orchestration and data transformation

3. Data and persistence layer
   - Neon Postgres for structured website and user metadata
   - Blob storage for assets and generated media
   - Redis-like usage tracking patterns for per-user AI quotas and counters

4. Integration layer
   - OpenAI and Google GenAI for content generation and agent reasoning
   - Unsplash API for imagery
   - Domain availability and pricing provider integration layer
   - Razorpay for payments
   - Resend for transactional email
   - Google Ads API or campaign data integration

5. Runtime and platform layer
   - Next.js runtime and edge runtime support
   - Vercel/managed hosting and serverless compute
   - Static asset hosting and CDN capabilities

## 5. Component Breakdown

### 5.1 Frontend application
The frontend is implemented as a Next.js application with app router pages. The repository structure implies a user experience with multiple surfaces:

- Landing and product marketing pages
- Site creation and template selection pages
- Editor pages for visual website customization
- Dashboard and billing-related screens
- Domain management screens
- AI assistant and chat experiences

This front-end is responsible for presentation, state management, UI flows, and forms. It calls server APIs for data access and business actions.

### 5.2 Authentication and authorization
The architecture uses Clerk for user authentication and identity. This is the primary trust boundary for user access and session management.

Authentication responsibilities include:

- User sign-in and session management
- Mapping Clerk user identity to website usernames and subscriptions
- Resolving website ownership before returning sensitive user data
- Restricting AI usage and premium features based on access rules

### 5.3 Website data and publishing layer
The website content model appears to store page structure and generated content in a database-backed data model for each user’s website. The system resolves each username to a per-user website table or data record, then reads and updates the site content.

This layer supports:

- Website retrieval by username
- HTML or site-data retrieval for editing and rendering
- Data persistence for custom content, templates, and user website state
- Dynamic re-enablement of website versions and generated fragments

### 5.4 AI orchestration services
There are multiple AI-related services in the codebase. They include:

- Code generation for editing site content
- Blank-page website generation from prompts
- Conversational agent with tool use
- Marketing AI Copilot for campaign, funnel, and performance guidance
- Content generation for website copy and structure
- Natural language recommendation generation from website metrics

These services call OpenAI or Google GenAI APIs. They are orchestrated in route handlers, with rules to maintain conversation state, streaming output, and structured tool responses.

### 5.4.1 Marketing AI Copilot
The Marketing AI Copilot is the product’s strategic assistant layer. It sits above the website editor and analytics pipelines and turns raw data into prioritized recommendations for growth. In practice, it interprets visitor trends, active user behavior, enquiry quality, campaign spend, landing-page friction, and domain opportunities to answer questions such as:

- Which section of my page is blocking conversion?
- Are my ad campaigns still efficient?
- Which leads need follow-up first?
- What is the most important marketing action this week?

The assistant should use website context, authenticated data, and approved tools only, rather than making unsupported claims.

### 5.5 Analytics and insight engine
The system includes analytics logic for:

- Total visits and historical traffic trends
- Active visitors in the last time window
- Enquiries and lead form submissions
- Campaign analysis and strategic suggestions

The architecture treats analytics as a data retrieval and summarization layer. Business logic reads data from storage or provider APIs, formats it, and then provides highly summarized recommendations to the user through the AI layer.

### 5.6 Domain and growth tooling layer
This layer includes domain search, pricing checks, and name-generation logic. It is designed as a targeted support service for marketing and launch decisions.

Key responsibilities:

- Domain availability checks
- Budget-aware recommendation generation
- Price and market validation logic
- Research results without purchasing or reserving domains autonomously

### 5.7 Billing and subscription gateway
The repo indicates premium gating and usage-based limits. Subscription logic is likely enforced at the application layer through account state and quotas.

The architecture likely includes:

- Subscription state lookup
- AI credit counting
- Premium feature gating
- Payment service integration

## 6. Data Architecture

### 6.1 Core entities
The system appears to model the following entities:

- User
- Website
- Website content or page data
- Template metadata
- Subscription state
- AI usage logs
- Enquiries / leads
- Domain records
- Campaign metadata

### 6.2 Persistent stores
The system uses structured relational storage for key business data. Neon Postgres is the likely primary data store, with dynamic site tables created per user or per username namespace.

Data is grouped into:

- Identity and user metadata
- Website configuration and ownership mapping
- Subscription and usage states
- Analytics records
- Leads and enquiries

### 6.3 Blob and media storage
Large assets and generated media are stored outside the relational store for efficiency and reliability. The repo includes blob storage usage patterns and static image directories, which suggests separate handling of asset uploads, generated images, and template media.

### 6.4 Usage and rate-limiting data
The system tracks AI usage with per-user counters, most likely in a lightweight key-value store. This is critical to enforce daily limits and premium restrictions without heavily burdening the database.

## 7. Integration Architecture

### 7.1 AI providers
The architecture integrates with OpenAI and Google GenAI services.

Use cases:

- Text generation and code generation
- Site editing recommendations
- Conversational streaming chat
- Tool-calling and agentic reasoning

These calls are treated as external business capabilities and are isolated behind service boundaries.

### 7.2 Media and assets
Unsplash is used for site imagery. Images are retrieved through real search API calls and returned to the user or embedded in content workflows.

### 7.3 Domain and registration
Domain APIs are used for domain research and pricing checks. This service is read-only for research and should be constrained to informational checks unless a separate purchase workflow is explicitly added.

### 7.4 Payments and communication
The platform includes payment and email channels via Razorpay and Resend, demonstrating a broader operational design that supports monetization and account lifecycle support.

### 7.5 Analytics and data retrieval
Analytics, active visitor count, traffic trends, and enquiry access are likely served through a combination of application logic and provider abstractions. The platform’s AI assistant pulls from these sources and interprets them for the user.

## 8. Request Flow and Runtime Behavior

### 8.1 User website flow
1. User signs in through Clerk.
2. System resolves their associated username and website identity.
3. User navigates into templates, blank editor, or edit flows.
4. Content and structure are retrieved from server-side data or generated by AI.
5. The system returns a website rendering or edited state.
6. The user publishes or updates the content.

### 8.2 AI chat flow
1. User enters a prompt in the AI interface.
2. Server resolves the authenticated website and metadata.
3. Tool definitions are attached to the AI invocation.
4. The model decides what tool actions to perform.
5. Tool responses are combined into a final answer.
6. The answer is streamed to the frontend in real time.

### 8.3 Analytics flow
1. User asks about traffic, visitors, enquiries, or ads.
2. The server resolves their website identity.
3. Data is pulled from storage or external providers.
4. Metrics are summarized and passed to the AI model.
5. The model returns a business interpretation and next steps.

## 9. Security Architecture

### 9.1 Identity and authorization model
The system should enforce the following rules:

- Authenticated identity must be established before any website-specific access.
- Website ownership must be validated before actions are performed.
- Users should never be able to request another user’s data by manipulating request payloads or route parameters.

### 9.2 API boundaries
Routes under app/api act as the main trust boundary. They should validate input, authenticate the user, resolve the correct website, and enforce usage limits before calling downstream integrations.

### 9.3 Data minimization
The system should only expose the minimum information needed for the current request. For example, AI should not access unrelated marketing data or avoid exposing internal system details to the user.

### 9.4 Secret management
Environment variables are used for API keys and hosting configuration. These must be managed in a secure deployment platform and never embedded in frontend-facing code.

## 10. Scalability and Reliability

### 10.1 Horizontal scalability
The app is designed for serverless-style deployment with stateless request handling. Most business logic should be stateless, with data persisted externally.

### 10.2 Edge and serverless fit
The use of Edge runtime indicates a strategy for latency-sensitive operations. This is beneficial for streaming chat responses and fast API interactions.

### 10.3 Failure handling
The architecture should degrade gracefully when:

- AI APIs are slow or unavailable
- Third-party tools return partial or failed responses
- Analytics data is missing
- Storage is temporarily unavailable

This requires clear fallback logic, retries, and user-facing error handling.

## 11. Operational Considerations

### 11.1 Monitoring and observability
The system should log:

- API failures and latency
- User auth failures
- AI request errors
- Subscription and quota checks
- External provider call outcomes

### 11.2 Cost control
AI services and external API calls are expensive and usage-sensitive. The architecture should support quota enforcement and usage tracking to maintain predictable operating costs.

### 11.3 Deployment structure
The repo indicates a managed Next.js deployment model that is cloud-friendly and suitable for rapid iteration. The system should separate:

- app runtime
- data persistence
- asset storage
- monitoring and logging
- external integration health

## 12. Risks and Constraints

### 12.1 Integration dependency risk
The platform depends on several external systems. If AI providers, domain APIs, or analytics providers fail, user workflows can degrade quickly.

### 12.2 Multi-tenant trust risk
Because website data is user-specific, a small authorization bug could expose protected information. Strong ownership checks are essential.

### 12.3 Model quality risk
AI can provide confident but incorrect recommendations. The system must treat AI output as a decision support system and not as ground truth.

### 12.4 Complexity risk
The product spans website building, marketing, domain planning, and analytics. Without clear modular boundaries, the system can become difficult to scale and maintain.

## 13. Recommended Architecture Evolution

### Phase 1: Stabilize core services
- Secure auth and ownership validation
- Website data retrieval and editing flows
- Basic AI generation and chat access
- Subscription and quota enforcement

### Phase 2: Intelligence layer
- Tool-based analytics and agent response flows
- Better summarization and recommendation quality
- Active visitor and lead interpretation

### Phase 3: Growth platform integration
- Campaign and ads integration
- Domain research sophistication
- Richer dashboards and reporting

### Phase 4: Platform maturity
- Multi-website and agency workflows
- Better event-driven processing
- Stronger monitoring and operational automation

## 14. Architectural Summary

The architecture of 7winks is a cloud-native, AI-enabled SaaS platform with a strong emphasis on user-specific website data, external integrations, and decision support. Its design is centered on a secure app layer, a flexible database model, and an orchestration pattern that combines website data with AI reasoning. The product is likely strongest when business logic is kept modular and user identity is enforced strictly at every boundary.

This architecture represents a platform that can serve both product execution and strategic growth guidance, which is consistent with the repository’s broader product vision. It is well suited for a small business-focused SaaS model that aims to turn a website into an intelligent operational asset rather than a static online brochure.
