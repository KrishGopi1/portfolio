// Single source of truth for all portfolio copy. UI components read from here.

export const profile = {
  name: "Krish Gopi",
  alias: "The Spectacular ML Engineer",
  tagline: "Your friendly neighborhood machine-learning engineer.",
  role: "Computer Science & Engineering student",
  focus:
    "Machine learning, deep learning, software engineering, and applied research.",
  about: [
    "I work primarily with Python and C/C++, with a focus on building ML systems and understanding the underlying algorithms rather than treating models as black boxes.",
    "I also contribute to open-source projects and work on practical systems involving large-scale data processing, retrieval, ranking, and ML pipelines.",
  ],
  currentFocus:
    "Developing stronger foundations in machine learning and mathematical reasoning, and applying them to research-oriented problems involving large-scale data, representation learning, retrieval, and structured data. I'm most interested in work that combines ML research with systems-level implementation, where model quality, computational efficiency, and data-processing constraints all matter.",
  email: "krishgopi9642@gmail.com",
  links: [
    // TODO(krish): replace with real profile URLs before deploying.
    { label: "GitHub", href: "https://github.com/krishgopi1" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/krish-gopi-707242311/" },
    { label: "Email", href: "mailto:krishgopi9642@gmail.com" },
  ],
};

export type SkillGroup = { title: string; power: string; items: string[] };

export const skills: SkillGroup[] = [
  { title: "Languages", power: "Native Tongue", items: ["Python", "C", "C++", "TypeScript", "JavaScript", "SQL"] },
  {
    title: "Machine Learning / AI",
    power: "Spider-Sense",
    items: [
      "Machine Learning", "Deep Learning", "Computer Vision", "Natural Language / Semantic Retrieval",
      "Entity Resolution", "Graph Neural Networks", "Representation Learning",
      "Model Evaluation & Ranking", "Feature Engineering", "Information Retrieval",
    ],
  },
  {
    title: "Frameworks & Libraries",
    power: "Web-Shooters",
    items: ["NumPy", "Pandas", "scikit-learn", "XGBoost", "CatBoost", "TensorFlow / Keras", "OpenCV", "FAISS", "Qiskit"],
  },
  {
    title: "Web Development",
    power: "Wall-Crawling",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "TanStack Query", "Node.js", "PostgreSQL", "MySQL"],
  },
  {
    title: "Systems / HPC",
    power: "Proportional Strength",
    items: [
      "Linux", "Git & GitHub", "OpenMP", "CUDA", "MPI", "GCC / MSYS2",
      "Parallel programming", "Performance analysis", "Strong and weak scaling",
    ],
  },
  { title: "Tools", power: "Utility Belt", items: ["QGIS", "Jupyter", "Docker", "Git", "AWS / cloud compute", "VS Code"] },
];

export type Project = {
  id: string;
  issue: string; // comic "issue #" label
  title: string;
  kicker: string; // short punchy subtitle
  sfx: string; // onomatopoeia for the panel
  summary: string;
  bullets: string[];
  quote?: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    id: "entity-resolution",
    issue: "#1",
    title: "Business Entity Resolution",
    kicker: "Amazon ML Challenge",
    sfx: "THWIP!",
    summary:
      "A large-scale entity-resolution pipeline for matching business records across multiple data sources, built to keep precision high while recovering the hard matches that basic string similarity misses.",
    bullets: [
      "Multi-stage candidate generation and blocking",
      "Character n-gram and word-level TF-IDF retrieval",
      "Name and address normalization",
      "Country-aware blocking",
      "Candidate pruning with XGBoost",
      "Hard-pair analysis and retrieval diagnostics",
      "Precision-oriented optimization using the F0.5 metric",
      "Processing millions of records and candidate pairs",
      "Cross-encoder reranking experiments",
    ],
    tags: ["XGBoost", "TF-IDF", "Blocking", "F0.5", "Reranking"],
  },
  {
    id: "satellite-retrieval",
    issue: "#2",
    title: "Satellite Semantic Retrieval & Change Analysis",
    kicker: "Search the planet by what's visible",
    sfx: "ZOOM!",
    summary:
      "A semantic satellite-imagery search and multi-temporal change-analysis system that makes large archives searchable by what is visible in the imagery, not just date, location and cloud cover.",
    quote: "Find areas where new construction appeared near this district since 2020.",
    bullets: [
      "Semantic image retrieval over remote-sensing imagery",
      "Multitemporal analysis and automated change detection",
      "RemoteCLIP / CLIP-based image embeddings",
      "Vector search with FAISS",
      "Spatial and temporal filtering",
    ],
    tags: ["RemoteCLIP", "FAISS", "Remote Sensing", "Change Detection"],
  },
  {
    id: "protein-gnn",
    issue: "#3",
    title: "Protein Classification with GNNs",
    kicker: "Graphs all the way down",
    sfx: "SNAP!",
    summary:
      "A research-oriented ML pipeline applying graph-based deep learning to protein classification, rather than an off-the-shelf classifier.",
    bullets: [
      "Protein sequence preprocessing",
      "Representing structural information as graphs",
      "Investigating graph neural network architectures",
      "Relating primary/secondary structure to graph representations",
      "Exploring structural information generated from sequences",
    ],
    tags: ["GNN", "Bioinformatics", "Representation Learning"],
  },
  {
    id: "photo-search",
    issue: "#4",
    title: "Photography Club Image Search",
    kicker: "Every face, every frame, findable",
    sfx: "FLASH!",
    summary:
      "An image-search system that turns a shared drive full of club photographs into a searchable archive instead of endless folder browsing.",
    bullets: [
      "Image embeddings and vector indexing",
      "Semantic image retrieval",
      "Facial recognition / identity matching",
      "Metadata and filename indexing",
      "Web interface to search by person or visual content",
    ],
    tags: ["Embeddings", "Face Matching", "Vector Index", "Web"],
  },
  {
    id: "mnist-cnns",
    issue: "#5",
    title: "MNIST Deep Learning Implementations",
    kicker: "Origin story: convolution",
    sfx: "POW!",
    summary:
      "Implemented and studied classic CNN architectures on MNIST to understand architecture, feature extraction, parameterization and model behaviour from the ground up.",
    bullets: ["LeNet-5", "AlexNet", "VGG-style architectures", "MobileNet-style architectures"],
    tags: ["CNNs", "TensorFlow / Keras", "From Scratch"],
  },
  {
    id: "parallel",
    issue: "#6",
    title: "Parallel Computing Work",
    kicker: "With great cores comes great speedup",
    sfx: "WHAM!",
    summary:
      "Parallel versions of numerical workloads with OpenMP, CUDA and MPI: benchmarked, scaled and debugged.",
    bullets: [
      "Matrix multiplication",
      "Numerical integration with Simpson's rule",
      "Sequential vs. parallel performance comparison",
      "Strong and weak scaling, Amdahl's Law",
      "GPU kernel execution",
      "Compiling and debugging parallel C/C++",
    ],
    tags: ["OpenMP", "CUDA", "MPI", "C/C++"],
  },
];

export const openSource = {
  summary:
    "I contribute to open-source software, including work around documentation quality, dependency consistency, installation documentation, and repository issues.",
  recent:
    "Recent work has included reviewing documentation against actual project configuration and identifying broken or misleading documentation links.",
};

export const interests = [
  "Machine Learning", "Deep Learning", "Computer Vision", "Representation Learning",
  "Information Retrieval", "Entity Resolution", "Graph Neural Networks", "Remote Sensing",
  "Bioinformatics", "Parallel Computing", "High-Performance Computing", "Open Source Software",
];

/** Section ids in page order. Every section renders <section id={id} data-section={id}>. */
export const SECTIONS = [
  { id: "hero", label: "Origin" },
  { id: "about", label: "About" },
  { id: "skills", label: "Powers" },
  { id: "projects", label: "Missions" },
  { id: "opensource", label: "Team-Ups" },
  { id: "interests", label: "Multiverse" },
  { id: "contact", label: "Signal" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
