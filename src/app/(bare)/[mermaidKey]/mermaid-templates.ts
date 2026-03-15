export interface MermaidTemplate {
  name: string;
  category: string;
  code: string;
}

export const MERMAID_TEMPLATES: MermaidTemplate[] = [
  {
    name: 'Flowchart',
    category: 'Basic',
    code: `flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`,
  },
  {
    name: 'Flowchart LR',
    category: 'Basic',
    code: `flowchart LR
    A([Start]) --> B[/Input/]
    B --> C{Condition}
    C -->|True| D[Process A]
    C -->|False| E[Process B]
    D --> F([End])
    E --> F`,
  },
  {
    name: 'Sequence Diagram',
    category: 'Basic',
    code: `sequenceDiagram
    autonumber
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!
    Note right of John: Text in note
    Alice->>John: See you later!`,
  },
  {
    name: 'Class Diagram',
    category: 'Basic',
    code: `classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal() bool
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat() bool
    }
    class Zebra{
        +bool is_wild
        +run()
    }`,
  },
  {
    name: 'State Diagram',
    category: 'Basic',
    code: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving : Start
    Moving --> Still : Stop
    Moving --> Crash : Bang
    Crash --> [*]

    state Moving {
        [*] --> Slow
        Slow --> Fast
        Fast --> Slow
    }`,
  },
  {
    name: 'Entity Relationship',
    category: 'Basic',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string email
        string phone
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        string deliveryAddress
    }
    LINE-ITEM {
        string productCode
        int quantity
        float pricePerUnit
    }
    PRODUCT ||--o{ LINE-ITEM : "ordered in"
    PRODUCT {
        string productCode
        string name
        float price
    }`,
  },
  {
    name: 'Gantt Chart',
    category: 'Project',
    code: `gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    excludes weekends

    section Planning
        Define requirements   :done,    req,  2024-01-01, 2024-01-07
        Create wireframes     :done,    wire, 2024-01-05, 2024-01-12
        Review & approval     :active,  rev,  2024-01-10, 3d

    section Development
        Frontend setup        :         fe,   after rev,  7d
        Backend API           :         be,   after rev,  10d
        Integration           :         int,  after fe,   5d

    section Testing
        Unit tests            :         ut,   after int,  4d
        UAT                   :         uat,  after ut,   3d
        Deploy                :milestone, dep, after uat, 0d`,
  },
  {
    name: 'Pie Chart',
    category: 'Data',
    code: `pie showData
    title Distribution of Time
    "Development" : 45
    "Testing" : 20
    "Planning" : 15
    "Meetings" : 10
    "Documentation" : 10`,
  },
  {
    name: 'Git Graph',
    category: 'Development',
    code: `gitGraph
    commit id: "Initial commit"
    commit id: "Add README"

    branch develop
    checkout develop
    commit id: "Setup project"
    commit id: "Add features"

    branch feature/auth
    checkout feature/auth
    commit id: "Add login"
    commit id: "Add logout"
    checkout develop
    merge feature/auth id: "Merge auth"

    checkout main
    merge develop id: "Release v1.0"
    commit id: "Hotfix"`,
  },
  {
    name: 'User Journey',
    category: 'UX',
    code: `journey
    title My working day
    section Morning
        Wake up: 3: Me
        Make coffee: 5: Me
        Check emails: 2: Me, Cat
    section At work
        Stand-up meeting: 4: Me, Team
        Write code: 5: Me
        Code review: 3: Me, Colleague
    section Evening
        Go home: 5: Me
        Dinner: 5: Me, Family
        Relax: 4: Me`,
  },
  {
    name: 'Mindmap',
    category: 'Ideas',
    code: `mindmap
  root((Project))
    Planning
      Requirements
        Functional
        Non-functional
      Timeline
        Milestones
        Deadlines
    Development
      Frontend
        UI Design
        Components
      Backend
        API
        Database
    Testing
      Unit Tests
      Integration
      UAT
    Deployment
      Staging
      Production`,
  },
  {
    name: 'Timeline',
    category: 'History',
    code: `timeline
    title History of Social Media
    2002 : LinkedIn
    2004 : Facebook
         : Google News
    2005 : YouTube
         : Reddit
    2006 : Twitter
    2010 : Instagram
         : Pinterest
    2011 : Snapchat
    2016 : TikTok`,
  },
  {
    name: 'Quadrant Chart',
    category: 'Data',
    code: `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 Expand
    quadrant-2 Promote
    quadrant-3 Re-evaluate
    quadrant-4 Improve
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`,
  },
  {
    name: 'XY Chart',
    category: 'Data',
    code: `xychart-beta
    title "Monthly Revenue (USD)"
    x-axis [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
    y-axis "Revenue ($k)" 4000 --> 12000
    bar [5000, 6200, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6200, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]`,
  },
  {
    name: 'Block Diagram',
    category: 'Architecture',
    code: `block-beta
    columns 3
    A["Frontend\\n(React)"] B["API Gateway"] C["Auth Service"]
    D["Mobile App"] space E["User DB"]
    A --> B
    D --> B
    B --> C
    C --> E`,
  },
  {
    name: 'C4 Context',
    category: 'Architecture',
    code: `C4Context
    title System Context for Internet Banking
    Enterprise_Boundary(b0, "BankBoundary") {
        Person(customer, "Personal Banking Customer", "A customer of the bank")
        System(banking, "Internet Banking System", "Allows customers to view accounts")
        System_Ext(mail, "E-Mail System", "Microsoft Exchange")
        System_Ext(mainframe, "Mainframe Banking System", "Stores all core banking info")
    }
    Rel(customer, banking, "Uses")
    Rel(banking, mail, "Sends e-mails", "SMTP")
    Rel(banking, mainframe, "Uses", "XML/HTTPS")`,
  },
  {
    name: 'Requirement Diagram',
    category: 'Design',
    code: `requirementDiagram
    requirement test_req {
        id: 1
        text: The system shall react in less than 1 second
        risk: high
        verifymethod: test
    }
    element test_entity {
        type: simulation
    }
    test_entity - satisfies -> test_req`,
  },
  {
    name: 'Packet Diagram',
    category: 'Network',
    code: `packet-beta
    title UDP Datagram
    0-15: "Source Port"
    16-31: "Destination Port"
    32-47: "Length"
    48-63: "Checksum"
    64-95: "Data (variable length)"`,
  },
];
