// API base URL
const API_BASE = '/api';

// Status constants
const IN_PROGRESS_STATUS = 'IN_PROGRESS';
const ERROR_STATUS = 'ERROR';
const SUCCESS_STATUS = 'SUCCESS';

// Global state
let employees = [];
let config = {};
let results = [];
let employeeTotals = {};
let businessSummary = {
    totalRevenue: 0,
    totalPayroll: 0,
    marketingSpend: 0,
    insuranceSpend: 0
};

// Status management
function setStatus(type, message) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status ${type.toLowerCase().replace('_', '-')}`;
    }
}

// API helper functions
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
}

// Load employees from API
async function loadEmployees() {
    try {
        employees = await apiCall('/employees');
        updateEmployeesList();
    } catch (error) {
        console.error('Error loading employees:', error);
        setStatus(ERROR_STATUS, `Failed to load employees: ${error.message}`);
    }
}

// Load configuration from API
async function loadConfig() {
    try {
        config = await apiCall('/config');
        
        // Update UI with config values
        if (config.level_L1) document.getElementById('level-L1').value = config.level_L1;
        if (config.level_L2) document.getElementById('level-L2').value = config.level_L2;
        if (config.level_L3) document.getElementById('level-L3').value = config.level_L3;
        if (config.level_L4) document.getElementById('level-L4').value = config.level_L4;
        if (config.trainee_wage) document.getElementById('trainee-wage').value = config.trainee_wage;
        if (config.margin_error) document.getElementById('margin-error').value = config.margin_error;
        if (config.decimal_points) document.getElementById('decimal-points').value = config.decimal_points;
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Save configuration to API
async function saveConfig() {
    try {
        const configData = {
            level_L1: document.getElementById('level-L1').value,
            level_L2: document.getElementById('level-L2').value,
            level_L3: document.getElementById('level-L3').value,
            level_L4: document.getElementById('level-L4').value,
            trainee_wage: document.getElementById('trainee-wage').value,
            margin_error: document.getElementById('margin-error').value,
            decimal_points: document.getElementById('decimal-points').value
        };
        
        config = await apiCall('/config', 'PUT', configData);
        setStatus(SUCCESS_STATUS, 'Configuration saved');
    } catch (error) {
        console.error('Error saving config:', error);
        setStatus(ERROR_STATUS, `Failed to save config: ${error.message}`);
    }
}

// Employee management
async function addEmployee() {
    const nameInput = document.getElementById('emp-name');
    const levelInput = document.getElementById('emp-level');
    
    const name = nameInput.value.trim();
    const level = levelInput.value;
    
    if (!name) {
        alert('Please enter an employee name');
        return;
    }
    
    try {
        await apiCall('/employees', 'POST', { name, level });
        nameInput.value = '';
        await loadEmployees();
        setStatus(SUCCESS_STATUS, 'Employee added successfully');
    } catch (error) {
        alert(`Failed to add employee: ${error.message}`);
    }
}

async function removeEmployee(id) {
    if (!confirm('Are you sure you want to remove this employee?')) {
        return;
    }
    
    try {
        await apiCall(`/employees/${id}`, 'DELETE');
        await loadEmployees();
        setStatus(SUCCESS_STATUS, 'Employee removed successfully');
    } catch (error) {
        alert(`Failed to remove employee: ${error.message}`);
    }
}

function updateEmployeesList() {
    const listEl = document.getElementById('employees-list');
    if (!listEl) return;
    
    if (employees.length === 0) {
        listEl.innerHTML = '<p style="color: #999; font-style: italic;">No employees added yet</p>';
        return;
    }
    
    listEl.innerHTML = employees.map((emp) => `
        <div class="list-item">
            <span><strong>${emp.name}</strong> - ${emp.level}</span>
            <button onclick="removeEmployee(${emp.id})">Remove</button>
        </div>
    `).join('');
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
    processPayrollFile(file);
}

async function processPayrollFile(file) {
    try {
        setStatus(IN_PROGRESS_STATUS, 'Processing payroll file...');
        
        // Validate inputs
        const marketingSpend = parseFloat(document.getElementById('marketing-spend').value);
        const insuranceSpend = parseFloat(document.getElementById('insurance-spend').value);
        
        if (isNaN(marketingSpend) || marketingSpend < 0) {
            throw new Error('Please enter a valid Marketing Spend amount (must be 0 or greater)');
        }
        
        if (isNaN(insuranceSpend) || insuranceSpend < 0) {
            throw new Error('Please enter a valid Insurance Spend amount (must be 0 or greater)');
        }
        
        // Save config first
        await saveConfig();
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('marketing_spend', marketingSpend);
        formData.append('insurance_spend', insuranceSpend);
        
        // Send to backend
        const response = await fetch(`${API_BASE}/payroll/process`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || 'Failed to process payroll');
        }
        
        const data = await response.json();
        
        // Store results
        results = data.results;
        employeeTotals = data.employeeTotals;
        businessSummary = data.businessSummary;
        
        // Display results
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
    
    if (!section || !headerEl || !bodyEl) return;
    
    section.style.display = 'block';
    
    // Get employee names
    const employeeNames = Object.keys(employeeTotals);
    
    // Create header
    const headerRow = document.createElement('tr');
    
    const baseHeaders = ['Job #', 'Job Status', 'Manual Input', 'Address'];
    baseHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    
    // Hours headers
    employeeNames.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Hours)`;
        headerRow.appendChild(th);
    });
    
    // Wages headers
    employeeNames.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Wages)`;
        headerRow.appendChild(th);
    });
    
    // Tips headers
    employeeNames.forEach(emp => {
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
    data.forEach(result => {
        const tr = document.createElement('tr');
        
        // Base columns
        tr.appendChild(createCell(result.jobNumber));
        tr.appendChild(createCell(result.jobStatus));
        tr.appendChild(createCell(result.manualInput));
        tr.appendChild(createCell(result.address));
        
        // Hours
        result.hours.forEach(h => tr.appendChild(createCell(h)));
        
        // Wages
        result.wages.forEach(w => tr.appendChild(createCell(`$${parseFloat(w).toFixed(2)}`)));
        
        // Tips
        result.tips.forEach(t => tr.appendChild(createCell(`$${parseFloat(t).toFixed(2)}`)));
        
        // End columns
        tr.appendChild(createCell(`$${result.jobAmount.toFixed(2)}`));
        tr.appendChild(createCell(`$${result.tipAmount.toFixed(2)}`));
        tr.appendChild(createCell(result.completedDate));
        
        bodyEl.appendChild(tr);
    });
    
    // Display summary
    displayEmployeeSummary();
    displayBusinessSummary();
    
    // Scroll to results
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

// Display employee summary
function displayEmployeeSummary() {
    const section = document.getElementById('results-section');
    if (!section) return;
    
    // Remove existing summary if any
    const existingSummary = document.getElementById('employee-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'employee-summary';
    summaryDiv.className = 'employee-summary';
    
    const employeeNames = Object.keys(employeeTotals);
    
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
                    ${employeeNames.map(emp => {
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
    if (!section) return;
    
    // Remove existing business summary if any
    const existingSummary = document.getElementById('business-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
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

// Save payroll to database
async function savePayroll() {
    try {
        if (results.length === 0) {
            alert('No results to save');
            return;
        }
        
        setStatus(IN_PROGRESS_STATUS, 'Saving payroll to database...');
        
        const response = await apiCall('/payroll/save', 'POST', {
            results,
            employeeTotals,
            businessSummary,
            runDate: new Date().toISOString().split('T')[0]
        });
        
        setStatus(SUCCESS_STATUS, `Payroll saved successfully! Run ID: ${response.payrollRunId}`);
    } catch (error) {
        setStatus(ERROR_STATUS, `Failed to save payroll: ${error.message}`);
    }
}

// Download results as CSV
function downloadResults() {
    if (results.length === 0) {
        alert('No results to download');
        return;
    }
    
    const employeeNames = Object.keys(employeeTotals);
    const baseHeaders = ['Job #', 'Job Status', 'Manual Input', 'Address'];
    const hoursHeaders = employeeNames.map(emp => `${emp} (Hours)`);
    const wagesHeaders = employeeNames.map(emp => `${emp} (Wages)`);
    const tipsHeaders = employeeNames.map(emp => `${emp} (Tips)`);
    const endHeaders = ['Job Amount', 'Tip Amount', 'Completed Date'];
    
    const headers = [...baseHeaders, ...hoursHeaders, ...wagesHeaders, ...tipsHeaders, ...endHeaders];
    
    // Create CSV data
    const csvData = [headers];
    
    results.forEach(result => {
        const row = [
            result.jobNumber,
            result.jobStatus,
            result.manualInput,
            result.address,
            ...result.hours,
            ...result.wages.map(w => `$${parseFloat(w).toFixed(2)}`),
            ...result.tips.map(t => `$${parseFloat(t).toFixed(2)}`),
            `$${result.jobAmount.toFixed(2)}`,
            `$${result.tipAmount.toFixed(2)}`,
            result.completedDate
        ];
        csvData.push(row);
    });
    
    // Add employee summary
    csvData.push([]);
    csvData.push(['Employee Summary']);
    csvData.push(['Employee', 'Total Hours', 'Wage (Wages + Tips)', 'Total Wages', 'Total Tips', 'Total Earnings', 'Average Hourly Rate']);
    
    employeeNames.forEach(emp => {
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
    
    // Convert to CSV
    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Download
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
    businessSummary = {
        totalRevenue: 0,
        totalPayroll: 0,
        marketingSpend: 0,
        insuranceSpend: 0
    };
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    const fileInput = document.getElementById('csv-file');
    if (fileInput) {
        fileInput.value = '';
    }
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
        fileInfo.textContent = '';
    }
    setStatus(SUCCESS_STATUS, 'Results cleared');
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Load employees and config
    await loadEmployees();
    await loadConfig();
    
    // Allow Enter key to add employee
    const empNameInput = document.getElementById('emp-name');
    if (empNameInput) {
        empNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addEmployee();
            }
        });
    }
    
    // Add save button handler if it exists
    const saveBtn = document.getElementById('save-payroll-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', savePayroll);
    }
});
