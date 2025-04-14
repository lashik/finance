// src/pages/PersonalDetailsPage.js
import React, { useState, useEffect, useContext } from 'react';
import {
    Typography, Card, Descriptions, Table, Select, InputNumber, Button, Space, Form, Input, DatePicker, Row, Col
} from 'antd';
import { PlusOutlined, DeleteOutlined, ExclamationOutlined } from '@ant-design/icons';
import dayjs from 'dayjs'; // Import dayjs for DatePicker
import { supabase } from '../supabaseClient'; // Ensure you have a Supabase client configured
import { AuthContext } from '../App';
const { Title } = Typography;
const { Option } = Select;

// --- Initial Data ---
const initialPersonalInfo = {
    name: '', // Example data
    dob: null, // Use dayjs object for DatePicker
    gender: '',
    occupation: '',
    maritalStatus: '',
    dependants: 0,
};

const initialIncome = [
    { key: 'prof', type: 'Professional income after taxes', amount: 0 },
    { key: 'other', type: 'Other income after taxes', amount: 0 },
];

const initialExpenses = [
    { key: '1', category: 'Insurance Premium (Monthly Average)', amount: 0 },
    { key: '2', category: 'Current Ongoing Savings (Monthly Average)', amount: 0 },
    { key: '3', category: 'Loan - EMI (Home, Vehicle, Personal, etc)', amount: 0 },
    { key: '4', category: 'House Rent / Maintenance', amount: 0 },
    { key: '5', category: 'Electricity bills', amount: 0 },
    { key: '6', category: 'Telephone Bills / Wifi', amount: 0 },
    { key: '7', category: 'Ration, Grocery and LPG', amount: 0 },
    { key: '8', category: 'Medicine', amount: 0 },
    { key: '9', category: 'Education / Tuition fees', amount: 0 },
    { key: '10', category: 'Vehicle Maintenance / Petrol', amount: 0 },
    { key: '11', category: 'House help', amount: 0 },
    { key: '12', category: 'Religious/social cause', amount: 0 },
    { key: '13', category: 'Entertainment / Leisure (Food, Shopping etc.)', amount: 0 },
];
// --------------------

// Fetch data from Supabase
const fetchPersonalDetails = async (email) => {
    try {
        console.log('Fetching personal details for email:', email);
        const { data, error } = await supabase
            .from('users') // Replace 'users' with your actual table name
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;
        if (!data || data.length === 0) {
            console.error('No user found with the provided email.');
            return null;
        }
        console.log('Fetched Personal Details:', data);

        // Map the fetched data to the state structure
        const personalInfo = {
            name: data.name,
            dob: dayjs(data.dob), // Convert to dayjs object
            gender: data.gender,
            occupation: data.occupation,
            maritalStatus: data.maritalStatus,
            dependants: data.dependants,
        };

        const incomeData = [
            { key: 'prof', type: 'Professional income after taxes', amount: data.professionalIncome || 0 },
            { key: 'other', type: 'Other income after taxes', amount: data.otherIncome || 0 },
        ];

        const expensesData = [
            { key: '1', category: 'Insurance Premium (Monthly Average)', amount: data.insurancePremium || 0 },
            { key: '2', category: 'Current Ongoing Savings (Monthly Average)', amount: data.ongoingSavings || 0 },
            { key: '3', category: 'Loan - EMI (Home, Vehicle, Personal, etc)', amount: data.loan || 0 },
            { key: '4', category: 'House Rent / Maintenance', amount: data.houseRent || 0 },
            { key: '5', category: 'Electricity bills', amount: data.electricityBills || 0 },
            { key: '6', category: 'Telephone Bills / Wifi', amount: data.telephoneBills || 0 },
            { key: '7', category: 'Ration, Grocery and LPG', amount: data.grocery || 0 },
            { key: '8', category: 'Medicine', amount: data.medicine || 0 },
            { key: '9', category: 'Education / Tuition fees', amount: data.educationFees || 0 },

            { key: '10', category: 'House help', amount: data.houseHelp || 0 },
            { key: '11', category: 'Religious/social cause', amount: data.socialCause || 0 },
            { key: '12', category: 'Entertainment / Leisure (Food, Shopping etc.)', amount: data.entertainment || 0 },
        ];

        return { personalInfo, incomeData, expensesData };
    } catch (error) {
        console.error('Error fetching personal details:', error.message);
        return null;
    }
};

// Update data in Supabase
const updatePersonalDetails = async (email, personalInfo, incomeData, expensesData) => {
    try {
        const updates = {
            name: personalInfo.name,
            dob: personalInfo.dob.format('YYYY-MM-DD'), // Convert dayjs to string
            gender: personalInfo.gender,
            occupation: personalInfo.occupation,
            maritalStatus: personalInfo.maritalStatus,
            dependants: personalInfo.dependants,
            professionalIncome: incomeData.find(item => item.key === 'prof')?.amount || 0,
            otherIncome: incomeData.find(item => item.key === 'other')?.amount || 0,
            insurancePremium: expensesData.find(item => item.key === '1')?.amount || 0,
            ongoingSavings: expensesData.find(item => item.key === '2')?.amount || 0,
            loan: expensesData.find(item => item.key === '3')?.amount || 0,
            houseRent: expensesData.find(item => item.key === '4')?.amount || 0,
            electricityBills: expensesData.find(item => item.key === '5')?.amount || 0,
            telephoneBills: expensesData.find(item => item.key === '6')?.amount || 0,
            grocery: expensesData.find(item => item.key === '7')?.amount || 0,
            medicine: expensesData.find(item => item.key === '8')?.amount || 0,
            educationFees: expensesData.find(item => item.key === '9')?.amount || 0,
            houseHelp: expensesData.find(item => item.key === '11')?.amount || 0,
            socialCause: expensesData.find(item => item.key === '12')?.amount || 0,
            entertainment: expensesData.find(item => item.key === '13')?.amount || 0,
        };

        const { error } = await supabase
            .from('users') // Replace 'users' with your actual table name
            .update(updates)
            .eq('email', email);

        if (error) throw error;

        console.log('Updated Personal Details:', updates);
        return true;
    } catch (error) {
        console.error('Error updating personal details:', error.message);
        return false;
    }
};

const PersonalDetailsPage = () => {
    const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo);
    const [incomeData, setIncomeData] = useState(initialIncome);
    const [expensesData, setExpensesData] = useState(initialExpenses);
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM')); // Default to current month
    const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track unsaved changes
    const [form] = Form.useForm(); // Form instance for editing personal info
    const { user } = useContext(AuthContext); // Get user from context
    const userEmail = user ? user.email : null;

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchPersonalDetails(userEmail);
            if (data) {
                setPersonalInfo(data.personalInfo);
                setIncomeData(data.incomeData);
                setExpensesData(data.expensesData);
            }
        };
        fetchData();
    }, [user]);

    // Handle edits in tables
    const handleIncomeChange = (key, field, value) => {
        const newData = incomeData.map(item =>
            item.key === key ? { ...item, [field]: value } : item
        );
        setIncomeData(newData);
        setHasUnsavedChanges(true); // Mark as unsaved
    };

    const handleExpenseChange = (key, field, value) => {
        const newData = expensesData.map(item =>
            item.key === key ? { ...item, [field]: value } : item
        );
        setExpensesData(newData);
        setHasUnsavedChanges(true); // Mark as unsaved
    };

    const handleSaveFinancialInfo = async () => {
        const success = await updatePersonalDetails(userEmail, personalInfo, incomeData, expensesData);
        if (success) {
            setHasUnsavedChanges(false); // Reset unsaved changes after saving
        }
    };

    // Calculate Totals
    const totalIncome = incomeData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = expensesData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const netSavings = totalIncome - totalExpenses;

    return (
        <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Personal Details & Finances</Title>

            {/* Personal Details Section */}
            <Card title="Personal Information" extra={<Button onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}>{isEditingPersonalInfo ? 'Cancel' : 'Edit'}</Button>} style={{ marginBottom: '24px' }}>
                {isEditingPersonalInfo ? (
                    <Form form={form} layout="vertical" onFinish={(values) => {
                        const updatedPersonalInfo = {
                            ...values,
                            dob: values.dob ? dayjs(values.dob) : null, // Store as dayjs object or null
                        };
                        setPersonalInfo(updatedPersonalInfo);
                        setIsEditingPersonalInfo(false);
                    }}>
                        <Row gutter={16}>
                            <Col xs={24} sm={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                            <Col xs={24} sm={12}><Form.Item name="dob" label="D.O.B. / Age"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                            <Col xs={24} sm={12}><Form.Item name="gender" label="Gender">
                                <Select>
                                    <Option value="Male">Male</Option>
                                    <Option value="Female">Female</Option>
                                    <Option value="Other">Other</Option>
                                </Select>
                            </Form.Item></Col>
                            <Col xs={24} sm={12}><Form.Item name="occupation" label="Occupation">
                                <Select>
                                    <Option value="Service">Service</Option>
                                    <Option value="Business">Business</Option>
                                    <Option value="Student">Student</Option>
                                    <Option value="Retired">Retired</Option>
                                    <Option value="House maker">House maker</Option>
                                    <Option value="Professional">Professional</Option>
                                </Select>
                            </Form.Item></Col>
                            <Col xs={24} sm={12}><Form.Item name="maritalStatus" label="Marital Status">
                                <Select>
                                    <Option value="Single">Single</Option>
                                    <Option value="Married">Married</Option>
                                    <Option value="Divorcee">Divorcee</Option>
                                    <Option value="Separated">Separated</Option>
                                    <Option value="Widower">Widower</Option>
                                </Select>
                            </Form.Item></Col>
                            <Col xs={24} sm={12}><Form.Item name="dependants" label="Dependants">
                                <Select>
                                    <Option value={0}>0</Option>
                                    <Option value={1}>1</Option>
                                    <Option value={2}>2</Option>
                                    <Option value={3}>3</Option>
                                    <Option value={4}>4</Option>
                                    <Option value="4+">4+</Option> {/* Store as string if needed */}
                                </Select>
                            </Form.Item></Col>
                        </Row>

                        <Button type="primary" htmlType='submit'>Save Changes</Button>
                        <Button style={{ marginLeft: 8 }} onClick={() => setIsEditingPersonalInfo(false)}>Cancel</Button>

                    </Form>
                ) : (
                    <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                        <Descriptions.Item label="Name">{personalInfo.name}</Descriptions.Item>
                        <Descriptions.Item label="D.O.B. / Age">{personalInfo.dob ? personalInfo.dob.format('YYYY-MM-DD') : 'N/A'} {/* Calculate Age if needed */}</Descriptions.Item>
                        <Descriptions.Item label="Gender">{personalInfo.gender}</Descriptions.Item>
                        <Descriptions.Item label="Occupation">{personalInfo.occupation}</Descriptions.Item>
                        <Descriptions.Item label="Marital Status">{personalInfo.maritalStatus}</Descriptions.Item>
                        <Descriptions.Item label="Dependants">{personalInfo.dependants}</Descriptions.Item>
                    </Descriptions>
                )}
            </Card>

            {/* Month Selection */}
            <Form layout="inline" style={{ marginBottom: '24px' }}>
                <Form.Item label="Select Month">
                    <DatePicker picker="month" value={dayjs(selectedMonth, 'YYYY-MM')} onChange={(date, dateString) => setSelectedMonth(dateString || dayjs().format('YYYY-MM'))} />
                </Form.Item>
                {/* Add Button to save monthly data if needed */}
                <Button type="primary">Add/Edit Monthly Figures</Button>
            </Form>

            {/* Income Table */}
            <Card title={`Monthly Income (${dayjs(selectedMonth).format('MMMM YYYY')})`} style={{ marginBottom: '24px' }}>
                <Table
                    columns={[
                        { title: 'Sr. No.', dataIndex: 'key', render: (text, record, index) => index + 1 },
                        { title: 'Income Source', dataIndex: 'type' },
                        {
                            title: 'Amount', dataIndex: 'amount', width: 150,
                            render: (text, record) => (
                                <InputNumber
                                    value={typeof text === 'number' ? text : null}
                                    onChange={(value) => handleIncomeChange(record?.key, 'amount', value)}
                                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                    style={{ width: '100%' }}
                                />
                            )
                        },
                    ]}
                    dataSource={incomeData}
                    pagination={false}
                    bordered
                    size="small"
                    summary={() => (
                        <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                            <Table.Summary.Cell index={0} colSpan={2}>Total Income</Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="right">
                                <InputNumber
                                    readOnly
                                    value={totalIncome}
                                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    style={{ width: '100%', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                                    controls={false}
                                />
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />
            </Card>

            {/* Expenses Table */}
            <Card
                title={`Monthly Expenses (${dayjs(selectedMonth).format('MMMM YYYY')})`}
                extra={
                    <Button
                        type="primary"
                        onClick={handleSaveFinancialInfo}
                        disabled={!hasUnsavedChanges} // Disable button if no unsaved changes
                        style={{
                            backgroundColor: hasUnsavedChanges ? '#1890ff' : '#d9d9d9', // Blue if unsaved, gray otherwise
                            borderColor: hasUnsavedChanges ? '#1890ff' : '#d9d9d9',
                        }}
                    >
                        Save Changes
                    </Button>
                }
            >
                <Button
                    onClick={() => {
                        const newKey = (expensesData.length + 1).toString();
                        setExpensesData([...expensesData, { key: newKey, category: '', amount: 0 }]);
                        setHasUnsavedChanges(true); // Mark as unsaved
                    }}
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{ marginBottom: 16, width: '100%' }}
                >
                    Add Expense Row
                </Button>
                <Table
                    columns={[
                        { title: 'Sr. No.', dataIndex: 'key', render: (text, record, index) => index + 1, width: 60 },
                        {
                            title: 'Expense Category',
                            dataIndex: 'category',
                            render: (text, record) => (
                                <Input
                                    value={text}
                                    onChange={(e) => handleExpenseChange(record.key, 'category', e.target.value)}
                                    placeholder="Enter category"
                                />
                            ),
                        },
                        {
                            title: 'Amount',
                            dataIndex: 'amount',
                            width: 150,
                            render: (text, record) => (
                                <InputNumber
                                    value={typeof text === 'number' ? text : null}
                                    onChange={(value) => handleExpenseChange(record.key, 'amount', value)}
                                    formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                    style={{ width: '100%' }}
                                />
                            ),
                        },
                        {
                            title: 'Action',
                            key: 'action',
                            width: 80,
                            render: (_, record) => (
                                <Button
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                        setExpensesData(expensesData.filter(item => item.key !== record.key));
                                        setHasUnsavedChanges(true); // Mark as unsaved
                                    }}
                                    danger
                                    type="link"
                                />
                            ),
                        },
                    ]}
                    dataSource={expensesData}
                    pagination={false}
                    bordered
                    size="small"
                    summary={() => (
                        <>
                            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                <Table.Summary.Cell index={0} colSpan={2}>Total Expenses</Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="right">
                                    <InputNumber
                                        readOnly
                                        value={totalExpenses}
                                        formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        style={{ width: '100%', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                                        controls={false}
                                    />
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}></Table.Summary.Cell> {/* Empty cell for action column */}
                            </Table.Summary.Row>
                            <Table.Summary.Row style={{ background: '#e6f7ff', fontWeight: 'bold' }}>
                                <Table.Summary.Cell index={0} colSpan={2}>Net Savings</Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="right">
                                    <InputNumber
                                        readOnly
                                        value={netSavings}
                                        formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        style={{ width: '100%', fontWeight: 'bold', border: 'none', background: 'transparent', color: netSavings >= 0 ? 'green' : 'red' }}
                                        controls={false}
                                    />
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        </>
                    )}
                />
            </Card>
        </div>
    );
};

export default PersonalDetailsPage;