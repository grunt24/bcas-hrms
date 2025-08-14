import React, { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  message,
  Spin,
  Calendar,
  List,
  Typography,
  Avatar,
  Tag,
  Button,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  ManOutlined,
  WomanOutlined,
  BellOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { EmployeeService } from "../api/EmployeeService"; 
import { Employee } from "../types/tblEmployees";
import { PositionTypes } from "../types/tblPosition";
import { DepartmentTypes } from "../types/tblDepartment";
import moment from "moment"; 
import PositionService from "../api/PositionService";
import DepartmentService from "../api/DepartmentService";
import { useAuth } from "../types/useAuth";
import { ROLES } from "../types/auth";
import "./Dashboard.css";

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [employeeData, setEmployeeData] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<PositionTypes[]>([]);
  const [departments, setDepartments] = useState<DepartmentTypes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  
  const { user } = useAuth();
  const isAdmin = user?.roleId === ROLES.Admin;

  useEffect(() => {
    fetchData();
  }, [isAdmin, user?.employeeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employees, positionsData, departmentsData] = await Promise.all([
        EmployeeService.getAll(),
        PositionService.getAll(),
        DepartmentService.getAll()
      ]);
      
      setEmployeeData(employees);
      setPositions(positionsData);
      setDepartments(departmentsData);
      
      // Find current employee data for non-admin users
      if (!isAdmin && user?.employeeId) {
        const currentEmp = employees.find(emp => emp.employeeID === user.employeeId);
        setCurrentEmployee(currentEmp || null);
        console.log('Current employee found:', currentEmp); // Debug log
      }
    } catch (error) {
      message.error("Failed to load data");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionName = (positionId?: number) => {
    return positions.find(p => p.positionID === positionId)?.positionName || "Unknown";
  };

  const getDepartmentName = (departmentId?: number) => {
    return departments.find(d => d.departmentID === departmentId)?.departmentName || "Unknown";
  };

  // Admin Dashboard Data
  const totalTeachers = employeeData.filter(e => 
    getPositionName(e.positionID) === "Teacher"
  ).length;
  
  const totalNonTeaching = employeeData.filter(e => 
    getPositionName(e.positionID) !== "Teacher"
  ).length;
  
  const totalMale = employeeData.filter(e => e.gender === "Male").length;
  const totalFemale = employeeData.filter(e => e.gender === "Female").length;

  const adminNotifications = employeeData
    .filter((employee) => {
      if (!employee.hireDate) return false;
      const hireDate = moment(employee.hireDate);
      const contractEndDate = hireDate.clone().add(1, 'year');
      return contractEndDate.isAfter(moment()) && 
             contractEndDate.diff(moment(), "days") <= 30;
    })
    .map((employee) => ({
      title: `${employee.firstName} ${employee.lastName}'s contract ends soon`,
      description: `Position: ${getPositionName(employee.positionID)}`,
      date: moment(employee.hireDate).clone().add(1, 'year').format("MMMM D, YYYY"),
    }));

  // Employee Dashboard Data
  const getEmployeeStats = () => {
    if (!currentEmployee) {
      return {
        contractStatus: 'Unknown',
        daysUntilContractEnd: 0,
        department: 'Unknown',
        position: 'Unknown',
        hireDate: 'Unknown',
        employeeName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Employee',
      };
    }

    const hireDate = moment(currentEmployee.hireDate);
    const contractEndDate = hireDate.clone().add(1, 'year');
    const daysUntilContractEnd = contractEndDate.diff(moment(), 'days');

    return {
      contractStatus: daysUntilContractEnd > 0 ? 'Active' : 'Expired',
      daysUntilContractEnd: Math.max(0, daysUntilContractEnd),
      department: getDepartmentName(currentEmployee.departmentID),
      position: getPositionName(currentEmployee.positionID),
      hireDate: hireDate.format('MMMM D, YYYY'),
      employeeName: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
    };
  };

  const employeeStats = getEmployeeStats();

  const employeeNotifications = [
    {
      title: "Welcome to BCAS HRMS",
      description: "Access your personal information and contracts here",
      type: "info",
    },
    ...(employeeStats.daysUntilContractEnd <= 30 && employeeStats.daysUntilContractEnd > 0 ? [{
      title: "Contract Renewal Reminder",
      description: `Your contract expires in ${employeeStats.daysUntilContractEnd} days`,
      type: "warning",
    }] : []),
    ...(employeeStats.contractStatus === 'Expired' ? [{
      title: "Contract Expired",
      description: "Please contact HR regarding contract renewal",
      type: "error",
    }] : []),
  ];

  const renderAdminDashboard = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="Total Teachers"
              value={totalTeachers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="Non-Teaching Staff"
              value={totalNonTeaching}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-stat-card">
            <Statistic 
              title="Male" 
              value={totalMale} 
              prefix={<ManOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="Female"
              value={totalFemale}
              prefix={<WomanOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Calendar" className="dashboard-calendar-card">
            <Calendar fullscreen={false} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card 
            title={<span><BellOutlined /> Contract End Alerts</span>}
            className="dashboard-notifications-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={adminNotifications}
              locale={{ emptyText: "No upcoming contract endings." }}
              renderItem={(item) => (
                <List.Item className="dashboard-notification-item">
                  <List.Item.Meta
                    title={<div className="dashboard-notification-title">{item.title}</div>}
                    description={
                      <>
                        <div className="dashboard-notification-description">{item.description}</div>
                        <div className="dashboard-notification-date">End Date: {item.date}</div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderEmployeeDashboard = () => (
    <>
      {/* Welcome Section */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className="welcome-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Welcome, {employeeStats.employeeName}!
                </Title>
                <Text type="secondary">
                  {employeeStats.position} • {employeeStats.department}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Personal Stats */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="Contract Status"
              value=""
              prefix={<SafetyCertificateOutlined />}
            />
            <Tag 
              color={employeeStats.contractStatus === 'Active' ? 'green' : 'red'}
              style={{ marginTop: 8 }}
            >
              {employeeStats.contractStatus}
            </Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="dashboard-stat-card">
            <Statistic
              title="Days Until Contract End"
              value={employeeStats.daysUntilContractEnd}
              prefix={<CalendarOutlined />}
              valueStyle={{ 
                color: employeeStats.daysUntilContractEnd <= 30 ? '#ff4d4f' : '#3f8600'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="dashboard-stat-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#8c8c8c', fontSize: '14px', marginBottom: '8px' }}>
                Hire Date
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CalendarOutlined />
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                  {employeeStats.hireDate}
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Calendar and Notifications */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Calendar" className="dashboard-calendar-card">
            <Calendar fullscreen={false} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card 
            title={<span><BellOutlined /> Notifications</span>}
            className="dashboard-notifications-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={employeeNotifications}
              renderItem={(item) => (
                <List.Item className="dashboard-notification-item">
                  <List.Item.Meta
                    avatar={<InfoCircleOutlined style={{ 
                      color: item.type === 'warning' ? '#faad14' : 
                             item.type === 'error' ? '#ff4d4f' : '#1890ff'
                    }} />}
                    title={<div className="dashboard-notification-title">{item.title}</div>}
                    description={
                      <div className="dashboard-notification-description">{item.description}</div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Quick Actions" className="quick-actions-card">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Button 
                  type="default"
                  size="large"
                  block
                  icon={<UserOutlined />}
                  onClick={() => window.location.href = '/faculty'}
                  style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div>View My Profile</div>
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button 
                  type="default"
                  size="large"
                  block
                  icon={<FileTextOutlined />}
                  onClick={() => window.location.href = '/contracts'}
                  style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div>View My Contract</div>
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button 
                  type="default"
                  size="large"
                  block
                  icon={<BellOutlined />}
                  disabled
                  style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}
                >
                  <div>Leave Requests</div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Coming Soon</Text>
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );

  return (
    <div className="dashboard-container">
      <Spin spinning={loading}>
        {isAdmin ? renderAdminDashboard() : renderEmployeeDashboard()}
      </Spin>
    </div>
  );
};

export default Dashboard;