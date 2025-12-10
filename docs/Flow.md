graph TD
    %% Define Styles
    classDef admin fill:#f9f,stroke:#333,stroke-width:2px;
    classDef user fill:#bbf,stroke:#333,stroke-width:2px;
    classDef approver fill:#dfd,stroke:#333,stroke-width:2px;
    classDef decision fill:#ff9,stroke:#333,stroke-width:2px;
    classDef endnode fill:#333,stroke:#fff,stroke-width:2px,color:#fff;

    %% Phase 1: Configuration
    subgraph Setup_Phase [Phase 1: System Setup (Admin/HR)]
        direction TB
        Admin([Admin / HR]):::admin
        
        %% Step 1: Manage User
        Admin -->|1. Setup User| UserConfig[หน้าจัดการพนักงาน / User Config]
        UserConfig --> SetLevel[กำหนด User Level]
        
        subgraph Levels [User Levels]
            L1[Supplier]
            L2[Operator]
            L3[General]
            L4[Supervise]
            L5[Interpreter]
            L6[Management]
        end
        SetLevel -.-> Levels
        
        UserConfig --> SetApprovers[กำหนด Approval Chain]
        SetApprovers --> A1[Assessment Person 1-3 คน]
        SetApprovers --> A2[Manager]
        SetApprovers --> A3[MD Final Approver]

        %% Step 2: Create Assessment
        Admin -->|2. Create Assessment| CreateAssess[สร้างชุดคำถาม Assessment]
        CreateAssess --> Draft[Save as Draft แยกตาม User Level]
        Draft --> AutoAssign[ระบบ Assign อัตโนมัติไปยัง User ตาม Level]
    end

    %% Phase 2: Execution
    subgraph Assessment_Phase [Phase 2: Assessment Execution]
        direction TB
        User([User]):::user
        
        AutoAssign -->|Notification| User
        User -->|Start| SelfAssess[Self Assessment]:::user
        
        SelfAssess --> App1{Approver 1}:::approver
        
        %% Loop logic for dynamic approvers
        App1 -- Approve --> CheckApp2{มี Approver 2 หรือไม่?}:::decision
        App1 -- Reject --> SelfAssess
        
        CheckApp2 -- Yes --> App2{Approver 2}:::approver
        CheckApp2 -- No --> ManagerApp{Manager Review}:::approver
        
        App2 -- Approve --> CheckApp3{มี Approver 3 หรือไม่?}:::decision
        App2 -- Reject --> SelfAssess
        
        CheckApp3 -- Yes --> App3{Approver 3}:::approver
        CheckApp3 -- No --> ManagerApp
        
        App3 -- Approve --> ManagerApp
        App3 -- Reject --> SelfAssess
        
        ManagerApp -- Approve --> MDApp{MD Review}:::approver
        ManagerApp -- Reject --> SelfAssess
        
        MDApp -- Approve --> Finish((จบกระบวนการ)):::endnode
        MDApp -- Reject --> SelfAssess
    end

    %% Link Setup to Phase 2 context
    Levels -.-> AutoAssign