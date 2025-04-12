// src/pages/RegisterPage.js
import React, { useState, useContext } from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, DatePicker, Select, Alert } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, GlobalOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App'; // Import context

const { Title, Text } = Typography;
const { Option } = Select;

// Mock list of countries for dropdown
const countries = ["USA", "Canada", "UK", "Australia", "India", "Germany", "France"]; // Add more as needed

// --- Mock User Store ---
// In a real app, this would be checked against a backend database
const registeredUsers = new Set(['existing@example.com']);
// --------------------

const RegisterPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext); // Get register function from context
    const navigate = useNavigate();
    const [form] = Form.useForm(); // To access form instance

    const onFinish = async (values) => {
        setLoading(true);
        setError('');

        // --- Mock Duplicate Check ---
        if (registeredUsers.has(values.email)) {
            setError('Email address already registered.');
            setLoading(false);
            return;
        }
        // Add mobile number duplicate check if needed
        // --------------------------

        try {
            // --- Mock Registration ---
            // In a real app, call an API: await authService.register(values);
            console.log('Registration attempt:', values);
            // Add to mock store (in real app, backend handles this)
            registeredUsers.add(values.email);
            register({
                name: values.name,
                email: values.email,
                //... include other relevant data if needed by auth context
            }); // Update auth state via context
            navigate('/dashboard'); // Redirect on success
            // ------------------
        } catch (err) {
            setError('Registration failed. Please try again.');
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row justify="center" align="middle" style={{ minHeight: 'calc(100vh - 120px)' }}>
            <Col xs={24} sm={20} md={16} lg={12} xl={8}>
                <Card title={<Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>Register</Title>}>
                    {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}
                    <Form
                        form={form}
                        name="register"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                        scrollToFirstError
                    >
                        <Form.Item
                            name="name"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please input your Full Name!', whitespace: true }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
                        </Form.Item>

                         <Form.Item
                            name="dob"
                            label="Date of Birth"
                            rules={[{ required: true, message: 'Please select your Date of Birth!' }]}
                        >
                            <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                        </Form.Item>

                        <Form.Item
                            name="country"
                            label="Country"
                            rules={[{ required: true, message: 'Please select your Country!' }]}
                        >
                            <Select prefix={<GlobalOutlined />} placeholder="Select your country">
                                {countries.map(country => (
                                    <Option key={country} value={country}>{country}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="mobile"
                            label="Mobile Number"
                            rules={[
                                { required: true, message: 'Please input your Mobile Number!' },
                                // Add pattern validation if needed e.g., /^\d{10}$/
                            ]}
                        >
                            <Input prefix={<PhoneOutlined />} placeholder="Enter your mobile number" style={{ width: '100%' }}/>
                        </Form.Item>


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
                            hasFeedback // Adds validation icons
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Choose a strong password" />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            label="Confirm Password"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                { required: true, message: 'Please confirm your password!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                    },
                                }),
                            ]}
                        >
                             <Input.Password prefix={<LockOutlined />} placeholder="Confirm your password" />
                        </Form.Item>


                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Register
                            </Button>
                        </Form.Item>

                        <Text style={{ display: 'block', textAlign: 'center' }}>
                            Already have an account? <Link to="/login">Log in here!</Link>
                        </Text>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default RegisterPage;