-- Seed Data for FMI (Freshers Mock Interview)
-- At least 40 questions across HR, Frontend, Backend, Data/ML + 20 curated resources + Interview Templates

-- 1. Interview Templates
INSERT INTO interview_templates (id, title, description, role, difficulty, duration_minutes, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Frontend Developer Fresher Mock', 'Evaluates core JavaScript, React, CSS, and basic web fundamentals alongside behavioral fit.', 'Frontend Developer', 'fresher', 20, true),
    ('a0000000-0000-0000-0000-000000000002', 'Backend Developer Fresher Mock', 'Covers REST APIs, relational databases, caching, error handling, and server logic.', 'Backend Developer', 'fresher', 20, true),
    ('a0000000-0000-0000-0000-000000000003', 'Data & ML Engineer Fresher Mock', 'Tests Python data pipelines, SQL querying, model evaluation metrics, and basic ML algorithms.', 'Data Engineer', 'fresher', 20, true),
    ('a0000000-0000-0000-0000-000000000004', 'Campus Placement General HR Mock', 'Comprehensive behavioral interview assessing communication, conflict resolution, teamwork, and culture fit.', 'Software Engineer', 'fresher', 15, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Question Bank (At least 40 questions: 10 HR, 10 Frontend, 10 Backend, 10 Data/ML)

-- HR QUESTIONS (10)
INSERT INTO question_bank (domain, difficulty, category, question_text, expected_key_points, probing_follow_ups, model_answer)
VALUES
(
    'hr', 'fresher', 'Introduction',
    'Tell me about yourself and what inspired you to pursue a career in software engineering.',
    '["Academic background and tech journey", "Specific project or turning point that sparked interest", "Core technical passions and relevant skills", "Enthusiasm for continuous learning"]',
    '["What was the most challenging technical project you built during college, and what was your individual contribution?", "How do you stay updated with emerging technologies outside your coursework?"]',
    'A strong answer follows the Present-Past-Future format: outlines current academic status and primary skills, highlights a concrete project that triggered genuine excitement for programming, and articulates why this entry-level role aligns with career ambitions.'
),
(
    'hr', 'fresher', 'Behavioral - Conflict',
    'Describe a time when you had a disagreement with a team member during a group project. How did you resolve it?',
    '["Specific context and technical or task disagreement", "Active listening and understanding peer perspective", "Objective evaluation based on project requirements", "Amicable compromise and successful outcome"]',
    '["If your teammate had refused to compromise, what steps would you have taken?", "What did you learn about your own communication style from that experience?"]',
    'Structured using the STAR technique (Situation, Task, Action, Result). Focuses on depersonalizing the conflict, looking at data or user needs, holding a 1-on-1 discussion, and reaching a collaborative decision without toxicity.'
),
(
    'hr', 'fresher', 'Behavioral - Pressure',
    'Can you share an experience where you faced a tight academic or project deadline? How did you prioritize your workload?',
    '["Clear prioritization framework (e.g. Eisenhower matrix or MoSCoW)", "Breaking work down into manageable milestones", "Proactive communication with stakeholders or professors", "Delivering MVP on time without burning out"]',
    '["What features or items did you decide to de-scope, and how did you decide?", "How did you manage stress during that intense period?"]',
    'Demonstrates calmness under pressure, intentional time management, breaking complex tasks into smaller chunks, identifying critical path deliverables, and meeting commitments.'
),
(
    'hr', 'fresher', 'Behavioral - Failure',
    'Tell me about a time a project did not go as planned or you made a mistake. What happened and what did you learn?',
    '["Accountability without shifting blame to teammates or tools", "Root cause of the mistake or failure", "Immediate remediation action taken", "Key lessons and safeguards implemented for future projects"]',
    '["Looking back, what early warning sign did you miss?", "How did this failure change your approach to testing or design?"]',
    'Shows humility and high ownership. Highlights an authentic setback (e.g., misconfigured database migration or missed edge case), immediate transparent remediation, and long-term habit changes.'
),
(
    'hr', 'fresher', 'Motivation',
    'Why do you want to join our engineering team specifically, rather than any other technology company?',
    '["Knowledge of company mission, tech stack, or engineering culture", "Connection between company challenges and candidate interests", "Growth and learning opportunities envisioned", "Genuine enthusiasm"]',
    '["Which of our products or features do you think could be improved, and how?", "What kind of mentorship environment helps you thrive most?"]',
    'Goes beyond generic praise. Cites specific engineering blog posts, open source contributions, or product mechanics, and articulates clear alignment with personal learning goals.'
),
(
    'hr', 'fresher', 'Adaptability',
    'How do you approach learning a completely new programming language or framework under time constraints?',
    '["Structured learning methodology (docs -> hello world -> small project)", "Understanding fundamental paradigms before syntax", "Consulting official documentation and community best practices", "Iterative building and debugging"]',
    '["Give an example of a technology you had to pick up in just a few days. How did it go?", "How do you verify that the code you write in a new framework follows idiomatic standards?"]',
    'Demonstrates self-directed learning efficiency. Emphasizes building small proof-of-concept apps rather than getting stuck in tutorial hell, and leveraging foundational CS principles.'
),
(
    'hr', 'fresher', 'Teamwork',
    'Give an example of how you supported a teammate who was struggling with their assigned task.',
    '["Empathy and recognizing signs of teammate struggle", "Collaborative problem solving without taking over completely", "Pair programming or knowledge sharing", "Fostering mutual team success"]',
    '["How did you balance helping them with completing your own deliverables?", "What did you do to ensure they felt confident continuing independently?"]',
    'Highlights emotional intelligence and team-first mentality. Explains constructive pair programming, asking guiding questions, and empowering the teammate rather than doing the work for them.'
),
(
    'hr', 'fresher', 'Ethics & Integrity',
    'If you noticed a shortcut in the codebase that meets the deadline but introduces a security risk, what would you do?',
    '["Refusal to compromise on core security or ethics", "Clear quantification of the risk and impact", "Proposing pragmatic alternatives or phased rollouts", "Escalating constructively to lead or mentor"]',
    '["What if a senior engineer insisted on shipping the shortcut anyway?", "How would you document this technical debt to ensure it gets addressed?"]',
    'Demonstrates professional integrity, constructive assertiveness, risk evaluation, and proposing balanced solutions (e.g., hotfix with an immediate follow-up ticket).'
),
(
    'hr', 'fresher', 'Self-Awareness',
    'What is one critical technical or soft skill area you are actively working to improve right now?',
    '["Honest recognition of a genuine gap", "Concrete actionable steps being taken (courses, books, projects)", "Measurable progress demonstrated", "Positive mindset towards feedback"]',
    '["What feedback from peers or mentors surprised you in the past?", "How do you evaluate whether your improvement efforts are succeeding?"]',
    'Avoids fake weaknesses like "I work too hard". Gives a genuine technical or soft skill (e.g. public speaking or distributed systems tracing) and demonstrates deliberate practice.'
),
(
    'hr', 'fresher', 'Ambition & Goals',
    'Where do you see yourself in two to three years, and what milestones do you hope to achieve as a software engineer?',
    '["Mastery of core engineering lifecycle and code quality", "Transitioning from mentee to autonomous contributor", "Taking ownership of end-to-end features or systems", "Contributing to team culture and mentoring newer joiners"]',
    '["What kind of engineering problems excite you the most?", "How do you measure your own personal success year over year?"]',
    'Shows grounded ambition, realistic expectations for early career trajectory, dedication to craft, and desire to create measurable business and technical value.'
);

-- FRONTEND QUESTIONS (10)
INSERT INTO question_bank (domain, difficulty, category, question_text, expected_key_points, probing_follow_ups, model_answer)
VALUES
(
    'frontend', 'fresher', 'JavaScript Core',
    'Explain the JavaScript Event Loop. How do the call stack, microtask queue, and macrotask queue interact?',
    '["Single-threaded nature of JS execution", "Call stack execution order", "Microtask queue priority (Promises, queueMicrotask)", "Macrotask queue processing (setTimeout, setInterval, I/O)", "Render execution phase"]',
    '["If you have a setTimeout with 0ms and a resolved Promise.then, which runs first and why?", "What causes an application UI to freeze in terms of the event loop?"]',
    'JavaScript is single-threaded with a runtime event loop. Synchronous code executes on the call stack. When async APIs finish, callbacks enter queues. Once the call stack is empty, the event loop drains ALL microtasks (Promises, process.nextTick) before picking the next single macrotask (setTimeout, event callbacks), followed by browser reflow/repaint.'
),
(
    'frontend', 'fresher', 'React Fundamentals',
    'What is the difference between state and props in React, and when should you lift state up?',
    '["Props are read-only inputs passed from parent to child", "State is internal mutable data managed by the component", "One-way data flow principle", "Lifting state up when sibling components need to share or coordinate data"]',
    '["What problems can arise from lifting state up too high in the component tree?", "How do modern state libraries like Zustand or Context compare to lifting state?"]',
    'Props pass configuration down the tree and are immutable to the child. State represents dynamic values that trigger re-renders when updated. When two or more sibling components need access to the same changing data, you lift state to their closest common ancestor.'
),
(
    'frontend', 'fresher', 'React Hooks',
    'Explain how the useEffect hook works and why the dependency array is crucial. What happens if you omit it versus passing an empty array?',
    '["Side-effects management (fetching, subscriptions, timers)", "No dependency array runs on every render", "Empty array runs only once on mount and cleans up on unmount", "Dependencies array triggers re-run when specified values change by reference", "Cleanup function execution to prevent memory leaks"]',
    '["What is a stale closure in useEffect and how do you resolve it?", "Why shouldn''t you put objects or functions directly in the dependency array without memoization?"]',
    'useEffect synchronizes a component with external systems. Omitting the array causes execution after every render. An empty array runs once on mount. Supplying specific variables compares references across renders; if any change, the cleanup runs, then the effect re-fires.'
),
(
    'frontend', 'fresher', 'CSS & Layout',
    'Compare CSS Flexbox and CSS Grid. When would you choose one over the other in modern web layout?',
    '["Flexbox is one-dimensional (row OR column content flow)", "Grid is two-dimensional (simultaneous rows AND columns)", "Flexbox excels at dynamic item alignment, toolbars, and wrapping tags", "Grid excels at page-level layouts, dashboard widgets, and strict alignment"]',
    '["How does flex-grow and flex-shrink determine element widths?", "Can you nest a Flex container inside a Grid cell? When would that be useful?"]',
    'Flexbox is optimal for 1D content-driven flow where elements adjust based on their internal size. Grid is optimal for 2D container-driven layout where precise row and column templates govern placement regardless of individual content size.'
),
(
    'frontend', 'fresher', 'Web Performance',
    'What steps can you take to optimize the initial page load time of a React Single Page Application?',
    '["Code-splitting and lazy loading with React.lazy and Suspense", "Asset compression and WebP/AVIF modern image formats", "Minification and tree-shaking via modern bundlers (Vite/Rollup)", "Browser caching and CDN deployment", "Reducing bundle size by eliminating unused dependencies"]',
    '["What is Cumulative Layout Shift (CLS) and how do you prevent it?", "How does server-side rendering (SSR) compare to SPA optimization?"]',
    'Optimization focuses on Critical Rendering Path: route-based and component-based code-splitting to reduce initial JS payload, serving responsive modern images with explicit dimensions, aggressive caching, font display swap, and avoiding render-blocking scripts.'
),
(
    'frontend', 'fresher', 'DOM & Events',
    'What is Event Delegation in the DOM, and what are its benefits in terms of memory and dynamic content?',
    '["Event bubbling mechanism through the DOM hierarchy", "Attaching a single event listener to a common ancestor", "Checking event.target to identify the exact child clicked", "Substantial memory savings with large lists", "Handling dynamically added elements without re-binding"]',
    '["What is the difference between event.target and event.currentTarget?", "How does event.stopPropagation() affect event delegation?"]',
    'Event delegation exploits event bubbling by placing a single listener on a parent rather than dozens on children. By inspecting event.target, you detect interactions with dynamic child elements with minimal memory footprint and zero cleanup overhead.'
),
(
    'frontend', 'fresher', 'Browser Storage',
    'Compare localStorage, sessionStorage, and Cookies. When would you use each, especially regarding security and auth tokens?',
    '["localStorage: persistent, 5-10MB, accessible via JS, vulnerable to XSS", "sessionStorage: scoped to single browser tab lifetime", "Cookies: 4KB, automatically sent with HTTP requests", "HttpOnly and Secure flags mitigate XSS and MITM risks", "Token storage recommendations"]',
    '["Why is storing JWTs in localStorage risky for high-security applications?", "What is the SameSite cookie attribute and how does it protect against CSRF?"]',
    'localStorage persists indefinitely across restarts but is readable by any JS executing on the origin (XSS vulnerability). sessionStorage clears on tab close. HttpOnly, Secure, SameSite cookies cannot be accessed via client JS, making them ideal for sensitive session tokens.'
),
(
    'frontend', 'fresher', 'Async JavaScript',
    'Explain the difference between Promises and async/await. How do you handle parallel asynchronous requests efficiently?',
    '["Async/await is syntactic sugar over Promises yielding synchronous-looking code", "Try/catch blocks for clean error propagation", "Promise.all for running independent requests concurrently", "Promise.allSettled when individual failures should not abort the batch", "Avoiding sequential waterfalls"]',
    '["What happens in Promise.all if one request rejects?", "How would you implement a retry mechanism for an async fetch?"]',
    'Promises represent eventual completion of async operations. Async/await provides readable imperative structure. For independent network requests, chaining awaits creates slow sequential waterfalls; instead, invoke Promise.all to fetch concurrently across available network threads.'
),
(
    'frontend', 'fresher', 'Web Accessibility (a11y)',
    'Why is web accessibility important, and what are three practical techniques to make a web application accessible?',
    '["Inclusivity for users with visual, motor, or cognitive disabilities and legal compliance (WCAG)", "Semantic HTML tags (button, nav, main, header) providing native accessibility", "Keyboard navigation and visible focus rings", "ARIA attributes when custom elements are necessary", "Adequate color contrast ratios and alternative text for media"]',
    '["Why is using a div with an onClick bad for accessibility?", "How do screen readers interpret aria-live regions?"]',
    'Accessibility ensures equal access. Core practices: use semantic HTML (giving screen readers free landmark and keyboard shortcuts), guarantee all interactive elements can be operated via keyboard with visible focus outlines, and maintain 4.5:1 color contrast with explicit alt text.'
),
(
    'frontend', 'fresher', 'TypeScript Fundamentals',
    'Why use TypeScript over vanilla JavaScript, and what is the difference between an `interface` and a `type` alias?',
    '["Compile-time type checking preventing runtime errors", "Enhanced IDE autocompletion and refactoring safety", "Interfaces support declaration merging and object contracts", "Type aliases support unions, intersections, primitives, and tuples", "Strict mode benefits"]',
    '["What is the `any` type in TypeScript and why is it discouraged in strict projects?", "What are generics and can you give a simple real-world use case?"]',
    'TypeScript provides static typing and prevents common runtime bugs (such as undefined is not a function). Interfaces define the shape of objects and can be extended or merged. Types can model complex unions, primitives, and mapped types. Strict typing eliminates whole classes of null/undefined bugs.'
);

-- BACKEND QUESTIONS (10)
INSERT INTO question_bank (domain, difficulty, category, question_text, expected_key_points, probing_follow_ups, model_answer)
VALUES
(
    'backend', 'fresher', 'API Design',
    'What makes an API RESTful, and what are the key differences between GET, POST, PUT, and PATCH methods?',
    '["Stateless client-server architecture and resource-based URI structure", "GET: idempotent, safe, retrieves resource", "POST: creates new resource, non-idempotent", "PUT: full replacement of resource, idempotent", "PATCH: partial modification of resource", "Standard HTTP status codes (200, 201, 400, 401, 404, 500)"]',
    '["What does it mean for an HTTP method to be idempotent?", "When would you return a 204 No Content status versus a 200 OK?"]',
    'REST relies on standard HTTP verbs and noun-based URIs. GET retrieves representations without side effects. POST creates resources. PUT replaces the entire entity idempotently. PATCH applies partial updates. Proper status codes and stateless request headers ensure predictable integration.'
),
(
    'backend', 'fresher', 'Databases & SQL',
    'Explain Database Normalization. Why do we normalize to 3NF, and when might you intentionally denormalize?',
    '["Eliminating data redundancy and update/delete anomalies", "1NF (atomic values), 2NF (full functional dependency), 3NF (no transitive dependencies)", "Data integrity and consistency guarantees", "Denormalization trade-offs for high-throughput read workloads"]',
    '["What is the performance cost of over-normalization on complex queries?", "How do database indexes improve query speeds, and what is their downside on writes?"]',
    'Normalization decomposes tables to ensure every non-key column depends solely on the primary key, preventing duplicate records and anomaly errors. We denormalize strategically in read-heavy applications (like reporting dashboards) to avoid costly multi-table joins.'
),
(
    'backend', 'fresher', 'Database Indexing',
    'How does a B-Tree index work in a relational database, and how do you decide which columns to index?',
    '["Balanced tree structure enabling O(log N) lookups, range queries, and sorting", "Indexing columns frequently used in WHERE, JOIN, and ORDER BY clauses", "High cardinality columns benefit most", "Overhead on INSERT, UPDATE, DELETE operations due to index rebalancing"]',
    '["What is a composite index and why does column order matter in it?", "What is an index scan versus an index seek?"]',
    'B-Trees organize sorted keys hierarchically, allowing logarithmic search steps. Index columns with high cardinality that appear frequently in query filters and joins. Avoid over-indexing columns with frequent bulk writes or very low cardinality (like booleans).'
),
(
    'backend', 'fresher', 'Authentication & Security',
    'Explain how JWT (JSON Web Token) authentication works. What are its benefits and security pitfalls?',
    '["Header, Payload, Signature breakdown", "Stateless verification using secret or public/private key pairs", "No database lookup required per request", "Pitfall: inability to invalidate tokens immediately before expiration without a blacklist", "Protection against XSS/CSRF depending on storage (HttpOnly cookies vs localStorage)"]',
    '["How do refresh tokens solve the token expiration problem securely?", "What happens if your JWT secret key gets leaked?"]',
    'A JWT contains claims cryptographically signed by the server. The client transmits the token in the Authorization Bearer header. Servers verify the signature statelessly without querying a session store. Pitfalls include token revocation challenges, requiring short lifespans and rotating refresh tokens.'
),
(
    'backend', 'fresher', 'Caching Strategies',
    'What is Redis, and how would you implement a Cache-Aside (Lazy Loading) pattern in a web service?',
    '["In-memory key-value data store with microsecond response times", "Cache-Aside flow: check cache -> on hit return -> on miss query DB, store in cache with TTL, return", "Cache expiration and invalidation strategies on writes", "Cache stampede prevention"]',
    '["What is the difference between Cache-Aside and Write-Through caching?", "How do you handle a scenario where the database updates but the cache still holds stale data?"]',
    'Redis stores data in RAM with support for rich structures. In Cache-Aside, the application first inspects Redis. On cache miss, it reads from the primary database, populates Redis with an appropriate Time-To-Live (TTL), and responds. On updates, it invalidates or updates the cached key.'
),
(
    'backend', 'fresher', 'Concurrency & Async',
    'What is the difference between synchronous and asynchronous code execution in backend frameworks like FastAPI or Node.js?',
    '["Sync blocks the execution thread during I/O operations", "Async utilizes an event loop to yield execution while waiting for network/disk I/O", "High concurrency with low memory footprint on I/O-bound workloads", "CPU-bound tasks require multi-threading or worker processes"]',
    '["Why will calling time.sleep() inside an async FastAPI route degrade performance?", "How does an async database driver differ from a traditional synchronous driver?"]',
    'Synchronous handlers halt the thread until database or external API calls return. Asynchronous handlers use non-blocking coroutines; while waiting for socket reads, the event loop serves thousands of other concurrent requests, drastically boosting throughput for I/O-bound services.'
),
(
    'backend', 'fresher', 'Error Handling & Logging',
    'How should a production backend service handle unexpected errors and structure its application logs?',
    '["Global exception handler returning uniform sanitized error envelopes to clients", "Never leaking stack traces or internal secrets to public users", "Structured JSON logging with request IDs, timestamps, log levels, and error codes", "Separation of client errors (4xx) from server faults (5xx) with alerting"]',
    '["What is a correlation ID or request ID and why is it vital in microservices?", "How do you avoid logging sensitive Personally Identifiable Information (PII)?"]',
    'Production APIs implement central middleware catching unhandled exceptions, emitting structured JSON logs with correlation IDs for tracing, and returning sanitized RFC 7807 error responses. Client errors get logged at warning level; unhandled 5xx exceptions trigger automated alerts.'
),
(
    'backend', 'fresher', 'Transactions & ACID',
    'What are ACID properties in database transactions, and why are they essential for financial or booking systems?',
    '["Atomicity: all operations succeed or all roll back", "Consistency: data moves from one valid state to another satisfying constraints", "Isolation: concurrent transactions do not interfere with each other", "Durability: committed transactions survive system crashes", "Transaction rollback mechanisms"]',
    '["What are isolation levels (e.g. Read Committed vs Serializable) and what phenomena (dirty reads, phantom reads) do they prevent?", "How does a distributed transaction differ?"]',
    'ACID guarantees transactional reliability. Atomicity ensures all steps (debit and credit) complete or none do. Consistency enforces schema rules. Isolation prevents concurrent reads from observing intermediate corrupted states. Durability ensures written records survive power failure.'
),
(
    'backend', 'fresher', 'Message Queues',
    'What problem do background task queues (like Celery, BullMQ, or ARQ with Redis) solve in web development?',
    '["Decoupling time-consuming tasks from the request-response lifecycle", "Keeping HTTP response times fast (<200ms)", "Use cases: email delivery, report generation, video transcoding, PDF creation", "Retry logic, worker concurrency, and failure management"]',
    '["What happens to queued jobs if a background worker crashes mid-task?", "How do you monitor queue lag and scale workers dynamically?"]',
    'Task queues offload heavy operations (such as generating PDF reports or calling slow LLMs) out of the synchronous HTTP cycle. The API enqueues a lightweight message and returns a 202 Accepted, while dedicated background worker processes execute jobs reliably with automatic retries.'
),
(
    'backend', 'fresher', 'Web Security (OWASP)',
    'Explain SQL Injection and Cross-Site Scripting (XSS). How do modern backend frameworks defend against them?',
    '["SQL Injection: untrusted user input altering SQL syntax", "Mitigation: Parameterized queries, prepared statements, and ORMs", "XSS: injecting malicious scripts rendered in victim browser", "Mitigation: Input validation, context-aware output encoding, Content Security Policy (CSP), HttpOnly cookies"]',
    '["Can SQL injection happen when using an ORM? If so, how?", "What is the difference between Stored XSS and Reflected XSS?"]',
    'SQL injection occurs when user parameters are concatenated directly into SQL queries. Defense requires prepared statements where database engines treat input strictly as literals. XSS involves unsanitized user content executed in clients; defense requires proper HTML escaping and strong CSPs.'
);

-- DATA & ML QUESTIONS (10)
INSERT INTO question_bank (domain, difficulty, category, question_text, expected_key_points, probing_follow_ups, model_answer)
VALUES
(
    'data_ml', 'fresher', 'Python & Pandas',
    'How do you handle missing values in a dataset using Pandas, and what factors guide your choice between imputation and dropping?',
    '["Detecting nulls with isna() and sum()", "Dropping rows/columns with dropna() when missingness is small or column is irrelevant", "Mean/median imputation for numerical data based on skewness", "Mode or categorical imputation", "Domain-specific implications of introducing synthetic bias"]',
    '["When would median imputation be preferred over mean imputation?", "What is Missing at Random (MAR) versus Missing Completely at Random (MCAR)?"]',
    'Identify null patterns first. If a column is missing >60% of data, drop it. If missingness is small and MCAR, row removal may be safe. Otherwise, impute: use median for skewed continuous variables to resist outliers, mode for categorical variables, or advanced techniques like KNN/iterative imputer.'
),
(
    'data_ml', 'fresher', 'ML Evaluation Metrics',
    'Why is Accuracy often a misleading metric for imbalanced classification problems, and what metrics should you use instead?',
    '["Accuracy paradox: predicting majority class yields 99% accuracy on 1% fraud", "Precision: proportion of positive identifications that were actually correct", "Recall (Sensitivity): proportion of actual positives identified correctly", "F1-Score: harmonic mean of precision and recall", "ROC-AUC and Confusion Matrix analysis"]',
    '["If you are building a disease screening tool, do you optimize for Precision or Recall?", "What does an ROC curve plot, and what does an AUC of 0.5 indicate?"]',
    'When classes are heavily skewed (e.g. fraud detection), a trivial model predicting negative achieves high accuracy while failing completely. We instead use Precision, Recall, F1-Score, and PR-AUC depending on whether false positives (spam filter) or false negatives (cancer diagnosis) carry higher penalty.'
),
(
    'data_ml', 'fresher', 'Supervised Learning',
    'Explain the Bias-Variance Tradeoff. What are the symptoms of high bias versus high variance, and how do you combat them?',
    '["Bias: error from erroneous assumptions, leading to underfitting (model too simple)", "Variance: error from sensitivity to training data fluctuations, leading to overfitting (model memorizes noise)", "High bias fixes: more complex model, additional features, less regularization", "High variance fixes: more training data, feature selection, regularization (L1/L2), cross-validation, bagging"]',
    '["How does L1 regularization (Lasso) differ from L2 regularization (Ridge) in feature selection?", "How does cross-validation help diagnose this tradeoff?"]',
    'Bias is underfitting; the model fails to capture underlying patterns (high training and validation error). Variance is overfitting; the model performs well on training data but poorly on test data. Balance is achieved via hyperparameter tuning, cross-validation, and appropriate regularization.'
),
(
    'data_ml', 'fresher', 'SQL for Analytics',
    'What are SQL Window Functions, and how do `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()` differ?',
    '["Window functions calculate aggregations across a partition without collapsing rows", "OVER (PARTITION BY ... ORDER BY ...)", "ROW_NUMBER assigns unique sequential integers regardless of ties", "RANK assigns duplicate ranks on ties and skips subsequent numbers", "DENSE_RANK assigns duplicate ranks on ties without skipping"]',
    '["Can you write an example query finding the second-highest salary per department?", "What is the difference between a GROUP BY and a PARTITION BY?"]',
    'Window functions perform computations across related rows while preserving individual row identity. For tied values (e.g., identical scores): ROW_NUMBER arbitrarily orders them (1,2,3), RANK shares rank and skips (1,1,3), and DENSE_RANK shares rank without skipping (1,1,2).'
),
(
    'data_ml', 'fresher', 'Data Pipelines & ETL',
    'What is the difference between ETL (Extract, Transform, Load) and ELT (Extract, Load, Transform) in modern data platforms?',
    '["ETL transforms data on an intermediary compute server before loading to database", "ELT loads raw data directly into modern cloud data warehouses (Snowflake, BigQuery) and transforms using warehouse SQL engines", "ELT offers greater flexibility, faster raw ingestion, and historical re-transformation", "Storage and compute separation advantages"]',
    '["What is a data lake versus a data warehouse?", "How do tools like dbt fit into an ELT workflow?"]',
    'ETL transforms data before loading to save disk space and meet legacy database constraints. Modern cloud warehouses decouple storage from compute, enabling ELT: raw data is loaded immediately, and transformations occur inside the scalable warehouse engine as needed.'
),
(
    'data_ml', 'fresher', 'Feature Engineering',
    'How do you encode categorical variables for machine learning models, and when should you choose One-Hot Encoding over Label/Target Encoding?',
    '["One-Hot Encoding creates binary columns for each category; best for nominal categories with low cardinality", "Avoids imparting false ordinal relationships (e.g. Red=1, Blue=2)", "Label Encoding assigns integers; appropriate for ordinal data (Low, Med, High)", "High cardinality risk: curse of dimensionality with One-Hot", "Target/Frequency encoding alternatives"]',
    '["What is target leakage when performing target encoding, and how do you prevent it?", "How do tree-based models like Random Forest handle categorical features compared to linear models?"]',
    'Nominal categories lack inherent order; One-Hot Encoding prevents linear models from hallucinating mathematical rankings. For high cardinality (e.g., zip codes), One-Hot expands dimensionality excessively; target encoding or embeddings are preferred with out-of-fold cross-validation.'
),
(
    'data_ml', 'fresher', 'Deep Learning Basics',
    'Explain the role of activation functions in Neural Networks. Why is ReLU generally preferred over Sigmoid in hidden layers?',
    '["Introduces non-linearity, allowing networks to learn complex decision boundaries", "Sigmoid saturates at extremes, causing vanishing gradients during backpropagation", "ReLU (Rectified Linear Unit, max(0, x)) has constant derivative of 1 for positive values, accelerating training convergence", "Dying ReLU problem and Leaky ReLU mitigation"]',
    '["What is the vanishing gradient problem and why does it stall learning in deep networks?", "Which activation function is standard in the output layer for multi-class classification?"]',
    'Without activation functions, stacking layers collapses into a simple linear transformation. Sigmoid squashes inputs between 0 and 1; for deep layers, gradients approach zero, stalling weights updates. ReLU is computationally cheap and keeps gradients healthy for positive activations.'
),
(
    'data_ml', 'fresher', 'Data Warehousing',
    'What is a Star Schema in dimensional modeling, and how do Fact tables differ from Dimension tables?',
    '["Fact tables record quantitative numerical measurements/events (e.g. sales, page views) with foreign keys", "Dimension tables provide qualitative descriptive context (e.g. customer, product, date)", "Star schema features a centralized Fact table joined directly to denormalized Dimension tables", "Optimized for fast analytic aggregations and intuitive SQL queries"]',
    '["What is a Snowflake Schema and how does it compare to a Star Schema?", "What is a slowly changing dimension (SCD Type 2)?"]',
    'Star schema organizes data for business intelligence. Fact tables contain metrics and foreign keys. Dimension tables contain attributes. Unlike normalized schemas, dimension tables are deliberately denormalized to minimize joins, maximizing query performance on analytical aggregations.'
),
(
    'data_ml', 'fresher', 'Model Overfitting',
    'What is Cross-Validation, and why is K-Fold Cross-Validation superior to a simple train/test split?',
    '["Splitting data into K equal folds, training on K-1, validating on 1, repeating K times", "Reduces variance in evaluation metric by averaging performance across all subsets", "Ensures every data point gets used for both training and validation", "Prevents optimistic bias from a single lucky or unlucky split", "Stratified K-Fold for maintaining class proportions"]',
    '["When would standard K-Fold fail for time-series data, and what should you use instead?", "What is data leakage and how can improper cross-validation cause it?"]',
    'A single split depends heavily on random partition luck. K-Fold partitions data into K subsets, iteratively training on K-1 and testing on the remaining one. Averaging test scores provides a robust, low-variance estimate of generalization performance. Stratified K-Fold preserves class distributions.'
),
(
    'data_ml', 'fresher', 'Unsupervised Learning',
    'How does K-Means Clustering work, and how do you determine the optimal number of clusters (K)?',
    '["Iterative algorithm: randomly initialize K centroids, assign points to nearest centroid, recalculate centroids, repeat until convergence", "Minimizes within-cluster sum of squares (inertia)", "Elbow method: plotting inertia vs K and identifying diminishing returns inflection point", "Silhouette score: evaluating intra-cluster cohesion versus nearest-cluster separation"]',
    '["Why is K-Means sensitive to feature scaling and outlier points?", "What are the limitations of K-Means when clusters have irregular non-spherical shapes?"]',
    'K-Means partitions data into K clusters by minimizing Euclidean distances to cluster centroids. Determine optimal K using the Elbow method (where rate of inertia reduction drops) corroborated by Silhouette analysis measuring how well-separated clusters are from neighboring clusters.'
);

-- 3. Curated Learning Resources (20 resources mapped to skill gaps)
INSERT INTO resources (title, description, url, resource_type, skill_gap_tag, domain)
VALUES
(
    'Mastering the STAR Method for Behavioral Interviews',
    'Complete guide on structuring behavioral answers using Situation, Task, Action, and Result to convey maximum impact.',
    'https://www.themuse.com/advice/star-interview-method',
    'article', 'star_method', 'hr'
),
(
    'Eliminating Filler Words: The Art of the Pause',
    'Practical vocal drills and pause techniques to replace "um", "uh", and "like" with confident silent pauses.',
    'https://hbr.org/2018/04/how-to-stop-saying-um-ah-and-you-know',
    'article', 'filler_words', 'general_communication'
),
(
    'JavaScript Visualized: The Event Loop & Concurrency',
    'Visual deep-dive into the V8 engine, call stack, microtask queue, and event loop animation.',
    'https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif',
    'article', 'event_loop', 'frontend'
),
(
    'React useEffect Lifecycle & Stale Closure Fixes',
    'Official React documentation guide on synchronizing effects, dependency linting, and preventing infinite loops.',
    'https://react.dev/learn/synchronizing-with-effects',
    'documentation', 'react_hooks', 'frontend'
),
(
    'A Complete Guide to CSS Flexbox & Grid',
    'Interactive CSS-Tricks guide comparing 1D Flexbox alignment with 2D Grid layouts with cheat sheets.',
    'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
    'documentation', 'css_layout', 'frontend'
),
(
    'Web Core Vitals & Performance Optimization Guide',
    'Google web.dev deep dive into optimizing LCP, INP, and CLS for lightning-fast responsive applications.',
    'https://web.dev/explore/fast',
    'documentation', 'web_performance', 'frontend'
),
(
    'W3C Web Content Accessibility Guidelines (WCAG) Quickref',
    'Interactive checklist to ensure contrast, semantic HTML, and keyboard accessibility compliance.',
    'https://www.w3.org/WAI/WCAG21/quickref/',
    'documentation', 'accessibility', 'frontend'
),
(
    'TypeScript Handbook: Types vs Interfaces & Generics',
    'Official Microsoft reference manual on constructing resilient type systems without escaping to any.',
    'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
    'documentation', 'typescript_strict', 'frontend'
),
(
    'RESTful API Design Best Practices & Status Code Standards',
    'Microsoft Azure architecture guide on crafting intuitive, idempotent, and secure RESTful endpoints.',
    'https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design',
    'article', 'api_design', 'backend'
),
(
    'Use The Index, Luke! A Guide to Database Performance',
    'Essential guide for developers on indexing algorithms, B-Trees, execution plans, and query optimization.',
    'https://use-the-index-luke.com/',
    'article', 'database_indexing', 'backend'
),
(
    'JWT Authentication Best Practices & Common Vulnerabilities',
    'Auth0 comprehensive whitepaper on token storage, expiration strategies, and preventing signature exploits.',
    'https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/',
    'article', 'jwt_auth', 'backend'
),
(
    'Redis Caching Patterns & Cache-Aside Implementation',
    'Official Redis architectural blueprint for cache invalidation, cache stampede prevention, and TTL strategies.',
    'https://redis.io/docs/latest/develop/use/patterns/caching/',
    'documentation', 'caching_redis', 'backend'
),
(
    'FastAPI & Async Python Concurrency Tutorial',
    'Understanding asynchronous event loops, coroutines, and non-blocking I/O in modern Python web services.',
    'https://fastapi.tiangolo.com/async/',
    'documentation', 'async_concurrency', 'backend'
),
(
    'OWASP Top 10 Web Application Security Vulnerabilities',
    'The standard awareness document for developers on preventing injection, broken auth, and security misconfigurations.',
    'https://owasp.org/www-project-top-ten/',
    'documentation', 'web_security', 'backend'
),
(
    'Data Cleaning & Imputation Techniques with Pandas',
    'Real Python hands-on tutorial on handling missing values, outliers, and data distributions.',
    'https://realpython.com/pandas-data-cleaning/',
    'article', 'data_cleaning', 'data_ml'
),
(
    'Understanding the Confusion Matrix, Precision, Recall & F1',
    'Visual guide on choosing the right classification metric for imbalanced real-world datasets.',
    'https://towardsdatascience.com/understanding-confusion-matrix-a9ad42dcfd62',
    'article', 'ml_metrics', 'data_ml'
),
(
    'SQL Window Functions Interactive Tutorial with Mode',
    'Hands-on interactive practice problems for ROW_NUMBER, RANK, and running totals.',
    'https://mode.com/sql-tutorial/sql-window-functions/',
    'practice', 'sql_window_functions', 'data_ml'
),
(
    'Modern Data Stack: The Transition from ETL to ELT',
    'Fivetran architecture breakdown on cloud data warehousing, raw ingestion, and in-warehouse transformation.',
    'https://www.fivetran.com/blog/etl-vs-elt',
    'article', 'elt_pipelines', 'data_ml'
),
(
    'StatQuest: Machine Learning Fundamentals & Bias-Variance',
    'Clear, intuitive video walkthrough of the bias-variance tradeoff and cross-validation concepts.',
    'https://www.youtube.com/watch?v=EuBBz3bI-aA',
    'video', 'bias_variance', 'data_ml'
),
(
    'Scikit-Learn Guide on Clustering & Determining K',
    'Official scikit-learn documentation covering K-Means inertia, silhouette coefficients, and cluster evaluation.',
    'https://scikit-learn.org/stable/modules/clustering.html#k-means',
    'documentation', 'clustering_kmeans', 'data_ml'
);

