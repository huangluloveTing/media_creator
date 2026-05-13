import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import { ProjectProvider } from './context/ProjectContext';
import ProjectListPage from './pages/ProjectListPage';
import ProjectEditorPage from './pages/ProjectEditorPage';
import SettingsPage from './pages/SettingsPage';

const customTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#4f7cff',
    colorSuccess: '#34d399',
    colorWarning: '#fbbf24',
    colorError: '#f87171',
    colorInfo: '#4f7cff',
    borderRadius: 10,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorBgBase: '#0a0a1a',
    colorBgContainer: '#131330',
    colorBgElevated: '#1a1a40',
    colorBorder: '#1e1e4a',
    colorText: '#e2e8f0',
    colorTextSecondary: '#94a3b8',
    fontSize: 14,
    lineHeight: 1.6,
    controlHeight: 36,
    paddingContentHorizontal: 20,
    paddingContentVertical: 16,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      paddingContentHorizontal: 16,
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Tag: {
      borderRadiusSM: 6,
    },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={customTheme}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProjectListPage />} />
            <Route
              path="/project/:projectId"
              element={
                <ProjectProvider>
                  <ProjectEditorPage />
                </ProjectProvider>
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
