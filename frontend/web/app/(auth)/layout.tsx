/**
 * Layout para páginas de autenticación
 * Presentation layer - Layout sin sidebar para login
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}


