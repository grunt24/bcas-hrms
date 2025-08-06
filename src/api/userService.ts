import { tblUsersTypes } from "../types/tblUsers";
import axios from 'axios';

const API_URL = 'https://localhost:7245/api';

const UserService = {
  getAll: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_URL}/Users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getById: async (userId: number): Promise<any> => {
    try {
      const response = await axios.get(`${API_URL}/Users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  create: async (userData: tblUsersTypes): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/Users`, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  update: async (userId: number, userData: any): Promise<any> => {
    try {
      const response = await axios.put(`${API_URL}/Users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  delete: async (userId: number): Promise<any> => {
    try {
      const response = await axios.delete(`${API_URL}/Users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },
  
  createUserForEmployee: async (userData: tblUsersTypes): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/Users`, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user for employee:', error);
      throw error;
    }
  }
};

export default UserService;