// Configuration constants
const TRAINEE = 'L1';
let TRAINEE_WAGE = 20;
let TRAINEE_PCT = 0.35;
let TECHNICIAN_PCT = 0.65;
let MARGIN_OF_ERROR_MINS = 0.25;
let NUM_DECIMAL_POINTS = 2;

const IN_PROGRESS_STATUS = 'IN_PROGRESS';
const ERROR_STATUS = 'ERROR';
const SUCCESS_STATUS = 'SUCCESS';

// Expected columns from HouseCallPro export
const EXPECTED_PAYROLL_FILE_COLUMNS = [
    "Job #",
    "Current job status",
    "Address",
    "Company",
    "Job completed date",
    "Assigned employees",
    "Job amount",
    "Tip amount",
    "Job duration",
    "Total time on job by employee"
];

// Global state
let employees = [];
let levels = {};
let payrollData = [];
let results = [];
let employeeTotals = {}; // Store totals for each employee
let rawEmployeeHours = {}; // Store raw hours from CSV before processing
let businessSummary = { 
    totalRevenue: 0, 
    totalPayroll: 0,
    marketingSpend: 0,
    insuranceSpend: 0
}; // Business summary totals

// Error classes
class SystemError extends Error {
    constructor(message) {
        super(message);
        this.name = "SystemError";
    }
}

class InputError extends Error {
    constructor(message) {
        super(message);
        this.name = "InputError";
    }
}

// Status management
function setStatus(type, message) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type.toLowerCase().replace('_', '-')}`;
}

// Employee management
function addEmployee() {
    const nameInput = document.getElementById('emp-name');
    const levelInput = document.getElementById('emp-level');
    
    const name = nameInput.value.trim();
    const level = levelInput.value;
    
    if (!name) {
        alert('Please enter an employee name');
        return;
    }
    
    if (employees.find(emp => emp[0] === name)) {
        alert('Employee already exists');
        return;
    }
    
    employees.push([name, level]);
    nameInput.value = '';
    updateEmployeesList();
}

function removeEmployee(index) {
    employees.splice(index, 1);
    updateEmployeesList();
}

function updateEmployeesList() {
    const listEl = document.getElementById('employees-list');
    if (employees.length === 0) {
        listEl.innerHTML = '<p style="color: #999; font-style: italic;">No employees added yet</p>';
        return;
    }
    
    listEl.innerHTML = employees.map((emp, index) => `
        <div class="list-item">
            <span><strong>${emp[0]}</strong> - ${emp[1]}</span>
            <button onclick="removeEmployee(${index})">Remove</button>
        </div>
    `).join('');
}

// Level management
function getLevels() {
    return {
        'L1': parseFloat(document.getElementById('level-L1').value),
        'L2': parseFloat(document.getElementById('level-L2').value),
        'L3': parseFloat(document.getElementById('level-L3').value),
        'L4': parseFloat(document.getElementById('level-L4').value)
    };
}

function updateSettings() {
    TRAINEE_WAGE = parseFloat(document.getElementById('trainee-wage').value);
    MARGIN_OF_ERROR_MINS = parseFloat(document.getElementById('margin-error').value);
    NUM_DECIMAL_POINTS = parseInt(document.getElementById('decimal-points').value);
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');
    
    if (!isCSV && !isExcel) {
        setStatus(ERROR_STATUS, 'Please upload a CSV or Excel file (.csv, .xls, .xlsx)');
        return;
    }
    
    document.getElementById('file-info').textContent = `Selected: ${file.name}`;
    
    if (isCSV) {
        // Handle CSV file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                parseCSVFile(e.target.result);
            } catch (error) {
                setStatus(ERROR_STATUS, `Error processing file: ${error.message}`);
            }
        };
        reader.readAsText(file);
    } else if (isExcel) {
        // Handle Excel file
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                parseExcelFile(e.target);
            } catch (error) {
                setStatus(ERROR_STATUS, `Error processing file: ${error.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

function parseCSVFile(csvData) {
    setStatus(IN_PROGRESS_STATUS, 'Processing CSV file...');
    
    try {
        const parsed = Papa.parse(csvData, {
            skipEmptyLines: true,
            dynamicTyping: true
        });
        
        if (parsed.data.length < 2) {
            throw new InputError("The input file needs to contain at least 1 row of data.");
        }
        
        if (parsed.data[0].length !== EXPECTED_PAYROLL_FILE_COLUMNS.length) {
            throw new InputError(
                `The input file contains ${parsed.data[0].length} columns. ` +
                `Expected ${EXPECTED_PAYROLL_FILE_COLUMNS.length} columns.\n` +
                `Expected columns: ${EXPECTED_PAYROLL_FILE_COLUMNS.join(', ')}`
            );
        }
        
        payrollData = parsed.data.slice(1);
        processPayroll();
        
    } catch (error) {
        if (error instanceof InputError) {
            setStatus(ERROR_STATUS, error.message);
        } else {
            setStatus(ERROR_STATUS, `Error processing file: ${error.message}`);
        }
    }
}

// Parse Excel file (XLS/XLSX)
function parseExcelFile(fileReader) {
    setStatus(IN_PROGRESS_STATUS, 'Processing Excel file...');
    
    try {
        const data = new Uint8Array(fileReader.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            raw: false 
        });
        
        if (jsonData.length < 2) {
            throw new InputError("The input file needs to contain at least 1 row of data.");
        }
        
        // Check column count
        if (jsonData[0].length !== EXPECTED_PAYROLL_FILE_COLUMNS.length) {
            throw new InputError(
                `The input file contains ${jsonData[0].length} columns. ` +
                `Expected ${EXPECTED_PAYROLL_FILE_COLUMNS.length} columns.\n` +
                `Expected columns: ${EXPECTED_PAYROLL_FILE_COLUMNS.join(', ')}`
            );
        }
        
        // Convert to same format as CSV data
        // Excel data is already in array format, so we can use it directly
        payrollData = jsonData.slice(1).map(row => {
            // Ensure row has the correct number of columns
            while (row.length < EXPECTED_PAYROLL_FILE_COLUMNS.length) {
                row.push('');
            }
            return row.slice(0, EXPECTED_PAYROLL_FILE_COLUMNS.length);
        });
        
        processPayroll();
        
    } catch (error) {
        if (error instanceof InputError) {
            setStatus(ERROR_STATUS, error.message);
        } else {
            setStatus(ERROR_STATUS, `Error processing Excel file: ${error.message}`);
        }
    }
}

// Parse employee hours string
function parseEmployeeHoursString(jobStr, employeeCols) {
    let output = {};
    
    if (jobStr == null || jobStr === '') {
        employeeCols.forEach(employeeName => {
            output[employeeName] = 0;
        });
        return output;
    }
    
    let delimiter = '\r\n';
    if (!jobStr.includes('\r')) {
        delimiter = '\n';
    }
    
    let lines = jobStr.split(delimiter);
    let result = {};
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        let parts = line.split(" - ");
        if (parts.length === 2) {
            result[parts[0].trim()] = parseFloat(parts[1].trim());
        }
    });
    
    let max_time = Math.max(...Object.values(result).filter(v => v > 0), 0);
    
    employeeCols.forEach(employeeName => {
        let employee_hours = result[employeeName] ? result[employeeName] : 0;
        if (employee_hours != 0 && max_time > 0) {
            employee_hours = max_time - employee_hours <= MARGIN_OF_ERROR_MINS ? max_time : employee_hours;
        }
        output[employeeName] = employee_hours;
    });
    
    return output;
}

// Main job parsing logic
function parseJob(job, job_amt, tips_amt, employee_cols, employee_levels, level_pcts) {
    let result = parseEmployeeHoursString(job, employee_cols);
    let output = {
        wages: new Array(employee_cols.length).fill('0.00'),
        tips: new Array(employee_cols.length).fill('0.00'),
        hours: Object.values(result)
    };
    
    if (job == null || job === '') {
        return output;
    }
    
    // If there's a single employee, pay them based on their level
    const employeesOnJob = Object.keys(result).filter(emp => result[emp] != 0);
    if (employeesOnJob.length === 1) {
        for (let i = 0; i < employee_cols.length; i++) {
            let emp = employee_cols[i];
            if (emp in result && result[emp] > 0) {
                output['wages'][i] = (level_pcts[employee_levels[emp]] * job_amt).toFixed(NUM_DECIMAL_POINTS);
                output['tips'][i] = tips_amt.toFixed(NUM_DECIMAL_POINTS);
            }
        }
        return output;
    }
    
    let trainees = new Set();
    let technicians = new Set();
    let max_pct = 0.0;
    
    for (let emp in result) {
        if (result[emp] != 0) {
            let level = employee_levels[emp];
            if (level == TRAINEE) {
                trainees.add(emp);
            } else {
                technicians.add(emp);
                max_pct = Math.max(max_pct, level_pcts[level]);
            }
        }
    }
    
    if (technicians.size == 0) {
        throw new Error(`The job has no technicians and only trainees.`);
    }
    
    let employee_wage = max_pct * job_amt;
    let total_employees_in_job = Object.values(result).filter(hours => hours != 0).length;
    let total_hours = Object.values(result).reduce((acc, value) => acc + value, 0);
    
    if (trainees.size > 0) {
        for (let i = 0; i < employee_cols.length; i++) {
            let emp = employee_cols[i];
            if (emp in result && result[emp] > 0) {
                if (trainees.has(emp)) {
                    output['wages'][i] = (TRAINEE_WAGE * output['hours'][i]).toFixed(NUM_DECIMAL_POINTS);
                    output['tips'][i] = ((output['hours'][i] / total_hours) * tips_amt).toFixed(NUM_DECIMAL_POINTS);
                    tips_amt -= parseFloat(output['tips'][i]);
                    total_hours -= output['hours'][i];
                }
            }
        }
    }
    
    // If two employees and one is a trainee
    if (total_employees_in_job == 2 && trainees.size > 0) {
        for (let i = 0; i < employee_cols.length; i++) {
            let emp = employee_cols[i];
            if (emp in result && result[emp] > 0 && technicians.has(emp)) {
                output['wages'][i] = (TECHNICIAN_PCT * employee_wage).toFixed(NUM_DECIMAL_POINTS);
                output['tips'][i] = ((output['hours'][i] / total_hours) * tips_amt).toFixed(NUM_DECIMAL_POINTS);
            }
        }
        return output;
    }
    
    total_employees_in_job -= trainees.size;
    
    // If two employees and both are technicians
    if (total_employees_in_job == 2) {
        let techs_arr = Array.from(technicians);
        let same_level = employee_levels[techs_arr[0]] === employee_levels[techs_arr[1]];
        let same_hours = result[techs_arr[0]] === result[techs_arr[1]];
        
        if (same_hours) {
            if (same_level) {
                for (let i = 0; i < employee_cols.length; i++) {
                    let emp = employee_cols[i];
                    if (emp in result && result[emp] > 0 && technicians.has(emp)) {
                        output['wages'][i] = (0.5 * employee_wage).toFixed(NUM_DECIMAL_POINTS);
                        output['tips'][i] = (0.5 * tips_amt).toFixed(NUM_DECIMAL_POINTS);
                    }
                }
            } else {
                // Senior gets 60% and junior gets 40%
                let tech1_level = level_pcts[employee_levels[techs_arr[0]]];
                let tech2_level = level_pcts[employee_levels[techs_arr[1]]];
                let senior_tech = techs_arr[1];
                let junior_tech = techs_arr[0];
                
                if (tech1_level > tech2_level) {
                    senior_tech = techs_arr[0];
                    junior_tech = techs_arr[1];
                }
                
                for (let i = 0; i < employee_cols.length; i++) {
                    let emp = employee_cols[i];
                    if (emp in result && result[emp] > 0) {
                        if (emp === senior_tech) {
                            output['wages'][i] = (0.60 * employee_wage).toFixed(NUM_DECIMAL_POINTS);
                            output['tips'][i] = (0.50 * tips_amt).toFixed(NUM_DECIMAL_POINTS);
                        } else if (emp === junior_tech) {
                            output['wages'][i] = (0.40 * employee_wage).toFixed(NUM_DECIMAL_POINTS);
                            output['tips'][i] = (0.50 * tips_amt).toFixed(NUM_DECIMAL_POINTS);
                        }
                    }
                }
            }
        } else {
            let total_hours_techs = 0;
            for (let emp of techs_arr) {
                total_hours_techs += result[emp];
            }
            
            for (let i = 0; i < employee_cols.length; i++) {
                let emp = employee_cols[i];
                if (emp in result && result[emp] > 0 && technicians.has(emp)) {
                    output['wages'][i] = (result[emp] / total_hours_techs * employee_wage).toFixed(NUM_DECIMAL_POINTS);
                    output['tips'][i] = (result[emp] / total_hours_techs * tips_amt).toFixed(NUM_DECIMAL_POINTS);
                }
            }
        }
        return output;
    }
    
    // 3+ employees in job, split based on hours
    let total_hours_techs = 0;
    for (let emp of Array.from(technicians)) {
        total_hours_techs += result[emp];
    }
    
    for (let i = 0; i < employee_cols.length; i++) {
        let emp = employee_cols[i];
        if (emp in result && result[emp] > 0 && technicians.has(emp)) {
            output['wages'][i] = (result[emp] / total_hours_techs * employee_wage).toFixed(NUM_DECIMAL_POINTS);
            output['tips'][i] = (result[emp] / total_hours_techs * tips_amt).toFixed(NUM_DECIMAL_POINTS);
        }
    }
    
    return output;
}

// Debug function to show wage calculation breakdown for a specific employee
function debugEmployeeWages(employeeName, data, employees, levels) {
    const employee_cols = employees.map(emp => emp[0]);
    const employee_levels = Object.fromEntries(employees);
    const level_pcts = levels;
    const empIndex = employee_cols.indexOf(employeeName);
    
    if (empIndex === -1) {
        console.log(`Employee ${employeeName} not found`);
        return;
    }
    
    console.log(`\n=== WAGE CALCULATION BREAKDOWN FOR ${employeeName.toUpperCase()} ===`);
    console.log(`Employee Level: ${employee_levels[employeeName]}`);
    console.log(`Level Percentage: ${level_pcts[employee_levels[employeeName]]}`);
    console.log(`\nPer Job Breakdown:\n`);
    
    let totalWages = 0;
    let jobCount = 0;
    
    data.forEach((row, rowIndex) => {
        let tips_amt = parseFloat(String(row[7] || '0').replace('$', '').replace(',', ''));
        let job_amt = parseFloat(String(row[6] || '0').replace('$', '').replace(',', '')) - tips_amt;
        let jobId = row[0];
        let jobHours = parseEmployeeHoursStringRaw(row[9], employee_cols);
        let hrHours = jobHours[employeeName] || 0;
        
        if (hrHours > 0) {
            jobCount++;
            let wages_and_tips = parseJob(
                row[9], 
                job_amt, 
                tips_amt, 
                employee_cols, 
                employee_levels, 
                level_pcts
            );
            
            let wage = parseFloat(wages_and_tips['wages'][empIndex]) || 0;
            let tip = parseFloat(wages_and_tips['tips'][empIndex]) || 0;
            totalWages += wage;
            
            // Determine calculation scenario
            let result = parseEmployeeHoursString(row[9], employee_cols);
            let employeesOnJob = Object.keys(result).filter(emp => result[emp] != 0);
            let scenario = '';
            
            if (employeesOnJob.length === 1) {
                scenario = `Single Employee: ${level_pcts[employee_levels[employeeName]]} × ${job_amt} = ${wage}`;
            } else {
                let trainees = new Set();
                let technicians = new Set();
                let max_pct = 0.0;
                
                for (let emp in result) {
                    if (result[emp] != 0) {
                        let level = employee_levels[emp];
                        if (level == TRAINEE) {
                            trainees.add(emp);
                        } else {
                            technicians.add(emp);
                            max_pct = Math.max(max_pct, level_pcts[level]);
                        }
                    }
                }
                
                let employee_wage = max_pct * job_amt;
                let total_employees = employeesOnJob.length;
                
                if (total_employees === 2 && trainees.size > 0) {
                    scenario = `2 Employees (1 Trainee): Technician gets 65% of ${employee_wage.toFixed(2)} = ${wage.toFixed(2)}`;
                } else if (total_employees === 2 && technicians.size === 2) {
                    let techs_arr = Array.from(technicians);
                    let same_level = employee_levels[techs_arr[0]] === employee_levels[techs_arr[1]];
                    let same_hours = result[techs_arr[0]] === result[techs_arr[1]];
                    
                    if (same_hours && same_level) {
                        scenario = `2 Technicians (Same Hours/Level): 50% of ${employee_wage.toFixed(2)} = ${wage.toFixed(2)}`;
                    } else if (same_hours && !same_level) {
                        let isSenior = level_pcts[employee_levels[employeeName]] === Math.max(level_pcts[employee_levels[techs_arr[0]]], level_pcts[employee_levels[techs_arr[1]]]);
                        scenario = `2 Technicians (Same Hours/Diff Levels): ${isSenior ? '60%' : '40%'} of ${employee_wage.toFixed(2)} = ${wage.toFixed(2)}`;
                    } else {
                        let total_hours_techs = result[techs_arr[0]] + result[techs_arr[1]];
                        scenario = `2 Technicians (Diff Hours): (${hrHours}/${total_hours_techs}) × ${employee_wage.toFixed(2)} = ${wage.toFixed(2)}`;
                    }
                } else {
                    let total_hours_techs = 0;
                    for (let emp of Array.from(technicians)) {
                        total_hours_techs += result[emp];
                    }
                    scenario = `${total_employees} Employees: (${hrHours}/${total_hours_techs.toFixed(2)}) × ${employee_wage.toFixed(2)} = ${wage.toFixed(2)}`;
                }
            }
            
            console.log(`Job ${jobId}:`);
            console.log(`  Hours: ${hrHours.toFixed(2)}`);
            console.log(`  Job Amount: $${job_amt.toFixed(2)}`);
            console.log(`  Scenario: ${scenario}`);
            console.log(`  Wage: $${wage.toFixed(2)}`);
            console.log(`  Tip: $${tip.toFixed(2)}`);
            console.log(`  Total: $${(wage + tip).toFixed(2)}\n`);
        }
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total Jobs: ${jobCount}`);
    console.log(`Total Wages: $${totalWages.toFixed(2)}`);
    console.log(`\n`);
}

// Generate output report
function getOutputReport(data, employees, levels) {
    const employee_cols = employees.map(emp => emp[0]);
    const employee_levels = Object.fromEntries(employees);
    const level_pcts = levels;
    
    // Initialize raw hours tracking
    rawEmployeeHours = {};
    employee_cols.forEach(emp => {
        rawEmployeeHours[emp] = 0;
    });
    
    let output = [];
    
    data.forEach(row => {
        let tips_amt = parseFloat(String(row[7] || '0').replace('$', '').replace(',', ''));
        let job_amt = parseFloat(String(row[6] || '0').replace('$', '').replace(',', '')) - tips_amt;
        
        // Parse raw hours from CSV before processing (for accurate totals)
        let rawHours = parseEmployeeHoursStringRaw(row[9], employee_cols);
        employee_cols.forEach(emp => {
            rawEmployeeHours[emp] += rawHours[emp] || 0;
        });
        
        let wages_and_tips = parseJob(
            row[9], 
            job_amt, 
            tips_amt, 
            employee_cols, 
            employee_levels, 
            level_pcts
        );
        
        output.push([
            row[0], // Job Id
            row[1], // Job Status
            row[9] == null || row[9] === '' ? "True" : "False", // Manual Input
            row[2], // Address
            ...wages_and_tips['hours'],
            ...wages_and_tips['wages'],
            ...wages_and_tips['tips'],
            job_amt, // Job Amount
            row[7] || '$0.00', // Tip Amount
            row[4], // Completed Date
        ]);
    });
    
    // Debug output for Henry Rios
    debugEmployeeWages('Henry Rios', data, employees, level_pcts);
    
    return output;
}

// Parse employee hours string WITHOUT margin of error rounding (for accurate totals)
function parseEmployeeHoursStringRaw(jobStr, employeeCols) {
    let output = {};
    
    if (jobStr == null || jobStr === '') {
        employeeCols.forEach(employeeName => {
            output[employeeName] = 0;
        });
        return output;
    }
    
    let delimiter = '\r\n';
    if (!jobStr.includes('\r')) {
        delimiter = '\n';
    }
    
    let lines = jobStr.split(delimiter);
    let result = {};
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        let parts = line.split(" - ");
        if (parts.length === 2) {
            result[parts[0].trim()] = parseFloat(parts[1].trim());
        }
    });
    
    // Return raw hours without margin of error rounding
    employeeCols.forEach(employeeName => {
        output[employeeName] = result[employeeName] ? result[employeeName] : 0;
    });
    
    return output;
}

// Calculate employee totals and averages
function calculateEmployeeTotals(data) {
    const employee_cols = employees.map(emp => emp[0]);
    const numEmployees = employee_cols.length;
    
    // Initialize totals
    employeeTotals = {};
    employee_cols.forEach(emp => {
        employeeTotals[emp] = {
            totalWages: 0,
            totalTips: 0,
            totalHours: 0,
            avgHourlyRate: 0
        };
    });
    
    // Initialize business summary
    businessSummary = {
        totalRevenue: 0,
        totalPayroll: 0,
        marketingSpend: parseFloat(document.getElementById('marketing-spend').value) || 0,
        insuranceSpend: parseFloat(document.getElementById('insurance-spend').value) || 0
    };
    
    // Use raw hours from CSV (before margin of error rounding) for accurate totals
    employee_cols.forEach(emp => {
        employeeTotals[emp].totalHours = rawEmployeeHours[emp] || 0;
    });
    
    // Calculate totals from all jobs (wages and tips from processed output)
    data.forEach((row, rowIndex) => {
        // Calculate total revenue from original payroll data
        // Revenue = Job amount (excluding tips)
        // Job amount is in column 6 (index 6), tips are in column 7 (index 7)
        if (payrollData[rowIndex]) {
            const rawJobAmount = parseFloat(String(payrollData[rowIndex][6] || '0').replace('$', '').replace(',', '')) || 0;
            const tipsAmount = parseFloat(String(payrollData[rowIndex][7] || '0').replace('$', '').replace(',', '')) || 0;
            // Revenue = Job amount - Tips (base job revenue only)
            businessSummary.totalRevenue += (rawJobAmount - tipsAmount);
        }
        
        // Skip first 4 columns (Job #, Status, Manual Input, Address)
        const startIndex = 4;
        
        // Hours are in columns startIndex to startIndex + numEmployees
        // Wages are in columns startIndex + numEmployees to startIndex + 2*numEmployees
        // Tips are in columns startIndex + 2*numEmployees to startIndex + 3*numEmployees
        
        employee_cols.forEach((emp, index) => {
            const wagesIndex = startIndex + numEmployees + index;
            const tipsIndex = startIndex + 2 * numEmployees + index;
            
            const wages = parseFloat(String(row[wagesIndex]).replace('$', '').replace(',', '')) || 0;
            const tips = parseFloat(String(row[tipsIndex]).replace('$', '').replace(',', '')) || 0;
            
            employeeTotals[emp].totalWages += wages;
            employeeTotals[emp].totalTips += tips;
            // Payroll cost = Wages only (excluding tips)
            businessSummary.totalPayroll += wages;
        });
    });
    
    // Calculate average hourly rates using raw hours
    // Average = Total Wages (without tips) / Total Hours
    employee_cols.forEach(emp => {
        const total = employeeTotals[emp];
        if (total.totalHours > 0) {
            total.avgHourlyRate = total.totalWages / total.totalHours;
        } else {
            total.avgHourlyRate = 0;
        }
    });
}

// Process payroll
function processPayroll() {
    try {
        updateSettings();
        
        if (employees.length === 0) {
            throw new InputError('Please add at least one employee');
        }
        
        // Validate that marketing spend and insurance spend are entered
        const marketingSpend = parseFloat(document.getElementById('marketing-spend').value);
        const insuranceSpend = parseFloat(document.getElementById('insurance-spend').value);
        
        if (isNaN(marketingSpend) || marketingSpend < 0) {
            throw new InputError('Please enter a valid Marketing Spend amount (must be 0 or greater)');
        }
        
        if (isNaN(insuranceSpend) || insuranceSpend < 0) {
            throw new InputError('Please enter a valid Insurance Spend amount (must be 0 or greater)');
        }
        
        const level_pcts = getLevels();
        const employee_levels = Object.fromEntries(employees);
        
        results = getOutputReport(payrollData, employees, level_pcts);
        calculateEmployeeTotals(results);
        displayResults(results);
        setStatus(SUCCESS_STATUS, `Successfully processed ${results.length} jobs`);
        
    } catch (error) {
        setStatus(ERROR_STATUS, `Error: ${error.message}`);
        console.error(error);
    }
}

// Display results
function displayResults(data) {
    if (data.length === 0) return;
    
    const section = document.getElementById('results-section');
    const headerEl = document.getElementById('results-header');
    const bodyEl = document.getElementById('results-body');
    
    section.style.display = 'block';
    
    // Create header
    const employee_cols = employees.map(emp => emp[0]);
    const headerRow = document.createElement('tr');
    
    const baseHeaders = ['Job #', 'Job Status', 'Manual Input', 'Address'];
    baseHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    
    // Hours headers
    employee_cols.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Hours)`;
        headerRow.appendChild(th);
    });
    
    // Wages headers
    employee_cols.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Wages)`;
        headerRow.appendChild(th);
    });
    
    // Tips headers
    employee_cols.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Tips)`;
        headerRow.appendChild(th);
    });
    
    const endHeaders = ['Job Amount', 'Tip Amount', 'Completed Date'];
    endHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    
    headerEl.innerHTML = '';
    headerEl.appendChild(headerRow);
    
    // Create body
    bodyEl.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        bodyEl.appendChild(tr);
    });
    
    // Display summary with average hourly rates
    displayEmployeeSummary();
    
    // Display business summary
    displayBusinessSummary();
    
    // Scroll to results
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display employee summary with average hourly rates
function displayEmployeeSummary() {
    const section = document.getElementById('results-section');
    
    // Remove existing summary if any
    const existingSummary = document.getElementById('employee-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'employee-summary';
    summaryDiv.className = 'employee-summary';
    
    const employee_cols = employees.map(emp => emp[0]);
    
    summaryDiv.innerHTML = `
        <h3>Employee Summary - Average Hourly Rates</h3>
        <div class="summary-table-container">
            <table id="summary-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Total Hours</th>
                        <th>Wage (Wages + Tips)</th>
                        <th>Total Wages</th>
                        <th>Total Tips</th>
                        <th>Total Earnings</th>
                        <th>Average Hourly Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${employee_cols.map(emp => {
                        const total = employeeTotals[emp];
                        const totalEarnings = total.totalWages + total.totalTips;
                        return `
                            <tr>
                                <td><strong>${emp}</strong></td>
                                <td>${total.totalHours.toFixed(2)}</td>
                                <td class="wage-column">$${totalEarnings.toFixed(2)}</td>
                                <td>$${total.totalWages.toFixed(2)}</td>
                                <td>$${total.totalTips.toFixed(2)}</td>
                                <td>$${totalEarnings.toFixed(2)}</td>
                                <td class="avg-rate">$${total.avgHourlyRate.toFixed(2)}/hr</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    section.appendChild(summaryDiv);
}

// Display business summary
function displayBusinessSummary() {
    const section = document.getElementById('results-section');
    
    // Remove existing business summary if any
    const existingSummary = document.getElementById('business-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    // Update expenses from input fields
    businessSummary.marketingSpend = parseFloat(document.getElementById('marketing-spend').value) || 0;
    businessSummary.insuranceSpend = parseFloat(document.getElementById('insurance-spend').value) || 0;
    
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'business-summary';
    summaryDiv.className = 'business-summary';
    
    const totalExpenses = businessSummary.totalPayroll + businessSummary.marketingSpend + businessSummary.insuranceSpend;
    const netProfit = businessSummary.totalRevenue - totalExpenses;
    const profitMargin = businessSummary.totalRevenue > 0 
        ? ((netProfit / businessSummary.totalRevenue) * 100).toFixed(2)
        : 0;
    
    summaryDiv.innerHTML = `
        <h3>Business Summary</h3>
        <div class="summary-table-container">
            <table id="business-summary-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Total Job Revenue</strong></td>
                        <td class="revenue-amount">$${businessSummary.totalRevenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Payroll Cost</strong></td>
                        <td class="expense-amount">$${businessSummary.totalPayroll.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Marketing Spend</strong></td>
                        <td class="expense-amount">$${businessSummary.marketingSpend.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Insurance Spend</strong></td>
                        <td class="expense-amount">$${businessSummary.insuranceSpend.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Expenses</strong></td>
                        <td class="expense-total">$${totalExpenses.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Net Profit</strong></td>
                        <td class="${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">$${netProfit.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Profit Margin</strong></td>
                        <td class="${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${profitMargin}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    section.appendChild(summaryDiv);
}

// Download results as CSV
function downloadResults() {
    if (results.length === 0) {
        alert('No results to download');
        return;
    }
    
    const employee_cols = employees.map(emp => emp[0]);
    const baseHeaders = ['Job #', 'Job Status', 'Manual Input', 'Address'];
    const hoursHeaders = employee_cols.map(emp => `${emp} (Hours)`);
    const wagesHeaders = employee_cols.map(emp => `${emp} (Wages)`);
    const tipsHeaders = employee_cols.map(emp => `${emp} (Tips)`);
    const endHeaders = ['Job Amount', 'Tip Amount', 'Completed Date'];
    
    const headers = [...baseHeaders, ...hoursHeaders, ...wagesHeaders, ...tipsHeaders, ...endHeaders];
    
    // Create CSV data with main results
    const csvData = [headers, ...results];
    
    // Add empty row and summary section
    csvData.push([]);
    csvData.push(['Employee Summary']);
    csvData.push(['Employee', 'Total Hours', 'Wage (Wages + Tips)', 'Total Wages', 'Total Tips', 'Total Earnings', 'Average Hourly Rate']);
    
    employee_cols.forEach(emp => {
        const total = employeeTotals[emp];
        const totalEarnings = total.totalWages + total.totalTips;
        csvData.push([
            emp,
            total.totalHours.toFixed(2),
            `$${totalEarnings.toFixed(2)}`,
            `$${total.totalWages.toFixed(2)}`,
            `$${total.totalTips.toFixed(2)}`,
            `$${totalEarnings.toFixed(2)}`,
            `$${total.avgHourlyRate.toFixed(2)}/hr`
        ]);
    });
    
    // Add business summary
    csvData.push([]);
    csvData.push(['Business Summary']);
    csvData.push(['Metric', 'Amount']);
    csvData.push(['Total Job Revenue', `$${businessSummary.totalRevenue.toFixed(2)}`]);
    csvData.push(['Total Payroll Cost', `$${businessSummary.totalPayroll.toFixed(2)}`]);
    csvData.push(['Marketing Spend', `$${businessSummary.marketingSpend.toFixed(2)}`]);
    csvData.push(['Insurance Spend', `$${businessSummary.insuranceSpend.toFixed(2)}`]);
    const totalExpenses = businessSummary.totalPayroll + businessSummary.marketingSpend + businessSummary.insuranceSpend;
    csvData.push(['Total Expenses', `$${totalExpenses.toFixed(2)}`]);
    const netProfit = businessSummary.totalRevenue - totalExpenses;
    csvData.push(['Net Profit', `$${netProfit.toFixed(2)}`]);
    const profitMargin = businessSummary.totalRevenue > 0 
        ? ((netProfit / businessSummary.totalRevenue) * 100).toFixed(2)
        : 0;
    csvData.push(['Profit Margin', `${profitMargin}%`]);
    
    const csv = Papa.unparse(csvData);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearResults() {
    results = [];
    employeeTotals = {};
    rawEmployeeHours = {};
    businessSummary = { 
        totalRevenue: 0, 
        totalPayroll: 0,
        marketingSpend: 0,
        insuranceSpend: 0
    };
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('csv-file').value = '';
    document.getElementById('file-info').textContent = '';
    setStatus(SUCCESS_STATUS, 'Results cleared');
}

// Initialize with default employees
function initializeDefaultEmployees() {
    const defaultEmployees = [
        ['Henry Rios', 'L4'],
        ['Danny Brown', 'L4'],
        ['Kevin Cooper', 'L4'],
        ['Yong Lee', 'L4'],
        ['David Mestas', 'L3'],
        ['Rick Fox', 'L3'],
        ['Paul Pate', 'L3'],
        ['Joshua Ryan', 'L1']
    ];
    
    employees = defaultEmployees;
    updateEmployeesList();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultEmployees();
    
    // Allow Enter key to add employee
    document.getElementById('emp-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addEmployee();
        }
    });
});

