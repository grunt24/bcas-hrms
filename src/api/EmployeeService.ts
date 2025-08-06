import axios from 'axios';
import { Employee } from '../types/tblEmployees';

const API_BASE_URL = 'https://localhost:7245/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const EmployeeService = {
  
  // CREATE
  async create(employee: Omit<Employee, 'employeeID'>): Promise<Employee> {
    const employeeData = { ...employee, employeeID: null };
    const response = await axiosInstance.post('/Employees', employeeData);
    return response.data;
  },

  // GET ALL
  async getAll(): Promise<Employee[]> {
    const response = await axiosInstance.get('/Employees');
    return response.data;
  },

  // UPDATE
update: async (id: number, employee: Partial<Employee>): Promise<Employee> => {
  try {
    const payload = {
      EmployeeID: id,
      FirstName: employee.firstName,
      LastName: employee.lastName,
      Gender: employee.gender,
      DateOfBirth: employee.dateOfBirth,
      Email: employee.email,
      PhoneNumber: employee.phoneNumber,
      Address: employee.address,
      PositionID: employee.positionID,
      DepartmentID: employee.departmentID,
      EmploymentStatus: employee.employmentStatus,
      HireDate: employee.hireDate
    };

    const response = await axiosInstance.patch<Employee>(
      `/Employees/${id}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error in EmployeeService.update:", error);
    throw error;
  }
},

  // DELETE
  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/Employees/${id}`);
  }
};