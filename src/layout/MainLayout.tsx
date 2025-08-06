import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import './MainLayout.css';

const { Header, Content, Sider } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth <= 992);
      if (window.innerWidth > 992) {
        setMobileMenuOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getActiveKey = () => {
    const path = location.pathname.split("/")[1] || "dashboard";
    return path;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      localStorage.removeItem("authToken");
      navigate("/");
    } else {
      navigate(`/${key}`);
    }
    if (mobileView) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <Layout style={{ minHeight: "100vh", width: "100vw" }}>
      {mobileView && (
        <Button 
          className="mobile-menu-toggle"
          icon={mobileMenuOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={toggleMobileMenu}
        />
      )}
      
      <Sider
        collapsible
        collapsed={!mobileView && collapsed}
        onCollapse={(value) => setCollapsed(value)}
        className={mobileMenuOpen ? "mobile-open" : ""}
        breakpoint="lg"
        collapsedWidth={mobileView ? 0 : 80}
        trigger={mobileView ? null : undefined}
        width={mobileView ? "80%" : undefined}
      >
        <div className="logo-container">
          <img 
            src="Images/logo.png" 
            style={{
              width: (collapsed && !mobileView) ? '50px' : '160px',
              height: '50px',
              objectFit: 'contain',
              padding: (collapsed && !mobileView) ? '0' : '0 16px',
              transition: 'all 0.2s'
            }}
          />
        </div>
        <Menu
          theme="dark"
          selectedKeys={[getActiveKey()]}
          mode="inline"
          onClick={handleMenuClick}
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: "Dashboard",
            },
            {
              key: "faculty",
              icon: <TeamOutlined />,
              label: "Faculty",
            },
            {
              key: "departments",
              icon: <TeamOutlined />,
              label: "Department",
            },
            {
              key: "positions",
              icon: <TeamOutlined />,
              label: "Positions",
            },
            {
              key: "users",
              icon: <UserOutlined />,
              label: "User Management",
            },
            {
              key: "settings",
              icon: <SettingOutlined />,
              label: "Settings",
            },
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: "Logout",
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: "#fff", textAlign: "center" }}>
          <h3 style={{ margin: 0, padding: 16 }}>Welcome to BCAS HRMS</h3>
        </Header>
        <Content style={{ margin: "16px" }}>
          {/* Outlet will render the child route components */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;