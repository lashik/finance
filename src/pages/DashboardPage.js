
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Row, Col, Card, Statistic, Typography, Tag, Divider, List, Select, Spin, Alert } from 'antd'; 
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip, Legend, Ticks, Filler 
} from 'chart.js';
import { supabase } from '../supabaseClient'; 
import { AuthContext } from '../App'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend, Filler);

const { Title, Text, Paragraph } = Typography; 
const { Option } = Select;


const formatIndianNumber = (value, decimals = 0) => {
    const num = Number(value);
    if (isNaN(num)) return '₹ 0';
    
    return `₹ ${num.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}`;
};

const safeGetNumber = (value, defaultValue = 0) => {
    const num = Number(String(value).replace(/₹|,/g, '')); 
    return isNaN(num) ? defaultValue : num;
};



const fundValueChartData = { 
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{ label: 'Fund Value', data: [500000, 510000, 530000, 520000, 550000, 560000, 580000, 600000, 590000, 610000, 630000, 650000], borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.1)', tension: 0.1, fill: true, pointRadius: 2, pointHoverRadius: 5, }],
};
const fundValueChartOptions = { 
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { label: (ctx) => `${ctx.dataset.label || ''}: ${formatIndianNumber(ctx.parsed.y)}` } } }, scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } }, y: { grid: { color: '#f0f0f0', drawBorder: false }, ticks: { callback: (v) => formatIndianNumber(v), maxTicksLimit: 5 } } }
};
const marketTodayData = { 
    sensex: { value: '75,123.45', change: '+350.12 (+0.47%)', changeType: 'up' },
    nifty: { value: '22,876.50', change: '+120.50 (+0.53%)', changeType: 'up' },
};



const MAJOR_CATEGORIES = {
    'Equity': 'Equity (Stocks)',
    'Fixed-Income': 'Fixed Income',
    'Real Estate': 'Real Estate',
    'Commodities': 'Commodities',
    'Alternative Investments': 'Alternative Investments',
    'Cryptocurrencies & Digital Assets': 'Cryptocurrencies', 
    'Derivatives & Structured Products': 'Derivatives', 
    'Cash & Cash Equivalents': 'Cash & Equivalents',
};

const DashboardPage = () => {
    const { user } = useContext(AuthContext); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [investmentData, setInvestmentData] = useState(null); 
    const [selectedReturnPeriod, setSelectedReturnPeriod] = useState('3Y'); 

    
    useEffect(() => {
        const fetchDashboardData = async (email) => {
            if (!email) {
                setError("User not logged in.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            setInvestmentData(null); 

            try {
                console.log(`Fetching investments for: ${email}`);
                const { data, error: fetchError } = await supabase
                    .from('users') 
                    .select('existing_investments') 
                    .eq('email', email)
                    .single(); 

                if (fetchError) {
                    if (fetchError.code === 'PGRST116') { 
                        console.warn(`No data found for user: ${email}. Existing investments might be null.`);
                        setInvestmentData({}); 
                    } else {
                        throw fetchError; 
                    }
                }

                console.log("Raw investment data fetched:", data?.existing_investments);
                setInvestmentData(data?.existing_investments || {}); 

            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(`Failed to load investment data: ${err.message}`);
                setInvestmentData({}); 
            } finally {
                setLoading(false);
            }
        };

        if (user?.email) {
            fetchDashboardData(user.email);
        } else {
            setError("User not available.");
            setLoading(false); 
        }
    }, [user]); 

    
    const processedData = useMemo(() => {
        if (!investmentData || Object.keys(investmentData).length === 0) {
            return { 
                equityDirect: 0, equityMutual: 0, equityEtf: 0, equityCaps: 0,
                assetValues: {}, totalNetWorth: 0,
                equityPerformance: 0, averageExpectedReturns: {},
            };
        }

        let equityDirect = 0, equityMutual = 0, equityEtf = 0, equityCaps = 0;
        let totalNetWorth = 0;
        let totalEquityInvested = 0;
        let totalEquityCurrent = 0;
        const assetValues = {}; 
        const averageExpectedReturns = {}; 

        
        Object.keys(MAJOR_CATEGORIES).forEach(key => {
            assetValues[key] = 0;
            averageExpectedReturns[key] = { totalReturn: 0, count: 0 };
        });

        
        Object.entries(investmentData).forEach(([categoryKey, items]) => {
            if (!Array.isArray(items)) return; 

            items.forEach(item => {
                
                const currentValue = safeGetNumber(item.current_value ?? item.property_value ?? item.invested_amount);
                const investedAmount = safeGetNumber(item.invested_amount);
                
                const expectedReturn = safeGetNumber(item.expected_return ?? item.interest_rate ?? item.rental_yield);

                totalNetWorth += currentValue;

                
                if (assetValues[categoryKey] !== undefined) {
                    assetValues[categoryKey] += currentValue;
                }

                
                if (averageExpectedReturns[categoryKey] !== undefined && expectedReturn > 0) {
                    averageExpectedReturns[categoryKey].totalReturn += expectedReturn;
                    averageExpectedReturns[categoryKey].count += 1;
                }


                
                if (categoryKey === 'Equity') {
                    totalEquityInvested += investedAmount;
                    totalEquityCurrent += currentValue;

                    
                    const typeLower = item.type?.toLowerCase() || '';
                    if (typeLower.includes('direct')) equityDirect += currentValue;
                    else if (typeLower.includes('mutual')) equityMutual += currentValue;
                    else if (typeLower.includes('etf') || typeLower.includes('exchange')) equityEtf += currentValue;
                    else if (typeLower.includes('cap')) equityCaps += currentValue;
                }
            });
        });

        
        Object.keys(averageExpectedReturns).forEach(key => {
            const { totalReturn, count } = averageExpectedReturns[key];
            averageExpectedReturns[key] = count > 0 ? totalReturn / count : 0; 
        });

        
        const equityPerformance = totalEquityInvested > 0
            ? ((totalEquityCurrent - totalEquityInvested) / totalEquityInvested) * 100
            : 0;

        return {
            equityDirect, equityMutual, equityEtf, equityCaps,
            assetValues, totalNetWorth,
            equityPerformance, averageExpectedReturns,
        };
    }, [investmentData]); 

    
    const assetValueList = Object.entries(MAJOR_CATEGORIES)
        .map(([key, name]) => ({
            name: name,
            value: processedData.assetValues[key] || 0,
        }))
        .filter(item => item.value > 0); 

    const investmentReturnList = Object.entries(MAJOR_CATEGORIES)
        .map(([key, name]) => ({
            name: name,
            
            value: processedData.averageExpectedReturns[key] || 0,
        }));


    
    if (loading) {
        return <Spin tip="Loading Dashboard..." size="large" style={{ display: 'block', marginTop: '50px' }} />;
    }

    if (error) {
        return <Alert message="Error Loading Dashboard" description={error} type="error" showIcon />;
    }

    return (
        <div>
            <Title level={3} style={{ marginBottom: '20px' }}>Dashboard</Title>

            {}
            <Title level={4} style={{ marginBottom: '10px', fontWeight: 500 }}>Equity</Title>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}><Card size="small" bordered={false} style={{ background: '#f0f5ff' }}><Statistic title="Direct Stocks" value={processedData.equityDirect} formatter={(v) => formatIndianNumber(v)} valueStyle={{ fontSize: '18px' }} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card size="small" bordered={false} style={{ background: '#f0f5ff' }}><Statistic title="Equity Mutual Funds" value={processedData.equityMutual} formatter={(v) => formatIndianNumber(v)} valueStyle={{ fontSize: '18px' }} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card size="small" bordered={false} style={{ background: '#f0f5ff' }}><Statistic title="ETFs" value={processedData.equityEtf} formatter={(v) => formatIndianNumber(v)} valueStyle={{ fontSize: '18px' }} /></Card></Col>
                <Col xs={24} sm={12} lg={6}><Card size="small" bordered={false} style={{ background: '#f0f5ff' }}><Statistic title="Small/Mid/Large-Cap" value={processedData.equityCaps} formatter={(v) => formatIndianNumber(v)} valueStyle={{ fontSize: '18px' }} /></Card></Col>
            </Row>

            <Divider />

            {}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                {}
                <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column' }}>
                    <Card
                        title="Fund Value"
                        
                        style={{ flex: 1 ,paddingBottom:'0px'}} 
                    >
                        
                        <Line options={fundValueChartOptions} data={fundValueChartData} style={{minHeight:'100%',height:'400px'}} />
                        
                    </Card>
                </Col>

                {}
                <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
                    {}
                    <Card
                        title="Asset-wise Current Values"
                        size="small"
                        style={{ marginBottom: '16px', flex: 1 }}
                    >
                        <List
                            size="small"
                            dataSource={assetValueList}
                            renderItem={(item) => (
                                <List.Item style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <Text style={{ flex: 1 }}>{item.name}</Text>
                                    <Text strong style={{ textAlign: 'right' }}>
                                        {formatIndianNumber(item.value)}
                                    </Text>
                                </List.Item>
                            )}
                            locale={{ emptyText: 'No assets found' }}
                        />
                    </Card>
                    {}
                    <Card title="Market Today" size="small" style={{ flex: 1 }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title="Sensex"
                                    value={marketTodayData.sensex.value}
                                    valueStyle={{ fontSize: '14px', color: '#555' }}
                                />
                                <Text
                                    style={{
                                        fontSize: '11px',
                                        color:
                                            marketTodayData.sensex.changeType === 'up'
                                                ? '#3f8600'
                                                : '#cf1322',
                                    }}
                                >
                                    {marketTodayData.sensex.changeType === 'up' ? (
                                        <ArrowUpOutlined />
                                    ) : (
                                        <ArrowDownOutlined />
                                    )}{' '}
                                    {marketTodayData.sensex.change}
                                </Text>
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Nifty"
                                    value={marketTodayData.nifty.value}
                                    valueStyle={{ fontSize: '14px', color: '#555' }}
                                />
                                <Text
                                    style={{
                                        fontSize: '11px',
                                        color:
                                            marketTodayData.nifty.changeType === 'up'
                                                ? '#3f8600'
                                                : '#cf1322',
                                    }}
                                >
                                    {marketTodayData.nifty.changeType === 'up' ? (
                                        <ArrowUpOutlined />
                                    ) : (
                                        <ArrowDownOutlined />
                                    )}{' '}
                                    {marketTodayData.nifty.change}
                                </Text>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <Divider />

            {}
            <Row gutter={[24, 24]}>
                {}
                <Col xs={24} lg={16}>
                    <Card title="Equity Based Investments Performance" size="small" style={{ marginBottom: '16px' }}>
                        <Statistic
                            
                            value={processedData.equityPerformance}
                            precision={2}
                            valueStyle={{ fontSize: '24px', color: processedData.equityPerformance >= 0 ? '#3f8600' : '#cf1322' }}
                            prefix={processedData.equityPerformance >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            suffix="%"
                        />
                        <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '5px' }}>Overall % gain/loss on invested equity amount.</Paragraph>
                    </Card>
                    <Card size="small">
                        <Statistic title="Today's Net Worth (All Assets)" value={processedData.totalNetWorth} formatter={(v) => formatIndianNumber(v)} valueStyle={{ fontSize: '24px', color: '#1890ff' }} />
                    </Card>
                </Col>

                {}
                <Col xs={24} lg={8}>
                    <Card title="Returns on Investments" size="small">
                        <Select
                            value={selectedReturnPeriod}
                            style={{ width: '100%', marginBottom: '12px' }}
                            onChange={(value) => setSelectedReturnPeriod(value)}
                            options={[
                                { value: '1Y', label: '1 Year Return' },
                                { value: '3Y', label: '3 Years Return' },
                                { value: '5Y', label: '5 Years Return' },
                                { value: '10Y', label: '10 Years Return' },
                                { value: 'EXPECTED', label: 'Average Expected Return*' }, 
                            ]}
                        />
                        <List
                            size="small"
                            dataSource={investmentReturnList}
                            renderItem={item => (
                                <List.Item style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <Text style={{ flex: 1 }}>{item.name}</Text>
                                    <Tag color={item.value >= 5 ? 'green' : item.value > 0 ? 'blue' : 'red'} style={{ textAlign: 'right', minWidth: '50px' }}>
                                        {item.value.toFixed(1)}%
                                    </Tag>
                                </List.Item>
                            )}
                        />
                        <Paragraph type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '8px' }}>
                            *Note: Returns shown are Average Expected/Interest/Yield % based on current data. Dropdown for historical periods is for UI only; actual historical calculation requires different data.
                        </Paragraph>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;