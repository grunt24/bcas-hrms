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
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  ManOutlined,
  WomanOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { EmployeeService } from "../api/EmployeeService"; 
import { Employee } from "../types/tblEmployees";
import { PositionTypes } from "../types/tblPosition";
import moment from "moment"; 
import PositionService from "../api/PositionService";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [employeeData, setEmployeeData] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<PositionTypes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employees, positions] = await Promise.all([
        EmployeeService.getAll(),
        PositionService.getAll()
      ]);
      setEmployeeData(employees);
      setPositions(positions);
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

  const totalTeachers = employeeData.filter(e => 
    getPositionName(e.positionID) === "Teacher"
  ).length;
  
  const totalNonTeaching = employeeData.filter(e => 
    getPositionName(e.positionID) !== "Teacher"
  ).length;
  
  const totalMale = employeeData.filter(e => e.gender === "Male").length;
  const totalFemale = employeeData.filter(e => e.gender === "Female").length;

  const notifications = employeeData
    .filter((employee) => {
      if (!employee.hireDate) return false;
      const hireDate = moment(employee.hireDate);
      const contractEndDate = hireDate.add(1, 'year');
      return contractEndDate.isAfter(moment()) && 
             contractEndDate.diff(moment(), "days") <= 30;
    })
    .map((employee) => ({
      title: `${employee.firstName} ${employee.lastName}'s contract ends soon`,
      description: `Position: ${getPositionName(employee.positionID)}`,
      date: moment(employee.hireDate).add(1, 'year').format("MMMM D, YYYY"),
    }));

  return (
    <div className="dashboard-container">
      <Spin spinning={loading}>
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
                dataSource={notifications}
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
      </Spin>
    </div>
  );
};

export default Dashboard;