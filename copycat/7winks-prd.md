# 7winks Product Requirements Document

## 1. Executive Summary

This PRD captures the product direction implied by the current repository: 7winks is an AI-assisted website creation and growth platform for small businesses, founders, and marketing teams that need to go from idea to live site, then optimize traffic, leads, and conversions. The product combines website templates, a visual editor, AI-driven copy and page generation, analytics dashboards, domain research, and a conversational agent that can answer questions using real website and campaign data.

The repo shows a product that is not only a website builder, but a growth operating system for digital businesses. Users can sign in, create a custom username, choose templates, edit pages, publish content, and then ask an AI agent to review performance, campaign health, visitor activity, domain opportunities, and customer enquiries. This makes 7winks a hybrid of website builder, marketing dashboard, AI copilot, and lead-generation assistant.

The core opportunity is to help non-technical owners quickly launch a modern online presence and make better decisions using AI and live business data. The product should prioritize speed to launch, clarity of metrics, and trust in automated recommendations.

## 2. Product Context and Evidence From the Repo

The repository includes the following product signals:

- A sign-in and onboarding flow that links a Clerk user to a website username.
- A template selection experience for landing pages and marketing pages.
- A rich page editor with AI-assisted generation and blank-site creation.
- An AI agent for website analysis and performance interpretation.
- Analytics features for visitor counts, active visitors, and traffic trends.
- Enquiry retrieval and customer lead handling.
- Google Ads campaign review and optimization guidance.
- Domain research and availability checks.
- Subscription and usage limits for AI and premium capabilities.

These features indicate a single product vision: launch a site quickly, understand how it performs, and act on growth insights without needing separate tools for design, analytics, lead capture, and domain strategy.

## 3. Problem Statement

Most small businesses struggle with four common bottlenecks:

1. Building a credible website takes time and technical effort.
2. The website is rarely connected to performance insights or customer behaviour.
3. Growth decisions depend on fragmented data across analytics, ads, leads, and SEO tools.
4. Business owners do not have a simple way to ask strategic questions about performance and next steps.

7winks addresses this by offering a single workspace where users can create or update websites and receive growth guidance from AI grounded in their actual site data.

## 4. Product Vision

7winks will become the easiest way for a business owner to move from concept to online presence to measurable growth. The product should feel like a guided operating system: create the site, connect the business data, ask what is working and what needs attention, and act on the recommendations.

### Product mission
To turn a small business website into a living growth asset that is easy to launch, easier to understand, and faster to improve.

### Product promise
Users can create their online presence in minutes and get AI-powered guidance on design, traffic, ads, leads, and domain strategy without depending on multiple disconnected platforms.

## 5. Target Users and Personas

### 5.1 Founder / small business owner
Needs: launch quickly, present a convincing brand, understand website leads and visitor trends, improve conversion.

Pain points: limited time, limited technical skills, frequent need to interpret marketing data without a dedicated analyst.

### 5.2 Freelancer or agency operator
Needs: build client-facing prototypes quickly, manage templates, review site performance, and offer strategic recommendations.

Pain points: too many tools, slow turnaround, difficulty translating analytics into action.

### 5.3 Growth-focused marketer
Needs: identify traffic drivers, review campaign health, summarize performance, and generate action items.

Pain points: disconnected data sources and lack of a single source of truth.

### 5.4 Brand or content-led creator
Needs: personal website, clean landing pages, and a clear message with a minimal setup burden.

Pain points: complexity of site publishing and maintaining visual quality.

## 6. Core User Journeys

### Journey 1: Create and launch a business website
1. User signs in.
2. User confirms or creates a website username.
3. User selects a template category and design direction.
4. User edits content, colors, sections, and copy.
5. User publishes the site.
6. User can continue to refine with AI or custom edits.

Success metric: user publishes a live site in under 20 minutes.

### Journey 2: Ask the AI agent for guidance
1. User opens the AI agent interface.
2. User asks a question about traffic, enquiries, ads, or marketing strategy.
3. The system resolves the authenticated website and data sources.
4. The agent interprets website and performance information.
5. The agent returns a concise recommendation.

Success metric: user receives actionable insight within a few seconds.

### Journey 3: Review growth health
1. User requests traffic trends and active visitor counts.
2. User sees total visits, daily trends, and conversion opportunities.
3. User checks new enquiries and lead quality.
4. User investigates campaigns and budgets.
5. User decides whether to change messaging, landing page sections, or ad targeting.

Success metric: user can identify a top issue and next action without external research.

### Journey 4: Plan domain and naming strategy
1. User enters a concept or brand idea.
2. The system checks domain availability and price.
3. The system surfaces six-letter .com suggestions under budget.
4. User evaluates domain fit and proceeds with purchase or further research.

Success metric: user receives relevant, revenue-oriented naming options quickly.

## 7. Scope of the Product

### In scope
- Website build and editing experiences
- AI-assisted content generation
- AI website agent with business context
- Visitor analytics and trend reporting
- Enquiry management and lead access
- Google Ads review
- Domain research and supply of available options
- Subscription-based usage controls
- Template and design gallery

### Out of scope for v1
- Full enterprise CMS and multi-site management
- Complex white-label agency portal
- Deep native e-commerce marketplace features
- Complex CRM automation beyond basic enquiry retrieval
- Full SEO suite and backlink automation

## 8. Functional Requirements

### 8.1 Account and onboarding
- Users must be able to sign in via secure authentication.
- Users must be able to set a unique public website username.
- The system should link a user to their website, subscriptions, and AI usage.
- A subscription state should gate premium access and AI credits.

### 8.2 Website creation and editing
- Users should be able to choose from design templates and categories.
- Users should be able to create a blank webpage.
- Users should be able to edit content, styles, and page structure.
- The system should preserve the site structure when AI is used for edits.
- Users should be able to update brand and layout without writing code.

### 8.3 AI assistance
- The AI should generate website copy and structure from prompts.
- The AI should answer strategic questions about site performance, traffic, and leads.
- The AI should use website data and tools to answer based on actual state, not guessed assumptions.
- AI output should be concise, action-oriented, and clear for non-technical users.

### 8.4 Analytics and insights
- Users should be able to see total visit counts.
- Users should be able to review traffic trends over time.
- Users should be able to see active visitor estimates.
- Users should be able to check website inquiry volume and the content of submitted messages.

### 8.5 Advertising and growth support
- Users should be able to review campaign performance information.
- The AI should summarize campaign status, budget, and optimization suggestions.
- Users should be able to ask for strategic recommendations that connect traffic, conversion, and ad spend.

### 8.6 Domain support
- Users should be able to search for available six-letter .com domain ideas.
- The system should return a list of candidates under target budget.
- The system should use real availability checks and clearly avoid implying purchase or reservation.

## 9. Non-Functional Requirements

### Performance
- Core dashboard and landing page actions should feel responsive.
- AI responses should be returned in near-real time for routine queries.
- Streaming output should be supported for a conversational experience.

### Reliability
- Missing environment variables and API failures should be handled gracefully with explicit errors.
- The system should degrade gracefully when data sources are unavailable.
- Analytics requests should avoid silent data loss.

### Security and privacy
- User identity must be verified before requesting website-specific data.
- User data must not be accessible across unrelated website accounts.
- AI actions should only use authenticated website context when required.

### Usability
- Interface copy should be simple, direct, and outcome-oriented.
- Users should understand what the system can do without deep training.
- Recommendations should be framed as insights, not as unverified claims.

## 10. Key Metrics and Success KPIs

### Product adoption
- Sign-up completion rate
- Active users per month
- Template usage rate
- Publish conversion rate

### Engagement
- Average number of AI conversations per active user
- Website edits per user per week
- Time from sign-in to first published site

### Business value
- Number of leads or enquiries generated
- Traffic growth after publishing
- Domain research use rate
- Premium conversion rate

### Reliability
- API failure rate
- AI response latency
- Error recovery rate

## 11. Risks and Constraints

### Data dependency risk
The product depends on multiple external systems: AI APIs, analytics data, Google Ads, Unsplash, and domain services. If any one of these fails, the user experience can become inconsistent.

### Trust risk
Users may question AI recommendations if they are not clearly tied to real website context. The product must show evidence-based outputs and avoid unsupported claims.

### Subscription risk
Usage limits can frustrate users if they are not clearly explained. Premium features should be transparent and aligned with customer value.

### Product complexity risk
The repo suggests a broad set of capabilities. Without disciplined prioritization, the product could become too broad and hard to support. The roadmap must protect the core value proposition.

## 12. Recommended Product Strategy

The next phase should focus on a tight and valuable core experience:

1. Website creation with templated and AI-assisted editing.
2. AI analysis of the current site and business context.
3. Live website metrics and enquiry visibility.
4. Growth recommendations tied to live data.
5. Domain naming assistance and ad review.

This is the right wedge because it emphasizes business outcomes rather than just tool creation. The product should feel like a digital growth partner, not a generic content generator.

## 13. MVP and Phase Plan

### Phase 1: Launch foundation
- Secure sign-in and onboarding
- Template selection and website editor
- AI copy generation and blank-page generation
- Basic analytics and enquiry retrieval

### Phase 2: Intelligence layer
- Conversational AI assistant
- Website-specific recommendations
- Traffic trend summaries
- Active visitor and lead view

### Phase 3: Growth platform
- Google Ads support
- Domain opportunity research
- Premium usage controls and insights dashboard

### Phase 4: Expansion
- Agency workflows
- Multi-site management
- Deeper CRM and campaign analytics

## 14. Product Decisions and Priorities

Priority must be given to the following product principles:

- Build for business owners, not only developers.
- Tie insights to real data and authentic site context.
- Keep the interface simple, fast, and confidence-building.
- Make recommendations actionable, not generic.
- Treat AI as a growth assistant, not a marketing gimmick.

## 15. Conclusion

The repository reflects a product with strong strategic potential: a website builder that also acts as a growth advisor. The distinctive advantage is not just generating pages, but translating live website data into insights about traffic, inquiry quality, ads, and next best actions. If 7winks focuses on this value proposition with discipline, it can position itself as a practical AI growth platform for small businesses rather than a generic site generator.

This PRD should be used as the product baseline for roadmap planning, feature prioritization, and stakeholder alignment. The product should continue to evolve around a single narrative: create the website, understand the results, and improve the business.
