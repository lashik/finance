import React, { useState, useEffect } from 'react';
import { Typography, Card, Slider, Row, Col, Table, InputNumber, Button, Statistic, Form, Popconfirm, Alert,Space } from 'antd';
import { SaveOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import { supabase } from '../supabaseClient';
import { useContext } from 'react';
import { AuthContext } from '../App'; // Import context
const { Title, Text, Paragraph } = Typography;

// Utility function to format numbers in the Indian numbering system
const formatIndianNumber = (value) => {
    if (!value) return '0';
    const formattedValue = parseFloat(value).toFixed(2);
    return formattedValue.toString().replace(/\B(?=(\d{2})+(?!\d))/g, ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};
const standardCagr = {
    equity_direct: 0.18, equity_mutual: 0.14, equity_etf: 0.11, equity_caps: 0.12,
    fixed_govt: 0.07, fixed_corp: 0.09, fixed_fd: 0.065, fixed_debt_mf: 0.05,
    real_estate: 0.08, 
    commodities: 0.05, 
    alternative: 0.14, 
    crypto: 0.15, 
    derivatives: 0.11, 
    cash: 0.08, 
};

const fetchPortfolioFromSupabase = async (email) => {
    try {
      const { data, error } = await supabase
        .from('users') 
        .select('existing_investments')
        .eq('email', email) 
        .single(); 
  
      if (error) {throw error;
        console.error('Error fetching portfolio data:', error.message);
        return null;
      }
      console.log('Fetched portfolio data:', data.existing_investments['Fixed-Income']);
      
      const investments = data.existing_investments;
  
      const mappedPortfolio = {
        equity_direct: parseInt(investments.Equity?.find((item) => item.type === 'Direct Stocks')?.invested_amount || 0),
        equity_mutual: parseInt(investments.Equity?.find((item) => item.type === 'Equity Mutual Funds')?.invested_amount || 0),
        equity_etf: parseInt(investments.Equity?.find((item) => item.type === 'Exchange-Traded Funds (ETFs)')?.invested_amount || 0),
        equity_caps: parseInt(investments.Equity?.find((item) => item.type === 'Small-Cap, Mid-Cap, Large-Cap Stocks')?.invested_amount || 0),
        fixed_govt: parseInt(investments['Fixed-Income']?.find((item) => item.type === 'Treasury Bills (T-Bills)')?.invested_amount || 0),
        fixed_corp: parseInt(investments['Fixed-Income']?.find((item) => item.type === 'Corporate Bonds')?.invested_amount || 0),
        fixed_fd: parseInt(investments['Fixed-Income']?.find((item) => item.type === 'Fixed Deposits (FDs)')?.invested_amount || 0),
        fixed_debt_mf: parseInt(investments['Fixed-Income']?.find((item) => item.type === 'Debt Mutual Funds')?.invested_amount || 0),
        real_estate: investments['Real Estate']?.reduce((sum, item) => sum + (parseInt(item.property_value) || 0), 0) || 0,
        commodities: investments.Commodities?.reduce((sum, item) => sum + (parseInt(item.invested_amount) || 0), 0) || 0,
        alternative: investments['Alternative Investments']?.reduce((sum, item) => sum + (parseInt(item.invested_amount) || 0), 0) || 0,
        crypto: investments['Cryptocurrencies & Digital Assets']?.reduce((sum, item) => sum + (parseInt(item.invested_amount) || 0), 0) || 0,
        derivatives: investments['Derivatives & Structured Products']?.reduce((sum, item) => sum + (parseInt(item.invested_amount) || 0), 0) || 0,
        cash: investments['Cash & Cash Equivalents']?.reduce((sum, item) => sum + (parseInt(item.invested_amount) || 0), 0) || 0,
    };
  
      return mappedPortfolio;
    } catch (error) {
      console.error('Error fetching portfolio from Supabase:', error.message);
      return null;
    }
  };



const riskProfiles = {
    1: { 
        name: "Low",
        allocations: {
            equity_direct: 0.10, equity_mutual: 0.07, equity_etf: 0.05, equity_caps: 0.03,
            fixed_govt: 0.05, fixed_corp: 0.00, fixed_fd: 0.45, fixed_debt_mf: 0.05,
            real_estate: 0.10, 
            commodities: 0.05, 
            alternative: 0.00, crypto: 0.00, derivatives: 0.00,
            cash: 0.05 
        },
        cagrs: standardCagr, 
    },
    2: { 
        name: "Medium",
        allocations: {
            equity_direct: 0.15, equity_mutual: 0.10, equity_etf: 0.05, equity_caps: 0.05,
            fixed_govt: 0.03, fixed_corp: 0.00, fixed_fd: 0.30, fixed_debt_mf: 0.07,
             real_estate: 0.10,
            commodities: 0.03,
            alternative: 0.00, crypto: 0.00, derivatives: 0.10, 
            cash: 0.02
        },
         cagrs: standardCagr,
    },
    3: { 
        name: "High",
        allocations: {
            equity_direct: 0.15, equity_mutual: 0.25, equity_etf: 0.05, equity_caps: 0.05,
            fixed_govt: 0.03, fixed_corp: 0.00, fixed_fd: 0.05, fixed_debt_mf: 0.07,
             real_estate: 0.10,
            commodities: 0.05,
            alternative: 0.05, 
            crypto: 0.03, 
            derivatives: 0.10, 
            cash: 0.02
        },
         cagrs: standardCagr 
    }
};




 




const ProjectionsPage = () => {
    
    const [currentPortfolioSnapshot,setCurrentPortfolioSnapshot] = useState({});
     const [riskLevel, setRiskLevel] = useState(2); 
    const [portfolioState, setPortfolioState] = useState({}); 
    const [projections, setProjections] = useState({ p5: 0, p10: 0, p20: 0 });
    const [editingKey, setEditingKey] = useState('');
    const [form] = Form.useForm();
    const { user } = useContext(AuthContext); // <--- Get user from context
    const userEmail = user ? user.email : null;
    const currentTotalValue = Object.values(portfolioState).reduce((sum, item) => sum + (item?.currentAmount || 0), 0);

    
    useEffect(() => {
        const profile = riskProfiles[riskLevel];
        if (!profile) return; // Add guard clause
        const fetchData = async () => {
            const fetchedPortfolio = await fetchPortfolioFromSupabase(userEmail);
            if (fetchedPortfolio) {
                console.log('Fetched portfolio:', fetchedPortfolio);
                setCurrentPortfolioSnapshot(fetchedPortfolio);
            } else {
                console.error('Failed to fetch portfolio data.');
            }
        };

        fetchData();
    }, [riskLevel]); // Re-run when riskLevel changes

    useEffect(() => {
        const profile = riskProfiles[riskLevel];
        if (!profile || Object.keys(currentPortfolioSnapshot).length === 0) return; // Add guard clause

        const newPortfolioState = {};
        let totalCurrent = 0;

        // Use snapshot for current amounts, profile for target allocation % and CAGR
        Object.keys(profile.allocations).forEach(key => {
            const currentAmount = currentPortfolioSnapshot[key] || 0;
            totalCurrent += currentAmount;
            const cagrValue = standardCagr[key] || 0;

            newPortfolioState[key] = {
                key: key, // Asset key
                name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format name
                currentAmount: currentAmount,
                targetAllocation: profile.allocations[key] * 100, // Store as percentage
                cagr: cagrValue * 100, // Store as percentage
            };
        });

        // Recalculate current allocation based on snapshot amounts
        if (totalCurrent > 0) {
            Object.keys(newPortfolioState).forEach(key => {
                newPortfolioState[key].currentAllocation = (newPortfolioState[key].currentAmount / totalCurrent * 100);
            });
        } else {
            Object.keys(newPortfolioState).forEach(key => {
                newPortfolioState[key].currentAllocation = 0;
            });
        }

        setPortfolioState(newPortfolioState);
        // Trigger initial calculation when risk level changes
        runProjections(newPortfolioState);

    }, [riskLevel, currentPortfolioSnapshot]); // Add currentPortfolioSnapshot as a dependency

     const calculateWeightedAvgCagr = (portfolio) => {
        let weightedCagrSum = 0;
        let totalValue = 0;
         Object.values(portfolio).forEach(item => {
             const amount = item.currentAmount || 0;
             const cagr = item.cagr / 100 || 0; // Convert % back to decimal
             weightedCagrSum += amount * cagr;
             totalValue += amount;
         });
        return totalValue > 0 ? weightedCagrSum / totalValue : 0;
    };

    const runProjections = (currentPort = portfolioState) => {
        if (Object.keys(currentPort).length === 0) {
            console.log("Portfolio state not ready for projection.");
            setProjections({ p5: 0, p10: 0, p20: 0 }); // Reset projections if no data
            return; // Exit if portfolioState is empty
        }
    
        const profile = riskProfiles[riskLevel]; // Get the current risk profile
        if (!profile) {
            console.error("Invalid risk profile.");
            return;
        }
    
        const totalValue = Object.values(currentPort).reduce((sum, item) => sum + (item?.currentAmount || 0), 0);
        const avgCagr = calculateWeightedAvgCagr(currentPort); // Use weighted average based on current amounts
    
        // Calculate target amounts based on risk level allocations
        const targetAmounts = {};
        Object.keys(profile.allocations).forEach((key) => {
            targetAmounts[key] = totalValue * profile.allocations[key]; // Target amount = total value * allocation percentage
        });
    
        console.log(`Running projections with Total: ${totalValue}, Avg CAGR: ${avgCagr.toFixed(4)}`);
        console.log("Target Amounts by Risk Level:", targetAmounts);
    
        // Calculate projections based on target amounts and CAGR
        const projectedValues = {
            p5: 0,
            p10: 0,
            p20: 0,
        };
    
        Object.keys(currentPort).forEach((key) => {
            const targetAmount = targetAmounts[key] || 0;
            const cagr = (profile.cagrs[key] || 0) / 100; // Convert CAGR percentage to decimal
    
            projectedValues.p5 += targetAmount * Math.pow(1 + cagr, 5);
            projectedValues.p10 += targetAmount * Math.pow(1 + cagr, 10);
            projectedValues.p20 += targetAmount * Math.pow(1 + cagr, 20);
        });
    
        console.log("Projected Values:", projectedValues);
    
        setProjections({
            p5: projectedValues.p5,
            p10: projectedValues.p10,
            p20: projectedValues.p20,
        });
    };

     // --- Editable Table Logic ---
     const isEditing = record => record.key === editingKey;

     const edit = (record) => {
         form.setFieldsValue({
             currentAmount: record.currentAmount, // Only allow editing amount for "What If"
         });
         setEditingKey(record.key);
     };

     const cancel = () => {
         setEditingKey('');
     };

      const save = async (key) => {
        try {
            const row = await form.validateFields();
            const newData = { ...portfolioState };
             if (newData[key]) {
                 newData[key] = { ...newData[key], currentAmount: row.currentAmount };

                 // Recalculate current allocations after changing an amount
                 const newTotalValue = Object.values(newData).reduce((sum, item) => sum + (item?.currentAmount || 0), 0);

                 if(newTotalValue > 0) {
                    Object.keys(newData).forEach(k => {
                        newData[k].currentAllocation = (newData[k].currentAmount / newTotalValue * 100);
                    });
                 } else {
                      Object.keys(newData).forEach(k => {
                        newData[k].currentAllocation = 0;
                    });
                 }


                 setPortfolioState(newData);
                 setEditingKey('');
                 // Optionally re-run projections immediately after save
                 // runProjections(newData);
             } else {
                // handle error case?
                 setEditingKey('');
             }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

     const handleSwap = (key, change) => {
        // Basic swap: Increase one, decrease another (or just update one amount)
        // This example just updates the edited amount via save()
        // More complex swap logic could be implemented here to enforce total value constraint etc.
        alert(`Swap logic for ${key} with change ${change} needs implementation (currently handled by direct amount edit).`);
     };


    const EditableCell = ({ editing, dataIndex, title, inputType, record, index, children, ...restProps }) => {
        const inputNode = inputType === 'number' ? <InputNumber style={{width: '100%'}} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/₹\s?|(,*)/g, '')}/> : <InputNumber />;
        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item name={dataIndex} style={{ margin: 0 }} rules={[{ required: true, message: `Please Input ${title}!` }]}>
                        {inputNode}
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };


    const portfolioColumns = [
         { title: 'Asset Class', dataIndex: 'name', key: 'name', width: '30%' },
         {
            title: 'Current Amount (₹)', dataIndex: 'currentAmount', key: 'currentAmount', width: '20%', editable: true, inputType: 'number',
            render: (val) => formatIndianNumber(val)
         },
          {
            title: 'Current %', dataIndex: 'currentAllocation', key: 'currentAllocation', width: '10%',
            render: (val) => `${val?.toFixed(1)}%`
         },
        {
            title: `Target % (${riskProfiles[riskLevel]?.name || '...'} Risk)`, // Added optional chaining for safety
            dataIndex: 'targetAllocation',
            key: 'targetAllocation', width: '15%',
            render: (val) => `${val?.toFixed(1)}%`
        },
         {
            title: 'Assumed CAGR', dataIndex: 'cagr', key: 'cagr', width: '10%',
            render: (val) => `${val?.toFixed(1)}%`
         },
         {
            title: 'Action', dataIndex: 'action', width: '15%',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Space size="small">
                        <Button onClick={() => save(record.key)} type="link" icon={<SaveOutlined />} />
                        <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                             <Button type="link" icon={<CloseOutlined />} danger />
                        </Popconfirm>
                    </Space>
                ) : (
                    <Space size="small">
                        <Button type="link" disabled={editingKey !== ''} onClick={() => edit(record)} icon={<EditOutlined />} title="Edit Amount (What If)" />
                         {/* Add Swap buttons here if needed */}
                         {/* <Button type="link" icon={<PlusCircleOutlined />} onClick={() => handleSwap(record.key, 'increase')} title="Increase Investment"/> */}
                         {/* <Button type="link" icon={<MinusCircleOutlined />} onClick={() => handleSwap(record.key, 'decrease')} title="Decrease Investment"/> */}
                    </Space>
                );
            },
        },
    ];

     const mergedColumns = portfolioColumns.map(col => {
        if (!col.editable) return col;
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.inputType || 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });


    return (
        <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Portfolio Projections </Title>

            {/* Risk Slider */}
            <Card title="Adjust Risk Tolerance" style={{ marginBottom: '24px' }}>
                 <Slider
                    min={1}
                    max={3}
                    onChange={setRiskLevel}
                    value={riskLevel}
                    marks={{ 1: 'Low', 2: 'Medium', 3: 'High' }}
                    step={1}
                    tooltip={{ open: true, formatter: (value) => riskProfiles[value]?.name }} // Added optional chaining
                 />
                 <Paragraph type="secondary" style={{marginTop: '10px'}}>Adjusting the risk tolerance updates the target asset allocation percentages below and impacts the projection calculations.</Paragraph>
            </Card>

             {/* Portfolio Table for What If */}
            <Card title="Portfolio Allocation & 'What If' Analysis" style={{ marginBottom: '24px' }}>
                <Alert type="info" message="Edit 'Current Amount' to simulate changes ('What If') and then click 'Run Projections'." style={{marginBottom: '15px'}}/>
                 <Form form={form} component={false}>
                    <Table
                         components={{ body: { cell: EditableCell } }}
                        columns={mergedColumns}
                        dataSource={Object.values(portfolioState)}
                        pagination={false}
                        bordered
                        size="small"
                        rowKey="key"
                        loading={Object.keys(portfolioState).length === 0} // Show loading if state is empty initially
                         summary={() => {
                             const totalCurrent = Object.values(portfolioState).reduce((sum, item) => sum + (item?.currentAmount || 0), 0);
                             const totalCurrentPerc = Object.values(portfolioState).reduce((sum, item) => sum + (item?.currentAllocation || 0), 0);
                             const totalTargetPerc = Object.values(portfolioState).reduce((sum, item) => sum + (item?.targetAllocation || 0), 0);
                             return (
                                <Table.Summary.Row style={{background: '#fafafa', fontWeight: 'bold'}}>
                                    <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">{`₹ ${formatIndianNumber(totalCurrent)}`}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={2}>{`${totalCurrentPerc.toFixed(1)}%`}</Table.Summary.Cell>
                                     <Table.Summary.Cell index={3}>{`${totalTargetPerc.toFixed(1)}%`}</Table.Summary.Cell>
                                     <Table.Summary.Cell index={4} colSpan={2}></Table.Summary.Cell>{/* Empty cells for CAGR/Action */}
                                </Table.Summary.Row>
                             );
                         }}
                    />
                 </Form>
                 <Button type="primary" onClick={() => runProjections()} style={{marginTop: '15px'}} disabled={editingKey !== '' || Object.keys(portfolioState).length === 0}>
                    Run Projections Based on Current Amounts
                </Button>
             </Card>


             {/* Projections Display */}
            <Card title="Net Worth Projections">
                 <Row gutter={16}>
                    <Col xs={24} sm={8}>
                        <Statistic title="Current Net Worth" value={formatIndianNumber(currentTotalValue)} precision={2} prefix="₹" />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Statistic title="After 5 Years (Est.)" value={formatIndianNumber(projections.p5)} precision={2} prefix="₹" />
                    </Col>
                    <Col xs={24} sm={8}>
                         <Statistic title="After 10 Years (Est.)" value={formatIndianNumber(projections.p10)} precision={2} prefix="₹" />
                    </Col>
                     <Col xs={24} sm={8} style={{marginTop: '16px'}}>
                         <Statistic title="After 20 Years (Est.)" value={formatIndianNumber (projections.p20)} precision={2} prefix="₹" />
                    </Col>
                </Row>
                 <Paragraph type="secondary" style={{marginTop: '15px'}}>Projections are estimates based on the weighted average CAGR of your current portfolio amounts and do not account for inflation, taxes, fees, or future contributions/withdrawals.</Paragraph>
            </Card>

        </div>
    );
};


export default ProjectionsPage;