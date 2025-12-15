
import { prisma } from './src/lib/db';

async function checkCoverage() {
    console.log('--- Checking Workflow Coverage ---');

    // 1. Get MD Configuration
    const mdSetting = await prisma.systemSetting.findUnique({
        where: { key: 'md_code' }
    });
    console.log(`\n[Configuration] MD Code: ${mdSetting?.value || 'NOT SET'}`);

    // 2. Fetch all employees
    const employees = await prisma.employee.findMany({
        where: { isActive: true },
        select: {
            empCode: true,
            empName_Eng: true,
            position: true,
            // department: true, // REMOVED
            approver1_ID: true,
            approver2_ID: true,
            manager_ID: true,
            gm_ID: true,
            user: {
                select: {
                    role: true,
                    userType: true
                }
            }
        }
    });

    console.log(`\n[Employees] Found ${employees.length} active employees.`);

    // 3. Analyze Chains
    const employeesMap = new Map(employees.map(e => [e.empCode, e]));

    const completeChains = [];
    const partialChains = [];

    for (const emp of employees) {
        const chain = {
            subject: `${emp.empCode} (${emp.position})`,
            approver1: emp.approver1_ID ? `${emp.approver1_ID} (${employeesMap.get(emp.approver1_ID)?.position || 'Unknown'})` : 'MISSING',
            approver2: emp.approver2_ID ? `${emp.approver2_ID} (${employeesMap.get(emp.approver2_ID)?.position || 'Unknown'})` : 'N/A',
            manager: emp.manager_ID ? `${emp.manager_ID} (${employeesMap.get(emp.manager_ID)?.position || 'Unknown'})` : 'MISSING',
            gm: emp.gm_ID ? `${emp.gm_ID} (${employeesMap.get(emp.gm_ID)?.position || 'Unknown'})` : 'MISSING',
        };

        // Check if MD exists in DB
        const mdExists = mdSetting?.value && employeesMap.has(mdSetting.value);

        // Naive check for "completeness" relative to standard flow
        // Standard: Appr1 -> Manager -> GM (MD is global)
        if (emp.approver1_ID && emp.manager_ID && emp.gm_ID && mdExists) {
            completeChains.push(chain);
        } else {
            partialChains.push(chain);
        }
    }

    // 4. Check specific roles
    const hrUsers = employees.filter(e => e.user?.role === 'ADMIN' || e.position.includes('HR'));
    const mdUser = mdSetting?.value ? employeesMap.get(mdSetting.value) : null;

    console.log('\n--- Key Roles ---');
    console.log(`MD: ${mdUser ? `${mdUser.empName_Eng} (${mdUser.empCode})` : 'MISSING or INVALID'}`);
    console.log(`HR/Admins: ${hrUsers.map(e => `${e.empName_Eng} (${e.empCode})`).join(', ') || 'No dedicated HR/Admin found'}`);

    console.log('\n--- Complete Workflow Chains (Subject -> Appr1 -> Mgr -> GM) ---');
    if (completeChains.length > 0) {
        completeChains.forEach(c => {
            console.log(`Subject: ${c.subject}`);
            console.log(`  -> Appr1: ${c.approver1}`);
            console.log(`  -> Appr2: ${c.approver2}`);
            console.log(`  -> Mgr:   ${c.manager}`);
            console.log(`  -> GM:    ${c.gm}`);
            console.log('-----------------------------------');
        });
    } else {
        console.log('NO employees have a fully defined approver chain configured.');
    }

    // List all employees for review
    console.log('\n--- All Active Employees ---');
    employees.forEach(e => {
        console.log(`${e.empCode} - ${e.empName_Eng} (${e.position})`);
    });
}

checkCoverage()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
