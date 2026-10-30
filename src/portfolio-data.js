// The portfolio is deliberately evidence-led. Update the dated Now entry when
// there is a real change, and replace nulls only with information you can share.
export const now = {
  asOf: '2026-10-25',
  asOfLabel: '25 OCT 2026',
  building: {
    text: 'Scholog’s grading flow and mobile experience.',
    href: 'https://github.com/101dave/Scholog/commit/fbc2f38',
    detail: 'Latest documented work'
  },
  reading: null,
  exploring: {
    text: 'k6 for check-in load testing.',
    detail: 'Harness prepared; staging run pending.',
    href: 'https://github.com/101dave/Scholog/blob/main/docs/LOAD_TEST.md'
  }
};

export const skillTiers = [
  {
    number: '01',
    title: 'Daily Drivers',
    eyebrow: 'THE CORE STACK',
    description: 'The languages I reach for across my independent projects.',
    skills: [
      { name: 'HTML & CSS', context: 'Interface foundations' },
      { name: 'JavaScript', context: 'Web application logic' },
      { name: 'C++', context: 'Console programs' }
    ]
  },
  {
    number: '02',
    title: 'Production & Tools',
    eyebrow: 'BUILD, SHIP, VERIFY',
    description: 'Supporting tools used across deployed and personal projects.',
    skills: [
      { name: 'Supabase + PostgreSQL', context: 'Data, auth & RLS' },
      { name: 'PHP', context: 'Web programming' },
      { name: 'Git, GitHub & VS Code', context: 'Version control & editor' },
      { name: 'Vercel', context: 'Deployment' },
      { name: 'Node.js test runner', context: 'Automated tests' }
    ]
  },
  {
    number: '03',
    title: 'Currently Exploring',
    eyebrow: 'THE NEXT QUESTIONS',
    description: 'Recent investigation, not a claim of production expertise.',
    skills: [
      { name: 'k6', context: 'Staging harness prepared' },
      { name: 'Selective sync', context: 'Reducing full-state polling' },
      { name: 'PostgreSQL indexes', context: 'Check-in query paths' }
    ],
    link: {
      label: 'Read the load-test notes',
      href: 'https://github.com/101dave/Scholog/blob/main/docs/LOAD_TEST.md'
    }
  }
];

// video: null, or { type: 'loom', src: 'https://www.loom.com/share/…' },
// or { type: 'mp4', src: 'videos/project-walkthrough.mp4' }.
export const projects = [
  {
    id: 'scholog',
    number: '01',
    category: 'ATTENDANCE / PWA',
    name: 'Scholog',
    fullName: 'Scholog — Student & Attendance Tracker',
    summary: 'Offline-ready attendance for teachers, with QR check-in and daily reports.',
    description: 'Built for classrooms where a reliable connection can’t be taken for granted.',
    tags: ['JavaScript', 'Supabase', 'PostgreSQL', 'PWA'],
    image: 'images/scholog-cover.png',
    imageAlt: 'Sample Scholog teacher dashboard showing attendance by class section',
    imageCaption: 'SAMPLE TEACHER DASHBOARD',
    imageKind: 'screenshot',
    live: 'https://scholog.vercel.app',
    source: 'https://github.com/101dave/Scholog',
    caseStudy: 'PROJECT-SCHOLOG.html',
    video: null,
    bottleneck: 'A background refresh could overwrite a newer local attendance edit; dropped connections made saves harder to trust.',
    tradeoff: 'Cached edits and a sync queue instead of network-only saves keep teachers working offline, but require queue management and stale-response guards.',
    proof: {
      value: '~17 KB vs. ~350 KB',
      text: 'Documented icon subset versus the full library; scanner and PDF libraries are also loaded on demand.',
      href: 'https://github.com/101dave/Scholog#performance-notes',
      linkText: 'See performance notes'
    },
    flow: {
      label: 'Scholog system flow',
      lanes: [
        [
          { title: 'Teacher', detail: 'Dashboard' },
          { title: 'Local cache', detail: 'Offline queue' },
          { title: 'Supabase', detail: 'Postgres + RLS' }
        ],
        [
          { title: 'Student', detail: 'QR / student ID' },
          { title: 'Check-in RPC', detail: 'Validates session' },
          { title: 'Supabase', detail: 'Attendance' }
        ]
      ],
      note: 'The teacher dashboard queues offline edits; student check-in needs a live session.'
    }
  },
  {
    id: 'atm-simulator',
    number: '02',
    category: 'C++ / CONSOLE',
    name: 'ATM Simulator',
    fullName: 'C++ ATM Simulator',
    summary: 'A small console program for exploring transaction state and control flow.',
    description: 'An early C++ project, kept public with its limitations intact.',
    tags: ['C++', 'Vectors', 'Control flow'],
    image: 'images/atm-demo.gif',
    imageAlt: 'Recorded terminal demo of the C++ ATM simulator',
    imageCaption: 'RECORDED TERMINAL DEMO',
    imageKind: 'terminal',
    source: 'https://github.com/101dave/EbaleAllanDave/blob/main/ATMSIMMULATOR.txt',
    caseStudy: 'PROJECT-ATM.html',
    video: null,
    bottleneck: 'The balance has to persist across repeated menu actions; putting login, transactions, and control flow in one function makes safety easy to get wrong.',
    tradeoff: 'The program uses in-memory values and vectors instead of storage: easy to run, but nothing persists and there is no complete ledger.',
    proof: {
      value: '100 + 500 = 600',
      text: 'A deposit updates the starting balance. The original withdrawal check only catches a balance of −1, so this is not production-safe.',
      href: 'https://github.com/101dave/EbaleAllanDave/blob/main/ATMSIMMULATOR.txt',
      linkText: 'Inspect the source'
    },
    flow: {
      label: 'ATM simulator program flow',
      lanes: [
        [
          { title: 'Input', detail: 'Card + PIN' },
          { title: 'Menu', detail: 'Choose action' },
          { title: 'Balance', detail: 'In memory' }
        ],
        [
          { title: 'Transaction', detail: 'Deposit / withdraw' },
          { title: 'Update', detail: 'Balance math' },
          { title: 'Output', detail: 'Printed receipt' }
        ]
      ],
      note: 'A learning exercise, not a secure banking system. No state survives a restart.'
    }
  }
];

// A case study for an archived exercise; not shown as a featured project.
export const archivedCaseStudies = [
  {
    id: 'grade-management',
    number: '03',
    category: 'C++ / RECORDS',
    name: 'Student Grade Management',
    fullName: 'C++ Student Grade Management System',
    summary: 'A console prototype for student records, semester averages, and pass/fail output.',
    description: 'An early learning exercise with a documented initialization bug.',
    tags: ['C++', 'Vectors', 'Records'],
    image: 'images/grade-management.svg',
    imageAlt: 'Illustrated cover for the C++ Student Grade Management project',
    imageCaption: 'ILLUSTRATED PROJECT COVER',
    imageKind: 'illustration',
    source: 'https://github.com/101dave/EbaleAllanDave/blob/main/STUDENTGRADEMANAGEMENTSYSTEM.txt',
    video: null,
    bottleneck: 'Keeping names, sections, and grades aligned across students requires careful initialization. The original sizes vectors before reading the student count.',
    tradeoff: 'Parallel vectors instead of a Student struct keep the exercise small, but shared indexes are harder to maintain and the uninitialized size makes the original unsafe.',
    proof: {
      value: 'n is read too late',
      text: 'The source constructs vectors with an uninitialized n. Read the count first or build records with push_back before indexing.',
      href: 'https://github.com/101dave/EbaleAllanDave/blob/main/STUDENTGRADEMANAGEMENTSYSTEM.txt',
      linkText: 'Inspect the source'
    },
    flow: {
      label: 'Grade management program flow',
      lanes: [
        [
          { title: 'Uninitialized n', detail: 'Declared first' },
          { title: 'Vectors', detail: 'Sized with n' },
          { title: 'Input count', detail: 'Read too late' }
        ],
        [
          { title: 'Student input', detail: 'Intended step' },
          { title: 'Average', detail: 'Two semesters' },
          { title: 'Report', detail: 'Pass / fail' }
        ]
      ],
      note: 'The first row shows the original bug; the reporting flow is intended but unsafe until vector initialization is fixed.'
    }
  }
];

export const archiveProjects = [
  {
    name: 'Student Grade Management',
    kind: 'C++ / RECORDS',
    description: 'A records and grading prototype with a documented vector-size bug.',
    image: 'images/grade-management.svg',
    source: 'STUDENTGRADEMANAGEMENTSYSTEM.txt',
    caseStudy: 'PROJECT-GRADES.html'
  },
  {
    name: 'Cashier Simulator',
    kind: 'C++ / TRANSACTIONS',
    description: 'A console cashier with tax and change calculations.',
    image: 'images/cashier-simulator.svg',
    source: 'CASHIERSIMULATOR.txt'
  },
  {
    name: 'Student Honor Calculator',
    kind: 'C++ / GRADING',
    description: 'Calculates an average and determines an honor status.',
    image: 'images/honor-calculator.svg',
    source: 'STUDENTHONORSTATUSCALCULATOR.txt'
  },
  {
    name: '2D & 3D Shape Calculator',
    kind: 'C++ / GEOMETRY',
    description: 'Calculates area, perimeter, or volume for a selected shape.',
    image: 'images/shape-calculator.svg',
    source: 'SHAPECALCULATOR.txt'
  },
  {
    name: 'Temperature Converter',
    kind: 'C++ / CONVERSION',
    description: 'Converts temperatures between Celsius and Fahrenheit.',
    image: 'images/temperature-converter.svg',
    source: 'FAHRENHEITANDCELSIUSCONVERTER.txt'
  },
  {
    name: 'Binary Converter',
    kind: 'C++ / CONVERSION',
    description: 'Converts between number bases and text to binary.',
    image: 'images/binary-converter.svg',
    source: 'BINARYConverter.txt'
  },
  {
    name: 'Simple Calculator',
    kind: 'C++ / ARITHMETIC',
    description: 'A four-operation calculator built with switch-case logic.',
    image: 'images/calculator.svg',
    source: 'CALCULATOR.txt'
  }
];
