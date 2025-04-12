// src/pages/DashboardPage.js
import React from 'react';
import { Row, Col, Card, Statistic, Typography, Progress, Tag, Divider, List } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title as ChartTitle,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ChartTitle,
    Tooltip,
    Legend
);

const { Title, Text } = Typography;

// Mock Data
const stockData = [
    { symbol: 'AAPL', name: 'Apple Inc.', value: '15,120.20', change: '+0.66%', changeType: 'up' },
    { symbol: 'NDAQ', name: 'Nasdaq Inc.', value: '15,215.70', change: '-0.28%', changeType: 'down' },
    { symbol: 'TSLA', name: 'Tesla Inc.', value: '10,225.40', change: '+1.66%', changeType: 'up' },
    { symbol: 'AMZN', name: 'Amazon Inc.', value: '40,500.20', change: '+2.56%', changeType: 'up' },
];

const sp500ChartData = {
    labels: ['May 21', 'Jun 21', 'Jul 21', 'Aug 21', 'Sep 21', 'Oct 21', 'Nov 21'],
    datasets: [
        {
            label: 'S&P 500',
            data: [4100, 4200, 4350, 4400, 4300, 4550, 4500.48],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false,
        },
    ],
};

const sp500ChartOptions = {
    responsive: true,
    plugins: {
        legend: { display: false },
        title: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false } }
    }
};

const fundData = {
    fundName: 'Digital Fund Direct-Growth',
    category: 'Equity Technology',
    minInvestment: '$100',
    totalReturn: 37.98,
    categoryReturn: 29.60,
};

const investmentReturnData = [
    { period: '1Y', value: 23.36, status: 'success'},
    { period: '3Y', value: 48.51, status: 'success' },
    { period: '5Y', value: 95.82, status: 'success' },
    // Add more periods if needed
];

const riskometerLevel = "Moderately High"; // Example: Moderate, High, Low etc.

const DashboardPage = () => {
    return (
        <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Dashboard</Title>

            {/* Orders/Watchlist Section */}
            <Title level={4} style={{ marginBottom: '16px' }}>Watchlist</Title>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {stockData.map(stock => (
                    <Col xs={24} sm={12} md={12} lg={6} key={stock.symbol}>
                        <Card bordered={false} size="small" >
                            <Statistic
                                title={`${stock.name} (${stock.symbol})`}
                                value={stock.value}
                                precision={2}
                                valueStyle={{ color: stock.changeType === 'up' ? '#3f8600' : '#cf1322', fontSize: '18px' }}
                                prefix={stock.changeType === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                suffix={`(${stock.change})`}
                            />
                             <Text type="secondary" style={{fontSize: '12px'}}>Portfolio</Text> {/* As per image */}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Divider />

            {/* S&P 500 Chart & Details */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={16}>
                    <Card title="S&P 500 Overview">
                        <Statistic title="S&P 500" value={4500.48} />
                        <Text type="secondary">Oct 25, 5:26 pm UTC-5, INDEXSP Disclaimer</Text>
                        <div style={{ height: '250px', marginTop: '20px', width: '100%',height: '100%' }}>
                           <Line options={sp500ChartOptions} data={sp500ChartData} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="S&P 500 Details">
                        <Statistic title="Previous Close" value={4500.50} groupSeparator="" valueStyle={{fontSize: '14px'}}/>
                        <Statistic title="Day Range" value={'3,588 - 5,415'} groupSeparator="" valueStyle={{fontSize: '14px'}}/>
                        <Statistic title="Year Range" value={'6,200 - 4,500'} groupSeparator="" valueStyle={{fontSize: '14px'}}/>
                        <Statistic title="Market Cap" value={'90.3T USD'} groupSeparator="" valueStyle={{fontSize: '14px'}}/>
                        <Statistic title="Volume" value={3852852} valueStyle={{fontSize: '14px'}}/>
                        {/* Add P/E Ratio, Primary Exchange etc. if needed */}
                         <Divider style={{margin: '12px 0'}} />
                         <Text strong>Market Cap:</Text> $40 <Tag color="blue">Index</Tag> {/* Example detail */}
                    </Card>
                </Col>
            </Row>

             <Divider />

            {/* Funds Section */}
             <Row gutter={[24, 24]}>
                 <Col xs={24} md={16}>
                    <Card title="Funds in this category">
                         <Title level={5}>{fundData.fundName}</Title>
                         <Text type="secondary">{fundData.category}</Text>
                         <Row justify="space-between" align="middle" style={{marginTop: '20px'}}>
                            <Col>
                                <Text strong>This fund's returns:</Text> <Tag color="green">+{fundData.totalReturn}%</Tag> (3 Years)
                            </Col>
                             <Col>
                                <Text type="secondary">Min Investment: {fundData.minInvestment}</Text>
                            </Col>
                         </Row>
                         <Progress percent={fundData.totalReturn} status="active" showInfo={false} trailColor="#E6F7FF"/>
                         <Text>Category Returns (3Y): +{fundData.categoryReturn}%</Text>
                         <Progress percent={fundData.categoryReturn} showInfo={false} trailColor="#FFFBE6"/>
                    </Card>
                 </Col>
                  <Col xs={24} md={8}>
                     <Card title="Investment Return">
                         <List
                            size="small"
                            dataSource={investmentReturnData}
                            renderItem={item => (
                                <List.Item>
                                    <Text strong>{item.period}:</Text> <Tag color={item.value > 0 ? "success" : "error"}>+{item.value}%</Tag>
                                </List.Item>
                            )}
                        />
                         <Divider style={{margin: '12px 0'}}/>
                         <Text strong>Scheme Riskometer:</Text> <Tag color="orange">{riskometerLevel}</Tag>
                     </Card>
                 </Col>
             </Row>

        </div>
    );
};

export default DashboardPage;