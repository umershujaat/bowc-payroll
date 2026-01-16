const { parseJob } = require('../utils/payrollCalculator');
const { parseEmployeeHoursStringRaw, parseCSVFile, parseExcelFile } = require('../utils/payrollParser');

// Generate output report
function getOutputReport(data, employees, levels, config) {
    const employee_cols = employees.map(emp => emp.name);
    const employee_levels = Object.fromEntries(employees.map(emp => [emp.name, emp.level]));
    const level_pcts = levels;
    
    const trainee_wage = parseFloat(config.trainee_wage);
    const margin_of_error = parseFloat(config.margin_error);
    const num_decimal_points = parseInt(config.decimal_points);
    
    // Initialize raw hours tracking
    let rawEmployeeHours = {};
    employee_cols.forEach(emp => {
        rawEmployeeHours[emp] = 0;
    });
    
    let output = [];
    
    data.forEach(row => {
        let tips_amt = parseFloat(String(row[7] || '0').replace('$', '').replace(',', '')) || 0;
        let job_amt = parseFloat(String(row[6] || '0').replace('$', '').replace(',', '')) || 0;
        job_amt = job_amt - tips_amt; // Job amount excludes tips
        
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
            level_pcts,
            trainee_wage,
            margin_of_error,
            num_decimal_points
        );
        
        output.push({
            jobNumber: row[0],
            jobStatus: row[1],
            manualInput: row[9] == null || row[9] === '' ? "True" : "False",
            address: row[2],
            hours: wages_and_tips['hours'],
            wages: wages_and_tips['wages'],
            tips: wages_and_tips['tips'],
            jobAmount: job_amt,
            tipAmount: tips_amt,
            completedDate: row[4]
        });
    });
    
    return { results: output, rawEmployeeHours };
}

// Calculate employee totals and business summary
function calculateEmployeeTotals(results, rawEmployeeHours, originalData, employees, marketingSpend, insuranceSpend) {
    const employee_cols = employees.map(emp => emp.name);
    const numEmployees = employee_cols.length;
    
    // Initialize totals
    let employeeTotals = {};
    employee_cols.forEach(emp => {
        employeeTotals[emp] = {
            totalWages: 0,
            totalTips: 0,
            totalHours: 0,
            avgHourlyRate: 0
        };
    });
    
    let businessSummary = {
        totalRevenue: 0,
        totalPayroll: 0,
        marketingSpend: parseFloat(marketingSpend) || 0,
        insuranceSpend: parseFloat(insuranceSpend) || 0,
        payrollTaxes: 0
    };
    
    // Use raw hours for totals
    employee_cols.forEach(emp => {
        employeeTotals[emp].totalHours = rawEmployeeHours[emp] || 0;
    });
    
    // Calculate totals from all jobs
    results.forEach((result, rowIndex) => {
        // Calculate total revenue from original payroll data
        if (originalData[rowIndex]) {
            const rawJobAmount = parseFloat(String(originalData[rowIndex][6] || '0').replace('$', '').replace(',', '')) || 0;
            const tipsAmount = parseFloat(String(originalData[rowIndex][7] || '0').replace('$', '').replace(',', '')) || 0;
            // Revenue = Job amount - Tips (base job revenue only)
            businessSummary.totalRevenue += (rawJobAmount - tipsAmount);
        }
        
        // Sum wages and tips for each employee
        employee_cols.forEach((emp, index) => {
            const wages = parseFloat(String(result.wages[index] || '0').replace('$', '').replace(',', '')) || 0;
            const tips = parseFloat(String(result.tips[index] || '0').replace('$', '').replace(',', '')) || 0;
            
            employeeTotals[emp].totalWages += wages;
            employeeTotals[emp].totalTips += tips;
            businessSummary.totalPayroll += wages;
        });
    });
    
    // Calculate average hourly rates
    employee_cols.forEach(emp => {
        const total = employeeTotals[emp];
        if (total.totalHours > 0) {
            total.avgHourlyRate = total.totalWages / total.totalHours;
        } else {
            total.avgHourlyRate = 0;
        }
    });
    
    return { employeeTotals, businessSummary };
}

// Process payroll file
async function processPayrollFile(fileBuffer, fileName, employees, levelsObj, config) {
    let payrollData;
    
    const fileNameLower = fileName.toLowerCase();
    const isCSV = fileNameLower.endsWith('.csv');
    const isExcel = fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.xlsx');
    
    if (isCSV) {
        const csvData = fileBuffer.toString('utf-8');
        payrollData = parseCSVFile(csvData);
    } else if (isExcel) {
        payrollData = parseExcelFile(fileBuffer);
    } else {
        throw new Error('Unsupported file format. Please upload CSV or Excel file.');
    }
    
    if (employees.length === 0) {
        throw new Error('Please add at least one employee');
    }
    
    // Generate output report
    const { results, rawEmployeeHours } = getOutputReport(payrollData, employees, levelsObj, config);
    
    // Calculate totals
    const { employeeTotals, businessSummary } = calculateEmployeeTotals(
        results,
        rawEmployeeHours,
        payrollData,
        employees,
        config.marketing_spend,
        config.insurance_spend
    );
    
    return {
        results,
        employeeTotals,
        businessSummary,
        rawEmployeeHours
    };
}

module.exports = {
    processPayrollFile,
    getOutputReport,
    calculateEmployeeTotals
};

