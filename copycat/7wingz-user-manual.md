# 7Wingz User Manual

This manual explains how to start using 7Wingz based on the features and screens present in this repository. It is written for a real user who wants to know what to click, what each page is for, and how the main functions work.

---

## 1. What 7Wingz is

7Wingz is a website-building and growth platform for small businesses, founders, and creators. In this codebase, the product combines:

- Website creation and page editing
- AI-assisted content generation
- Template-based landing pages
- Saved projects and revisit flows
- Subscription and premium upgrade
- Analytics and AI agent insights
- Email marketing workflow
- Domain search and purchase research
- Refund and billing information

The core idea is simple: create a site quickly, improve it with AI, and then understand how it is performing.

---

## 2. How to get started

### Step 1: Sign in
Go to the sign-in flow.

What to do:
- Open the app.
- Click Sign in.
- Sign in with your account.

After sign-in, the app automatically checks whether you already have a linked username.

If you do not yet have one:
- You are redirected to create a username.
- You will see a form to create your public website identity.

### Step 2: Create or confirm your username
This is the identity that links your account to your website.

Typical flow:
- Sign in
- Create a username
- The system stores the username against your account
- You are then taken to your workspace or template page

Examples from the repo suggest the user may land on a flow such as:
- /sign-in
- /after-sign-in
- /new_username
- /templates/[username]

Important: Your username is important because many later pages are personalized around it, such as your website workspace, pricing page, saved pages, and agent tools.

---

## 3. Main user journey: build a website

### Option A: Use a template
Once your username is created, you arrive at the workspace page. This is where you choose how you want to build.

Look for screens such as:
- “What would you like to build today?”
- category tabs like landing page, business, etc.
- template cards with titles and descriptions
- search bar for template discovery

What to do:
1. Open your template workspace.
2. Pick a category.
3. Search or browse templates.
4. Click a template you like.
5. The system begins setup and redirects you into the editor.

The app from the repo supports template browsing and selection under routes such as:
- /templates/[username]
- /edit/[username]
- /edit_new/[username]

### Option B: Start with a blank page
If you do not want a template, there is also a blank editor flow.

What to do:
- Select the blank editor option.
- The app takes you into a new editing interface.
- You can create content from scratch.

This is useful when you want more control or are building a custom layout from zero.

---

## 4. Editing your website

### Editing interface
The editor flows are built around content editing and website generation.

You can generally expect the following actions:
- Change text blocks
- Replace website content using AI prompts
- Modify layout or style choices
- Upload assets or images
- Generate sections with AI
- Save your current work

### AI-assisted editing
The codebase includes AI generation tools for website edits and website creation.

Typical use:
- Enter a natural-language instruction such as: “Make this a premium SaaS landing page” or “Change the headline to emphasize trust and ROI.”
- The AI updates the website content or structure.
- The editor keeps the structure stable when possible.

Important behavior in the repo:
- AI is used to change page content
- It tries to preserve the existing object structure
- It avoids changing image URLs unless necessary
- It should produce valid HTML or updated JavaScript payloads depending on the tool used

This means AI is best used for:
- Headline rewrites
- Section updates
- Brand messaging
- Product page copy
- Landing page refinement

### Save and revisit projects
If you want to come back to your work later, the system includes a saved-items flow.

Look for:
- Saved workspace items
- Re-open saved projects
- Continue editing a previously saved design

This is usually reached via:
- /saved/[username]

This function is useful when you are iterating on versions of your website or working on multiple concepts.

---

## 5. Publishing and launch

The product is designed to help users get live quickly.

Typical workflow:
1. Select a template or blank editor
2. Edit text, structure, and design
3. Review your page
4. Publish or move to a live version

The user experience is meant to reduce setup friction.

The repo repeatedly describes features such as:
- instant publishing
- no technical friction
- launch cleanly and quickly

This means the product is meant to be a lightweight website system rather than a complex dev environment.

---

## 6. Premium and subscription features

### View pricing
There is a pricing page associated with each username.

Typical flow:
- Open the pricing page
- Select the upgrade option
- Review free vs premium features

Page behavior from the repo suggests:
- Users can check current premium status
- They can create an order with Razorpay
- Successful payment verifies through a server route

### Free plan includes
- Core templates
- Basic website starting points
- AI-assisted editing
- Instant publishing

### Premium plan includes
- Premium templates
- More design variety
- Save and revisit projects
- Full layout and code access
- AI, email, and Google Ads credits

### Premium pricing shown in the repo
- €6.66 / month

This indicates the product is positioned as a subscription is a way to unlock more breathing room for building and scaling.

### What to click
- Look for the pricing button or upgrade CTA
- Click “Unlock Premium”
- Confirm the plan
- Complete payment

### Credits policy
The repo highlights credits as follows:
- Credits carry forward
- They do not expire
- Users can recharge if they run out

This is important because AI usage and campaign tools are likely quota-managed.

---

## 7. Email marketing workflow

The product includes a direct email campaign feature.

### What it does
- Upload a list of contacts from CSV or Excel
- Review selected contacts
- Choose an email template
- Send the user into an AI-assisted email campaign flow

### What to click
- Open the template or workspace page
- Find the email campaign action
- Upload a CSV or Excel file
- Add contacts
- Choose a layout template
- Continue to AI email workflow

### Input format
The code accepts:
- CSV files
- Excel files

The app also provides a downloadable sample CSV with columns like:
- Name
- Email

This feature is relevant for campaign marketing and customer outreach.

---

## 8. Domain search and naming support

### Why it matters
A business often needs a good domain name to match the brand and be easy to remember.

### What the system can do
The repo includes domain-search and availability-check tools. These can:
- check domain availability
- suggest names
- compare price options
- support six-letter .com searches
- keep results under the user’s budget

### Typical use
- Enter a name idea or brand concept
- Check if the domain is available
- Review pricing and suggestions
- Decide whether to move ahead with the purchase or continue research

Important note: This is a research and recommendation workflow, not an unconditional purchase flow. It is designed to support decisions without bypassing user approval.

---

## 9. AI agent and website insights

This is one of the key differentiators of the product. The repo includes an AI user agent that answers business questions using real website data and tool access.

### What the agent can do
The system prompt says the agent can:
- search Unsplash for website images
- retrieve enquiries
- review visitor counts and traffic trends
- check active visitors
- review Google Ads campaigns
- explain 7Wingz features
- research domain names within budget
- review HTML, scripts, design, UX, SEO, accessibility, performance, and conversion flow

### How to use it
- Open the developer or agent page
- Ask a question in plain language
- The AI reads the relevant website and/or connected data
- It returns suggestions and analysis

Examples of good questions:
- “What is my account status?”
- “How is my site performing this week?”
- “What are my active visitors?”
- “Which pages are likely converting?”
- “What should I fix on the homepage?”
- “Are my Google Ads campaigns healthy?”

### Important caveat
The agent is intended to be grounded in real data and connected tools. It should not invent capabilities or pretend to do things outside the supported system.

---

## 10. Developer agent and analytics page

The repo contains a dedicated developer agent page for analytics and read-only website review.

Typical behavior:
- Enter a username
- Type a prompt into the analysis box
- Press Analyze
- The app calls the dev-agent API
- The response is shown in the UI

This is useful for:
- traffic analysis
- account checks
- enquiry review
- growth troubleshooting

This page is especially useful for people who want more data-driven answers than a simple visual editor gives them.

---

## 11. Refunds and billing policy

The repo includes a clear refund policy.

### Main points
- Subscriptions are usually billed in advance and are mostly non-refundable after successful payment
- Cancellation is allowed anytime
- Unused periods are not refunded
- Duplicate or billing errors may qualify for refund review
- Approved refunds are processed back to the original payment method

### Where to find it
- /legal/refund
- /refunds/[username]

### What to do if needed
- Read the policy
- Check whether you qualify
- Contact support at support@7wingz.com if you believe there is a billing issue

---

## 12. Recommended workflow for a first-time user

If you are new to the product, this is the easiest order to follow:

1. Sign in
2. Create your username
3. Open the templates page
4. Pick a template or start blank
5. Edit the page with AI or manual content changes
6. Save your work
7. Review your site and improve the messaging
8. Upgrade to Premium when needed
9. Use the AI agent to review traffic, enquiry quality, and next actions
10. Try domain research for naming ideas
11. Run email campaigns and growth experiments

This path gives you the fastest route from zero to a working site and then to optimization.

---

## 13. Common user actions and where they live

| Action | Likely place |
| --- | --- |
| Sign in | /sign-in |
| Create username | /new_username |
| After sign-in redirect | /after-sign-in |
| Choose template | /templates/[username] |
| Edit website | /edit/[username] or /edit_new/[username] |
| View saved work | /saved/[username] |
| View pricing | /pricing/[username] |
| View refunds | /refunds/[username] |
| Review domain options | /domains |
| Use AI agent | /dev-agent/[username] |

---

## 14. Troubleshooting

### I cannot sign in
- Check that your account is authenticated
- Make sure your username was created after sign-in
- Revisit the sign-in flow

### I do not see my workspace
- Check whether your username was created successfully
- Make sure you were redirected to the personalized page
- Return to the sign-in or onboarding step

### The AI agent is not responding
- Check the prompt text
- Confirm the site or username is linked correctly
- Confirm that the server environment has valid API keys
- Try a shorter and clearer question

### Premium features are not active
- Check pricing and payment status
- Verify successful payment completion
- Ensure the subscription state is updated in the system

### I cannot upload CSV or Excel contacts
- Make sure the file is valid and in a supported format
- Check column names like Name and Email
- Use a simple sample file to test

---

## 15. Quick answer: what should a new user do first?

If you are starting from scratch, do these in order:

1. Sign in
2. Create a username
3. Choose a template
4. Edit text and layout
5. Save the version
6. Publish or launch the site
7. Upgrade to Premium if you need more templates, savings, or credits
8. Ask the AI agent for analytics and improvement suggestions

This is the most complete real-world flow supported by the repository.

---

## 16. Summary

7Wingz is designed to be more than a basic website builder. The product blends:

- design and content editing
- AI writing and generation
- website publishing
- subscription management
- marketing and email workflow
- domain support
- analytics and AI review

For a new user, the main goal is to create a username, build a website, refine it with AI, and use the growth tools to understand what works and what to improve next.

This guide gives a practical overview of how a user can navigate the system and understand the key features hidden in the repo.
