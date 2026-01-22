import 'antd/dist/reset.css';
import '@/src/client/ui/style/globals.scss';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-CN'>
      <body>{children}</body>
    </html>
  );
}
