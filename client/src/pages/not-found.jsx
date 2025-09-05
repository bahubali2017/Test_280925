import { Link } from 'wouter';

/**
 * NotFound component for handling 404 errors
 * @returns {JSX.Element} The NotFound component
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow text-center">
        <h1 className="text-4xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div>
          <Link href="/login" className="text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}