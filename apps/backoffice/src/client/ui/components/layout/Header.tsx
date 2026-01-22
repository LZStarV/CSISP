'use client';
import { Layout } from 'antd';
export default function HeaderBar() {
  return (
    <Layout.Header style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ color: '#fff', fontWeight: 600, marginRight: 16 }}>
        Backoffice
      </div>
    </Layout.Header>
  );
}
