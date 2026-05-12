// No sidebar for pending users — they see a standalone page
export default function PendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
