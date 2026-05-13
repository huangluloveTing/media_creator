import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, message, Space } from 'antd';
import { LockOutlined, ArrowLeftOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword) {
      message.warning('请填写所有字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.warning('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      message.warning('新密码至少 6 位');
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      message.success('密码修改成功');
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
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Space align="center" style={{ marginBottom: 32 }}>
          <Link to="/">
            <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#94a3b8' }} />
          </Link>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4f7cff, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(79, 124, 255, 0.3)',
            }}
          >
            <KeyOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: '#e2e8f0' }}>
              修改密码
            </Title>
            <Text type="secondary">更改您的登录密码</Text>
          </div>
        </Space>

        <Card
          style={{
            background: '#131330',
            borderColor: '#1e1e4a',
            borderRadius: 12,
          }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                当前密码
              </Text>
              <Input.Password
                placeholder="输入当前密码"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                style={{ background: '#0a0a1a', borderColor: '#1e1e4a', color: '#e2e8f0' }}
              />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                新密码
              </Text>
              <Input.Password
                placeholder="输入新密码（至少 6 位）"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ background: '#0a0a1a', borderColor: '#1e1e4a', color: '#e2e8f0' }}
              />
            </div>
            <div>
              <Text style={{ display: 'block', marginBottom: 6, color: '#94a3b8', fontSize: 13 }}>
                确认新密码
              </Text>
              <Input.Password
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ background: '#0a0a1a', borderColor: '#1e1e4a', color: '#e2e8f0' }}
              />
            </div>
            <Button
              type="primary"
              block
              icon={<LockOutlined />}
              loading={loading}
              onClick={handleSubmit}
              style={{ borderRadius: 8, marginTop: 4 }}
            >
              修改密码
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
}
