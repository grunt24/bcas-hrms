import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  Select,
  message,
  Spin,
  Popconfirm,
  Modal,
  DatePicker,
  Grid,
  Tabs,
  Dropdown,
  Menu,
  Divider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  PrinterOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { EmployeeService } from "../api/EmployeeService";
import { Employee } from "../types/tblEmployees";
import type { ColumnsType } from "antd/lib/table";
import UserService from "../api/userService";
import moment from "moment";
import "./FacultyPage.css";
import DepartmentService from "../api/DepartmentService";
import { DepartmentTypes } from "../types/tblDepartment";
import { PositionTypes } from "../types/tblPosition";
import PositionService from "../api/PositionService";
import { useAuth } from "../types/useAuth";
import { ROLES } from "../types/auth";
import Requirements from "./Requirements";

const { Option } = Select;
const { useBreakpoint } = Grid;
const { TabPane } = Tabs;

const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  "Elementary",
  "High School",
  "Vocational",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Post-Doctoral",
];

// Excel export utility functions
const exportToExcel = (data: any[], filename: string, category?: string) => {
  const headers = [
    "Employee ID",
    "First Name",
    "Last Name",
    "Gender",
    "Date of Birth",
    "Email",
    "Phone Number",
    "Address",
    "Department",
    "Position",
    "Employment Status",
    "Hire Date",
    "Family Member First Name",
    "Family Member Last Name",
    "Family Member Gender",
    "Family Member Address",
    "Family Member Phone",
    "Educational Attainment",
    "Institution Name",
    "Year Graduated",
    "Course Name",
  ].join(",");

  const rows = data.map((employee) =>
    [
      `"${employee.formattedId}"`,
      `"${employee.firstName || ""}"`,
      `"${employee.lastName || ""}"`,
      `"${employee.gender || ""}"`,
      `"${
        employee.dateOfBirth
          ? moment(employee.dateOfBirth).format("YYYY-MM-DD")
          : ""
      }"`,
      `"${employee.email || ""}"`,
      `"${employee.phoneNumber || ""}"`,
      `"${employee.address || ""}"`,
      `"${employee.departmentName || ""}"`,
      `"${employee.positionName || ""}"`,
      `"${employee.employmentStatus || ""}"`,
      `"${
        employee.hireDate ? moment(employee.hireDate).format("YYYY-MM-DD") : ""
      }"`,
      `"${employee.memberFirstName || ""}"`,
      `"${employee.memberLastName || ""}"`,
      `"${employee.memberGender || ""}"`,
      `"${employee.memberAddress || ""}"`,
      `"${employee.memberPhoneNumber || ""}"`,
      `"${employee.educationalAttainment || ""}"`,
      `"${employee.institutionName || ""}"`,
      `"${
        employee.yearGraduated
          ? moment(employee.yearGraduated).format("YYYY")
          : ""
      }"`,
      `"${employee.courseName || ""}"`,
    ].join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}${category ? `_${category}` : ""}_${moment().format(
      "YYYY-MM-DD"
    )}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const FacultyPage: React.FC = () => {
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [facultyData, setFacultyData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [userForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] =
    useState<Employee | null>(null);
  const screens = useBreakpoint();
  const [departments, setDepartments] = useState<DepartmentTypes[]>([]);
  const [positions, setPositions] = useState<PositionTypes[]>([]);
  const { user } = useAuth();
  const isAdmin = user?.roleId === ROLES.Admin;
  const tableRef = useRef<HTMLDivElement>(null);

const formatEmployeeId = (
  employeeId: number | string | undefined,
  hireDate?: string | Date
): string => {
  if (!employeeId) return "N/A";

  if (typeof employeeId === "string" && employeeId.includes("-")) {
    return employeeId;
  }

  const idNumber =
    typeof employeeId === "string" ? parseInt(employeeId) : employeeId;

  if (!hireDate) {
    console.warn(`⚠️ Missing hireDate for employee ID ${idNumber}`);
  }

  const year = hireDate ? moment(hireDate).year() : new Date().getFullYear();
  const formattedId = idNumber.toString().padStart(3, "0");
  return `${year}-${formattedId}`;
};


const getEnhancedFacultyData = () => {
  return facultyData.map((employee) => {
    const isValidHireDate = employee.hireDate && moment(employee.hireDate).isValid();

    // Optional: Log bad data during development
    if (!isValidHireDate) {
      console.warn(`⚠️ Invalid or missing hireDate for employeeID ${employee.employeeID}`);
    }

    return {
      ...employee,
      formattedId: isValidHireDate
        ? formatEmployeeId(employee.employeeID, employee.hireDate)
        : "Invalid-Date", // Or "N/A", or skip this field entirely
      departmentName:
        departments.find((d) => d.departmentID === employee.departmentID)
          ?.departmentName || "N/A",
      positionName:
        positions.find((p) => p.positionID === employee.positionID)
          ?.positionName || "N/A",
      gender: employee.gender || "N/A",
    };
  });
};


  const handlePrint = (category?: string, categoryValue?: string) => {
    const enhancedData = getEnhancedFacultyData();
    let dataToPrint = enhancedData;
    let title = "Faculty Members";

    if (category && categoryValue) {
      dataToPrint = enhancedData.filter(
        (employee) =>
          employee[category as keyof typeof employee]?.toString() ===
          categoryValue
      );
      title = `Faculty Members - ${categoryValue}`;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      message.error("Popup blocked! Please allow popups for printing.");
      return;
    }

    const tableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .print-header { text-align: center; margin-bottom: 20px; }
          .print-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .print-date { font-size: 14px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">${title}</div>
          <div class="print-date">Generated on: ${moment().format(
            "MMMM D, YYYY h:mm A"
          )}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Gender</th>
              <th>Email</th>
              <th>Department</th>
              <th>Position</th>
              <th>Status</th>
              <th>Hire Date</th>
              <th>Family Member</th>
              <th>Gender</th>
            </tr>
          </thead>
          <tbody>
            ${dataToPrint
              .map(
                (employee) => `
              <tr>
                <td>${employee.formattedId}</td>
                <td>${employee.firstName || ""}</td>
                <td>${employee.lastName || ""}</td>
                <td>${employee.gender || ""}</td>
                <td>${employee.email || ""}</td>
                <td>${employee.departmentName}</td>
                <td>${employee.positionName}</td>
                <td>${employee.employmentStatus || ""}</td>
                <td>${
                  employee.hireDate
                    ? moment(employee.hireDate).format("YYYY-MM-DD")
                    : ""
                }</td>
                <td>${
                  employee.memberFirstName
                    ? `${employee.memberFirstName} ${employee.memberLastName}`
                    : "N/A"
                }</td>
                <td>${employee.memberGender || "N/A"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
  };

  const handleExportToExcel = (category?: string, categoryValue?: string) => {
    const enhancedData = getEnhancedFacultyData();
    let dataToExport = enhancedData;
    let filename = "Faculty_Members";

    if (category && categoryValue) {
      dataToExport = enhancedData.filter(
        (employee) =>
          employee[category as keyof typeof employee]?.toString() ===
          categoryValue
      );
      filename = `Faculty_Members_${categoryValue.replace(/\s+/g, "_")}`;
    }

    exportToExcel(dataToExport, filename, categoryValue);
    message.success(`Data exported successfully!`);
  };

  const getUniqueCategories = () => {
    const enhancedData = getEnhancedFacultyData();

    const positions = [
      ...new Set(enhancedData.map((e) => e.positionName)),
    ].filter(Boolean);
    const departments = [
      ...new Set(enhancedData.map((e) => e.departmentName)),
    ].filter(Boolean);
    const employmentStatuses = [
      ...new Set(enhancedData.map((e) => e.employmentStatus)),
    ].filter(Boolean);
    const genders = [...new Set(enhancedData.map((e) => e.gender))].filter(
      Boolean
    );

    return { positions, departments, employmentStatuses, genders };
  };

  const {
    positions: uniquePositions,
    departments: uniqueDepartments,
    employmentStatuses: uniqueStatuses,
    genders: uniqueGenders,
  } = getUniqueCategories();

  const exportMenu = (
    <Menu>
      <Menu.SubMenu key="position" title="Export by Position">
        {uniquePositions.map((position) => (
          <Menu.Item
            key={`pos-${position}`}
            onClick={() => handleExportToExcel("positionName", position)}
          >
            {position}
          </Menu.Item>
        ))}
      </Menu.SubMenu>

      <Menu.SubMenu key="department" title="Export by Department">
        {uniqueDepartments.map((department) => (
          <Menu.Item
            key={`dept-${department}`}
            onClick={() => handleExportToExcel("departmentName", department)}
          >
            {department}
          </Menu.Item>
        ))}
      </Menu.SubMenu>

      <Menu.SubMenu key="status" title="Export by Employment Status">
        {uniqueStatuses.map((status) => (
          <Menu.Item
            key={`status-${status}`}
            onClick={() => handleExportToExcel("employmentStatus", status)}
          >
            {status}
          </Menu.Item>
        ))}
      </Menu.SubMenu>

      <Menu.SubMenu key="gender" title="Export by Gender">
        {uniqueGenders.map((gender) => (
          <Menu.Item
            key={`gender-${gender}`}
            onClick={() => handleExportToExcel("gender", gender)}
          >
            {gender}
          </Menu.Item>
        ))}
      </Menu.SubMenu>

      <Menu.Divider />

      <Menu.Item key="all" onClick={() => handleExportToExcel()}>
        Export All Data
      </Menu.Item>
    </Menu>
  );

  const printMenu = (
    <Menu>
      <Menu.SubMenu key="position" title="Print by Position">
        {uniquePositions.map((position) => (
          <Menu.Item
            key={`print-pos-${position}`}
            onClick={() => handlePrint("positionName", position)}
          >
            {position}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
      <Menu.SubMenu key="department" title="Print by Department">
        {uniqueDepartments.map((department) => (
          <Menu.Item
            key={`print-dept-${department}`}
            onClick={() => handlePrint("departmentName", department)}
          >
            {department}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
      <Menu.SubMenu key="status" title="Print by Employment Status">
        {uniqueStatuses.map((status) => (
          <Menu.Item
            key={`print-status-${status}`}
            onClick={() => handlePrint("employmentStatus", status)}
          >
            {status}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
      <Menu.SubMenu key="gender" title="Print by Gender">
        {uniqueGenders.map((gender) => (
          <Menu.Item
            key={`print-gender-${gender}`}
            onClick={() => handlePrint("gender", gender)}
          >
            {gender}
          </Menu.Item>
        ))}
      </Menu.SubMenu>
      <Menu.Divider />
      <Menu.Item key="all" onClick={() => handlePrint()}>
        Print All Data
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [allEmployees, depts, pos] = await Promise.all([
          EmployeeService.getAll(),
          DepartmentService.getAll(),
          PositionService.getAll(),
        ]);

        const employees = isAdmin
          ? allEmployees
          : allEmployees.filter(
              (emp) => emp.employeeID === (user?.employeeId || 0)
            );

        setFacultyData(employees);
        setDepartments(depts);
        setPositions(pos);
      } catch (error) {
        setError("Failed to fetch data");
        message.error("Failed to fetch data");
        console.error("Error fetching faculty data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, user?.employeeId]);

  const handleCreate = () => {
    if (!isAdmin) {
      message.warning("You don't have permission to add new faculty members");
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      employmentStatus: "Hired",
      hireDate: moment(),
      gender: "Male",
      memberGender: "Male",
    });
    setEditingId(null);
    setSelectedEmployee(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: Employee) => {
    if (!isAdmin && record.employeeID !== user?.employeeId) {
      message.warning("You can only edit your own profile");
      return;
    }

    form.setFieldsValue({
      employeeID: record.employeeID,
      firstName: record.firstName,
      lastName: record.lastName,
      gender: record.gender || "Male",
      dateOfBirth: record.dateOfBirth ? moment(record.dateOfBirth) : null,
      email: record.email,
      phoneNumber: record.phoneNumber,
      address: record.address,
      departmentID: record.departmentID ? Number(record.departmentID) : null,
      positionID: record.positionID ? Number(record.positionID) : null,
      employmentStatus: record.employmentStatus || "Hired",
      hireDate: record.hireDate ? moment(record.hireDate) : null,

      // Family member fields
      memberFirstName: record.memberFirstName,
      memberLastName: record.memberLastName,
      memberGender: record.memberGender || "Male",
      memberAddress: record.memberAddress,
      memberPhoneNumber: record.memberPhoneNumber,
      // Educational Attainment
      educationalAttainment: record.educationalAttainment,
      institutionName: record.institutionName,
      yearGraduated: record.yearGraduated ? moment(record.yearGraduated) : null,
      courseName: record.courseName,
      // Work Experience
      previousPosition: record.previousPosition,
      officeName: record.officeName,
      durationStart: record.durationStart ? moment(record.durationStart) : null,
      durationEnd: record.durationEnd ? moment(record.durationEnd) : null,
      agencyName: record.agencyName,
      supervisor: record.supervisor,
      accomplishment: record.accomplishment,
      summary: record.summary,
    });
    setEditingId(record.employeeID || null);
    setSelectedEmployee(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) {
      message.warning("You don't have permission to delete faculty members");
      return;
    }

    try {
      setLoading(true);
      await EmployeeService.delete(id);
      setFacultyData(facultyData.filter((item) => item.employeeID !== id));
      message.success("Faculty member deleted successfully");
    } catch (err) {
      message.error("Failed to delete faculty member");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formattedValues = {
        ...values,
  dateOfBirth: values.dateOfBirth
    ? moment(values.dateOfBirth).format("YYYY-MM-DD")
    : undefined,
  hireDate: values.hireDate
    ? moment(values.hireDate).format("YYYY-MM-DD")
    : undefined,
            

          // : moment().format("YYYY-MM-DD"),
        departmentID: Number(values.departmentID),
        positionID: Number(values.positionID),
        yearGraduated: values.yearGraduated
          ? moment(values.yearGraduated).format("YYYY-MM-DD")
          : null,
        durationStart: values.durationStart
          ? moment(values.durationStart).format("YYYY-MM-DD")
          : null,
        durationEnd: values.durationEnd
          ? moment(values.durationEnd).format("YYYY-MM-DD")
          : null,
      };

      if (editingId) {
        const updatedEmployee = await EmployeeService.update(
          editingId,
          formattedValues
        );
        setFacultyData(
          facultyData.map((item) =>
            item.employeeID === editingId ? updatedEmployee : item
          )
        );
        message.success("Faculty updated successfully");
      } else {
        const { employeeID, ...employeeDataWithoutId } = formattedValues;
        const newEmployee = await EmployeeService.create(employeeDataWithoutId);
        setFacultyData([...facultyData, newEmployee]);
        message.success("Faculty added successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedEmployee(null);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      message.error("Operation failed. Please check the form and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserAccount = (record: Employee, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!isAdmin) {
      message.warning("You don't have permission to create user accounts");
      return;
    }

    userForm.resetFields();
    setSelectedEmployee(record);

    userForm.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      employeeId: record.employeeID,
      username: `${record.firstName?.toLowerCase() || ""}${
        record.lastName?.toLowerCase() || ""
      }`,
      positions:
        positions.find((p) => p.positionID === record.positionID)
          ?.positionName || 3,
    });

    setIsUserModalVisible(true);
  };

  const handleSubmitUserAccount = async () => {
    try {
      const values = await userForm.validateFields();
      setLoading(true);

      await UserService.createUserForEmployee(values);
      message.success("User account created successfully");
      setIsUserModalVisible(false);
      userForm.resetFields();
      setSelectedEmployee(null);
    } catch (err: any) {
      message.error(err.message || "Failed to create user account");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record: Employee) => {
    setSelectedEmployeeDetails(record);
    setDetailModalVisible(true);
  };

  const filteredData = facultyData.filter((record) =>
    Object.values(record).some((value) =>
      value?.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const columns: ColumnsType<Employee> = [
    {
      title: "Employee ID",
      dataIndex: "employeeID",
      key: "employeeID",
      responsive: ["sm"],
      render: (id: number, record: Employee) => (
        <span className="employee-id">
          {formatEmployeeId(id, record.hireDate)}
        </span>
      ),
    },
    {
      title: "Name",
      key: "name",
      responsive: ["xs", "sm"],
      render: (_, record) => (
        <div className="name-cell">
          <div className="name-line">{record.firstName}</div>
          <div className="name-line">{record.lastName}</div>
        </div>
      ),
    },
    {
      title: "First Name",
      dataIndex: ["firstName"],
      key: "firstName",
      responsive: ["md"],
    },
    {
      title: "Last Name",
      dataIndex: ["lastName"],
      key: "lastName",
      responsive: ["md"],
    },
    {
      title: "Gender",
      dataIndex: ["gender"],
      key: "gender",
      responsive: ["sm"],
    },
    {
      title: "Department",
      dataIndex: "departmentID",
      key: "departmentID",
      responsive: ["sm"],
      render: (deptId) => {
        return (
          departments.find((d) => d.departmentID === deptId)?.departmentName ||
          deptId
        );
      },
    },
    {
      title: "Position",
      dataIndex: ["positionID"],
      key: "positionID",
      responsive: ["sm"],
      render: (positionId) => {
        return (
          positions.find((p) => p.positionID === positionId)?.positionName ||
          positionId
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      responsive: ["md"],
      render: (email) => (
        <span className="email-cell">
          {screens.md ? email : `${email.substring(0, 10)}...`}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "employmentStatus",
      key: "employmentStatus",
      responsive: ["sm"],
    },
    {
      title: "Hire Date",
      dataIndex: "hireDate",
      key: "hireDate",
      responsive: ["md"],
      render: (date) =>
        moment(date).format(screens.md ? "YYYY-MM-DD" : "YY-MM-DD"),
    },
    {
      title: "Family Member",
      key: "familyMember",
      responsive: ["lg"],
      render: (_, record) => (
        <span>
          {record.memberFirstName
            ? `${record.memberFirstName} ${record.memberLastName}`
            : "N/A"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      className: "actions-column",
      render: (_, record) => (
        <Space size="middle" className="actions-space">
          {(isAdmin || record.employeeID === user?.employeeId) && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(record);
              }}
              className="action-button"
              aria-label="Edit"
            />
          )}
          {isAdmin && (
            <>
              <Button
                type="link"
                icon={<UserOutlined />}
                onClick={(e) => handleAddUserAccount(record, e)}
                className="action-button"
                aria-label="Add User Account"
                title="Add User Account"
              />
              <Popconfirm
                title="Are you sure to delete this faculty member?"
                onConfirm={(e) => {
                  if (e) e.stopPropagation();
                  handleDelete(record.employeeID!);
                }}
                onCancel={(e) => e?.stopPropagation()}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  className="action-button"
                  aria-label="Delete"
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  if (loading && facultyData.length === 0) {
    return (
      <Card title="Faculty Members" className="faculty-card">
        <Spin size="large" />
      </Card>
    );
  }

  const cardExtra = (
    <div className="search-add-container">
      <Input.Search
        placeholder="Search faculty"
        allowClear
        onChange={(e) => setSearchText(e.target.value)}
        className="search-input"
        enterButton
        size={screens.xs ? "small" : "middle"}
      />
      <Space>
        <Dropdown
          overlay={printMenu}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Button
            icon={<PrinterOutlined />}
            className="export-button"
            size={screens.xs ? "small" : "middle"}
          >
            {screens.sm ? "Print" : ""}
          </Button>
        </Dropdown>

        <Dropdown
          overlay={exportMenu}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Button
            icon={<FileExcelOutlined />}
            type="primary"
            className="export-button"
            size={screens.xs ? "small" : "middle"}
          >
            {screens.sm ? "Export" : ""}
          </Button>
        </Dropdown>

        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="add-button"
            size={screens.xs ? "small" : "middle"}
          >
            {screens.sm ? "Add Faculty" : "Add"}
          </Button>
        )}
      </Space>
    </div>
  );

  return (
    <div className="faculty-page-container" ref={tableRef}>
      <Card title="Faculty Members" className="faculty-card" extra={cardExtra}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="employeeID"
          pagination={{
            pageSize: 10,
            showSizeChanger: !screens.xs,
            size: screens.xs ? "small" : "default",
          }}
          loading={loading}
          scroll={{ x: true }}
          className="faculty-table"
          size={screens.xs ? "small" : "middle"}
          onRow={(record) => {
            return {
              onClick: () => handleViewDetails(record),
            };
          }}
          rowClassName="clickable-row"
        />
      </Card>

      {/* Edit/Create Faculty Modal */}
      <Modal
        title={
          editingId
            ? `Edit Info: ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`
            : "Add New Faculty Member"
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedEmployee(null);
          form.resetFields();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setSelectedEmployee(null);
              form.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {editingId ? "Update" : "Submit"}
          </Button>,
        ]}
        width={screens.xs ? "90%" : "800px"}
        className="faculty-modal"
        destroyOnClose
      >
        <div className="modal-form-container">
          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item name="employeeID" hidden>
              <Input />
            </Form.Item>

            <Divider orientation="left">Personal Information</Divider>

            <div className="form-row">
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: "Please enter first name" }]}
                className="form-item"
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: "Please enter last name" }]}
                className="form-item"
              >
                <Input />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: "Please select gender" }]}
                className="form-item"
              >
                <Select>
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[
                  { required: true, message: "Please select date of birth" },
                ]}
                className="form-item"
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
                className="form-item"
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[
                  { required: true, message: "Please enter phone number" },
                ]}
                className="form-item"
              >
                <Input />
              </Form.Item>
            </div>

            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter address" }]}
            >
              <Input.TextArea rows={2} />
            </Form.Item>

            <Divider orientation="left">Employment Information</Divider>

            <div className="form-row">
              <Form.Item
                name="departmentID"
                label="Department"
                rules={[
                  { required: isAdmin, message: "Please select department" },
                ]}
                className="form-item"
              >
                <Select disabled={!isAdmin}>
                  {departments.map((dept) => (
                    <Option key={dept.departmentID} value={dept.departmentID}>
                      {dept.departmentName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="positionID"
                label="Position"
                rules={[
                  { required: isAdmin, message: "Please select position" },
                ]}
                className="form-item"
              >
                <Select disabled={!isAdmin}>
                  {positions.map((position) => (
                    <Option
                      key={position.positionID}
                      value={position.positionID}
                    >
                      {position.positionName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                name="employmentStatus"
                label="Employment Status"
                initialValue="Hired"
                className="form-item"
              >
                <Select disabled={!isAdmin}>
                  <Option value="Hired">Hired</Option>
                  <Option value="Probation">Probation</Option>
                  {editingId && (
                    <>
                      <Option value="Terminated">Terminated</Option>
                      <Option value="Resigned">Resigned</Option>
                    </>
                  )}
                </Select>
              </Form.Item>

              <Form.Item
                name="hireDate"
                label="Hire Date"
                // initialValue={moment()}
                className="form-item"
                rules={[
                  { required: isAdmin, message: "Please select hire date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} disabled={!isAdmin} />
              </Form.Item>
            </div>

            <Divider orientation="left">Educational Attainment</Divider>

            <div className="form-row">
              <Form.Item
                name="educationalAttainment"
                label="Educational Attainment"
                className="form-item"
              >
                <Select placeholder="Select Educational Attainment">
                  {EDUCATIONAL_ATTAINMENT_OPTIONS.map((level) => (
                    <Option key={level} value={level}>
                      {level}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="yearGraduated"
                label="Year Graduated"
                className="form-item"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  picker="year"
                  placeholder="Select Year"
                />
              </Form.Item>
            </div>

            <Form.Item name="courseName" label="Course Name">
              <Input placeholder="Course Name" />
            </Form.Item>

            <Form.Item name="institutionName" label="Institution Name">
              <Input placeholder="Name of school or institution" />
            </Form.Item>

            <Divider orientation="left">Work Experience</Divider>
            <div className="form-row">
              <Form.Item
                name="previousPosition"
                label="Previous Position"
                className="form-item"
              >
                <Input placeholder="Previous Position" />
              </Form.Item>

              <Form.Item
                name="officeName"
                label="Office Name"
                className="form-item"
              >
                <Input placeholder="Office Name" />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                name="durationStart"
                label="Duration Start"
                className="form-item"
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Start Date"
                />
              </Form.Item>
              <Form.Item
                name="durationEnd"
                label="Duration End"
                className="form-item"
              >
                <DatePicker style={{ width: "100%" }} placeholder="End Date" />
              </Form.Item>
            </div>
            <Form.Item
              name="agencyName"
              label="Agency Name"
              className="form-item"
            >
              <Input placeholder="Agency Name" />
            </Form.Item>

            <Form.Item
              name="supervisor"
              label="Supervisor"
              className="form-item"
            >
              <Input placeholder="Supervisor" />
            </Form.Item>
            <Form.Item
              name="accomplishment"
              label="List Of Accomplishment"
              className="form-item"
            >
              <Input.TextArea rows={3} placeholder="Accomplishment" />
            </Form.Item>

            <Form.Item
              name="summary"
              label="Summary Of Actual Duties and Responsibilities"
            >
              <Input.TextArea
                rows={3}
                placeholder="Brief Summary of Work Experience"
              />
            </Form.Item>

            <Divider orientation="left">Family Member Information</Divider>

            <div className="form-row">
              <Form.Item
                name="memberFirstName"
                label="Family Member First Name"
                className="form-item"
              >
                <Input placeholder="First Name" />
              </Form.Item>

              <Form.Item
                name="memberLastName"
                label="Family Member Last Name"
                className="form-item"
              >
                <Input placeholder="Last Name" />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                name="memberGender"
                label="Family Member Gender"
                className="form-item"
              >
                <Select placeholder="Select Gender">
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="memberPhoneNumber"
                label="Family Member Phone"
                className="form-item"
              >
                <Input placeholder="Phone Number" />
              </Form.Item>
            </div>

            <Form.Item name="memberAddress" label="Family Member Address">
              <Input.TextArea rows={2} placeholder="Address" />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* Create User Account Modal */}
      <Modal
        title="Create User Account"
        open={isUserModalVisible}
        onOk={handleSubmitUserAccount}
        onCancel={() => {
          setIsUserModalVisible(false);
          setSelectedEmployee(null);
          userForm.resetFields();
        }}
        confirmLoading={loading}
        width={screens.xs ? "90%" : "520px"}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="firstName" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="lastName" hidden>
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
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="newPassword"
            rules={[{ required: true, message: "Please input password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Role"
            name="roleId"
            rules={[{ required: true, message: "Please select role!" }]}
          >
            <Select>
              <Option value={1}>Admin</Option>
              <Option value={2}>Teacher</Option>
              <Option value={3}>Non-Teacher</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Employee Details Modal */}
      <Modal
        title={`${selectedEmployeeDetails?.firstName} ${selectedEmployeeDetails?.lastName} - Profile`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setDetailModalVisible(false)}
            style={{ background: "#00883e", borderColor: "#00883e" }}
          >
            Close
          </Button>,
        ]}
        width={800}
        className="employee-details-modal"
      >
        {selectedEmployeeDetails && (
          <>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Basic Information" key="1">
                <div className="horizontal-details-container">
                  <div className="employee-avatar horizontal-avatar">
                    {selectedEmployeeDetails.firstName?.charAt(0)}
                    {selectedEmployeeDetails.lastName?.charAt(0)}
                  </div>

                  <div className="horizontal-details-grid">
                    <div className="detail-row">
                      <span className="detail-label">Employee ID:</span>
                      <span className="detail-value employee-id">
                        {formatEmployeeId(
                          selectedEmployeeDetails.employeeID,
                          selectedEmployeeDetails.hireDate
                        )}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.firstName}{" "}
                        {selectedEmployeeDetails.lastName}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Gender:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.gender}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Date of Birth:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.dateOfBirth
                          ? moment(selectedEmployeeDetails.dateOfBirth).format(
                              "MMMM D, YYYY"
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">
                        <a href={`mailto:${selectedEmployeeDetails.email}`}>
                          {selectedEmployeeDetails.email}
                        </a>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">
                        <a href={`tel:${selectedEmployeeDetails.phoneNumber}`}>
                          {selectedEmployeeDetails.phoneNumber}
                        </a>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Department:</span>
                      <span className="detail-value">
                        {departments.find(
                          (d) =>
                            d.departmentID ===
                            selectedEmployeeDetails.departmentID
                        )?.departmentName ||
                          selectedEmployeeDetails.departmentID}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Position:</span>
                      <span className="detail-value">
                        {positions.find(
                          (p) =>
                            p.positionID === selectedEmployeeDetails.positionID
                        )?.positionName || selectedEmployeeDetails.positionID}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.employmentStatus}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Hire Date:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.hireDate
                          ? moment(selectedEmployeeDetails.hireDate).format(
                              "MMMM D, YYYY"
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.address}
                      </span>
                    </div>
                  </div>
                </div>
              </TabPane>
              <TabPane tab="Educational Attainment" key="2">
                <div className="horizontal-details-container">
                  <div className="horizontal-details-grid">
                    <div className="detail-row">
                      <span className="detail-label">
                        Educational Attainment:
                      </span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.educationalAttainment || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Year Graduated:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.yearGraduated
                          ? moment(
                              selectedEmployeeDetails.yearGraduated
                            ).format("YYYY")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Institution Name:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.institutionName || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Course:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.courseName || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {!selectedEmployeeDetails.educationalAttainment && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "20px",
                      color: "#999",
                    }}
                  >
                    <p>No educational information available.</p>
                  </div>
                )}
              </TabPane>
              <TabPane tab="Work Experience" key="3">
                <div className="horizontal-details-container">
                  <div className="horizontal-details-grid">
                    <div className="detail-row">
                      <span className="detail-label">Previous Position:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.previousPosition || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Office Name:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.officeName || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.durationStart
                          ? moment(
                              selectedEmployeeDetails.durationStart
                            ).format("YYYY-MM-DD")
                          : "N/A -"}{" "}
                        ||{" "}
                        {selectedEmployeeDetails.durationEnd
                          ? moment(selectedEmployeeDetails.durationEnd).format(
                              "YYYY-MM-DD"
                            )
                          : " N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Agency Name:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.agencyName || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Supervisor:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.supervisor || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">
                        List of Accomplishments:
                      </span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.accomplishment || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">
                        Summary of Actual Duties:
                      </span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.summary || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {!selectedEmployeeDetails.educationalAttainment && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "20px",
                      color: "#999",
                    }}
                  >
                    <p>No educational information available.</p>
                  </div>
                )}
              </TabPane>
              {/* <Requirements/> */}
              <TabPane tab="Requirements | Records" key="4">
<Requirements employeeId={selectedEmployeeDetails?.employeeID ?? null} />

              </TabPane>
              <TabPane tab="Family Data" key="5">
                <div className="horizontal-details-container">
                  <div className="horizontal-details-grid">
                    <div className="detail-row">
                      <span className="detail-label">Family Member Name:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.memberFirstName &&
                        selectedEmployeeDetails.memberLastName
                          ? `${selectedEmployeeDetails.memberFirstName} ${selectedEmployeeDetails.memberLastName}`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Gender:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.memberGender || "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone Number:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.memberPhoneNumber ? (
                          <a
                            href={`tel:${selectedEmployeeDetails.memberPhoneNumber}`}
                          >
                            {selectedEmployeeDetails.memberPhoneNumber}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">
                        {selectedEmployeeDetails.memberAddress || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {!selectedEmployeeDetails.memberFirstName && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "20px",
                      color: "#999",
                    }}
                  >
                    <p>No family member information available.</p>
                  </div>
                )}
              </TabPane>
              <TabPane tab="Salary Adjustment" key="6">
                <div className="salary-adjustment-container">
                  <div className="salary-section">
                    <div className="salary-header">
                      <h3 className="salary-title">SALARY ADJUSTMENT</h3>
                      <div className="current-salary">
                        <Form.Item
                          label="Current Salary"
                          name="currentSalary"
                          className="form-item"
                          rules={[
                            { required: true, message: "Please enter amount" },
                          ]}
                        >
                          <Input prefix="₱" type="number" placeholder="0.00" />
                        </Form.Item>
                      </div>
                    </div>

                    <div className="adjustment-form">
                      <div className="form-row">
                        <Form.Item
                          label="Adjustment Type"
                          name="adjustmentType"
                          className="form-item-full"
                        >
                          <Select placeholder="Select adjustment type">
                            <Option value="regular">Regular Adjustment</Option>
                            <Option value="promotion">Promotion</Option>
                            <Option value="bonus">Bonus</Option>
                            <Option value="evaluation">Evaluation Bonus</Option>
                            <Option value="allowance">Allowance</Option>
                            <Option value="deduction">Deduction</Option>
                          </Select>
                        </Form.Item>
                      </div>

                      <div className="form-row">
                        <Form.Item
                          label="Amount"
                          name="adjustmentAmount"
                          className="form-item"
                          rules={[
                            { required: true, message: "Please enter amount" },
                          ]}
                        >
                          <Input prefix="₱" type="number" placeholder="0.00" />
                        </Form.Item>

                        <Form.Item
                          label="Effective Date"
                          name="effectiveDate"
                          className="form-item"
                          rules={[
                            {
                              required: true,
                              message: "Please select effective date",
                            },
                          ]}
                        >
                          <DatePicker style={{ width: "100%" }} />
                        </Form.Item>
                      </div>

                      <Form.Item
                        label="Reason/Description"
                        name="adjustmentReason"
                        className="form-item-full"
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Enter reason for salary adjustment..."
                        />
                      </Form.Item>
                    </div>

                    <div className="salary-actions">
                      <Button
                        type="primary"
                        className="submit-salary-adjustment"
                      >
                        Submit Salary Adjustment
                      </Button>
                    </div>
                  </div>

                  <Divider />

                  <div className="salary-history">
                    <h4 className="history-title">Salary Adjustment History</h4>
                    <div className="history-placeholder">
                      <p>No salary adjustments recorded yet.</p>
                    </div>
                    {/* You can add a table here later to display salary history */}
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </>
        )}
      </Modal>
    </div>
  );
};

export default FacultyPage;
