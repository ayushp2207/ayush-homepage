/**
 * Single source of truth for the site's content.
 *
 * Both the constellation graph and the rendered page sections read from here,
 * so a role or project is only ever described in one place.
 */

/** Skills that act as the "hub" nodes of the constellation. */
export const skills = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "javascript", label: "JavaScript" },
  { id: "pytorch", label: "PyTorch" },
  { id: "langchain", label: "LangChain" },
  { id: "mcp", label: "MCP" },
  { id: "multiagent", label: "Multi-Agent Systems" },
  { id: "dynamodb", label: "DynamoDB" },
  { id: "kubernetes", label: "Kubernetes" },
  { id: "databricks", label: "Databricks" },
  { id: "rag", label: "RAG" },
  { id: "deeprl", label: "Deep RL" },
  { id: "cv", label: "Computer Vision" },
  { id: "aws", label: "AWS" },
];

/**
 * Everything I have built, taught or published. `skills` holds skill ids, which
 * is what wires each entry into the constellation.
 */
export const work = [
  {
    id: "transfer-family",
    kind: "experience",
    title: "S3 Endpoint Configuration",
    org: "Amazon Web Services",
    role: "Software Development Engineer Intern",
    period: "Sep 2026 – Present",
    location: "Boston, MA",
    summary:
      "Designing S3 endpoint configuration for AWS Transfer Family Web Apps, so customers can expose their own S3 buckets through a managed browser interface without provisioning SFTP, FTPS, FTP or AS2 clients.",
    details: [
      "Built 3 Java service endpoints consumed by internal AWS control-plane APIs, with request validation, idempotency and structured error handling against versioned API contracts.",
      "Modeled persistence in DynamoDB using partition/sort key and GSI access patterns for single-digit-millisecond lookups, with conditional writes to stay consistent under concurrent updates.",
      "Owned the full SDLC — design doc, code reviews, 80%+ unit test coverage — deploying CDK infrastructure through 4 pipeline stages with CloudWatch alarms and automatic rollback.",
    ],
    skills: ["java", "aws", "dynamodb"],
  },
  {
    id: "dns-agents",
    kind: "experience",
    title: "Multi-Agent DNS Anomaly Detection",
    org: "AT&T Labs, Network CTO",
    role: "AI Engineer Intern",
    period: "Jun 2026 – Aug 2026",
    location: "Middletown, NJ",
    summary:
      "Architected a multi-agent AI system for DNS anomaly detection and root cause analysis: a parent orchestrator coordinating 3 specialized sub-agents over MCP, processing 8M+ residential gateway logs to diagnose network faults end to end.",
    details: [
      "Built an anomaly detection pipeline with ML-based statistical models on Databricks to surface DNS resolver anomalies; agent workflows trigger autonomously on detection.",
      "Deployed agentic workflows with tool-use integrations across telemetry sources, enabling natural-language querying of DNS logs.",
      "Surfaced resolver degradation, query pattern drift and infrastructure outages across a production network.",
    ],
    skills: ["python", "langchain", "mcp", "multiagent", "databricks"],
  },
  {
    id: "wines-testbed",
    kind: "experience",
    title: "Agentic 5G Spectrum Testbed",
    org: "WiNES Lab, Institute for Intelligent Networked Systems",
    role: "Graduate Research Assistant",
    period: "Sep 2025 – May 2026",
    location: "Boston, MA",
    summary:
      "Designed an autonomous spectrum data collection pipeline on a live 5G testbed, with a ground-truth labeling system correlating signal captures to experiment metadata to build evaluation benchmarks for LLM training.",
    details: [
      "Architected dual MCP server infrastructure on OpenShift/Kubernetes, exposing hardware and databases as LLM-callable tools.",
      "Evaluated tool accuracy and agent decisions across multi-step workflows to benchmark agentic system reliability.",
    ],
    skills: ["python", "mcp", "kubernetes", "multiagent"],
  },
  {
    id: "pibit",
    kind: "experience",
    title: "Semantic Document Retrieval Pipeline",
    org: "Pibit.ai (YC21)",
    role: "Machine Learning Intern",
    period: "May 2024 – Jul 2024",
    location: "Bangalore, India",
    summary:
      "Built an end-to-end data pipeline on Azure using LangChain and FAISS for semantic document retrieval, improving retrieval accuracy by 40% with MLflow tracking.",
    details: [
      "Designed and evaluated Few-Shot, Chain-of-Thought and ReAct prompting strategies for NLP tasks.",
      "Automated model evaluation with DSPy, cutting iteration time by 60%, and deployed scalable LLM inference with A/B testing.",
    ],
    skills: ["python", "langchain", "rag"],
  },
  {
    id: "pit-wall",
    kind: "project",
    title: "Pit Wall: Multi-Agent F1 Strategy Simulation",
    org: "Personal project",
    period: "Aug 2025",
    location: "",
    summary:
      "Orchestrated 5 Llama 3 agents through AutoGen into a multi-agent system that negotiates real-time Formula 1 race strategy against live timing data from FastF1.",
    details: [
      "Each agent argues a position — tyre strategy, rival pace, weather, fuel load — and the group converges on a pit call.",
    ],
    skills: ["python", "multiagent", "langchain"],
    link: "https://github.com/ayushp2207",
  },
  {
    id: "mmwave",
    kind: "project",
    title: "6G mmWave Link Blockage Prediction",
    org: "Research project",
    period: "Jul 2024",
    location: "",
    summary:
      "Built a CNN-LSTM model in PyTorch that forecasts mmWave link blockage from video one second ahead at 90% accuracy.",
    details: [
      "Combines a convolutional feature extractor over video frames with a recurrent head over the resulting sequence.",
    ],
    skills: ["pytorch", "cv", "python"],
    link: "https://github.com/ayushp2207",
  },
  {
    id: "this-site",
    kind: "project",
    title: "This Homepage",
    org: "CS5610 Project 1",
    period: "Sep 2026",
    location: "",
    summary:
      "The site you are reading. Vanilla HTML5, CSS3 and ES6 modules with no framework and no build step, including the skill constellation below, which is hand-written canvas code.",
    details: [
      "A small force-directed layout runs on a 2D canvas: skills repel each other, edges pull related nodes together, and velocity is damped until the graph settles.",
      "Every interaction is mirrored in a keyboard-accessible button list, so the graph is not the only way to reach the content.",
    ],
    skills: ["javascript"],
    link: "https://github.com/ayushp2207/ayush-homepage",
  },
  {
    id: "vr-wifi",
    kind: "publication",
    title:
      "Improving VR Performance in WiFi-6 using Deep Reinforcement Learning based Spatial Reuse",
    org: "IEEE COMSNETS 2025",
    period: "2025",
    location: "Bengaluru, India",
    summary:
      "Applies deep reinforcement learning to spatial reuse decisions in WiFi-6, improving latency for virtual reality traffic. Won Best UG Presentation Award.",
    details: ["Authors: A. N. Patel and D. K. Patel."],
    skills: ["deeprl", "python"],
  },
  {
    id: "rand-pc",
    kind: "publication",
    title:
      "Rand-PC: A Randomized Skeleton Learning Algorithm for Faster and Efficient Bayesian Structure Learning",
    org: "IEEE Transactions on Neural Networks and Learning Systems",
    period: "Under review",
    location: "",
    summary:
      "A randomized skeleton learning algorithm that speeds up Bayesian network structure discovery without giving up accuracy.",
    details: ["Authors: R. D., K. K., A. N. Patel, D. K. P."],
    skills: ["python"],
  },
];

/** Degree history, rendered on the homepage. */
export const education = [
  {
    school: "Northeastern University",
    degree: "MS in Computer Science",
    period: "Expected May 2027",
    location: "Boston, MA",
    coursework: "Agentic AI, NLP, Programming Design, Deep Learning",
  },
  {
    school: "Ahmedabad University",
    degree: "B.Tech in Computer Science Engineering",
    period: "May 2025",
    location: "Ahmedabad, India",
    coursework: "Linear Algebra, Machine Learning, Computer Vision",
  },
];

/** Grouped skill lists for the plain-text skills section. */
export const skillGroups = [
  {
    name: "Languages",
    items: ["Python", "C++", "Java", "JavaScript", "SQL", "MATLAB"],
  },
  {
    name: "AI / LLM tooling",
    items: [
      "LangChain",
      "DSPy",
      "AutoGen",
      "RAG",
      "Prompt engineering",
      "Model evaluation",
      "Fine-tuning",
    ],
  },
  {
    name: "ML frameworks",
    items: [
      "PyTorch",
      "TensorFlow",
      "Keras",
      "scikit-learn",
      "Hugging Face Transformers",
      "OpenCV",
    ],
  },
  {
    name: "Cloud & DevOps",
    items: [
      "AWS (S3, IAM)",
      "Docker",
      "Kubernetes",
      "OpenShift",
      "Azure",
      "PostgreSQL",
      "CI/CD",
      "Git",
    ],
  },
];
