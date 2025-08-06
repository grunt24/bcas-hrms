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
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
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
    { roleId: 1, roleName: "Administrator" },
    { roleId: 2, roleName: "Teacher" },
    { roleId: 3, roleName: "Staff" },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await UserService.getAll();
        setUserData(data);
      } catch (err) {
        setError("Failed to fetch user data");
        message.error("Failed to fetch user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = (record: UserListItem) => {
    form.setFieldsValue({
      userId: record.userId,
      employeeId: record.employeeId,
      roleId: record.roleId,
      username: record.userName,
      isActive: record.isActive,
    });
    setEditingId(record.userId);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await UserService.delete(id);
      setUserData(userData.filter((item) => item.userId !== id));
      message.success("User deleted successfully");
    } catch (err) {
      message.error("Failed to delete user");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingId) {
        const updatedUser = await UserService.update(editingId, values);
        setUserData(
          userData.map((item) =>
            item.userId === editingId ? { ...item, ...updatedUser } : item
          )
        );
        message.success("User updated successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (err) {
      message.error("Operation failed. Please check the form and try again.");
      console.error("Detailed error:", err);
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
        return role ? role.roleName : roleId;
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
        <span style={{ color: status ? "green" : "red" }}>
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
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.userId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
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
            placeholder="Search..."
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
        </Space>
      }
    >
      {error && <div className="error-message">{error}</div>}

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="userId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingId ? "Edit User" : "Add User"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
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
            <Select>
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
            <Form.Item label="Status" name="isActive" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagementPage;
