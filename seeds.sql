INSERT INTO departments(department_name)
VALUES
('DEVELOPMENT'),
('SALES'),
('HR');

INSERT INTO roles(title, salary, department_id)
VALUES
('Manager', 100000, 1);

INSERT INTO employees(first_name, last_name, role_id, manager_id)
VALUES
('Raymond', 'Lee', 1, NULL);