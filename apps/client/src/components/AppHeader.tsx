import { useNavigate, Link } from 'react-router-dom';
import { Button, Space, Dropdown, Typography } from 'antd';
import {
  PlaySquareOutlined,
  SettingOutlined,
  LogoutOutlined,
  KeyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

export default function AppHeader() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#0d0d2b',
        borderBottom: '1px solid #1e1e4a',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Link
        to="/"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4f7cff, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PlaySquareOutlined style={{ fontSize: 16, color: '#fff' }} />
        </div>
        <Text strong style={{ color: '#f1f5f9', fontSize: 15, margin: 0 }}>
          Media Creator
        </Text>
      </Link>

      <Dropdown
        menu={{
          items: [
            { key: 'settings', icon: <SettingOutlined />, label: <Link to="/settings">设置</Link> },
            {
              key: 'password',
              icon: <KeyOutlined />,
              label: <Link to="/change-password">修改密码</Link>,
            },
            { type: 'divider' },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '退出登录',
              onClick: () => {
                logout();
                navigate('/login');
              },
            },
          ],
        }}
        placement="bottomRight"
      >
        <Button
          type="text"
          icon={<UserOutlined style={{ fontSize: 18 }} />}
          style={{ color: '#94a3b8' }}
        />
      </Dropdown>
    </div>
  );
}
