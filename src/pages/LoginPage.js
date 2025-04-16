
import React, { useState, useContext } from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App'; 
import { supabase } from '../supabaseClient';
const { Title, Text } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext); 
    const navigate = useNavigate();
     
    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        try {
            console.log('Login attempt:', values);
    
            // Query the database to check email and password
            const { data, error } = await supabase
                .from('users') // Replace 'users' with your actual table name
                .select('email, password') // Select the email and password fields
                .eq('email', values.email)
                .single();
    
            if (error || !data) {
                console.error('Error fetching user:', error?.message || 'User not found');
                setError('Invalid email or password.');
            } else if (data.password !== values.password) {
                // Compare the entered password with the stored password
                console.error('Password mismatch');
                setError('Invalid email or password.');
            } else {
                console.log('Login successful:', data);
                login(values.email); // Update the AuthContext with the logged-in user's email
                navigate('/dashboard'); // Navigate to the dashboard
            }
        } catch (err) {
            setError('Login failed. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        
        alert('Password reset link simulation: An email would be sent if this were a real app.');
        
    };

    return (
        <Row justify="center" align="middle" style={{ minHeight: 'calc(100vh - 120px)' }}>
            <Col xs={24} sm={16} md={12} lg={8} xl={6}>
                <Card title={<Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>Login</Title>}>
                    {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}
                    <Form
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: 'Please input your Email!' },
                                { type: 'email', message: 'Please enter a valid Email!' }
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="Enter your email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{ required: true, message: 'Please input your Password!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="link" onClick={handleForgotPassword} style={{ padding: 0 }}>
                                Forgot password?
                            </Button>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Log in
                            </Button>
                        </Form.Item>

                        <Text style={{ display: 'block', textAlign: 'center' }}>
                            Don't have an account? <Link to="/register">Register now!</Link>
                        </Text>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default LoginPage;