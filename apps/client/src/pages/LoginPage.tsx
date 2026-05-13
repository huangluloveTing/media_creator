import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      message.warning('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 50%, #0a0a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 400,
          background: '#131330',
          borderColor: '#1e1e4a',
          borderRadius: 16,
        }}
      >
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 20px rgba(79, 124, 255, 0.3)',
              }}
            >
              <LoginOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#e2e8f0' }}>
              登录
            </Title>
            <Text type="secondary">Media Creator</Text>
          </div>

          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Input
              prefix={<UserOutlined style={{ color: '#64748b' }} />}
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onPressEnter={handleSubmit}
              size="large"
              style={{ background: '#0a0a1a', borderColor: '#1e1e4a', color: '#e2e8f0' }}
            />
            <Input.Password
              prefix={<LockOutlined style={{ color: '#64748b' }} />}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleSubmit}
              size="large"
              style={{ background: '#0a0a1a', borderColor: '#1e1e4a', color: '#e2e8f0' }}
            />
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={handleSubmit}
              style={{
                height: 44,
                fontWeight: 600,
                borderRadius: 10,
              }}
            >
              登 录
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
