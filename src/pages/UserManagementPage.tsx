import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  Select,
  message,
  Popconfirm,
  Modal,
  Switch,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import UserService from "../api/userService";
import { UserListItem, Role } from "../types/tblUsers";
import type { ColumnsType } from "antd/lib/table";

const { Option } = Select;

const UserManagementPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [userData, setUserData] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const roles: Role[] = [
    { roleId: 1, roleName: "Admin" },
    { roleId: 2, roleName: "Teacher" },
    { roleId: 3, roleName: "Non-Teacher" },
  ];

  // Fetch user data function
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UserService.getAll();
      setUserData(data);
    } catch (err) {
      setError("Failed to fetch user data");
      message.error("Failed to fetch user data");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleAddUser = () => {
    form.resetFields();
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: UserListItem) => {
    // Use the exact same field names as in the API response
    form.setFieldsValue({
      userId: record.userId,
      employeeId: record.employeeId,
      roleId: record.roleId,
      username: record.userName, // Map userName from API to username in form
      isActive: record.isActive,
    });
    setEditingId(record.userId);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await UserService.delete(id);
      // Refresh the data after successful delete
      await fetchUserData();
      message.success("User deleted successfully");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to delete user";
      message.error(errorMsg);
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingId) {
        // For update, send only the changed values
        const updateData = {
          ...values,
          userName: values.username, // Map form username to API userName
        };
        delete updateData.username; // Remove the form field name

        await UserService.update(editingId, updateData);
        message.success("User updated successfully");
      } else {
        // For create, use the form values directly
        const createData = {
          ...values,
          userName: values.username, // Map form username to API userName
        };
        delete createData.username; // Remove the form field name

        await UserService.create(createData);
        message.success("User created successfully");
      }

      // Refresh data after successful operation
      await fetchUserData();
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 
                      err?.message || 
                      "Operation failed";
      message.error(errorMsg);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = userData.filter((record) =>
    Object.values(record).some((value) =>
      value?.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const columns: ColumnsType<UserListItem> = [
    {
      title: "Username",
      dataIndex: "userName",
      key: "userName",
      width: 150,
    },
    {
      title: "Role",
      dataIndex: "roleId",
      key: "roleId",
      width: 150,
      render: (roleId) => {
        const role = roles.find((r) => r.roleId === roleId);
        return role ? role.roleName : `Role ${roleId}`;
      },
      filters: roles.map((role) => ({
        text: role.roleName,
        value: role.roleId,
      })),
      onFilter: (value, record) => record.roleId === value,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (status) => (
        <span style={{ color: status ? "#52c41a" : "#ff4d4f" }}>
          {status ? "Active" : "Inactive"}
        </span>
      ),
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
            style={{ padding: '4px 8px' }}
          />
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={(e) => {
              if (e) e.stopPropagation();
              handleDelete(record.userId);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={(e) => e.stopPropagation()}
              style={{ padding: '4px 8px' }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="User Management"
      extra={
        <Space>
          <Input.Search
            placeholder="Search users..."
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddUser}
          >
            Add User
          </Button>
        </Space>
      }
    >
      {error && (
        <div style={{ 
          color: '#ff4d4f', 
          marginBottom: 16, 
          padding: '8px 12px', 
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px'
        }}>
          {error}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="userId"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true
        }}
        scroll={{ x: 600 }}
      />

      <Modal
        title={editingId ? "Edit User" : "Add New User"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        confirmLoading={loading}
        width={500}
        maskClosable={false}
      >
        <Form 
          form={form} 
          layout="vertical"
          preserve={false}
        >
          <Form.Item name="userId" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="employeeId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input username!" }]}
          >
            <Input disabled={!!editingId} />
          </Form.Item>

          <Form.Item
            label="Role"
            name="roleId"
            rules={[{ required: true, message: "Please select role!" }]}
          >
            <Select placeholder="Select a role">
              {roles.map((role) => (
                <Option key={role.roleId} value={role.roleId}>
                  {role.roleName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {!editingId && (
            <Form.Item
              label="Password"
              name="newPassword"
              rules={[{ required: true, message: "Please input password!" }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          {editingId && (
            <Form.Item 
              label="Status" 
              name="isActive" 
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagementPage;