import { Form, Input, Button, Card, Typography, message} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import authenticationService from "../api/authenticationService";
import { LoginTypes } from "../types/auth";
import "./LoginPage.css"; 

const { Title } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();

  const onFinish = async (data: LoginTypes) => {
    try {
      const response = await authenticationService.login(data)

      if (response) {
        message.success('Login successful!')
        navigate('/dashboard')
      } else {
        message.error('Invalid username or password.')
      }
    } catch (error) {
      console.error('Login failed:', error)
      message.error('Something went wrong. Please try again.')
    }
  }
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgb(255 255 255)",
      }}
    >
      <Card style={{ width: 350 }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Login
        </Title>
        <Form
          name="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username"/>
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block className="login-button">
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
