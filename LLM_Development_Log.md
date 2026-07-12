# LLM Development Log

*Development involved iterative collaboration with an LLM. The following document summarizes the major prompts, architectural decisions, debugging process, and reasoning throughout development.*

---

## 1. Initial Architecture & Planning
* **Objective**: Build a multi-agent equity analysis terminal displaying profile audits, news sentiment mapping, and investment scorecards.
* **Architectural Blueprint**:
  * **Frontend**: React-based dashboard featuring slate panel glassmorphism.
  * **Backend**: Express node server orchestrating third-party APIs.
  * **Orchestration**: Parallel searches, context merging, and single-inference Gemini execution mapping to a structured JSON schema.

---

## 2. Iterative Development & Major Prompts

### Search Autocomplete & Verification
* **Prompt Idea**: *"Design a search console that queries Alpha Vantage SYMBOL_SEARCH and falls back to Serper organic query search results, combining and ranking them by match relevance."*
* **Implementation**: Built a custom search merging algorithm in `routes/analysis.js` that compiles Alpha Vantage ticker results and Serper search logs, deduplicating them and sorting by relevancy.

### Centralized Gemini Call Optimization
* **Prompt Idea**: *"Given a complete context JSON block containing the company profile, verified website details, financial statements (revenue and EPS history), and raw news snippets, write a system prompt for Gemini 2.5 Flash to act as a principal investment analyst. Have it run a mock debate among 7 specialized expert personas and return a structured JSON report matching the scorecard schema."*
* **Reasoning**: Instead of calling Gemini multiple times (which would take up to 2 minutes), a single optimized prompt with structural output rules reduces latency to under 30 seconds and guarantees schema alignment.

---

## 3. Key Design Decisions & Trade-offs
* **JavaScript ESM**: Evaluated TypeScript but opted for modern ES Modules to avoid transpiler complexities and ensure fast hot-module replacement (HMR) times.
* **Tavily Search Depth Optimization**: Initially configured Tavily query crawls to `"advanced"`, which added 4+ seconds of latency. Changing search depth to `"basic"` optimized results retrieval times to under 1.5 seconds while maintaining snippet quality.
* **Client-Side Caching**: Implemented session storage on the client console to cache analysis reports, providing instant dashboard reloads on page transitions.

---

## 4. Feature Implementations

### Committee Decision System
* **Orchestration**: Prompted Gemini to represent 7 distinct expert personas: Financial Analyst, Risk Officer, Industry Analyst, News Analyst, Valuation Analyst, Growth Analyst, and Portfolio Manager.
* **Vote Logic**: Each persona evaluates the unified context from their perspective, casting ballots (Invest, Hold, Pass) and outputting a structured reason that appears in the frontend detail grid.

### Interactive Onboarding Tour
* **React Joyride Customization**: Added steps guiding the user through the search input, verified profile card, sentiment stream, financial health tabs, and expert committee.
* **Tooltip Resolution**: To resolve styling conflicts with global CSS rules, developed a custom `TourTooltip` component with a slate-900 popover panel and clear Previous, Next, and End Tour actions on all steps.
* **Persistence Logic**: Set up `onboarding_home_completed` and `onboarding_dashboard_completed` flags in local storage to prevent the tour from auto-starting repeatedly on return visits while preserving manual start-tour button overrides.

---

## 5. Performance Improvements & Bug Fixes
* **Clean Conditional Rendering**: If the Alpha Vantage API key is rate-limited or fails to return historical statement details, the charts component collapses and returns `null` to maintain a clean layout instead of rendering empty/blank axes.
* **API Exhaustion Safety**: Configured global error handlers on both the backend and frontend. If an API quota is exhausted, raw JSON errors, provider details, and server stacks are suppressed, and the user-friendly `"API quota exhausted."` message is rendered.
