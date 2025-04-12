// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Space, ConfigProvider, theme } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  SolutionOutlined,
  EditOutlined,
  FundProjectionScreenOutlined,
  SettingOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

// Import Page Components (Create these files in subsequent steps)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PersonalDetailsPage from './pages/PersonalDetailsPage';
import PortfolioPage from './pages/PortfolioPage';
import GoalSettingPage from './pages/GoalSettingPage';
import ProjectionsPage from './pages/ProjectionsPage';
import logo from './assets/logo.png'; // Placeholder logo, replace with actual path
// Placeholder Context for Authentication
const AuthContext = React.createContext();

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text } = Typography;

// --- Mock Authentication Hook ---
const useAuth = () => {
  // In a real app, this would interact with context or state management
  const [user, setUser] = useState(null); // null = logged out, { email: '...' } = logged in

  const login = (email) => setUser({ email });
  const logout = () => setUser(null);
  const register = (userData) => {
      // Simulate registration -> login
      console.log('Simulating registration:', userData);
      // In real app, check for duplicates here or on server
      login(userData.email);
  }

  return { user, login, logout, register };
};
// -----------------------------

// --- Sidebar Navigation ---
const AppSidebar = ({ collapsed }) => {
  const location = useLocation();
  const { user } = React.useContext(AuthContext);

  const menuItems = user ? [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { key: '/personal-details', icon: <SolutionOutlined />, label: <Link to="/personal-details">Personal Details</Link> },
    {
      key: '/portfolio',
      icon: <EditOutlined />,
      label: 'Portfolio Mgmt', // Level 1
      children: [ // Level 2 (if needed, can flatten)
        {
            key: '/portfolio/edit', // Level 3 as requested
            icon: <EditOutlined />, // Reuse icon or use specific one
            label: <Link to="/portfolio/edit">Add / Edit Portfolio</Link>,
        }
      ]
    },
    { key: '/goal-setting', icon: <SettingOutlined />, label: <Link to="/goal-setting">Goal Setting</Link> },
    { key: '/projections', icon: <FundProjectionScreenOutlined />, label: <Link to="/projections">Projections</Link> },
  ] : [
    { key: '/login', icon: <LoginOutlined />, label: <Link to="/login">Login</Link> },
    { key: '/register', icon: <UserAddOutlined />, label: <Link to="/register">Register</Link> },
  ];

  // Find the deepest matching key for selectedKeys
  const getSelectedKeys = () => {
      const path = location.pathname;
      // Match more specific paths first
      if (path.startsWith('/portfolio/edit')) return ['/portfolio/edit'];
      if (path.startsWith('/portfolio')) return ['/portfolio']; // Catch parent if needed
      const item = menuItems.flat().find(i => i && i.key === path); // Flatten for simple match
      return item ? [item.key] : [];
  };

   // Find parent key for defaultOpenKeys
   const getDefaultOpenKeys = () => {
     const path = location.pathname;
     if (path.startsWith('/portfolio/edit')) return ['/portfolio'];
     return [];
   };


  return (
    <Sider trigger={null} collapsible collapsed={collapsed} width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
      <div style={{ height: 'auto', padding: '16px', background: 'white', textAlign: 'center', lineHeight: '32px', color: '#fff', borderRadius: '4px' }}>
        {collapsed ? <div /> :<div style={{display: "flex", flexDirection: "row", alignItems: "center", columnGap: '7px'}}>
            <img src={logo} />
            
            <figcaption style={{margin: '1px 0px 3px', width: '100%', color:'#000000', letterSpacing: '-0.32px', fontWeight:'700'}} >
              FinanceGenius
            </figcaption>
          </div>}
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getDefaultOpenKeys()} // Keep portfolio open if child is active
        items={menuItems}
      />
    </Sider>
  );
};
// -------------------------

// --- Header ---
const AppHeader = ({ collapsed, toggleCollapse }) => {
  const { user, logout } = React.useContext(AuthContext);

  return (
    <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
       {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: toggleCollapse,
            style: { fontSize: '18px', cursor: 'pointer'}
        })}
      {user ? (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text>{user.email}</Text>
          <LogoutOutlined onClick={logout} style={{ cursor: 'pointer', color: 'red', fontSize: '16px' }} title="Logout" />
        </Space>
      ) : (
        <Text>Welcome</Text>
      )}
    </Header>
  );
};
// ----------------

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  if (!user) {
    
    return <Navigate to="/login" replace />;
  }
  return children;
};
// ----------------------------

// --- Main App Component ---
function App() {
  const [collapsed, setCollapsed] = useState(false);
  const auth = useAuth(); // Use our mock auth hook

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Ant Design Theme Configuration (Optional Customization)
  const { darkAlgorithm, compactAlgorithm } = theme;
  const appTheme = {
    // algorithm: darkAlgorithm, // Uncomment for dark theme
    token: {
      // colorPrimary: '#00b96b', // Example primary color change
    },
  }

  return (
    <ConfigProvider theme={appTheme}>
      <AuthContext.Provider value={auth}>
        <Router>
          <Layout style={{ minHeight: '100vh' }}>
            {auth.user && <AppSidebar collapsed={collapsed} />}
            <Layout className="site-layout">
              {auth.user && <AppHeader collapsed={collapsed} toggleCollapse={toggleCollapse} />}
              <Content style={{ padding: 24, background: '#E7E9F5', borderRadius: '8px' }}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/personal-details" element={<ProtectedRoute><PersonalDetailsPage /></ProtectedRoute>} />
                  {/* Note: Level 3 is the route, Level 2 'Portfolio Mgmt' is just menu structure */}
                  <Route path="/portfolio/edit" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
                  <Route path="/goal-setting" element={<ProtectedRoute><GoalSettingPage /></ProtectedRoute>} />
                  <Route path="/projections" element={<ProtectedRoute><ProjectionsPage /></ProtectedRoute>} />

                  {/* Default Route */}
                  <Route path="/" element={auth.user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

                   {/* Catch-all for undefined routes (Optional) */}
                   <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Content>
              <Footer style={{ textAlign: 'center', background: '#E7E9F5' }}>
                Financial Planning System ©{new Date().getFullYear()}
              </Footer>
            </Layout>
          </Layout>
        </Router>
      </AuthContext.Provider>
    </ConfigProvider>
  );
}

export default App;
export { AuthContext }; // Export context for use in other components