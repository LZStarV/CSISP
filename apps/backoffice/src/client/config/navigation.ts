export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon?: string;
};
export const NAV_ITEMS: NavItem[] = [
  { key: 'user-center', label: '用户', href: '/user-center', icon: 'UserOutlined' },
  { key: 'logs-manage', label: '日志', href: '/logs-manage', icon: 'FileSearchOutlined' },
  { key: 'db-manage', label: '数据库', href: '/db-manage', icon: 'DatabaseOutlined' },
];
