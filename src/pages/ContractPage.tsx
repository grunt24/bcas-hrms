import React, { useState, useEffect } from "react";
import { 
  EyeOutlined, 
  UploadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  EditOutlined
} from "@ant-design/icons";
import { 
  Button, 
  Upload, 
  Modal, 
  message, 
  Table, 
  Space,
  Image,
  Typography,
  DatePicker,
  Form,
  Row,
  Col,
  Select
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import dayjs, { Dayjs } from 'dayjs';
import { EmployeeService } from "../api/EmployeeService";
import DepartmentService from "../api/DepartmentService";
import { ContractService } from "../api/ContractService";
import { EmployeeWithContracts } from "../types/tblContracts";
import { Employee } from "../types/tblEmployees";
import { useAuth } from "../types/useAuth";
import { ROLES } from "../types/auth";
import "./ContractPage.css";

const { Text } = Typography;
const { Option } = Select;

interface Department {
  departmentID: number;
  departmentName: string;
}

interface ContractFormData {
  contractStartDate: Dayjs;
  contractEndDate: Dayjs;
  contractType: string;
}

interface ContractUpdateFormData {
  contractStartDate?: Dayjs;
  contractEndDate?: Dayjs;
  contractType?: string;
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
  const { user } = useAuth();
  const isAdmin = user?.roleId === ROLES.Admin;
  const isTeacher = user?.roleId === ROLES.Teaching;
  const isNonTeacher = user?.roleId === ROLES.NonTeaching;
  
  const hasAccess = isAdmin || isTeacher || isNonTeacher;

  const [employees, setEmployees] = useState<EmployeeWithContracts[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithContracts | null>(null);
  const [updatingContract, setUpdatingContract] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [updateFileList, setUpdateFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm<ContractFormData>();
  const [updateForm] = Form.useForm<ContractUpdateFormData>();

  useEffect(() => {
    if (!hasAccess) {
      message.error("You don't have permission to access this page");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [allEmployees, departmentData] = await Promise.all([
          EmployeeService.getAll(),
          DepartmentService.getAll()
        ]);
        
        let employeeData: Employee[];
        
        if (isAdmin) {
          employeeData = allEmployees;
        } else if (isTeacher || isNonTeacher) {
          employeeData = allEmployees.filter(emp => emp.employeeID === user?.employeeId);
        } else {
          employeeData = [];
        }
        
        const employeesWithContracts = await Promise.all(
          employeeData.map(async (emp) => {
            try {
              const employeeContracts = await ContractService.getByEmployeeId(emp.employeeID!);
              
              const employeeWithContracts: EmployeeWithContracts = {
                ...emp,
                contracts: employeeContracts,
                contractStatus: ""
              };
              
              return employeeWithContracts;
            } catch (error) {
              console.error(`Failed to fetch contracts for employee ${emp.employeeID}:`, error);
              return {
                ...emp,
                contracts: [],
              } as unknown as EmployeeWithContracts;
            }
          })
        );
        
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
  }, [hasAccess, isAdmin, isTeacher, isNonTeacher, user?.employeeId]);

  if (!hasAccess) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column'
      }}>
        <Text type="danger" style={{ fontSize: '18px', marginBottom: '16px' }}>
          Access Denied
        </Text>
        <Text type="secondary">
          You don't have permission to view contract information.
        </Text>
      </div>
    );
  }

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

  const handleDownload = async (contractId: number, fileName: string) => {
    try {
      const blob = await ContractService.download(contractId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download contract:", error);
      message.error("Failed to download contract");
    }
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingEmployee && fileList.length > 0) {
        setUploading(true);
        
        const file = fileList[0].originFileObj as File;
        
        const contractData = {
          contractType: values.contractType,
          contractStartDate: values.contractStartDate.format('YYYY-MM-DD'),
          contractEndDate: values.contractEndDate.format('YYYY-MM-DD'),
          lastUpdatedBy: user?.employeeId || 0
        };

        try {
          const createdContract = await ContractService.upload(
            editingEmployee.employeeID!,
            file,
            contractData
          );
          
          message.success("Contract uploaded successfully");
          
          const updatedEmployees = employees.map(emp => {
            if (emp.employeeID === editingEmployee.employeeID) {
              const updatedContracts = [...emp.contracts, createdContract];
              return {
                ...emp,
                contracts: updatedContracts
              };
            }
            return emp;
          });
          
          setEmployees(updatedEmployees);
          setEditingEmployee(null);
          setFileList([]);
          form.resetFields();
        } catch (error) {
          console.error("Failed to upload contract:", error);
          message.error("Failed to upload contract");
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error("Validation failed:", error);
      message.error("Please fill in all required fields");
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      
      if (updatingContract) {
        setUpdating(true);
        
        const updateData: any = {
          lastUpdatedBy: user?.employeeId || 0
        };

        if (values.contractType) {
          updateData.contractType = values.contractType;
        }
        if (values.contractStartDate) {
          updateData.contractStartDate = values.contractStartDate.format('YYYY-MM-DD');
        }
        if (values.contractEndDate) {
          updateData.contractEndDate = values.contractEndDate.format('YYYY-MM-DD');
        }
        if (updateFileList.length > 0) {
          updateData.file = updateFileList[0].originFileObj as File;
        }

        try {
          const updatedContract = await ContractService.update(
            updatingContract.contractID!,
            updateData
          );
          
          message.success("Contract updated successfully");
          
          const updatedEmployees = employees.map(emp => {
            const updatedContracts = emp.contracts.map(contract => 
              contract.contractID === updatingContract.contractID 
                ? { ...updatedContract, contractID: updatingContract.contractID }
                : contract
            );
            
            return {
              ...emp,
              contracts: updatedContracts
            };
          });
          
          setEmployees(updatedEmployees);
          setUpdatingContract(null);
          setUpdateFileList([]);
          updateForm.resetFields();
        } catch (error) {
          console.error("Failed to update contract:", error);
          message.error("Failed to update contract");
        } finally {
          setUpdating(false);
        }
      }
    } catch (error) {
      console.error("Validation failed:", error);
      message.error("Please fill in all required fields");
    }
  };

  const getDepartmentName = (departmentId: number | undefined) => {
    if (typeof departmentId !== 'number') return 'Unknown';
    const department = departments.find(d => d.departmentID === departmentId);
    return department ? department.departmentName : departmentId;
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
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
      <div style={{ textAlign: 'center', padding: '40px' }}>
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
        <Text strong>{record.firstName} {record.lastName}</Text>
      ),
    },
    {
      title: 'Department',
      key: 'department',
      render: (record: Employee) => (
        <Text>{getDepartmentName(record.departmentID)}</Text>
      ),
    },
    {
      title: 'Contract Type',
      key: 'contractType',
      render: (record: EmployeeWithContracts) => {
        const latestContract = record.contracts.length > 0 
          ? record.contracts[record.contracts.length - 1] 
          : null;
        return (
          <Text>{latestContract?.contractType || 'Not specified'}</Text>
        );
      },
    },
    {
      title: 'Contract Start',
      key: 'startDate',
      render: (record: EmployeeWithContracts) => {
        const latestContract = record.contracts.length > 0 
          ? record.contracts[record.contracts.length - 1] 
          : null;
        return (
          <Text>{latestContract?.contractStartDate ? dayjs(latestContract.contractStartDate).format('MMM DD, YYYY') : 'Not set'}</Text>
        );
      },
    },
    {
      title: 'Contract End',
      key: 'endDate',
      render: (record: EmployeeWithContracts) => {
        const latestContract = record.contracts.length > 0 
          ? record.contracts[record.contracts.length - 1] 
          : null;
        return (
          <Text>{latestContract?.contractEndDate ? dayjs(latestContract.contractEndDate).format('MMM DD, YYYY') : 'Not set'}</Text>
        );
      },
    },
    {
      title: 'Days Remaining',
      key: 'daysRemaining',
      render: (record: EmployeeWithContracts) => {
        const latestContract = record.contracts.length > 0 
          ? record.contracts[record.contracts.length - 1] 
          : null;
        
        if (!latestContract?.contractEndDate) return <Text type="secondary">N/A</Text>;
        
        const daysLeft = dayjs(latestContract.contractEndDate).diff(dayjs(), 'days');
        const color = daysLeft < 30 ? 'red' : daysLeft < 90 ? 'orange' : 'green';
        
        return (
          <Text type={color === 'red' ? 'danger' : color === 'orange' ? 'warning' : 'success'}>
            {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
          </Text>
        );
      },
    },
    {
      title: 'Contract Documents',
      key: 'contractDocuments',
      render: (record: EmployeeWithContracts) => (
        <Space direction="vertical" size="small">
          {record.contracts.length > 0 ? (
            record.contracts.map((contract) => (
              <div key={contract.contractID} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview({
                    uid: contract.contractID?.toString() || '',
                    name: contract.fileName || 'contract',
                    status: 'done',
                    url: contract.filePath,
                  } as UploadFile)}
                  size="small"
                />
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(contract.contractID!, contract.fileName || 'contract')}
                  size="small"
                />
                {isAdmin && (
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setUpdatingContract(contract);
                      updateForm.setFieldsValue({
                        contractType: contract.contractType ?? undefined,
                        contractStartDate: contract.contractStartDate ? dayjs(contract.contractStartDate) : undefined,
                        contractEndDate: contract.contractEndDate ? dayjs(contract.contractEndDate) : undefined,
                      });
                      setUpdateFileList([]);
                    }}
                    size="small"
                  />
                )}
                <Text>
                  {contract.fileName || `Contract ${contract.contractID}`}
                </Text>
              </div>
            ))
          ) : (
            <Text type="secondary">No contract documents</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: EmployeeWithContracts) => (
        <Space size="middle" className="contract-actions">
          {isAdmin && record.contracts.length === 0 && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => {
                setEditingEmployee(record);
                form.resetFields();
              }}
              size="small"
            >
              <span className="action-text">Upload Contract</span>
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="contract-page">
      <div style={{ marginBottom: '16px' }}>
        <h2>
          {isAdmin ? 'Employee Contracts' : 'My Contracts'}
        </h2>
      </div>

      <Table
        columns={columns}
        dataSource={employees}
        rowKey="employeeID"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        open={!!editingEmployee}
        title={`Upload Contract for ${editingEmployee?.firstName} ${editingEmployee?.lastName}`}
        onCancel={() => {
          setEditingEmployee(null);
          setFileList([]);
          form.resetFields();
        }}
        onOk={handleUpload}
        confirmLoading={uploading}
        width={600}
        okText="Upload"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            contractType: 'Regular',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contractStartDate"
                label="Start Date"
                rules={[{ required: true, message: 'Please select start date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contractEndDate"
                label="End Date"
                rules={[{ required: true, message: 'Please select end date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD" 
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="contractType"
            label="Contract Type"
            rules={[{ required: true, message: 'Please select contract type' }]}
          >
            <Select>
              <Option value="Regular">Regular</Option>
              <Option value="Contractual">Contractual</Option>
              <Option value="Probationary">Probationary</Option>
              <Option value="Temporary">Temporary</Option>
              <Option value="Part-Time">Part-Time</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Contract Document">
            <Upload
              beforeUpload={beforeUpload}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!updatingContract}
        title={`Update Contract`}
        onCancel={() => {
          setUpdatingContract(null);
          setUpdateFileList([]);
          updateForm.resetFields();
        }}
        onOk={handleUpdate}
        confirmLoading={updating}
        width={600}
        okText="Update"
      >
        <Form
          form={updateForm}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contractStartDate"
                label="Start Date"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD" 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contractEndDate"
                label="End Date"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD" 
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="contractType"
            label="Contract Type"
          >
            <Select>
              <Option value="Regular">Regular</Option>
              <Option value="Contractual">Contractual</Option>
              <Option value="Probationary">Probationary</Option>
              <Option value="Temporary">Temporary</Option>
              <Option value="Part-Time">Part-Time</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Contract Document">
            <Upload
              beforeUpload={beforeUpload}
              fileList={updateFileList}
              onChange={({ fileList }) => setUpdateFileList(fileList)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewOpen}
        title={previewFile?.name || 'Contract Preview'}
        footer={null}
        onCancel={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
        width={800}
      >
        {renderFilePreview()}
      </Modal>
    </div>
  );
};

export default ContractPage;