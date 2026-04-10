interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

// 统一包裹主要内容区域的基础面板。
export function Panel({ children, className = '' }: PanelProps) {
  return <section className={`panel ${className}`.trim()}>{children}</section>;
}
