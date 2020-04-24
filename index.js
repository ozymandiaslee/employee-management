const mysql = require('mysql');
const inquirer = require('inquirer');
      
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: "lindenplace1",
  database: 'employee_db'
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId + "\n");
  init();
});

const init = () => {
  inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      message: 'Choose an option',
      choices: ['ADD EMPLOYEE', 'VIEW EMPLOYEES', 'UPDATE EMPLOYEES', 'DELETE EMPLOYEES']
    }
  ]).then(function(response) {

    switch(response.action){
      case 'ADD EMPLOYEE':
          addEmployee();
          break;
      case 'VIEW EMPLOYEES':
          viewData()
          break;
      case 'DELETE EMPLOYEES':
          deleteData();
          break;
    }
  })
  .catch(function(err) {
    console.log(err);
  })
}

const addEmployee = () => {
  const employeesQuery = 'SELECT * FROM employees',
        rolesQuery = 'SELECT * FROM roles';
  connection.query(employeesQuery, function(err, employee) {
    if (err) throw err
    connection.query(rolesQuery, function(err, role) {
        if (err) throw err
        inquirer.prompt([{
          name: 'first_name',
          type: 'input',
          message: "What is the employee's first name?"
        },
        {
          name: 'last_name',
          type: 'input',
          message: "What is the employee's last name"
        },
        {
          name: 'role',
          type: 'list',
          message: "What is this employee's role",
          choices: () => role.map(val => val.title)
        },
        {
          name: 'hasManager',
          type: 'confirm',
          message: "Does this employee have a manager?"
        },
        {
          name: 'manager',
          type: 'list',
          message: 'Choose their manager',
          when: (answer) => answer.hasManager,
          choices: () => employee.map(val => val.first_name + " " + val.last_name)
        }
      ]).then(function(response) {
        const roleQuery = 'SELECT r_id FROM roles WHERE ?';
        connection.query(roleQuery, { title: response.role}, function(err, response) {
          if (err) throw err;
          const roleId = role[0].id;
          const managerQuery = "SELECT r_id FROM employees WHERE ? AND ?";
          const firstName = response.manager.slice(0, response.manager.indexOf(" "));
          const lastName = response.manager.slice(response.manager.indexOf(" ") + 1, response.manager.length);
          connection.query(managerQuery, [{ first_name: firstName }, { last_name: lastName }], function(err, response){
            if(err) throw err;
            const employeeId = result[0].id;
            const query = "INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)";
            connection.query(query [response.fname, response.lname, roleId, employeeId], function(err, response) {
              if(err) throw err;
              continuePrompt();
            });
          });
        });
      });
    });
  });
}

//viewing all data function
const viewData = () => {
  inquirer.prompt([
    {
      name: 'filter',
      type: 'list',
      message: 'How would you like to view the data?',
      choices: ['VIEW ALL EMPLOYEES', 'VIEW EMPLOYEES BY DEPARTMENT', 'VIEW EMPLOYEES BY MANAGER']
    }]).then(function(response){
      switch(response.filter){
        case 'VIEW ALL EMPLOYEES':
          console.log('Selecting all employees...\n');
          connection.query(`SELECT * FROM employees`, function(err, response) {
            if(err) throw err
            console.table(response);
            continuePrompt();
          });
          break;
        case 'VIEW EMPLOYEES BY DEPARTMENT':
          let query = 'SELECT department_name FROM departments';
          connection.query(query, function(err, response) {
            if(err) throw err;
            console.log(response);
            inquirer.prompt(
              {
              type: 'list',
              name: 'department',
              message: 'SELECT DEPARTMENT',
              choices: () => {
                return response.map(val => val.department_name)
              }
            }).then(function(response) {
              let query = 'SELECT d_id FROM departments WHERE ?';
              connection.query(query, { department_name: response.department }, function(err, data) {
                if (err) throw err
                const departmentId = data[0].d_id;
                const newQuery = "SELECT * FROM employees INNER JOIN roles on employees.role_id = roles.r_id WHERE roles.department_id = ?";
                connection.query(newQuery, [departmentId], (err, response) => {
                    if(err) throw err;
                    console.table(response);
                });
                continuePrompt();
              });
            });
          });
          break;
          case 'VIEW EMPLOYEES BY MANAGER':
            let employeeQuery = "SELECT concat(first_name, ' ', last_name) as name FROM employees";
            connection.query(employeeQuery, function(err, response) {
              if (err) throw err
              inquirer.prompt(
                {
                  type: 'list',
                  name: 'manager',
                  message: 'Choose a manager',
                  choices: () => response
                }
              ).then(function(response) {
                const firstNameArr = response.manager.split(' ');
                const lastNameIndex = response.manager.indexOf(' ');
                const firstName = firstNameArr[0];
                const lastName = response.manager.substring(lastNameIndex + 1, response.manager.length);
                const queryEmployeeID = 'SELECT e_id from employees where first_name = ? AND last_name = ?';
                connection.query(queryEmployeeID, [firstName, lastName], function(err, results) {
                  if (err) throw err;
                  const queryManager = 'SELECT * from employees where manager_id = ?';
                  const managerID = results[0].id;
                  connection.query(queryManager, [managerID], function(err, data){
                    if (err) throw err;
                    console.table(data)
                    continuePrompt();
                  })
                })
              })
            })
      }
    });
}

const deleteData = () => {
  connection.query('SELECT * FROM employees', function(err, response) {
    if (err) throw err;
    inquirer.prompt(
      {
        type: 'list',
        name: 'remove',
        message: 'Which employee would you like to remove?',
        choices: () => {
          return response.map(val => val.first_name + ' ' + val.last_name);
        }
      }
    ).then(function(response) {
      const firstName = response.remove.slice(0, response.remove.indexOf(" "));
      const lastName = response.remove.slice(response.remove.indexOf(" ") + 1, response.remove.length);
      connection.query('DELETE FROM employees WHERE ? and ?', [{first_name: firstName}, {last_name: lastName}], function(err, data) {
        if (err) throw err;
        console.log('Employee successfully removed from database');
        continuePrompt();
      })
    })
  })
}

const continuePrompt = () => {
  inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      message: 'Would you like to continue or exit?',
      choices: ['CONTINUE', 'EXIT']
    }
  ]).then(function(response){
    console.log(`${response.action} \n`)
    switch(`${response.action}`){
      case 'CONTINUE':
        init();
        break;
      case 'EXIT':
        connection.end();
    }
  });
}