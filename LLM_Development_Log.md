# LLM Development Log

*Development involved iterative collaboration with an LLM. The following document summarizes the major prompts, architectural decisions, debugging process, and reasoning throughout development.*

---

## 1. Project Planning & Scoping
* **Goal**: Build an AI-driven multi-agent securities analysis portal allowing real-time searching, profile audits, sentiment maps, and financial health scorecards.
* **Architectural Blueprint**:
  * **Frontend**: React-based dashboard featuring dark-mode slate panel aesthetics.
  * **Backend**: Express node server orchestrating third-party APIs.
  * **API Pipeline**: Parallel search lookups to bypass single-source limits, unified context creation, and single-inference Gemini execution mapping to a structured JSON schema.

---

## 2. Iterative Development & Major Prompts

### Autocomplete & Search Verification
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

## 4. Key Bug Fixes & Optimization
* **Onboarding Joyride Overlaps**: Default Joyride styling conflicted with Tailwind slate rules. Overrode this by developing a custom `TourTooltip` JSX component mapping to standard slate colors, including complete End Tour controls on all steps.
* **Unverified Information Filtering**: To avoid showing empty placeholders, added clean validations (`isVerified`) that dynamically collapse empty fields (such as Careers, LinkedIn, or Investor Relations) if no verified links are found.
* **API Exhaustion Safeguards**: Standardized backend and frontend SSE catch blocks. If Gemini/Alpha Vantage rate limits are hit, the application suppresses stack traces and displays a clean `"API quota exhausted."` message.
