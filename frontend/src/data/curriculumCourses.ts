export interface CurriculumCourse {
  code: string;
  title: string;
  category: "Foundation Core" | "Discipline-linked Engineering Sciences" | "Discipline Core" | "Discipline Elective";
  categoryShort: "FC" | "DLES" | "DC" | "DE";
  courseType: "Theory" | "Lab" | "Embedded" | "Soft Skill" | "Project" | "Basket";
  credits: number;
}

export const CURRICULUM_COURSES: CurriculumCourse[] = [
  // ==========================================
  // 1. Foundation Core (FC) - 28 courses
  // ==========================================
  { code: "ICHY101L", title: "Engineering Chemistry", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 3.0 },
  { code: "ICHY101P", title: "Engineering Chemistry Lab", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 1.0 },
  { code: "ICSE101E", title: "Computer Programming : Python", category: "Foundation Core", categoryShort: "FC", courseType: "Embedded", credits: 3.0 },
  { code: "ICSE102L", title: "Structured and Object Oriented Programming", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 2.0 },
  { code: "ICSE102P", title: "Structured and Object Oriented Programming Lab", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 2.0 },
  { code: "ICSE103E", title: "Computer Programming : Java", category: "Foundation Core", categoryShort: "FC", courseType: "Embedded", credits: 3.0 },
  { code: "IEEE102L", title: "Basic Electrical and Electronics Engineering", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 3.0 },
  { code: "IEEE102P", title: "Basic Electrical and Electronics Engineering Lab", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 1.0 },
  { code: "IENG101L", title: "Technical English Communication", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 2.0 },
  { code: "IENG101P", title: "Technical English Communication Lab", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 1.0 },
  { code: "IENG102P", title: "Technical Report Writing", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 1.0 },
  { code: "IFLE200L", title: "Foreign Language", category: "Foundation Core", categoryShort: "FC", courseType: "Basket", credits: 2.0 },
  { code: "IHSM200L", title: "HSM Elective", category: "Foundation Core", categoryShort: "FC", courseType: "Basket", credits: 3.0 },
  { code: "IMAT101L", title: "Calculus", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 3.0 },
  { code: "IMAT101P", title: "Calculus Lab", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 1.0 },
  { code: "IMAT102L", title: "Differential Equations and Transforms", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 4.0 },
  { code: "IMAT201L", title: "Complex Variables and Linear Algebra", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 4.0 },
  { code: "IMAT202L", title: "Probability and Statistics", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 3.0 },
  { code: "IMAT202P", title: "Probability and Statistics Lab", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 1.0 },
  { code: "IPHY101L", title: "Engineering Physics", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 3.0 },
  { code: "IPHY101P", title: "Engineering Physics Lab", category: "Foundation Core", categoryShort: "FC", courseType: "Lab", credits: 1.0 },
  { code: "ISTS101P", title: "Qualitative Skills Practice I", category: "Foundation Core", categoryShort: "FC", courseType: "Soft Skill", credits: 1.5 },
  { code: "ISTS102P", title: "Quantitative Skills Practice I", category: "Foundation Core", categoryShort: "FC", courseType: "Soft Skill", credits: 1.5 },
  { code: "ISTS201P", title: "Qualitative Skills Practice II", category: "Foundation Core", categoryShort: "FC", courseType: "Soft Skill", credits: 1.5 },
  { code: "ISTS202P", title: "Quantitative Skills Practice II", category: "Foundation Core", categoryShort: "FC", courseType: "Soft Skill", credits: 1.5 },
  { code: "ISTS301P", title: "Advanced Competitive Coding - I", category: "Foundation Core", categoryShort: "FC", courseType: "Soft Skill", credits: 1.5 },
  { code: "ISTS302P", title: "Advanced Competitive Coding - II", category: "Foundation Core", categoryShort: "FC", courseType: "Soft Skill", credits: 1.5 },
  { code: "ISWE101L", title: "Software Engineering", category: "Foundation Core", categoryShort: "FC", courseType: "Theory", credits: 3.0 },

  // ==========================================
  // 2. Discipline-linked Engineering Sciences (DLES) - 5 courses
  // ==========================================
  { code: "IMAT205L", title: "Discrete Mathematics and Graph Theory", category: "Discipline-linked Engineering Sciences", categoryShort: "DLES", courseType: "Theory", credits: 4.0 },
  { code: "ISWE201L", title: "Digital Logic and Microprocessor", category: "Discipline-linked Engineering Sciences", categoryShort: "DLES", courseType: "Theory", credits: 3.0 },
  { code: "ISWE201P", title: "Digital Logic and Microprocessor Lab", category: "Discipline-linked Engineering Sciences", categoryShort: "DLES", courseType: "Lab", credits: 1.0 },
  { code: "ISWE401L", title: "Embedded Systems and IoT", category: "Discipline-linked Engineering Sciences", categoryShort: "DLES", courseType: "Theory", credits: 3.0 },
  { code: "ISWE401P", title: "Embedded Systems and IoT Lab", category: "Discipline-linked Engineering Sciences", categoryShort: "DLES", courseType: "Lab", credits: 1.0 },

  // ==========================================
  // 3. Discipline Core (DC) - 29 courses
  // ==========================================
  { code: "ISWE102L", title: "Data Structures and Algorithms", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE102P", title: "Data Structures and Algorithms Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE103L", title: "Database Systems", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE103P", title: "Database Systems Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE202L", title: "Requirements Engineering and Management", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE203L", title: "Theory of Computation", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 4.0 },
  { code: "ISWE204L", title: "Operating Systems", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE204P", title: "Operating Systems Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE205L", title: "Computer Networks", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE205P", title: "Computer Networks Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE206L", title: "Web Technologies", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE206P", title: "Web Technologies Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE207L", title: "Object Oriented Analysis and Design", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE207P", title: "Object Oriented Analysis and Design Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE301L", title: "Computer Architecture and Organization", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE302L", title: "Artificial Intelligence", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE302P", title: "Artificial Intelligence Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE304L", title: "Software Architecture", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE305L", title: "Software Testing", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE305P", title: "Software Testing Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE306L", title: "Software Project Management", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE402L", title: "Software Metrics", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE403L", title: "Software Configuration Management", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE404L", title: "Design Patterns", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE405L", title: "Network and Information Security", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE406L", title: "Agile Development Process and Devops", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE406P", title: "Agile Development Process and Devops Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },
  { code: "ISWE407L", title: "User Interface and User Experience Design", category: "Discipline Core", categoryShort: "DC", courseType: "Theory", credits: 3.0 },
  { code: "ISWE407P", title: "User Interface and User Experience Design Lab", category: "Discipline Core", categoryShort: "DC", courseType: "Lab", credits: 1.0 },

  // ==========================================
  // 4. Discipline Elective (DE) - 38 courses
  // ==========================================
  { code: "ISWE208L", title: "Optimization Techniques", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE209L", title: "Data Mining", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE210L", title: "R for Data Science", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE307L", title: "Digital Image Processing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE308L", title: "Soft Computing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE309L", title: "Cloud Computing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE310L", title: "Natural Language Processing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE311L", title: "Software Industrialization and Economics", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE312L", title: "Computer Vision", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE313L", title: "Advanced Java Programming", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE314L", title: "Social Network Analysis", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE391J", title: "Technical Answers to Real Problems Project", category: "Discipline Elective", categoryShort: "DE", courseType: "Project", credits: 3.0 },
  { code: "ISWE392J", title: "Design Project", category: "Discipline Elective", categoryShort: "DE", courseType: "Project", credits: 3.0 },
  { code: "ISWE393J", title: "Laboratory Project", category: "Discipline Elective", categoryShort: "DE", courseType: "Project", credits: 3.0 },
  { code: "ISWE394J", title: "Product Development Project", category: "Discipline Elective", categoryShort: "DE", courseType: "Project", credits: 3.0 },
  { code: "ISWE396J", title: "Reading Course", category: "Discipline Elective", categoryShort: "DE", courseType: "Project", credits: 3.0 },
  { code: "ISWE397J", title: "Special Project", category: "Discipline Elective", categoryShort: "DE", courseType: "Project", credits: 3.0 },
  { code: "ISWE398J", title: "Simulation Project", category: "Discipline Elective", categoryShort: "DE", courseType: "Project", credits: 3.0 },
  { code: "ISWE408L", title: "Cross Platform Application Development", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 2.0 },
  { code: "ISWE408P", title: "Cross Platform Application Development Lab", category: "Discipline Elective", categoryShort: "DE", courseType: "Lab", credits: 1.0 },
  { code: "ISWE409L", title: "High Performance Computing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE410L", title: "Machine Learning", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 2.0 },
  { code: "ISWE410P", title: "Machine Learning Lab", category: "Discipline Elective", categoryShort: "DE", courseType: "Lab", credits: 1.0 },
  { code: "ISWE411L", title: "Deep Learning", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE412L", title: "Block Chain Technologies", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE413L", title: "Robotic Process Automation", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE414L", title: "Modern Full Stack Development", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE415L", title: "Cyber Security", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE416L", title: "Big Data Analytics", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE417L", title: "Quantum Computing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE418L", title: "Low Code Application Development", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE419L", title: "Metaverse", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE420L", title: "Cyber Physical Systems", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE421L", title: "Cognitive Computing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE422L", title: "Multicore Computing", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE423L", title: "Dynamic Program Analysis", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE424L", title: "Formal Methods for Software Engineering", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 },
  { code: "ISWE425L", title: "Game Theory and its Applications", category: "Discipline Elective", categoryShort: "DE", courseType: "Theory", credits: 3.0 }
];
