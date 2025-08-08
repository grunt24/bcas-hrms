import React, { useState, useEffect } from "react";
import { 
  EyeOutlined, 
  DeleteOutlined,
  UploadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined
} from "@ant-design/icons";
import { 
  Button, 
  Upload, 
  Modal, 
  message, 
  Table, 
  Space,
  Tag,
//  Spin,
  Image
} from "antd";
import type { UploadFile } from "antd";
import { EmployeeService } from "../api/EmployeeService";
import DepartmentService from "../api/DepartmentService";
import { Employee } from "../types/tblEmployees";
import "./ContractPage.css";

interface EmployeeContract extends Employee {
  contractStatus: 'Active' | 'Expired' | 'Pending';
  contractFiles: UploadFile[];
}

interface Department {
  departmentID: number;
  departmentName: string;
}

const getFileIcon = (fileType?: string) => {
  if (!fileType) return <FileOutlined />;
  
  if (fileType.includes('pdf')) return <FilePdfOutlined />;
  if (fileType.includes('word') || fileType.includes('document')) return <FileWordOutlined />;
  if (fileType.includes('excel') || fileType.includes('sheet')) return <FileExcelOutlined />;
  if (fileType.includes('image')) return <FileOutlined />;
  
  return <FileOutlined />;
};

const ContractPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeContract[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeContract | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [employeeData, departmentData] = await Promise.all([
          EmployeeService.getAll(),
          DepartmentService.getAll()
        ]);
        
        const statuses = ['Active', 'Expired', 'Pending'] as const;
        const employeesWithContracts = employeeData.map(emp => ({
          ...emp,
          contractStatus: statuses[Math.floor(Math.random() * 3)],
          contractFiles: []
        }));
        
        setEmployees(employeesWithContracts);
        setDepartments(
          departmentData
            .filter((d: any) => typeof d.departmentID === 'number')
            .map((d: any) => ({
              departmentID: d.departmentID as number,
              departmentName: d.departmentName
            }))
        );
      } catch (error) {
        message.error("Failed to fetch data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview && file.originFileObj) {
      try {
        file.preview = await getBase64(file.originFileObj);
      } catch (error) {
        console.error("Error generating preview:", error);
        message.error("Failed to generate preview");
        return;
      }
    }
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  const handleUpload = () => {
    if (editingEmployee && fileList.length > 0) {
      const updatedEmployees = employees.map(emp => 
        emp.employeeID === editingEmployee.employeeID 
          ? { ...emp, contractFiles: [...emp.contractFiles, ...fileList] }
          : emp
      );
      setEmployees(updatedEmployees);
      message.success("Contract file uploaded successfully");
      setEditingEmployee(null);
      setFileList([]);
    }
  };

  const handleDelete = (employeeId: number, fileUid: string) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.employeeID === employeeId) {
        return {
          ...emp,
          contractFiles: emp.contractFiles.filter(file => file.uid !== fileUid)
        };
      }
      return emp;
    });
    setEmployees(updatedEmployees);
    message.success("Contract file deleted successfully");
  };

  const getDepartmentName = (departmentId: number | undefined) => {
    if (typeof departmentId !== 'number') return 'Unknown';
    const department = departments.find(d => d.departmentID === departmentId);
    return department ? department.departmentName : departmentId;
  };

  const beforeUpload = (file: File) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const renderFilePreview = () => {
    if (!previewFile) return null;

    const fileType = previewFile.type || '';
    const fileUrl = previewFile.url || previewFile.preview || '';

    if (fileType.includes('image')) {
      return (
        <Image
          width="100%"
          src={fileUrl}
          alt="Contract preview"
          style={{ maxHeight: '70vh', objectFit: 'contain' }}
        />
      );
    }

    if (fileType.includes('pdf')) {
      return (
        <iframe 
          src={fileUrl} 
          width="100%" 
          height="600px" 
          style={{ border: 'none' }}
          title="PDF Preview"
        />
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        {getFileIcon(fileType)}
        <p style={{ marginTop: 16 }}>
          {previewFile.name || 'Contract File'}
        </p>
        <Button 
          type="primary" 
          onClick={() => window.open(fileUrl, '_blank')}
          style={{ marginTop: 16 }}
        >
          Download File
        </Button>
      </div>
    );
  };

  const columns = [
    {
      title: 'Employee',
      key: 'name',
      render: (record: Employee) => (
        <span>{record.firstName} {record.lastName}</span>
      ),
    },
    {
      title: 'Department',
      key: 'department',
      render: (record: Employee) => (
        <span>{getDepartmentName(record.departmentID)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'contractStatus',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'Active' ? 'green' : 
          status === 'Expired' ? 'red' : 'orange'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Contract',
      key: 'contract',
      render: (record: EmployeeContract) => (
        <Space size="middle" className="contract-actions">
          <Button
            type="link"
            icon={<UploadOutlined />}
            onClick={() => setEditingEmployee(record)}
            size="small"
          >
            <span className="action-text">Upload</span>
          </Button>
          {record.contractFiles.length > 0 && (
            <>
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(record.contractFiles[0])}
                size="small"
              >
                <span className="action-text">View</span>
              </Button>
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.employeeID!, record.contractFiles[0].uid)}
                size="small"
              >
                <span className="action-text">Delete</span>
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="contract-page">
      <h2>Employee Contracts</h2>
      
      <Table
        columns={columns}
        dataSource={employees}
        rowKey="employeeID"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
        className="contract-table"
      />

      {/* Upload Modal */}
      {editingEmployee && (
        <Modal
          title={`Upload Contract for ${editingEmployee.firstName} ${editingEmployee.lastName}`}
          open={true}
          onCancel={() => setEditingEmployee(null)}
          footer={[
            <Button key="cancel" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>,
            <Button
              key="upload"
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0}
            >
              Upload
            </Button>,
          ]}
          className="upload-modal"
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={({ fileList }) => setFileList(fileList)}
            accept="*/*"
            maxCount={1}
          >
            {fileList.length >= 1 ? null : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Select File</div>
              </div>
            )}
          </Upload>
          <p style={{ marginTop: 8, color: '#666' }}>
            Supported files: PDF, Word, Excel, Images (Max 10MB)
          </p>
        </Modal>
      )}

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewFile?.name || 'Contract File'}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width="90%"
        style={{ top: 20 }}
        wrapClassName="preview-modal"
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {renderFilePreview()}
        </div>
      </Modal>
    </div>
  );
};

export default ContractPage;
