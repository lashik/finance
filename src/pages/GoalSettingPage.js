// src/pages/GoalSettingPage.js
import React, { useState, useEffect } from 'react';
import {
    Typography, Card, Form, InputNumber, Select, Button, Radio, Alert, Slider, Row, Col, Table, Statistic
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// --- CAGR Assumptions (Standard) ---
const standardCagr = {
    equity_direct: 0.18, equity_mutual: 0.14, equity_etf: 0.11, equity_caps: 0.12,
    fixed_govt: 0.07, fixed_corp: 0.09, fixed_fd: 0.065, fixed_debt_mf: 0.05,
    real_estate_residential: 0.02, real_estate_commercial: 0.08, real_estate_reit: null, // N/A
    commodities_gold_silver: 0.05, commodities_oil_gas: 0.06, commodities_agri: 0.025,
    alternative_pe_vc: 0.30, alternative_hedge: 0.14, alternative_collectibles: 0.07,
    crypto_coins: 0.15, crypto_nft: 0.12,
    derivatives_options_futures: 0.11, derivatives_swaps: 0.12,
    cash_savings: 0.035, cash_mmf: 0.09, cash_tbills: 0.08,
};
const formatIndianNumber = (value) => {
    if (!value) return '0';
    const formattedValue = parseFloat(value).toFixed(2);
    return formattedValue.toString().replace(/\B(?=(\d{2})+(?!\d))/g, ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};
// --- Placeholder: Need to get current total fund value from Portfolio context/state ---
const getCurrentPortfolioValue = () => {
    // In a real app, fetch this from Portfolio state/context or calculate it
    return 750000; // Example value: 75 Lakhs (using number format for calculation)
};
// -----------------------------------------------------------------------------------

const GoalSettingPage = () => {
    const [form] = Form.useForm();
    const [calculationMode, setCalculationMode] = useState('standard'); // 'standard' or 'current'
    const [goalResult, setGoalResult] = useState(null);
    const [error, setError] = useState('');

    const currentFundValue = getCurrentPortfolioValue(); // Get current value

    const calculateFutureValue = (principal, rate, years) => {
        if (principal <= 0 || rate <= 0 || years <= 0) return principal;
        return principal * Math.pow((1 + rate), years);
    };

    const calculateRequiredPrincipal = (futureValue, rate, years) => {
         if (futureValue <= 0 || rate <= 0 || years <= 0) return 0;
        return futureValue / Math.pow((1 + rate), years);
    }

    const onFinish = (values) => {
        setError('');
        setGoalResult(null);
        console.log('Goal Settings:', values);

        const { years, targetCorpus } = values;
        const avgCagr = 0.12; // Placeholder: This should dynamically change based on risk/portfolio mix
                              // For simplicity using a fixed 12% CAGR for this example calculation.
                              // A real implementation would calculate weighted average CAGR based on portfolio.

        if (calculationMode === 'current') {
            // Calculate future value based on current funds
            const futureValue = calculateFutureValue(currentFundValue, avgCagr, years);
            const isPossible = futureValue >= targetCorpus;
            setGoalResult({
                mode: 'current',
                futureValue: futureValue,
                target: targetCorpus,
                possible: isPossible,
                message: isPossible
                    ? `Based on your current fund value of ${currentFundValue.toLocaleString()} and an assumed average ${avgCagr * 100}% annual return, you could potentially reach ${futureValue.toLocaleString()} in ${years} years, achieving your target.`
                    : `Based on your current fund value of ${currentFundValue.toLocaleString()} and an assumed average ${avgCagr * 100}% annual return, you might only reach ${futureValue.toLocaleString()} in ${years} years. This may not be enough to meet your target of ${targetCorpus.toLocaleString()}. Consider increasing contributions or adjusting your investment strategy/risk.`
            });
        } else { // Standard Calculations
             // Calculate required current value OR required investment mix
             const requiredPrincipal = calculateRequiredPrincipal(targetCorpus, avgCagr, years);

             if (currentFundValue >= requiredPrincipal) {
                  setGoalResult({
                    mode: 'standard',
                    requiredPrincipal: requiredPrincipal,
                    message: `To achieve ${targetCorpus.toLocaleString()} in ${years} years (assuming ${avgCagr * 100}% average annual return), you need approximately ${requiredPrincipal.toLocaleString()} invested today. Your current fund value of ${currentFundValue.toLocaleString()} appears sufficient.`
                });
             } else {
                 // This is where the suggestion "put 50% in stocks & 50% in MFs" comes in - needs more logic
                 // For now, just state the required principal and the gap.
                  setGoalResult({
                    mode: 'standard',
                     requiredPrincipal: requiredPrincipal,
                    message: `To achieve ${targetCorpus.toLocaleString()} in ${years} years (assuming ${avgCagr * 100}% average annual return), you need approximately ${requiredPrincipal.toLocaleString()} invested today. Your current fund value is ${currentFundValue.toLocaleString()}. You may need additional investments or a strategy targeting higher returns (e.g., higher allocation to equity).`
                    // Suggestion: "For example, you might need to allocate X% to stocks and Y% to mutual funds..." - This requires the risk adjustment part.
                });
             }

        }
    };

    return (
        <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Define Your Goal</Title>

            <Card style={{ marginBottom: '24px' }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ years: 10, targetCorpus: 20000000 }} // Default: 10 years, 2 Cr
                >
                    <Row gutter={16}>
                         <Col xs={24} sm={12} md={8}>
                            <Form.Item name="years" label="Number of Years" rules={[{ required: true, type: 'number', min: 1 }]}>
                                <InputNumber style={{ width: '100%' }} placeholder="e.g., 10" />
                            </Form.Item>
                        </Col>
                         <Col xs={24} sm={12} md={8}>
                            <Form.Item name="targetCorpus" label="Target Corpus" rules={[{ required: true, type: 'number', min: 1 }]}>
                                <InputNumber style={{ width: '100%' }} placeholder="e.g., 20000000" formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/₹\s?|(,*)/g, '')}/>
                            </Form.Item>
                        </Col>
                         <Col xs={24} sm={24} md={8}>
                             <Form.Item label="Calculation Method" name="calculationMode" initialValue="standard">
                                <Radio.Group onChange={(e) => setCalculationMode(e.target.value)} value={calculationMode}>
                                    <Radio value="standard">Standard Calculation</Radio>
                                    <Radio value="current">Based on Current Financials</Radio>
                                </Radio.Group>
                            </Form.Item>
                         </Col>
                    </Row>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Calculate Goal Feasibility
                        </Button>
                         <Button htmlType="button" onClick={() => { form.resetFields(); setGoalResult(null); setError(''); }} style={{marginLeft: '8px'}}>
                            Reset
                        </Button>
                    </Form.Item>
                </Form>

                 {/* Display Calculation Result */}
                 {error && <Alert message={error} type="error" showIcon style={{ marginTop: '20px' }} />}
                 {goalResult && (
                     <Alert
                        message={calculationMode === 'current' ? "Projection Based on Current Funds" : "Standard Goal Calculation"}
                        description={<Paragraph>{goalResult.message}</Paragraph>}
                        type={goalResult.possible === false ? "warning" : "info"} // Use warning if goal seems unlikely based on current mode
                        showIcon
                        style={{ marginTop: '20px' }}
                    />
                 )}
            </Card>


            {/* Placeholder for Risk Adjustment - To be implemented in next step */}
            <Card title="Risk Adjustment (Affects Projections)">
                <Paragraph>Select your risk tolerance. This will adjust the assumed returns and suggested portfolio allocation in the projections.</Paragraph>
                 {/* Risk Slider component will go here */}
                 {/* Display of adjusted portfolio will go here */}
                 <Text>Risk Adjustment Slider and dynamic portfolio display will be added in the Projections section.</Text>
            </Card>

        </div>
    );
};

export default GoalSettingPage;