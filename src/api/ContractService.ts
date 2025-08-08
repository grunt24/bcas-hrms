// api/ContractService.ts
import axios from 'axios';
import { Contract } from '../types/tblContracts';

const API_URL = process.env.REACT_APP_API_URL + '/api/contracts';

export const ContractService = {
  async getByEmployeeId(employeeId: number): Promise<Contract[]> {
    const response = await axios.get(`${API_URL}/employee/${employeeId}`);
    return response.data;
  },

  async upload(
    _employeeId: number, 
    file: File, 
    contractData: {
      contractType: string;
      contractStartDate: string;
      contractEndDate: string;
      lastUpdatedBy: number;
    }
  ): Promise<Contract> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contractType', contractData.contractType);
    formData.append('contractStartDate', contractData.contractStartDate);
    formData.append('contractEndDate', contractData.contractEndDate);
    formData.append('lastUpdatedBy', contractData.lastUpdatedBy.toString());

    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async download(contractId: number): Promise<Blob> {
    const response = await axios.get(`${API_URL}/${contractId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async delete(contractId: number): Promise<void> {
    await axios.delete(`${API_URL}/${contractId}`);
  },

  async updateStatus(contractId: number, status: string): Promise<Contract> {
    const response = await axios.patch(`${API_URL}/${contractId}/status`, { status });
    return response.data;
  },
};

export default ContractService;