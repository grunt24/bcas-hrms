import React, { useEffect, useState } from 'react';
import { Table, Spin, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from '../api/_axiosInstance';

const { Title } = Typography;

interface EvalWithNames {
  evaluationID: number;
  employeeID: number;
  employeeName: string;
  evaluatorID: number;
  evaluatorName: string;
  evaluationDate: string;
  finalScore: number;
  createdAt: string;
}

const EvaluatedPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<EvalWithNames[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const res = await axios.get('/Evaluations');
      setEvaluations(res.data);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<EvalWithNames> = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Evaluator',
      dataIndex: 'evaluatorName',
      key: 'evaluatorName',
    },
    {
      title: 'Date',
      dataIndex: 'evaluationDate',
      key: 'evaluationDate',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Evaluation Score Average',
      dataIndex: 'finalScore',
      key: 'finalScore',
      render: (score: number) => score.toFixed(2),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Evaluations</Title>
      <Spin spinning={loading}>
        <Table
          rowKey="evaluationID"
          columns={columns}
          dataSource={evaluations}
          bordered
          pagination={{ pageSize: 10 }}
        />
      </Spin>
    </div>
  );
};

export default EvaluatedPage;
