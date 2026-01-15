const Papa = require('papaparse');
const XLSX = require('xlsx');

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

// Parse employee hours string with margin of error
function parseEmployeeHoursString(jobStr, employeeCols, marginOfError) {
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
            employee_hours = max_time - employee_hours <= marginOfError ? max_time : employee_hours;
        }
        output[employeeName] = employee_hours;
    });
    
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

// Parse CSV file
function parseCSVFile(csvData) {
    const parsed = Papa.parse(csvData, {
        skipEmptyLines: true,
        dynamicTyping: true
    });
    
    if (parsed.data.length < 2) {
        throw new Error("The input file needs to contain at least 1 row of data.");
    }
    
    if (parsed.data[0].length !== EXPECTED_PAYROLL_FILE_COLUMNS.length) {
        throw new Error(
            `The input file contains ${parsed.data[0].length} columns. ` +
            `Expected ${EXPECTED_PAYROLL_FILE_COLUMNS.length} columns.\n` +
            `Expected columns: ${EXPECTED_PAYROLL_FILE_COLUMNS.join(', ')}`
        );
    }
    
    return parsed.data.slice(1);
}

// Parse Excel file (XLS/XLSX)
function parseExcelFile(buffer) {
    const data = new Uint8Array(buffer);
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
        throw new Error("The input file needs to contain at least 1 row of data.");
    }
    
    // Check column count
    if (jsonData[0].length !== EXPECTED_PAYROLL_FILE_COLUMNS.length) {
        throw new Error(
            `The input file contains ${jsonData[0].length} columns. ` +
            `Expected ${EXPECTED_PAYROLL_FILE_COLUMNS.length} columns.\n` +
            `Expected columns: ${EXPECTED_PAYROLL_FILE_COLUMNS.join(', ')}`
        );
    }
    
    // Convert to same format as CSV data
    return jsonData.slice(1).map(row => {
        // Ensure row has the correct number of columns
        while (row.length < EXPECTED_PAYROLL_FILE_COLUMNS.length) {
            row.push('');
        }
        return row.slice(0, EXPECTED_PAYROLL_FILE_COLUMNS.length);
    });
}

module.exports = {
    parseEmployeeHoursString,
    parseEmployeeHoursStringRaw,
    parseCSVFile,
    parseExcelFile,
    EXPECTED_PAYROLL_FILE_COLUMNS
};

