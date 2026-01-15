const { parseEmployeeHoursString } = require('./payrollParser');

const TRAINEE = 'L1';
const TECHNICIAN_PCT = 0.65;

// Main job parsing logic
function parseJob(job, job_amt, tips_amt, employee_cols, employee_levels, level_pcts, trainee_wage, margin_of_error, num_decimal_points) {
    let result = parseEmployeeHoursString(job, employee_cols, margin_of_error);
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
                output['wages'][i] = (level_pcts[employee_levels[emp]] * job_amt).toFixed(num_decimal_points);
                output['tips'][i] = tips_amt.toFixed(num_decimal_points);
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
                    output['wages'][i] = (trainee_wage * output['hours'][i]).toFixed(num_decimal_points);
                    output['tips'][i] = ((output['hours'][i] / total_hours) * tips_amt).toFixed(num_decimal_points);
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
                output['wages'][i] = (TECHNICIAN_PCT * employee_wage).toFixed(num_decimal_points);
                output['tips'][i] = ((output['hours'][i] / total_hours) * tips_amt).toFixed(num_decimal_points);
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
                        output['wages'][i] = (0.5 * employee_wage).toFixed(num_decimal_points);
                        output['tips'][i] = (0.5 * tips_amt).toFixed(num_decimal_points);
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
                            output['wages'][i] = (0.60 * employee_wage).toFixed(num_decimal_points);
                            output['tips'][i] = (0.50 * tips_amt).toFixed(num_decimal_points);
                        } else if (emp === junior_tech) {
                            output['wages'][i] = (0.40 * employee_wage).toFixed(num_decimal_points);
                            output['tips'][i] = (0.50 * tips_amt).toFixed(num_decimal_points);
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
                    output['wages'][i] = (result[emp] / total_hours_techs * employee_wage).toFixed(num_decimal_points);
                    output['tips'][i] = (result[emp] / total_hours_techs * tips_amt).toFixed(num_decimal_points);
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
            output['wages'][i] = (result[emp] / total_hours_techs * employee_wage).toFixed(num_decimal_points);
            output['tips'][i] = (result[emp] / total_hours_techs * tips_amt).toFixed(num_decimal_points);
        }
    }
    
    return output;
}

module.exports = {
    parseJob
};

