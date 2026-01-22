'use client';
import type { QueryTableResponse } from '@csisp/idl/backoffice';
import {
  Layout,
  List,
  Table,
  Space,
  Select,
  InputNumber,
  Typography,
  Divider,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { rpcCall } from '@/src/client/utils/rpc-client';

type ListModelsResult = { models: string[] };

type QueryTableParams = {
  table: string;
  page?: number;
  size?: number;
  columns?: string[];
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
};

type QueryTableResult = QueryTableResponse;

export default function DbPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>('');
  const [columns, setColumns] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<string>('');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(20);
  const [data, setData] = useState<QueryTableResult | null>(null);
  useEffect(() => {
    rpcCall<ListModelsResult>('db', 'listModels', {}).then(res => {
      setTables(res.models);
      if (!current && res.models.length) setCurrent(res.models[0]);
    });
  }, []);
  useEffect(() => {
    if (!current) return;
    rpcCall<{ columns: string[] }>('db', 'queryTable', {
      table: current,
      page: 1,
      size: 1,
    } as QueryTableParams)
      .then(() => {
        return rpcCall<QueryTableResult>('db', 'queryTable', {
          table: current,
          page,
          size,
          orderBy,
          orderDir,
        } as QueryTableParams);
      })
      .then(res => {
        setData(res);
        const cols = Object.keys(res.items?.[0] ?? {});
        setColumns(cols);
        if (!orderBy && cols.length) setOrderBy(cols[0]);
      });
  }, [current, page, size, orderBy, orderDir]);
  const tableColumns = useMemo(
    () => columns.map(c => ({ title: c, dataIndex: c, key: c })),
    [columns]
  );
  return (
    <Layout style={{ background: 'transparent' }}>
      <Space align='start' style={{ width: '100%' }}>
        <div style={{ width: 260 }}>
          <Typography.Title level={5}>表</Typography.Title>
          <List
            bordered
            dataSource={tables}
            renderItem={t => (
              <List.Item
                onClick={() => {
                  setCurrent(t);
                  setPage(1);
                }}
                style={{
                  cursor: 'pointer',
                  fontWeight: t === current ? 600 : 400,
                }}
              >
                {t}
              </List.Item>
            )}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Space style={{ marginBottom: 12 }}>
            <span>排序列</span>
            <Select
              style={{ width: 200 }}
              value={orderBy || undefined}
              options={columns.map(c => ({ value: c, label: c }))}
              onChange={v => setOrderBy(v)}
            />
            <span>方向</span>
            <Select
              style={{ width: 160 }}
              value={orderDir}
              options={[
                { value: 'asc', label: '升序' },
                { value: 'desc', label: '降序' },
              ]}
              onChange={v => setOrderDir(v as 'asc' | 'desc')}
            />
            <span>分页</span>
            <InputNumber
              min={1}
              value={page}
              onChange={v => setPage(Number(v) || 1)}
            />
            <span>每页</span>
            <InputNumber
              min={1}
              max={100}
              value={size}
              onChange={v => setSize(Number(v) || 20)}
            />
          </Space>
          <Divider />
          <Table
            rowKey={(_, idx) => String(idx)}
            dataSource={data?.items || []}
            columns={tableColumns}
            pagination={{
              current: data?.page || page,
              pageSize: data?.size || size,
              total: Number(data?.total ?? 0),
              onChange: (p, s) => {
                setPage(p);
                setSize(s);
              },
            }}
          />
        </div>
      </Space>
    </Layout>
  );
}
