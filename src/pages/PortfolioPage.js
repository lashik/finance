// src/pages/PortfolioPage.js
import React, { useState, useEffect, useContext } from 'react';
import { Typography, Collapse, Button, Form, Input, InputNumber, DatePicker, Select, Space, Table, Popconfirm, Spin, Alert, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid'; // For generating unique keys for new items

import { supabase } from '../supabaseClient'; // Adjust path if needed
import { AuthContext } from '../App'; // Import AuthContext

const { Title } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

// --- Constants for Standardized Keys ---
const KEY_AMOUNT = 'amount'; // Represents invested_amount or property_value
const KEY_RATE_VALUE = 'rateValue'; // Represents expected_return, interest_rate, rental_yield
const KEY_RATE_UNIT = 'rateUnit'; // Represents '%', 'Yield', etc. (derive this)
const KEY_DESCRIPTION = 'description';
const KEY_TYPE = 'type'; // The sub-type name from Supabase (e.g., "Direct Stocks")
const KEY_ID = 'id'; // Unique frontend ID
const KEY_MATURITY = 'maturityDate'; // Optional common key
const KEY_TERM = 'term'; // Optional common key
const KEY_TERM_UNIT = 'termUnit'; // Optional common key

// --- Mapping from Supabase Type to a simplified internal key for structure ---
// Needed if your old `initialPortfolioData` keys were different from Category Names
const categoryNameToKey = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/&/g, 'and');
const typeNameToInternalKey = (typeName) => typeName.toLowerCase().replace(/[^a-z0-9]+/g, '_');


// --- Data Transformation Functions ---

// Transforms Supabase JSONB object to the nested state structure
const transformSupabaseToState = (supabaseData) => {
    if (!supabaseData || typeof supabaseData !== 'object') {
        return {}; // Return empty if no data or invalid format
    }

    const portfolioState = {};

    for (const categoryName in supabaseData) {
        const categoryItems = supabaseData[categoryName];
        const categoryKey = categoryNameToKey(categoryName); // e.g., 'equity'
        portfolioState[categoryKey] = {
            name: categoryName, // e.g., "Equity"
            types: {},
        };

        if (Array.isArray(categoryItems)) {
            categoryItems.forEach(item => {
                const typeName = item[KEY_TYPE] || "Unknown Type"; // e.g., "Direct Stocks"
                const typeKey = typeNameToInternalKey(typeName); // e.g., 'direct_stocks'

                if (!portfolioState[categoryKey].types[typeKey]) {
                    portfolioState[categoryKey].types[typeKey] = {
                        name: typeName,
                        items: [],
                    };
                }

                // --- Map Supabase fields to standardized state keys ---
                let amount = item.invested_amount !== undefined ? parseFloat(item.invested_amount) :
                    item.property_value !== undefined ? parseFloat(item.property_value) : 0;
                let rateValue = item.expected_return !== undefined ? parseFloat(item.expected_return) :
                    item.interest_rate !== undefined ? parseFloat(item.interest_rate) :
                        item.rental_yield !== undefined ? parseFloat(item.rental_yield) : null;
                let rateUnit = item.rental_yield !== undefined ? 'Yield' : '%'; // Default to % unless it's yield
                let maturityDate = item.maturity_date ? dayjs(item.maturity_date) : item.maturityDate ? dayjs(item.maturityDate) : null; // Handle different casing just in case
                let term = item.maturity_period !== undefined ? parseInt(item.maturity_period) : null;
                let termUnit = term ? (categoryName === 'Cash & Cash Equivalents' && typeName === 'Treasury Bills (T-Bills)' ? 'Months' : 'Years') : null; // Example logic for term unit

                if (isNaN(amount)) amount = 0;
                if (rateValue !== null && isNaN(rateValue)) rateValue = null;
                if (term !== null && isNaN(term)) term = null;


                const transformedItem = {
                    [KEY_ID]: uuidv4(), // Generate unique frontend ID
                    [KEY_TYPE]: typeName,
                    [KEY_DESCRIPTION]: item[KEY_DESCRIPTION] || '',
                    [KEY_AMOUNT]: amount,
                    [KEY_RATE_VALUE]: rateValue,
                    [KEY_RATE_UNIT]: rateValue !== null ? rateUnit : null, // Only show unit if rate exists
                    [KEY_MATURITY]: maturityDate,
                    [KEY_TERM]: term,
                    [KEY_TERM_UNIT]: termUnit,
                    // Store original data if needed for reverse transformation, or handle mapping based on type later
                    _originalItem: { ...item } // Optional: Store original for easier reverse mapping
                };
                // ----------------------------------------------------

                portfolioState[categoryKey].types[typeKey].items.push(transformedItem);
            });
        }
    }
    console.log("Transformed State:", portfolioState);
    return portfolioState;
};


// Transforms nested state structure back to Supabase JSONB object
const transformStateToSupabase = (portfolioState) => {
    const supabaseData = {};

    for (const categoryKey in portfolioState) {
        const categoryData = portfolioState[categoryKey];
        const categoryName = categoryData.name; // e.g., "Equity"
        supabaseData[categoryName] = [];

        for (const typeKey in categoryData.types) {
            const typeData = categoryData.types[typeKey];
            typeData.items.forEach(item => {
                // --- Map standardized state keys back to Supabase fields ---
                // This requires knowing the original structure or using the type name
                const originalType = item[KEY_TYPE]; // e.g., "Direct Stocks"
                const reconstructedItem = {
                    [KEY_TYPE]: originalType,
                    [KEY_DESCRIPTION]: item[KEY_DESCRIPTION] || '',
                };

                // Map amount back based on category/type (example logic)
                if (categoryName === 'Real Estate' && (originalType === 'Residential Property' || originalType === 'Commercial Property')) {
                    reconstructedItem.property_value = item[KEY_AMOUNT]?.toString() || '0';
                } else {
                    reconstructedItem.invested_amount = item[KEY_AMOUNT]?.toString() || '0';
                }

                // Map rate back based on unit or type (example logic)
                const rateVal = item[KEY_RATE_VALUE];
                if (rateVal !== null && rateVal !== undefined) {
                    if (item[KEY_RATE_UNIT] === 'Yield') {
                        reconstructedItem.rental_yield = rateVal.toString();
                    } else if (originalType === 'Fixed Deposits (FDs)' || originalType === 'Corporate Bonds' || originalType === 'Savings Accounts' || originalType === 'Treasury Bills (T-Bills)') {
                        reconstructedItem.interest_rate = rateVal.toString();
                    } else {
                        reconstructedItem.expected_return = rateVal.toString();
                    }
                }

                // Map term/maturity back (example logic)
                if (item[KEY_TERM] !== null && item[KEY_TERM] !== undefined) {
                    reconstructedItem.maturity_period = item[KEY_TERM].toString();
                }
                if (item[KEY_MATURITY]) {
                    reconstructedItem.maturity_date = dayjs(item[KEY_MATURITY]).format('YYYY-MM-DD');
                }

                // Add other fields specific to the original type if needed, potentially using item._originalItem if stored

                supabaseData[categoryName].push(reconstructedItem);
                // ----------------------------------------------------
            });
        }
    }
    console.log("Transformed Supabase Data for Saving:", supabaseData);
    return supabaseData;
};

// --- API Functions ---
const fetchPortfolioData = async (email) => {
    if (!email) return null;
    try {
        const { data, error } = await supabase
            .from('users') // OR your specific portfolios table
            .select('existing_investments') // Select the JSONB column
            .eq('email', 'kashik.sredharan@gmail.com')
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore 'Exactly one row expected' error if no row exists
            throw error;
        }
        console.log("Fetched raw Supabase portfolio:", data.existing_investments);
        return data.existing_investments || {}; // Return the jsonb object or empty object
    } catch (error) {
        console.error("Error fetching portfolio data:", error.message);
        message.error(`Error fetching portfolio: ${error.message}`);
        return null;
    }
};

const updatePortfolioData = async (email, portfolioJsonb) => {
    if (!email) return false;
    try {
        // Use upsert: update if exists, insert if not (useful for first save)
        // Assumes 'email' is the unique constraint column for users table
        const { error } = await supabase
            .from('users') // OR your specific portfolios table
            .update({ existing_investments: portfolioJsonb })
            .eq('email', email);
        // If using upsert and the row might not exist:
        // .upsert({ email: email, portfolio_data: portfolioJsonb }, { onConflict: 'email' })


        if (error) throw error;
        console.log("Successfully updated portfolio data in Supabase.");
        message.success("Portfolio saved successfully!");
        return true;
    } catch (error) {
        console.error("Error updating portfolio data:", error.message);
        message.error(`Error saving portfolio: ${error.message}`);
        return false;
    }
};


// --- Editable Cell Component (Adapts to standardized keys) ---
const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
    let inputNode = <Input />;
    if (dataIndex === KEY_AMOUNT) {
        inputNode = <InputNumber style={{ width: '100%' }} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/₹\s?|(,*)/g, '')} />;
    } else if (dataIndex === KEY_RATE_VALUE) {
        inputNode = <InputNumber style={{ width: '100%' }} />; // Allow decimals for rate
    } else if (dataIndex === KEY_TERM) {
        inputNode = <InputNumber style={{ width: '100%' }} min={0} precision={0} />; // Integer for term
    }
    else if (dataIndex === KEY_MATURITY) {
        inputNode = <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />;
    } else if (dataIndex === KEY_RATE_UNIT) {
        inputNode = (
            <Select style={{ width: '80px' }}>
                <Option value="%">%</Option>
                <Option value="Yield">Yield</Option>
                {/* Add other units if needed */}
            </Select>
        );
    } else if (dataIndex === KEY_TERM_UNIT) {
        inputNode = (
            <Select style={{ width: '100%' }}>
                <Option value="Years">Years</Option>
                <Option value="Months">Months</Option>
            </Select>
        );
    }
    // Add more specific inputs if needed based on dataIndex (e.g., a Select for KEY_TYPE if editable)

    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item
                    name={dataIndex}
                    style={{ margin: 0 }}
                    rules={[{ required: ![KEY_RATE_VALUE, KEY_RATE_UNIT, KEY_MATURITY, KEY_TERM, KEY_TERM_UNIT].includes(dataIndex), message: `Please Input ${title}!` }]} // Make rate/maturity/term optional
                >
                    {inputNode}
                </Form.Item>
            ) : (
                // Format display value
                (dataIndex === KEY_AMOUNT && typeof children === 'number')
                    ? `₹ ${children.toLocaleString()}`
                    : (dataIndex === KEY_RATE_VALUE && typeof children === 'number')
                        ? `${children}${record[KEY_RATE_UNIT] || ''}` // Append unit if rate exists
                        : (dataIndex === KEY_TERM && typeof children === 'number')
                            ? `${children} ${record[KEY_TERM_UNIT] || ''}` // Append term unit
                            : (dataIndex === KEY_MATURITY && children)
                                ? dayjs(children).isValid() ? dayjs(children).format('YYYY-MM-DD') : 'Invalid Date'
                                : children
            )}
        </td>
    );
};

// --- Investment Table Component (Adapts columns) ---
const InvestmentTable = ({ categoryKey, typeKey, typeName, items, updateItems }) => {
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState(''); // Use the 'id' field for editing key

    const isEditing = record => record[KEY_ID] === editingKey;

    const edit = (record) => {
        form.setFieldsValue({
            ...record, // Spread existing values
            // Ensure date/numeric types are correct for form fields
            [KEY_MATURITY]: record[KEY_MATURITY] ? dayjs(record[KEY_MATURITY]) : null,
            [KEY_AMOUNT]: Number(record[KEY_AMOUNT]) || 0,
            [KEY_RATE_VALUE]: record[KEY_RATE_VALUE] !== null ? Number(record[KEY_RATE_VALUE]) : null,
            [KEY_TERM]: record[KEY_TERM] !== null ? Number(record[KEY_TERM]) : null,
        });
        setEditingKey(record[KEY_ID]);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const save = async (id) => {
        try {
            const row = await form.validateFields();
            const newData = [...items];
            const index = newData.findIndex(item => id === item[KEY_ID]);

            if (index > -1) { // Existing item found
                const item = newData[index];
                // Create updated item, ensuring numeric types are correct
                const updatedItem = {
                    ...item,
                    ...row,
                    [KEY_AMOUNT]: Number(row[KEY_AMOUNT]) || 0,
                    [KEY_RATE_VALUE]: row[KEY_RATE_VALUE] !== null && row[KEY_RATE_VALUE] !== undefined ? Number(row[KEY_RATE_VALUE]) : null,
                    [KEY_MATURITY]: row[KEY_MATURITY] ? dayjs(row[KEY_MATURITY]) : null, // Keep as dayjs
                    [KEY_TERM]: row[KEY_TERM] !== null && row[KEY_TERM] !== undefined ? Number(row[KEY_TERM]) : null,

                };
                newData.splice(index, 1, updatedItem);
                updateItems(newData); // Pass updated items array up
                setEditingKey('');
            } else { // Should not happen if editing existing item
                console.error("Item to save not found");
                setEditingKey(''); // Reset editing key anyway
            }

        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const handleDelete = (id) => {
        const newData = items.filter(item => item[KEY_ID] !== id);
        updateItems(newData);
        if (editingKey === id) {
            setEditingKey('');
        }
    };

    const handleAdd = () => {
        if (editingKey) return; // Don't add if already editing

        const newId = uuidv4(); // Generate unique ID
        const newItem = {
            [KEY_ID]: newId,
            [KEY_TYPE]: typeName, // Pre-fill type based on table context
            [KEY_DESCRIPTION]: '',
            [KEY_AMOUNT]: 0,
            [KEY_RATE_VALUE]: null,
            [KEY_RATE_UNIT]: '%', // Default unit
            [KEY_MATURITY]: null,
            [KEY_TERM]: null,
            [KEY_TERM_UNIT]: 'Years',
        };
        updateItems([...items, newItem]);
        edit(newItem); // Immediately start editing the new row
    };

    // --- Define common columns ---
    const columns = [
        { title: 'Investment Description', dataIndex: KEY_DESCRIPTION, editable: true, width: 250 },
        { title: 'Invested Amount (₹)', dataIndex: KEY_AMOUNT, editable: true, width: 150, align: 'right' },
        { title: 'Rate of Return', dataIndex: KEY_RATE_VALUE, editable: true, width: 100, align: 'right' },
        { title: 'Rate Unit (e.g., % or Yield)', dataIndex: KEY_RATE_UNIT, editable: true, width: 90 },
        { title: 'Investment Term', dataIndex: KEY_TERM, editable: true, width: 100, align: 'right' },
        { title: 'Term Unit (e.g., Years)', dataIndex: KEY_TERM_UNIT, editable: true, width: 100 },
        { title: 'Maturity Date', dataIndex: KEY_MATURITY, editable: true, width: 130 },
        {
            title: 'Action',
            dataIndex: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Space size="small">
                        <Button onClick={() => save(record[KEY_ID])} type="link" icon={<SaveOutlined />} title="Save" />
                        <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                            <Button type="link" icon={<CloseOutlined />} danger title="Cancel" />
                        </Popconfirm>
                    </Space>
                ) : (
                    <Space size="small">
                        <Button
                            type="link"
                            disabled={!!editingKey}
                            onClick={() => edit(record)}
                            icon={<EditOutlined />}
                            title="Edit"
                        />
                        <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record[KEY_ID])}>
                            <Button type="link" icon={<DeleteOutlined />} danger disabled={!!editingKey} title="Delete" />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    const mergedColumns = columns.map(col => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.inputType || 'text', // Default input type if needed
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });


    return (
        <div style={{ marginTop: '10px', marginBottom: '20px' }}>
            <Button
                onClick={handleAdd}
                type="dashed"
                icon={<PlusOutlined />}
                style={{ marginBottom: 16, width: '100%' }}
                disabled={!!editingKey}
            >
                Add {typeName} Investment
            </Button>
            <Form form={form} component={false}>
                <Table
                    components={{ body: { cell: EditableCell } }}
                    bordered
                    dataSource={items}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    pagination={false}
                    size="small"
                    rowKey={KEY_ID} // Use the unique frontend ID as the key
                    scroll={{ x: 1000 }} // Enable horizontal scroll if needed
                />
            </Form>
        </div>
    );
};


// --- Main Portfolio Page Component ---
const PortfolioPage = () => {
    const { user } = useContext(AuthContext);
    const userEmail = user?.email;
    const [portfolio, setPortfolio] = useState({}); // State holds the nested structure
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch and transform data on load or when user changes
    useEffect(() => {
        if (userEmail) {
            setLoading(true);
            fetchPortfolioData(userEmail)
                .then(supabaseData => {
                    const transformedState = transformSupabaseToState(supabaseData);
                    setPortfolio(transformedState);
                })
                .catch(err => console.error("Error in fetch/transform chain:", err)) // Should be caught in fetchPortfolioData already
                .finally(() => setLoading(false));
        } else {
            setPortfolio({}); // Clear portfolio if no user
            setLoading(false);
        }
    }, [userEmail]);

    // Function passed down to InvestmentTable to update state
    const updatePortfolioItems = (categoryKey, typeKey, newItems) => {
        setPortfolio(prevPortfolio => {
            // Deep copy to ensure immutability if necessary, or careful update
            const updatedPortfolio = JSON.parse(JSON.stringify(prevPortfolio)); // Simple deep copy
            if (updatedPortfolio[categoryKey]?.types[typeKey]) {
                updatedPortfolio[categoryKey].types[typeKey].items = newItems;
            } else {
                console.error("Error updating state: category or type key not found");
            }

            return updatedPortfolio;
        });
    };

    // Handle saving the entire portfolio back to Supabase
    const handleSavePortfolio = async () => {
        if (!userEmail) {
            message.error("Cannot save portfolio: User not logged in.");
            return;
        }
        setSaving(true);
        try {
            const supabaseData = transformStateToSupabase(portfolio);
            await updatePortfolioData(userEmail, supabaseData);
            // Optionally re-fetch after save to ensure consistency, or trust the state
            // fetchPortfolioData(userEmail).then(data => setPortfolio(transformSupabaseToState(data)));
        } catch (error) {
            // Error message handled within updatePortfolioData
            console.error("Error during save process:", error);
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return <Spin tip="Loading Portfolio..." size="large"><div style={{ height: '300px' }} /></Spin>;
    }

    return (
        <div>
            <Title level={3} style={{ marginBottom: '24px' }}>Add / Edit Portfolio</Title>
            <Button
                type="primary"
                onClick={handleSavePortfolio}
                loading={saving}
                disabled={loading}
                style={{ marginBottom: '10px', marginTop: '15px', float: 'right' }}
            >
                Save Changes
            </Button>
            <Collapse
                accordion={true} // Ensures only one panel is open at a time
                defaultActiveKey={[]} // All panels start collapsed
                bordered={false}
                style={{ background: '#fff' }}
            >
                {Object.keys(portfolio).length === 0 && !loading && (
                    <Alert message="No portfolio data found or loaded." type="info" style={{ margin: '20px' }} />
                )}
                {Object.entries(portfolio).map(([categoryKey, categoryData]) => (
                    <Panel
                        header={<Title level={4} style={{ margin: 0, fontWeight: 500 }}>{categoryData.name}</Title>}
                        key={categoryKey}
                        style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                        {Object.entries(categoryData.types).map(([typeKey, typeData]) => (
                            <div
                                key={typeKey}
                                style={{
                                    marginBottom: '15px',
                                    paddingLeft: '15px',
                                    borderLeft: '3px solid #e8e8e8',
                                    marginLeft: '10px',
                                }}
                            >
                                <Title
                                    level={5}
                                    style={{
                                        marginTop: '10px',
                                        marginBottom: '5px',
                                        fontWeight: 'normal',
                                        color: '#555',
                                    }}
                                >
                                    {typeData.name}
                                </Title>
                                <InvestmentTable
                                    categoryKey={categoryKey}
                                    typeKey={typeKey}
                                    typeName={typeData.name}
                                    items={typeData.items}
                                    updateItems={(newItems) => updatePortfolioItems(categoryKey, typeKey, newItems)}
                                />
                            </div>
                        ))}
                    </Panel>
                ))}
            </Collapse>


        </div>
    );
};

export default PortfolioPage;